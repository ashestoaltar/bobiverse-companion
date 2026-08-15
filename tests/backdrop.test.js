// The naked-eye backdrop, from the HYG database.
//
// Sol gets its own check because it leaked in once: its Cartesian position is
// 0.000005 rather than exactly zero, so a `x === 0` test missed it and the Sun
// was drawn into the backdrop at magnitude -26.7.
//
// The extract and the shipped field are two different sets now — 5,070 stars
// taken from HYG, cut to magnitude 5.5 on the way into the page — so the checks
// that used to compare a count against the data file have to say which of the
// two they mean, and the reason for the cut is itself under test below.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const SKYFIELD = get('SKYFIELD');
  const SKY = get('SKY');
  const CHART = get('CHART');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'skyfield.json'), 'utf8'));
  const limit = source.display_limit != null ? source.display_limit : source.magnitude_limit;
  const packed = source.stars.split(',');
  const wanted = [];
  for (let i = 0; i < source.count; i++)
    if (+packed[i * 5 + 3] / 10 <= limit) wanted.push(+packed[i * 5 + 3] / 10);

  ok(wanted.length > 0 && wanted.length <= source.count,
     `the display limit ${limit} keeps ${wanted.length} of ${source.count} extracted stars`);
  ok(SKYFIELD && SKYFIELD.count === wanted.length,
     `console has ${SKYFIELD && SKYFIELD.count} stars, ` +
     `skyfield.json has ${wanted.length} at or brighter than magnitude ${limit}`);
  ok(SKY.length === SKYFIELD.count, `unpacked ${SKY.length} of ${SKYFIELD.count}`);
  ok(SKYFIELD.limit === limit,
     `the page says its limit is ${SKYFIELD.limit}, the data says ${limit}`);

  // The cut has one justification and it is falsifiable: everything dropped
  // would have rendered identically to the faintest thing kept, because the
  // alpha ramp clamps before magnitude 5.5 and the size ladder has already
  // reached its last rung. Retune either curve so the faint stars would differ
  // again and this fails — at which point the cut needs re-arguing, not
  // renumbering.
  ok(run(`skyAlpha(${limit})`) === run(`skyAlpha(${source.magnitude_limit})`),
     `a magnitude ${source.magnitude_limit} star would not render at the same ` +
     `alpha as one at the ${limit} cut — the dropped stars were distinguishable`);
  ok(run(`skySize(${limit})`) === run(`skySize(${source.magnitude_limit})`),
     `a magnitude ${source.magnitude_limit} star would not render at the same ` +
     `size as one at the ${limit} cut`);
  // And the ramp is a ramp above the clamp, or the cut argument proves too much.
  ok(run('skyAlpha(1)') > run('skyAlpha(3)') && run('skyAlpha(3)') > run('skyAlpha(5)'),
     'the alpha ramp does not fade with magnitude at all');

  // The page states its own faintest magnitude rather than a number typed in
  // beside it. Read from what the chart renders, not from the file: the file
  // holds the expression, and an expression is not a claim until it runs.
  get('state').view = 'chart';
  run('render()');
  const stated = /to magnitude ([\d.]+) from the HYG/.exec(
    get('document').getElementById('stage').innerHTML);
  ok(stated && +stated[1] === limit,
     `the chart tells the reader magnitude ${stated && stated[1]}, ships to ${limit}`);
  ok(new RegExp(`Backdrop: ${SKYFIELD.count.toLocaleString()} `)
       .test(get('document').getElementById('stage').innerHTML),
     'the chart states a star count that is not the one it shipped');

  // HYG is CC BY-SA 4.0 — attribution has to survive into the shipped file.
  ok(/HYG/.test(SKYFIELD.source), 'HYG attribution missing from the data');
  ok(/CC BY-SA/.test(SKYFIELD.licence), 'licence missing from the data');
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  ok(/HYG/.test(html) && /CC BY-SA/.test(html), 'attribution not visible in the built page');

  // ---- every backdrop star is a unit direction ----
  let worstR = 0;
  for (const s of SKY) worstR = Math.max(worstR, Math.abs(Math.hypot(...s.v) - 1));
  ok(worstR < 0.002, `sky point off the unit sphere by ${worstR.toFixed(5)}`);

  // rotation preserves length, or the sky shears
  Object.assign(CHART, {yaw: 1.3, pitch: -0.7});
  let worstRot = 0;
  for (const s of SKY) {
    const r = run(`rot(${JSON.stringify(s.v)})`);
    worstRot = Math.max(worstRot, Math.abs(Math.hypot(...r) - Math.hypot(...s.v)));
  }
  ok(worstRot < 1e-9, `rotation changed a vector length by ${worstRot}`);

  // ---- Sol is the observer, not a backdrop star ----
  const solLike = SKY.filter(s => s.m < -10);
  ok(solLike.length === 0, `the Sun leaked into the backdrop: ${solLike.length} stars brighter than -10`);

  const mags = SKY.map(s => s.m);
  const brightest = Math.min(...mags);
  ok(brightest > -2 && brightest < -1,
     `brightest backdrop star should be Sirius near -1.4, got ${brightest}`);
  ok(Math.max(...mags) <= limit,
     `a star fainter than the display limit got in: ${Math.max(...mags)}`);

  // ---- colour index maps to a valid colour across its whole range ----
  for (const ci of [-0.9, -0.5, -0.4, 0, 0.35, 0.65, 1.0, 1.5, 2.0, 2.5, 3.5]) {
    const c = run(`ciColour(${ci})`);
    ok(c.length === 3 && c.every(v => Number.isFinite(v) && v >= 0 && v <= 255),
       `bad colour for ci ${ci}: ${JSON.stringify(c)}`);
  }
  ok(run('ciColour(-0.3)')[2] > run('ciColour(1.5)')[2], 'blue channel should fall as colour index rises');
  ok(run('ciColour(1.5)')[0] >= run('ciColour(-0.3)')[0], 'red channel should rise as colour index rises');

  // ---- nothing renders NaN at extreme viewports or angles ----
  for (const [w, h] of [[400, 300], [1200, 800], [320, 240], [2560, 1440]]) {
    for (const [yaw, pitch] of [[0, 0], [2.4, 1.1], [-1.9, -1.4]]) {
      Object.assign(CHART, {yaw, pitch});
      const out = run(`skyLayer(${w},${h})`);
      ok(!out.includes('NaN'), `NaN in sky layer at ${w}x${h}, yaw ${yaw}`);
    }
  }
  for (const [yaw, pitch, zoom] of [[0, 0, 1], [3.1, 1.49, 0.35], [-2.2, -1.49, 9]]) {
    Object.assign(CHART, {yaw, pitch, zoom});
    const svg = run('chartSvg(1000, 700)');
    ok(!svg.includes('NaN'), `NaN in chart at yaw ${yaw}`);
    ok(!svg.includes('undefined'), `undefined in chart at yaw ${yaw}`);
  }
  Object.assign(CHART, {yaw: -0.62, pitch: 0.5, zoom: 1});

  // ---- paintSky survives a canvas that gives it nothing ----
  const probe = {painted: 0};
  run(`globalThis.__probe = {painted: 0};
       globalThis.__fakeCanvas = {width: 0, height: 0, getContext(){ return {
         setTransform(){}, clearRect(){}, fillRect(){ globalThis.__probe.painted++; },
         beginPath(){}, arc(){}, fill(){}, set fillStyle(v){}, set globalAlpha(v){} }; }};
       paintSky(globalThis.__fakeCanvas, 900, 600);`);
  probe.painted = run('globalThis.__probe.painted');
  ok(probe.painted > 400, `paintSky drew only ${probe.painted} stars`);
  ok(run('globalThis.__fakeCanvas.width') > 0, 'canvas was never sized');

  // a canvas with no 2d context must not throw
  try {
    run('paintSky({width:0, height:0, getContext(){ return null; }}, 900, 600)');
  } catch (e) {
    ok(false, `paintSky threw on a null context: ${e.message}`);
  }

  console.log(`  ${SKY.length} stars, brightest ${brightest}, ${probe.painted} painted`);
};
