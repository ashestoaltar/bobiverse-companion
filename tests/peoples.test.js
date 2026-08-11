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
    ok(['people', 'polity'].includes(e.kind), `${e.id}: bad kind ${e.kind}`);
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
  // FAITH is the test case: it is never unpacked on the page, so it must carry
  // no expansion. Inventing a plausible one is the failure mode this guards.
  const faith = byId['faith'];
  if (faith) ok(!faith.expansion, 'FAITH has no expansion in the books; it must not have one here');
  const use = byId['use'];
  if (use) ok(use.expansion === 'United States of Eurasia', 'USE expansion should match the text');

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
  ok(/SPECIES/.test(stage()) && /POLITIES/.test(stage()), 'both sections should be labelled');

  // species come before polities
  const order = [...stage().matchAll(/data-entry="([^"]+)"/g)].map(m => m[1]);
  const firstPolity = order.findIndex(id => byId[id].kind === 'polity');
  const lastPeople = order.map(id => byId[id].kind).lastIndexOf('people');
  ok(firstPolity === -1 || lastPeople < firstPolity, 'species should all precede polities');

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
              `${entries.filter(e => e.kind === 'polity').length} polities`);
};
