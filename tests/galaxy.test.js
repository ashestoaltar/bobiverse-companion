// Galaxy context — impression frame, not a second survey chart.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const GALAXY = get('GALAXY');
  const GATES = get('GATES');
  const state = get('state');
  const doc = get('document');
  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'galaxy.json'), 'utf8'));

  ok(GALAXY && typeof GALAXY.diameter_ly === 'number', 'galaxy context missing from page');
  ok(!('_comment' in GALAXY), '_comment should be stripped');
  ok(GALAXY.diameter_ly >= 1000, 'diameter_ly should be galactic scale');
  ok(Array.isArray(GALAXY.arms) && GALAXY.arms.length === source.arms.length, 'arms mismatch');

  const bead = get('localBeadLy')();
  ok(bead > 0 && bead < 100, `local bead should be Chart scale, got ${bead}`);
  ok(bead < GALAXY.diameter_ly / 100, 'bead must be tiny vs galactic diameter');

  state.book = get('BOOK_MAX');
  state.view = 'galaxy';
  state.galaxy = null;
  run('render()');
  const svg = doc.getElementById('galaxy-svg');
  ok(svg, 'galaxy svg on stage');
  const markup = svg ? svg.innerHTML : '';
  ok(/LOCAL/.test(markup), 'local bead callout painted');
  ok(/ARTIST|IMPRESSION|NOT A SURVEY/i.test(markup), 'impression disclaimer painted');
  const stage = doc.getElementById('stage').innerHTML;
  ok(/GATES|gates/.test(stage) && /CHART|chart/.test(stage),
     'galaxy bar cross-links GATES and CHART');

  // Mesh overlay only when gates visible
  const gateNodes = ((GATES && GATES.nodes) || []).length;
  if (gateNodes) {
    ok(/Hub Zero|Skippyland|Epsilon Eridani/.test(markup),
       'GATES nodes appear as schematic overlay at full reading position');
  }

  // Book 4: arms and mesh held; bead and disk remain
  state.book = 4;
  run('render()');
  const svg4 = doc.getElementById('galaxy-svg');
  const m4 = svg4 ? svg4.innerHTML : '';
  ok(/LOCAL/.test(m4), 'book 4 still shows local bead');
  ok(!/Hub Zero/.test(m4), 'book 4 must not overlay Hub Zero');
  ok(!/Perseus Arm|perseus_arm/.test(m4) || !/data-galaxy="perseus_arm"/.test(m4),
     'book 4 must not expose Perseus arm hit target');

  state.book = get('BOOK_MAX');
  state.galaxy = 'local';
  run('render()');
  const doss = doc.getElementById('dossier').innerHTML;
  ok(/CHART|local/i.test(doss), 'local dossier offers Chart');

  // Layout must not use gate ferry distances
  ok(!/\b82\s*ly\b/i.test(markup) && !/\b70\s*ly\b/i.test(markup),
     'ferry distances must not appear in galaxy paint');

  console.log(`  bead ≤${bead.toFixed(1)} ly · disk ~${GALAXY.diameter_ly} ly · ${GALAXY.arms.length} arms`);
};
