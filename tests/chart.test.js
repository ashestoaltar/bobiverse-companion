// Star chart: projection geometry and the astrophysics behind the symbols.
//
// The geometry checks are invariants rather than fixtures — Sol stays centred
// at every camera angle, and no pair of systems is ever stretched relative to
// another — so they hold whatever the camera does and whatever gets added to
// systems.json.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, need, sandbox, ROOT}) => {
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

  // The glow is drawn under an opaque core, so everything inside offset 38.5%
  // is invisible and only the stops beyond it do any work. It has to clear the
  // backdrop's own floor out there, or a system reads fainter than the speckle
  // behind it — which is what it was doing at 0.11.
  const stops = [...defs.matchAll(/offset="(\d+)%" stop-color="[^"]*" stop-opacity="([\d.]+)"/g)]
                  .map(m => [+m[1] / 100, +m[2]]);
  ok(stops.length >= 3, `the glow gradient has only ${stops.length} stops`);
  const alphaAt = t => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [a, b] = [stops[i - 1], stops[i]];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
    }
    return stops[stops.length - 1][1];
  };
  const CORE = 1 / 2.6;                       // where the opaque disc ends
  ok(alphaAt(CORE) > run('skyAlpha(6)'),
     `the glow reaches the star's edge at ${alphaAt(CORE).toFixed(3)}, ` +
     `dimmer than a backdrop star at ${run('skyAlpha(6)')}`);
  ok(alphaAt(CORE) > alphaAt(0.7) && alphaAt(0.7) > alphaAt(0.95),
     'the glow does not fall off outward');
  ok(alphaAt(1) === 0, 'the glow does not reach zero at its own edge');

  // ---- labels: how many survive decluttering, and do they point at the right
  // star. Both were changed together, and only one of them is about looks.
  //
  // Coverage across a spread of cameras and viewports rather than one, because
  // a placement rule tuned to a single screenshot is a placement rule tuned to
  // a single screenshot. Over these 24 views: 73.1% before the diagonals and
  // the second and third rings, 86.3% after, worst case 9 of 20 up to 14. The
  // floor sits under both so retuning has room, and a regression to the old
  // behaviour still fails.
  const VIEWS = [[1400, 900], [1000, 700], [800, 520], [600, 420]];
  const CAMERAS = [[-0.62, 0.5], [0, 0], [2.36, 1.1], [-2.36, -0.3], [0.79, -0.9], [3.14, 0.5]];
  const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  let labelled = 0, views = 0, misowned = 0, orphan = 0, dupe = 0;
  for (const [w, h] of VIEWS) {
    for (const [yaw, pitch] of CAMERAS) {
      Object.assign(CHART, {yaw, pitch, zoom: 1, panx: 0, pany: 0, year: 2345, sel: null});
      const svg = run(`chartSvg(${w},${h})`);
      const labels = [...svg.matchAll(/class="star-label" x="([-\d.]+)" y="([-\d.]+)">([^<]*)</g)]
                       .map(m => ({x: +m[1], y: +m[2], name: unesc(m[3])}));
      const dots = PLACED.map(s => ({
        name: s.name, p: run(`project(${JSON.stringify(s.xyz_ly)},${w},${h})`)}));
      views++; labelled += labels.length;
      if (new Set(labels.map(l => l.name)).size !== labels.length) dupe++;
      for (const l of labels) {
        const mine = dots.find(d => d.name === l.name);
        if (!mine) { orphan++; continue; }
        // The box the app placed, and the corner of it nearest its own star —
        // the end a reader follows back to find out what the name belongs to.
        const box = {x1: l.x, y1: l.y - 9.8, x2: l.x + l.name.length * 6.4 + 10, y2: l.y + 4.6};
        const ax = Math.min(Math.max(mine.p.x, box.x1), box.x2);
        const ay = Math.min(Math.max(mine.p.y, box.y1), box.y2);
        const near = Math.hypot(ax - mine.p.x, ay - mine.p.y);
        for (const d of dots)
          if (d !== mine && Math.hypot(ax - d.p.x, ay - d.p.y) <= near) { misowned++; break; }
      }
    }
  }
  ok(orphan === 0, `${orphan} labels name something that is not a placed system`);
  ok(dupe === 0, `${dupe} views drew the same name twice`);
  ok(misowned === 0,
     `${misowned} labels start nearer to another system's dot than to their own`);
  const coverage = labelled / (views * PLACED.length);
  ok(coverage > 0.80,
     `only ${(coverage * 100).toFixed(1)}% of names survive decluttering across ${views} views`);
  console.log(`  labels: ${(coverage * 100).toFixed(1)}% placed across ${views} views, ` +
              `none misattributed`);
  Object.assign(CHART, {yaw: -0.62, pitch: 0.5, zoom: 1, panx: 0, pany: 0, sel: null});

  console.log(`  ${PLACED.length} placed, ${UNPLACED.length} unplaced, ${withSpec.length} with spectra`);

  // ---- the help text must only name gestures this device can make ----------
  // The first mobile pass shipped a chart whose instructions were "wheel zoom"
  // and "shift-drag pan" on a phone, which is worse than no instructions: it
  // reads as broken rather than as unsupported. The stub reports a fine
  // pointer, so the desktop wording is the one that should appear.
  get('state').view = 'chart';
  run('render()');
  const bar = get('document').getElementById('stage').innerHTML;
  ok(/WHEEL ZOOM/.test(bar), 'a mouse should be told about the wheel');
  ok(!/PINCH|TWO-FINGER/.test(bar), 'a mouse was offered touch gestures');
  ok(get('TOUCH') === false, 'TOUCH should be false when the pointer is fine');

  // ---- what a drag actually costs ------------------------------------------
  // Measured before it was touched: the sky was 5.27ms of per-frame work on a
  // desktop, and a phone is several times slower than that — over the frame
  // budget for a scene whose only change is where the camera is pointing.
  //
  // A star's colour, brightness and size are properties of the star. Rotating
  // cannot change any of them, so recomputing them per frame was work thrown
  // away 60 times a second to arrive at the same values.
  run('styleSky()');
  const SKY = get('SKY');
  ok(SKY.length > 1000, `the backdrop holds ${SKY.length} stars`);
  // Over the whole backdrop, but as one assertion rather than ten thousand:
  // five thousand identical passes tell you nothing the count of failures does
  // not, and they bury every other check in the suite.
  const unstyled = SKY.filter(st =>
    !/^rgba\(\d+,\d+,\d+,[\d.]+\)$/.test(st.fill || '') || !(st.size > 0));
  ok(unstyled.length === 0,
     `${unstyled.length} of ${SKY.length} stars have no precomputed fill or size, ` +
     `e.g. ${JSON.stringify(unstyled[0])}`);

  // Idempotent, and cheap on the second call — otherwise "compute once" is
  // just "compute again with extra steps".
  const before = SKY[0].fill;
  run('styleSky()');
  ok(SKY[0].fill === before, 'styleSky recomputed what it had already computed');

  // A canvas reallocates its backing store and resets its context whenever
  // width or height is assigned, even to the value it already holds. On a drag
  // that was one full reallocation per frame.
  let resizes = 0;
  const fake = {
    _w: 0, _h: 0,
    get width() { return this._w; }, set width(v) { resizes++; this._w = v; },
    get height() { return this._h; }, set height(v) { resizes++; this._h = v; },
    getContext: () => ({setTransform(){}, clearRect(){}, fillRect(){}, set fillStyle(v){}}),
  };
  sandbox.__fakeCanvas = fake;
  run('paintSky(__fakeCanvas, 800, 500)');
  const first = resizes;
  ok(first > 0, 'the canvas was never sized at all');
  run('paintSky(__fakeCanvas, 800, 500)');
  ok(resizes === first, 'the canvas was resized again at the same dimensions');
  run('paintSky(__fakeCanvas, 900, 500)');
  ok(resizes > first, 'the canvas did not resize when the dimensions changed');

  // Pointer events do not arrive at the refresh rate — a phone reports at
  // 120Hz — so the gesture paths coalesce into one paint per frame. The
  // discrete controls stay synchronous, and so does paintChart() itself,
  // because render() and the tests want the chart drawn when they return.
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'dist', 'index.html'), 'utf8');
  ok(/function paintChartSoon\(\)/.test(src), 'nothing coalesces repaints');
  ok(/requestAnimationFrame/.test(src), 'repaints are not tied to the display');
  const moveHandler = /addEventListener\('pointermove'[\s\S]*?\n  \}\);/.exec(src);
  ok(moveHandler && /paintChartSoon\(\)/.test(moveHandler[0]),
     'a drag still repaints once per pointer event');
  ok(moveHandler && !/[^n]\bpaintChart\(\)/.test(moveHandler[0]),
     'the drag path still calls paintChart directly');
};
