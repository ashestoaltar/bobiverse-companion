// Star chart: projection geometry and the astrophysics behind the symbols.
//
// The geometry checks are invariants rather than fixtures — Sol stays centred
// at every camera angle, and no pair of systems is ever stretched relative to
// another — so they hold whatever the camera does and whatever gets added to
// systems.json.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const PLACED = get('PLACED');
  const UNPLACED = get('UNPLACED');
  const SYS = get('SYS');
  const SYSTEMS = get('SYSTEMS');
  const CHART = get('CHART');
  const state = get('state');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'systems.json'), 'utf8')).systems;
  const withCoords = source.filter(s => s.xyz_ly);

  ok(PLACED.length + UNPLACED.length === source.length,
     `${PLACED.length} placed + ${UNPLACED.length} unplaced != ${source.length} in systems.json`);
  ok(PLACED.length === withCoords.length,
     `${PLACED.length} placed but ${withCoords.length} systems have coordinates`);

  // ---- Sol is the origin, at every camera angle ----
  for (const [yaw, pitch, zoom] of [[0, 0, 1], [-0.62, 0.5, 1], [2.1, -1.2, 3], [3.14, 1.4, 0.4]]) {
    Object.assign(CHART, {yaw, pitch, zoom, panx: 0, pany: 0});
    const o = run('project([0,0,0], 800, 600)');
    ok(Math.abs(o.x - 400) < 1e-9 && Math.abs(o.y - 300) < 1e-9,
       `Sol off-centre at yaw ${yaw}: (${o.x}, ${o.y})`);
  }

  // ---- the projection is uniform: no pair stretched relative to any other ----
  Object.assign(CHART, {yaw: 0.9, pitch: -0.4, zoom: 1, panx: 0, pany: 0});
  const FARTHEST = get('FARTHEST');
  const unit = (Math.min(800, 600) / 2 - 34) / FARTHEST;
  let worst = 0;
  for (const p of PLACED) {
    for (const q of PLACED) {
      const pp = run(`project(${JSON.stringify(p.xyz_ly)},800,600)`);
      const qq = run(`project(${JSON.stringify(q.xyz_ly)},800,600)`);
      const screen = Math.hypot(pp.x - qq.x, pp.y - qq.y);
      const truth = Math.hypot(p.xyz_ly[0] - q.xyz_ly[0],
                               p.xyz_ly[1] - q.xyz_ly[1],
                               p.xyz_ly[2] - q.xyz_ly[2]);
      worst = Math.max(worst, screen - truth * unit);
    }
  }
  ok(worst < 1e-6, `projection stretched a separation by ${worst.toFixed(4)}px`);

  // ---- the fiction's own distances, as a check on the coordinates ----
  // Bill lists these from 82 Eridani in Bk3 ch21.
  const dist = (a, b) => Math.hypot(a.xyz_ly[0] - b.xyz_ly[0],
                                    a.xyz_ly[1] - b.xyz_ly[1],
                                    a.xyz_ly[2] - b.xyz_ly[2]);
  const e82 = SYS['82_eridani'];
  for (const [id, said] of [['epsilon_eridani', 12.5], ['omicron2_eridani', 12.0], ['tau_ceti', 12.0]]) {
    const got = dist(e82, SYS[id]);
    ok(Math.abs(got - said) < 1.0, `${id} is ${got.toFixed(2)} ly from 82 Eridani; Bk3 ch21 says ~${said}`);
  }

  // ---- the timeline gate reveals systems in the order the books do ----
  CHART.year = 2150;
  const early = PLACED.filter(s => s.first_year != null && s.first_year <= 2150).map(s => s.name);
  ok(early.length === 1 && early[0] === 'Epsilon Eridani',
     `by 2150 expected only Epsilon Eridani, got ${early.join(', ') || 'nothing'}`);

  const dated = PLACED.filter(s => s.first_year != null);
  CHART.year = 2345;
  ok(PLACED.filter(s => s.first_year != null && s.first_year <= 2345).length === dated.length,
     'the last year on the slider should reveal every dated system');

  // ---- every system's dossier renders ----
  state.view = 'chart';
  for (const sys of SYSTEMS.systems) {
    CHART.sel = sys.id;
    try { run('render()'); } catch (e) { ok(false, `system dossier ${sys.id}: ${e.message}`); }
  }
  CHART.sel = null;

  // ---- astrophysics ----
  const withSpec = PLACED.filter(s => s.spectral);
  ok(withSpec.length === withCoords.filter(s => s.spectral).length,
     'a placed system lost its spectral type in the build');

  for (const s of withSpec) {
    const colour = run(`starColour(SYS[${JSON.stringify(s.id)}])`);
    const radius = run(`starRadius(SYS[${JSON.stringify(s.id)}])`);
    ok(/^#[0-9a-f]{6}$/i.test(colour), `${s.name}: bad colour ${colour}`);
    ok(radius >= 2.4 && radius <= 7.6, `${s.name}: radius out of range ${radius}`);
  }

  // class comes from the spectral string, not a default
  ok(run("starClass(SYS.gliese_877)") === 'M', 'Gliese 877 (M3V) should classify M');
  ok(run("starClass(SYS.eta_leporis)") === 'F', 'Eta Leporis (F2V) should classify F');
  ok(run("starClass(SYS.omicron2_eridani)") === 'K', '40 Eri (K0V) should classify K');
  ok(run('starRadius(SYS.eta_leporis)') > run('starRadius(SYS.gliese_877)'),
     'an F2V dwarf should outshine an M3 dwarf');

  // absolute magnitude must follow from apparent V and parallax
  for (const s of withSpec) {
    if (s.vmag == null || !s.parallax_mas || s.id === 'sol') continue;
    const want = s.vmag - 5 * Math.log10(1000 / s.parallax_mas) + 5;
    ok(Math.abs(want - s.abs_mag) < 0.01,
       `${s.name}: abs_mag ${s.abs_mag} but V and parallax give ${want.toFixed(3)}`);
  }
  ok(SYS.sol.abs_mag === 4.83, "Sol's absolute V should be 4.83");

  // a glow gradient exists for every class actually in use
  const defs = run('chartDefs()');
  for (const s of withSpec) {
    const cls = run(`starClass(SYS[${JSON.stringify(s.id)}])`);
    ok(defs.includes(`glow-${cls}`), `no gradient defined for spectral class ${cls}`);
  }

  console.log(`  ${PLACED.length} placed, ${UNPLACED.length} unplaced, ${withSpec.length} with spectra`);
};
