// The vessels register — design generations vs named hulls.
//
// Ship names (Heaven-2) and design generations (generation 2) are different
// things in the books; this register holds both and refuses to collapse them.
// Holotank plates hang on vessels/<id>. A Bob's free-text vessel field links
// here when it matches an entry's `match` string.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, need, ROOT}) => {
  const VESSELS = get('VESSELS');
  const BOBS = get('BOBS');
  const state = get('state');
  const doc = get('document');
  const HOLO = get('HOLO');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'vessels.json'), 'utf8'));

  ok(VESSELS && Array.isArray(VESSELS.vessels), 'no vessels register reached the page');
  const craft = VESSELS.vessels;
  ok(craft.length === source.vessels.length,
     `page has ${craft.length} vessels, data has ${source.vessels.length}`);
  ok(!('_comment' in VESSELS), '_comment should be stripped by the build');
  ok(craft.length > 0, 'vessels register is empty');

  each('vessels', craft, v => {
    ok(v.id && v.name, `${v.id}: missing id or name`);
    ok(['design', 'hull', 'class', 'weapon'].includes(v.kind), `${v.id}: bad kind ${v.kind}`);
    ok(['heaven', 'colony', 'exodus', 'medeiros', 'others', 'other'].includes(v.line),
       `${v.id}: bad line ${v.line}`);
    ok(v.cite && /^Bk\d+/.test(v.cite), `${v.id}: cite missing or malformed: ${v.cite}`);
    ok(v.note && v.note.length > 40, `${v.id}: note too thin`);
    ok(typeof v.spoil === 'number' && v.spoil >= 1, `${v.id}: spoil missing`);
  }, 4);
  ok(new Set(craft.map(v => v.id)).size === craft.length, 'duplicate vessel id');

  // design gens and hull names both present
  ok(craft.some(v => v.kind === 'design' && v.generation === 1), 'missing heaven gen 1 design');
  ok(craft.some(v => v.match === 'Heaven-2'), 'Heaven-2 hull should be on file');
  ok(craft.some(v => v.match === 'HEAVEN-1B'), 'HEAVEN-1B hull should be on file');

  // every bob vessel label resolves
  for (const b of BOBS) {
    if (!b.vessel) continue;
    ok(craft.some(v => v.match === b.vessel),
       `${b.id}: vessel '${b.vessel}' has no match in the vessels register`);
  }

  // ---- rendering ----
  state.view = 'vessels';
  state.q = '';
  state.vessel = null;
  run('render()');
  const stage = () => doc.getElementById('stage').innerHTML;

  for (const v of craft) {
    ok(stage().includes(`data-vessel="${v.id}"`), `${v.id}: no card rendered`);
  }
  ok(!/NaN|undefined/.test(stage()), 'vessels stage contains NaN or undefined');

  // designs sort before hulls of the same generation/line in a stable way
  ok(/data-vessel="heaven_g1"/.test(stage()), 'heaven_g1 should render');

  state.q = 'exodus';
  run('render()');
  const found = [...stage().matchAll(/data-vessel="([^"]+)"/g)].map(m => m[1]);
  ok(found.length > 0 && found.length < craft.length, 'search should narrow vessels');
  ok(found.every(id => id.startsWith('exodus') || craft.find(v => v.id === id).line === 'exodus'
      || /exodus/i.test(craft.find(v => v.id === id).name + craft.find(v => v.id === id).note)),
     'exodus search should stay in family');
  state.q = '';

  // dossier + holotank attachment on a design with a plate
  const withPlate = need('design with plate',
    craft.find(v => HOLO.plates.some(p => p.about === `vessels/${v.id}`)));
  state.vessel = withPlate.id;
  run('render()');
  const doss = doc.getElementById('dossier').innerHTML;
  ok(doss.includes(withPlate.name), 'vessel dossier missing name');
  ok(/data-plate=/.test(doss), `${withPlate.id}: holotank attachment missing from vessels dossier`);
  ok(/CREW|ASSOCIATED/.test(doss) || /crew/i.test(doss), 'vessel dossier should list crew when present');

  // Bob dossier links into vessels
  const bob = need('bob with vessel', BOBS.find(b => b.vessel === 'Heaven-2'));
  state.view = 'register';
  state.selected = bob.id;
  state.vessel = null;
  run('render()');
  const bobD = doc.getElementById('dossier').innerHTML;
  ok(bobD.includes(`href="#vessels/`), `${bob.id}: vessel field should link into vessels register`);

  console.log(`  ${craft.length} vessels · ${craft.filter(v => v.kind === 'design').length} designs · ` +
              `${craft.filter(v => v.kind === 'hull').length} hulls`);
};
