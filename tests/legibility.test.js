// Can you actually read it?
//
// These exist because the first look at the chart was unreadable in ways no
// unit test noticed: glow washed out every spectral colour, labels collided,
// ring labels sat on top of the cluster, and the backdrop was drawn at an alpha
// that made it invisible. Screenshot bugs, caught only by looking. These are
// the cheapest approximation of looking.

module.exports = ({ok, get, run}) => {
  const PLACED = get('PLACED');
  const CHART = get('CHART');

  // The default camera, which is what anyone sees first.
  Object.assign(CHART, {yaw: -0.62, pitch: 0.50, zoom: 1, panx: 0, pany: 0, year: 2345, sel: null});
  const svg = run('chartSvg(1300, 660)');

  const labels = [...svg.matchAll(/class="star-label"[^>]*>([^<]+)</g)].map(m => m[1]);
  ok(labels.length >= 8, `only ${labels.length} labels survived decluttering`);
  ok(new Set(labels).size === labels.length, 'a label was drawn twice');

  // Systems that carry real narrative weight must keep their names at the
  // default angle. Omicron² Eridani is here because decluttering once dropped
  // it — 34 scenes, and the Vulcans' home.
  for (const want of ['Sol', 'Epsilon Eridani', 'Eta Leporis', 'Omicron² Eridani']) {
    ok(labels.includes(want), `${want} lost its label to decluttering`);
  }

  // Ring labels belong below the cluster, not through it.
  const ringY = [...svg.matchAll(/class="ring-label" x="([\d.]+)" y="([\d.]+)"/g)].map(m => +m[2]);
  ok(ringY.length >= 4, `ring labels missing: ${ringY.length}`);
  ok(Math.min(...ringY) > 330, `a ring label is still in the upper half at y=${Math.min(...ringY)}`);

  // Spectral colour must survive the glow: the star bodies should not all be
  // the same colour once drawn.
  const fills = [...svg.matchAll(/class="star-body"[^>]*fill="(#[0-9a-f]{6})"/gi)].map(m => m[1].toLowerCase());
  if (fills.length) {
    ok(new Set(fills).size > 3, `only ${new Set(fills).size} distinct star colours — glow may be washing them out`);
  }

  // Contrast: the palette must clear WCAG AA for body text. --ash was once at
  // 2.26:1 and was used for labels, metadata and the status line.
  const css = run('typeof CSS_TEXT === "string" ? CSS_TEXT : ""');
  const source = css || require('fs').readFileSync(
    require('path').join(__dirname, '..', 'dist', 'index.html'), 'utf8');

  const lum = hex => {
    const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  const varOf = name => {
    const m = new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`).exec(source);
    return m && m[1];
  };
  const bg = varOf('bg') || varOf('ink');
  for (const name of ['ash', 'amber-dim', 'amber']) {
    const fg = varOf(name);
    if (!fg || !bg) continue;
    const r = ratio(fg, bg);
    ok(r >= 4.5, `--${name} on --bg is ${r.toFixed(2)}:1, below WCAG AA 4.5:1`);
  }

  console.log(`  labels placed: ${labels.length} of ${PLACED.length}`);
};
