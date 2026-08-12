// In Memorium — the fate model, and the entries that have no name.
//
// This register makes a claim the others don't: that it knows how many Bobs
// died without knowing who three of them were. That only stays true if the
// unnamed count keeps coming from Bill's line in Bk1 ch60 rather than from
// whatever happens to be in the data, so most of what follows checks that the
// page and data/memorium.json still agree, and that the four fates stay
// distinct.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const BOBS = get('BOBS');
  const MEMORIUM = get('MEMORIUM');
  const FATE = get('FATE');
  const state = get('state');
  const doc = get('document');

  const source = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data', 'memorium.json'), 'utf8'));

  const by = f => BOBS.filter(b => b.fate === f);
  const named = by('memorium'), presumed = by('presumed'), restored = by('restored');

  // ---- the fate field ---------------------------------------------------
  ok(MEMORIUM && MEMORIUM.unnamed, 'the memorium file did not reach the page');
  ok(!Object.keys(MEMORIUM).some(k => k.startsWith('_')),
     'editorial comments should be stripped by the build');

  for (const b of BOBS) {
    ok(b.fate in FATE, `${b.id}: fate ${JSON.stringify(b.fate)} is not one of the four`);
    ok(b.status === undefined, `${b.id}: still carries the old status field`);
    // a fate other than active is a claim about the text, so it needs a page
    if (b.fate !== 'active') ok(b.fateCite, `${b.id}: fate ${b.fate} with no citation`);
    if (b.fate === 'memorium' || b.fate === 'presumed')
      ok(b.fateNote, `${b.id}: fate ${b.fate} with no note saying what is known`);
    if (b.fate === 'active')
      ok(!b.fateCite && !b.fateNote, `${b.id}: active but carries fate evidence`);
  }

  // The distinction the whole register exists for. If these ever collapse back
  // into one bucket we are asserting that a destroyed ship is a death, which is
  // the thing the books spend five books not saying.
  ok(named.length > 0, 'nobody is on the list');
  ok(restored.length > 0, 'nobody was recovered — the fate model has collapsed');
  ok(presumed.length > 0, 'nothing is unaccounted for — suspiciously tidy');

  // Elmer is the specific record this model was built to fix: his vessel was
  // destroyed at 82 Eridani and he is named on the page as having survived it.
  const elmer = BOBS.find(b => b.id === 'elmer');
  ok(elmer && elmer.fate === 'restored',
     'Elmer is not marked restored — Bk1 ch60 has Bill confirm he made it');
  const bender = BOBS.find(b => b.id === 'bender');
  ok(bender && bender.fate === 'restored',
     'Bender is not marked restored — the Heaven\'s River expedition got him out (Bk4 ch64)');

  // ---- the unnamed ------------------------------------------------------
  const unnamed = MEMORIUM.unnamed.reduce((n, u) => n + u.n, 0);
  ok(unnamed > 0, 'the counted-but-unnamed entries are gone');
  ok(unnamed === source.unnamed.reduce((n, u) => n + u.n, 0),
     'the page and data/memorium.json disagree about how many are unnamed');
  for (const u of MEMORIUM.unnamed) {
    ok(u.cite, 'a counted absence still has to cite the page that counts it');
    ok(u.n < (u.of || []).length,
       `${u.n} unnamed drawn from ${(u.of || []).length} candidates — at equal, we'd know them all`);
    for (const id of u.of || []) {
      const b = BOBS.find(x => x.id === id);
      ok(b, `candidate ${id} is not a record`);
      ok(b && b.fate === 'presumed',
         `candidate ${id} is ${b && b.fate} — resolved candidates must leave the pool`);
    }
  }

  // Taylor's spelling. Standard English wants Memoriam; this is a quotation.
  const shipped = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  ok(!/Memoriam/.test(shipped), "the page says 'Memoriam'; the books say 'Memorium'");
  ok(/In Memorium/.test(shipped), "the page never says 'In Memorium' at all");

  // ---- rendering --------------------------------------------------------
  state.view = 'memorium';
  state.selected = null;
  state.q = '';
  run('render()');
  const stage = doc.getElementById('stage').innerHTML;

  ok(/mem-blank/.test(stage), 'the unnamed entries are not rendered as rows');
  const blanks = (stage.match(/mem-blank/g) || []).length;
  ok(blanks === unnamed,
     `${blanks} blank rows for ${unnamed} unnamed entries — the count must come from the books`);
  for (const b of named) ok(stage.includes(b.name), `${b.name} is missing from the list`);
  for (const b of presumed) ok(stage.includes(b.name), `${b.name} is missing from the unaccounted section`);
  ok(!/NaN|undefined/.test(stage), 'the register rendered NaN or undefined');

  // Fail closed: an empty register must not look like a passing one. Every
  // section header carries its own count, so a bug that empties one shows up
  // as a zero rather than as a section that quietly isn't there.
  ok(/ON THE LIST/.test(stage), 'the list section vanished');
  ok(new RegExp(`UNACCOUNTED — ${presumed.length}`).test(stage), 'the unaccounted count is wrong');
  ok(new RegExp(`RECOVERED — ${restored.length}`).test(stage), 'the recovered count is wrong');

  // the status line reports the total, not just the names
  const status = doc.getElementById('status').innerHTML;
  ok(status.includes(String(named.length + unnamed)),
     `status line does not report ${named.length + unnamed} on the list`);

  // selecting a name still opens the ordinary dossier
  state.selected = named[0].id;
  run('render()');
  const dossier = doc.getElementById('dossier').innerHTML;
  ok(dossier.includes(named[0].name), 'selecting a memorium row did not open its dossier');
  ok(/IN MEMORIUM/.test(dossier), 'the dossier does not flag the fate');
  state.selected = null;
  state.view = 'register';
  run('render()');

  console.log(`  ${named.length} named + ${unnamed} unnamed on the list, ` +
              `${presumed.length} unaccounted, ${restored.length} recovered`);
};
