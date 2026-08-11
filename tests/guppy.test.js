// Guppy — the pixel portrait and where it shows up.
//
// Pixel art fails quietly: a row one character short doesn't error, it just
// renders slightly wrong, and nobody notices in a JSON string. So the grid is
// checked here as well as at build time.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const GUPPY = get('GUPPY');
  const state = get('state');
  const doc = get('document');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'guppy.json'), 'utf8'));

  ok(GUPPY && GUPPY.frames, 'no portrait reached the page');
  ok(!Object.keys(GUPPY).some(k => k.startsWith('_')),
     'editorial comments should be stripped by the build');

  const {width: w, height: h, palette, frames} = GUPPY;
  ok(w > 0 && h > 0, `bad dimensions ${w}x${h}`);
  ok(frames.idle && frames.blink, 'expected an idle and a blink frame');

  // ---- the grid is rectangular and uses only known colours ----
  for (const [name, rows] of Object.entries(frames)) {
    ok(rows.length === h, `frame ${name}: ${rows.length} rows, expected ${h}`);
    rows.forEach((row, i) => {
      ok(row.length === w, `frame ${name} row ${i}: width ${row.length}, expected ${w}`);
      for (const ch of row) {
        ok(ch === '.' || ch in palette, `frame ${name} row ${i}: '${ch}' is not in the palette`);
      }
    });
  }
  for (const [key, v] of Object.entries(palette)) {
    ok(typeof v === 'number' && v >= 0 && v <= 1, `palette '${key}' is ${v}, expected 0..1`);
  }

  // ---- blink differs from idle only around the eyes ----
  const differing = frames.idle.map((r, i) => r === frames.blink[i] ? null : i).filter(i => i !== null);
  ok(differing.length > 0, 'the blink frame is identical to idle');
  ok(differing.length <= 4, `blink changes ${differing.length} rows; it should only close the eyes`);
  // ...and the silhouette must not move, or he appears to flinch
  for (const i of differing) {
    const edge = s => [s.indexOf('o'), s.lastIndexOf('o')].join();
    ok(edge(frames.idle[i]) === edge(frames.blink[i]),
       `row ${i}: the outline shifts between frames — that reads as a flinch, not a blink`);
  }

  // ---- rendering ----
  const svg = run("pixelSvg('idle')");
  ok(svg.startsWith('<svg'), 'pixelSvg did not return an svg');
  ok(svg.includes(`viewBox="0 0 ${w} ${h}"`), 'viewBox does not match the grid');
  ok(svg.includes('shape-rendering="crispEdges"'), 'pixel art must not be smoothed');
  ok(svg.includes('role="img"') && /aria-label="[^"]+"/.test(svg), 'portrait needs an accessible label');
  ok(!/NaN|undefined/.test(svg), 'rendered portrait contains NaN or undefined');

  // every drawn cell uses currentColor, so one portrait serves every context
  const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map(m => m[1]);
  ok(fills.length > 0 && fills.every(f => f === 'currentColor'),
     'portrait hardcodes a colour; it should inherit currentColor');

  // runs are merged rather than one rect per pixel
  const rects = (svg.match(/<rect/g) || []).length;
  ok(rects < w * h / 3, `${rects} rects for ${w * h} cells — runs are not being merged`);

  // painted area should match the grid exactly
  const drawn = frames.idle.join('').split('').filter(c => c !== '.').length;
  const area = [...svg.matchAll(/width="(\d+)" height="1"/g)].reduce((n, m) => n + (+m[1]), 0);
  ok(area === drawn, `rendered ${area} cells, grid has ${drawn}`);

  ok(run("pixelSvg('nope')") === '', 'an unknown frame should render nothing, not throw');

  // ---- where he appears ----
  state.view = 'register';
  state.selected = null;
  state.q = '';
  run('render()');
  const idle = doc.getElementById('dossier').innerHTML;
  ok(/id="guppy-idle"/.test(idle), 'Guppy should be waiting in the idle dossier');
  ok(idle.includes('<rect'), 'the idle dossier portrait did not render');

  // and should NOT be there once a record is selected
  state.selected = get('BOBS')[0].id;
  run('render()');
  ok(!/guppy-idle/.test(doc.getElementById('dossier').innerHTML),
     'Guppy should stand aside once a record is selected');
  state.selected = null;

  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  ok(/id="boot-face"/.test(html), 'the boot screen has nowhere to put Guppy');

  console.log(`  ${w}x${h}, ${Object.keys(frames).length} frames, ${rects} rects`);
};
