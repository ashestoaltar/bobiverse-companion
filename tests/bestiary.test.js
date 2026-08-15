// The bestiary, and the boundary it exists to hold.
//
// The load-bearing rule is that this register contains fauna and nothing else.
// Deltans, Quinlans, Pav and the Others are people; the series is largely about
// Bob working out that they are, so shelving them under "beasts" would have the
// console arguing against the books. validate.py enforces it at build time and
// this checks the shipped result.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, need, ROOT}) => {
  const BESTIARY = get('BESTIARY');
  const SYS = get('SYS');
  const state = get('state');
  const doc = get('document');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bestiary.json'), 'utf8'));

  ok(BESTIARY && Array.isArray(BESTIARY.creatures), 'no bestiary reached the page');
  const beasts = BESTIARY.creatures;
  ok(beasts.length === source.creatures.length,
     `page has ${beasts.length} creatures, data has ${source.creatures.length}`);
  ok(!('_comment' in BESTIARY), '_comment should be stripped by the build');

  // ---- the boundary ----
  const PEOPLE = ['deltan', 'quinlan', 'snark', 'pav', 'other', 'bawbe'];
  for (const c of beasts) {
    const n = c.name.toLowerCase().replace(/s$/, '');
    ok(!PEOPLE.includes(n), `${c.id}: ${c.name} is a people, not fauna`);
    ok(c.sapience !== 'sapient', `${c.id}: a sapient belongs in the peoples register`);
    ok(['none', 'contested'].includes(c.sapience), `${c.id}: bad sapience ${c.sapience}`);
  }

  // ---- every entry is anchored in the text ----
  for (const c of beasts) {
    ok(c.cite && /^Bk\d+ ch\d+ · /.test(c.cite), `${c.id}: cite is missing or malformed: ${c.cite}`);
    ok(c.note && c.note.length > 40, `${c.id}: note is too thin to be worth showing`);
    ok(c.mentions == null || c.mentions > 0, `${c.id}: mentions should be positive`);
  }
  ok(new Set(beasts.map(c => c.id)).size === beasts.length, 'duplicate creature id');

  // ---- locations resolve into the star chart ----
  for (const c of beasts) {
    if (!c.system) continue;
    ok(SYS[c.system], `${c.id}: system ${c.system} is not in the chart`);
  }

  // ---- rendering ----
  state.view = 'bestiary';
  state.q = '';
  state.beast = null;
  run('render()');
  const stage = () => doc.getElementById('stage').innerHTML;

  for (const c of beasts) {
    ok(stage().includes(`data-beast="${c.id}"`), `${c.id}: no card rendered`);
    ok(stage().includes(`>${c.name}<`), `${c.id}: name missing from its card`);
  }
  ok(!/NaN|undefined/.test(stage()), 'bestiary stage contains NaN or undefined');

  // sorted loudest-first — the gorilloids lead now that the dragons turned out
  // to be people and left for the other register
  const order = [...stage().matchAll(/data-beast="([^"]+)"/g)].map(m => m[1]);
  const byMentions = beasts.slice().sort((a, b) =>
    (b.mentions || 0) - (a.mentions || 0) || a.name.localeCompare(b.name)).map(c => c.id);
  ok(order.join() === byMentions.join(), `card order is ${order[0]}..., expected ${byMentions[0]}...`);

  // ---- search ----
  state.q = 'poseidon';
  run('render()');
  const found = [...stage().matchAll(/data-beast="([^"]+)"/g)].map(m => m[1]);
  ok(found.length > 0 && found.length < beasts.length,
     `searching a world should narrow the list, got ${found.length} of ${beasts.length}`);
  ok(found.includes('kraken'), 'searching "poseidon" should find the kraken');

  state.q = 'zzzznomatch';
  run('render()');
  ok(/NO MATCH/.test(stage()), 'empty state should say so');
  state.q = '';

  // ---- dossier ----
  for (const c of beasts) {
    state.beast = c.id;
    run('render()');
    const d = doc.getElementById('dossier').innerHTML;
    ok(d.includes(c.name), `${c.id}: dossier does not name it`);
    ok(d.includes(c.cite), `${c.id}: dossier omits the citation`);
    ok(!/NaN|undefined/.test(d), `${c.id}: dossier contains NaN or undefined`);
    // an entry without art should say how to add some, not leave a blank
    if (!c.art) ok(d.includes(`assets/bestiary/${c.id}.svg`),
                   `${c.id}: no art, and no note saying where art would go`);
  }
  state.beast = null;

  // ---- illustrations ----
  const drawn = beasts.filter(c => c.art);
  ok(drawn.length > 0, 'the art pipeline shipped nothing — is assets/bestiary/ wired up?');
  for (const c of drawn) {
    ok(c.art.trim().startsWith('<svg'), `${c.id}: art is not an <svg> element`);
    ok(!/<\?xml|<!DOCTYPE/i.test(c.art), `${c.id}: art still carries document-level markup`);
    ok(!/<script/i.test(c.art), `${c.id}: art contains a script`);
    // the page promises no external requests
    ok(!/https?:\/\//i.test(c.art), `${c.id}: art reaches outside the page`);
    // stroke styling comes from CSS via currentColor, so art must not hardcode it
    ok(!/fill="(?!none)[^"]+"/i.test(c.art), `${c.id}: art hardcodes a fill; it should be stroked`);
  }

  // A creature with art renders it; one without gets the reserved plate.
  //
  // This used to assert that some creature on the page had no art, which held
  // right up until every creature had some — and then the check for the empty
  // path started failing because the path had stopped being exercised, not
  // because it had broken. Coverage that depends on a gap in the data
  // evaporates the moment the data improves. So the empty plate is rendered
  // directly from a creature that does not exist, the way registers.test.js
  // adds a register at runtime. The path stays covered whether or not anything
  // real is still undrawn — and something will be: peoples has fourteen
  // entries and no art at all.
  state.view = 'bestiary';
  run('render()');
  const reserved = run('beastPlate({id:"__none__", role:"predator"}, false)');
  ok(/beast-art empty/.test(reserved),
     'a creature with no art should get the reserved plate');
  ok(/aria-hidden="true"/.test(reserved),
     'the reserved plate is decoration and should be hidden from a screen reader');
  ok(!/<svg/.test(reserved), 'the reserved plate should not draw anything');

  const drawn2 = run('beastPlate(BESTIARY.creatures.find(c => c.art), false)');
  ok(/<svg/.test(drawn2) && !/empty/.test(drawn2),
     'a creature with art should render it rather than the reserved plate');
  ok(drawn.length >= 1, 'no creature carries artwork — the inline-SVG path is untested');
  ok(/<div class="beast-art"><svg/.test(stage()), 'illustrated creature did not render its art');

  // ---- the system link hands off to the chart ----
  const withSystem = need('a creature with a home system', beasts.find(c => c.system));
  if (withSystem) {
    state.view = 'bestiary';
    state.beast = withSystem.id;
    run('render()');
    ok(doc.getElementById('dossier').innerHTML.includes(`data-sys="${withSystem.system}"`),
       'the dossier should link its world to the chart');
    state.beast = null;
  }

  state.view = 'register';
  run('render()');

  console.log(`  ${beasts.length} creatures, ${drawn.length} illustrated`);
};
