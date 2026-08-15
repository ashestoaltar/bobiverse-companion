// Peoples and polities, and the boundary they share with the bestiary.
//
// The rule that spans both registers: a name may be a people or fauna, never
// both. The console must not be able to call the Deltans a species in one view
// and a beast in another, because the books spend five volumes arguing about
// exactly that line and it would be picking the wrong side by accident.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const PEOPLES = get('PEOPLES');
  const BESTIARY = get('BESTIARY');
  const SYS = get('SYS');
  const state = get('state');
  const doc = get('document');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'peoples.json'), 'utf8'));

  ok(PEOPLES && Array.isArray(PEOPLES.entries), 'no peoples register reached the page');
  const entries = PEOPLES.entries;
  ok(entries.length === source.entries.length,
     `page has ${entries.length} entries, data has ${source.entries.length}`);
  ok(!('_comment' in PEOPLES), '_comment should be stripped by the build');

  // ---- the boundary with the bestiary ----
  const fauna = new Set(((BESTIARY && BESTIARY.creatures) || [])
    .map(c => c.name.toLowerCase().replace(/s$/, '')));
  for (const e of entries) {
    const key = e.name.toLowerCase().replace(/^the /, '').replace(/s$/, '');
    ok(!fauna.has(key), `${e.id}: ${e.name} is also in the bestiary`);
  }
  // and the species the books settle must be on this side of it
  for (const want of ['deltans', 'quinlans', 'pav']) {
    ok(entries.some(e => e.id === want && e.kind === 'people'),
       `${want} should be filed here as a people`);
  }

  // ---- shape ----
  const byId = Object.fromEntries(entries.map(e => [e.id, e]));
  for (const e of entries) {
    ok(['people', 'polity', 'faction'].includes(e.kind), `${e.id}: bad kind ${e.kind}`);
    // A faction is the register's third kind and is defined by what it lacks:
    // no ground and nobody it speaks for. If either ever appears on one, it was
    // a polity all along and the distinction has quietly stopped meaning
    // anything.
    if (e.kind === 'faction') {
      ok(!e.system && !e.place, `${e.id}: a faction holds no ground`);
      ok(!e.of, `${e.id}: a faction speaks for itself`);
    }
    ok(e.cite && /^Bk\d+ ch\d+ · /.test(e.cite), `${e.id}: cite missing or malformed: ${e.cite}`);
    ok(e.note && e.note.length > 40, `${e.id}: note too thin`);
    if (e.of) {
      ok(byId[e.of], `${e.id}: of ${e.of} is not in the register`);
      ok(byId[e.of].kind === 'people', `${e.id}: a polity should belong to a people`);
      ok(e.kind === 'polity', `${e.id}: a people cannot belong to another people`);
    }
    if (e.contact) ok(e.kind === 'people', `${e.id}: contact belongs to a species`);
    if (e.system) ok(SYS[e.system], `${e.id}: system ${e.system} is not in the chart`);
  }
  ok(new Set(entries.map(e => e.id)).size === entries.length, 'duplicate entry id');

  // ---- expansions are the books', not ours ----
  // The failure this guards is inventing a plausible expansion for an acronym
  // the books leave closed. FAITH used to be the test case for exactly that,
  // and the assertion was that it must carry none — which was true right up
  // until the appendices were parsed and book 2's List of Terms turned out to
  // expand it. So the guard now checks the thing that actually matters: an
  // expansion has to be sourced, not absent.
  const faith = byId['faith'];
  if (faith) ok(faith.expansion === 'Free American Independent Theocratic Hegemony',
                "FAITH's expansion should match book 2's List of Terms");
  const use = byId['use'];
  if (use) ok(use.expansion === 'United States of Eurasia', 'USE expansion should match the text');

  // The general form, which the FAITH case should have been from the start:
  // every expansion must appear somewhere in the corpus, appendices included.
  // Naming individual acronyms tests what we happen to remember; this tests the
  // rule. It is also what would have caught FAITH being wrong from the other
  // direction — an expansion sitting here that no book ever prints.
  const cachePath = path.join(ROOT, '.cache', 'corpus.json');
  const CORPUS = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : [];
  for (const e of entries) {
    if (!e.expansion || !CORPUS.length) continue;
    const needle = e.expansion.replace(/[\u2018\u2019]/g, "'").toLowerCase();
    const found = CORPUS.some(c => c.text.replace(/[\u2018\u2019]/g, "'").toLowerCase().includes(needle));
    ok(found, `${e.id}: expansion "${e.expansion}" appears nowhere in the books`);
  }

  // ---- rendering ----
  state.view = 'peoples';
  state.q = '';
  state.people = null;
  run('render()');
  const stage = () => doc.getElementById('stage').innerHTML;

  for (const e of entries) {
    ok(stage().includes(`data-entry="${e.id}"`), `${e.id}: no row rendered`);
    ok(stage().includes(`>${e.name}<`), `${e.id}: name missing from its row`);
  }
  ok(!/NaN|undefined/.test(stage()), 'peoples stage contains NaN or undefined');
  ok(/SPECIES/.test(stage()) && /POLITIES/.test(stage()) && /BOB FACTIONS/.test(stage()),
     'all three sections should be labelled');

  // species, then polities, then factions — the register's own argument in
  // reading order: who counts as a person, who decides, who you throw in with
  const RANK = {people: 0, polity: 1, faction: 2};
  const order = [...stage().matchAll(/data-entry="([^"]+)"/g)].map(m => RANK[byId[m[1]].kind]);
  ok(order.every((r, i) => i === 0 || order[i - 1] <= r),
     `the three kinds are interleaved: ${order.join('')}`);

  // ---- search ----
  state.q = 'quinlan';
  run('render()');
  const hits = [...stage().matchAll(/data-entry="([^"]+)"/g)].map(m => m[1]);
  ok(hits.includes('quinlans'), 'searching "quinlan" should find the Quinlans');
  ok(hits.length < entries.length, 'search should narrow the register');
  state.q = 'zzzznomatch';
  run('render()');
  ok(/NO MATCH/.test(stage()), 'empty state should say so');
  state.q = '';

  // ---- dossier ----
  for (const e of entries) {
    state.people = e.id;
    run('render()');
    const d = doc.getElementById('dossier').innerHTML;
    ok(d.includes(e.name), `${e.id}: dossier does not name it`);
    ok(d.includes(e.cite), `${e.id}: dossier omits the citation`);
    ok(!/NaN|undefined/.test(d), `${e.id}: dossier contains NaN or undefined`);
    if (e.expansion) ok(d.includes(e.expansion), `${e.id}: dossier omits the expansion`);
  }

  // ---- factions tie to the records, in both directions -------------------
  // The point of putting the four in this register is that a faction is a thing
  // in the world and not just a tag. If the tie breaks, the entry is decoration.
  const BOBS = get('BOBS');
  for (const e of entries.filter(x => x.kind === 'faction')) {
    ok(e.factionTag, `${e.id}: a faction needs a factionTag`);
    const mine = BOBS.filter(b => b.faction === e.factionTag);
    ok(mine.length > 0, `${e.id}: factionTag ${e.factionTag} matches no record`);
    state.people = e.id;
    run('render()');
    const d = doc.getElementById('dossier').innerHTML;
    for (const b of mine) ok(d.includes(`#register/${b.id}`), `${e.id}: joiners omit ${b.id}`);
  }
  // and the record points back
  const tagged = BOBS.find(b => b.faction);
  if (tagged) {
    state.view = 'register'; state.selected = tagged.id;
    run('render()');
    const rd = doc.getElementById('dossier').innerHTML;
    const target = entries.find(e => e.factionTag === tagged.faction);
    ok(target && rd.includes(`#peoples/${target.id}`),
       `${tagged.id}'s faction should link to its register entry`);
    state.view = 'peoples'; state.selected = null;
  }

  // a people lists the polities that speak for it
  state.people = 'quinlans';
  run('render()');
  const quin = doc.getElementById('dossier').innerHTML;
  const theirs = entries.filter(e => e.of === 'quinlans');
  ok(theirs.length > 0, 'the Quinlans should have polities on file');
  for (const t of theirs) {
    ok(quin.includes(`data-people="${t.id}"`), `Quinlan dossier omits ${t.id}`);
  }
  state.people = null;

  state.view = 'register';
  run('render()');

  console.log(`  ${entries.filter(e => e.kind === 'people').length} species, ` +
              `${entries.filter(e => e.kind === 'polity').length} polities, ` +
              `${entries.filter(e => e.kind === 'faction').length} Bob factions`);
};
