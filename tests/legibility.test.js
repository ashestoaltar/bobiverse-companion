// Can you actually read it?
//
// These exist because the first look at the chart was unreadable in ways no
// unit test noticed: glow washed out every spectral colour, labels collided,
// ring labels sat on top of the cluster, and the backdrop was drawn at an alpha
// that made it invisible. Screenshot bugs, caught only by looking. These are
// the cheapest approximation of looking.

module.exports = ({ok, get, run, each, need}) => {
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
  //
  // This matched `class="star-body"` for the whole of its life, and no such
  // class has ever existed — the bodies are bare circles, classed only when
  // they are a ring or a halo. So `fills` was always empty, the `if` always
  // skipped, and the check that gave this suite its name never ran once. It is
  // matched against the shape the chart actually emits now, and asserted rather
  // than guarded: an empty list here means the chart drew no stars at all,
  // which is a louder bug than the one this was watching for.
  const fills = [...svg.matchAll(/<circle cx="[-\d.]+" cy="[-\d.]+" r="[\d.]+" fill="(#[0-9a-f]{6})"/gi)]
    .map(m => m[1].toLowerCase());
  ok(fills.length >= 10, `only ${fills.length} star bodies drawn — the chart is empty`);
  ok(new Set(fills).size > 3,
     `only ${new Set(fills).size} distinct star colours across ${fills.length} stars — ` +
     `glow may be washing spectral class out`);

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
  // The background is --void. This read `varOf('bg') || varOf('ink')` and
  // neither variable has ever been in the stylesheet, so `bg` was null, the
  // loop hit `continue` on all three passes, and the contrast check this suite
  // was written for asserted nothing for its entire life. The `continue` is
  // what made it invisible: a missing variable read as "not applicable here"
  // rather than as "this test cannot run".
  //
  // Naming it once and asserting it resolves is the fix. If the palette is
  // renamed again, this fails loudly instead of going quiet.
  const bg = need('--void, the page background', varOf('void'));
  each('text colours to check for contrast', ['ash', 'amber-dim', 'amber', 'amber-hi', 'phos'], name => {
    const fg = need(`--${name}`, varOf(name));
    if (!fg || !bg) return;
    const r = ratio(fg, bg);
    ok(r >= 4.5, `--${name} on --void is ${r.toFixed(2)}:1, below WCAG AA 4.5:1`);
  });

  // Checking a fixed list of variables only covers the ones somebody thought
  // of. This walks the other way — every rule that actually paints text, in
  // whatever colour it uses — so a new class in a new colour is covered the day
  // it is written rather than the day someone remembers to add it above.
  //
  // `color:` and a `fill:` on a text element only. Borders, strokes and shape
  // fills are excluded on purpose: --rule is 2.41:1 and draws every divider on
  // the page, which is fine for a 1px line and not fine for a sentence.
  // A rule that sets its own background is measured against that, not against
  // the page. Half the console's text is inverted on selection — a chosen row
  // is --void on --amber — and comparing those to the page background reports
  // 1.00:1 for a combination that is actually 11.40:1 the right way round.
  // Backgrounds, by the selector that sets them. A rule that paints text but
  // sets no background of its own inherits one — `tr[aria-selected] .dim` is
  // drawn on the amber its parent row sets — so an unresolved lookup walks up
  // by longest matching selector prefix. It is not a cascade engine and does
  // not need to be: the question is only ever "what is behind this text", and
  // in a stylesheet this size the containing rule is written out in full.
  const TEXT_RULE = /([^{}]+)\{([^}]*)\}/g;
  const BG = /(?:^|[;\s])background(?:-color)?\s*:\s*var\(--([a-z-]+)\)/;
  const backgrounds = [];
  for (const m of source.matchAll(TEXT_RULE)) {
    const b = BG.exec(m[2]);
    if (b) backgrounds.push({sel: m[1].trim().replace(/\s+/g, ' '), name: b[1]});
  }
  backgrounds.sort((a, b) => b.sel.length - a.sel.length);
  const behind = sel => {
    const parts = b => b.sel.split(',').map(p => p.trim());
    // The containing rule written out in full: `.reg tbody tr[x] .dim` sits
    // inside `.reg tbody tr[x]`.
    let hit = backgrounds.find(b => sel === b.sel ||
      parts(b).some(p => sel.startsWith(p + ' ')));
    // Or written from a shorter root: `tr[x] .prov` sits inside the row set by
    // `.reg tbody tr[x]`, which is not a prefix of it but ends with its head.
    if (!hit) {
      const head = sel.split(' ')[0];
      hit = backgrounds.find(b => parts(b).some(p => p === head || p.endsWith(' ' + head)));
    }
    return hit ? hit.name : 'void';
  };

  const painted = [];
  for (const m of source.matchAll(TEXT_RULE)) {
    const [, selector, body] = m;
    const own = BG.exec(body);
    for (const d of body.split(';')) {
      const c = /(?:^|[^-\w])(color|fill)\s*:\s*var\(--([a-z-]+)\)/.exec(d);
      if (!c) continue;
      // A `fill` only paints glyphs when its selector is a text element.
      if (c[1] === 'fill' && !/label|text|glyph/.test(selector)) continue;
      const sel = selector.trim().replace(/\s+/g, ' ');
      painted.push({selector: sel, name: c[2], on: own ? own[1] : behind(sel)});
    }
  }
  each('CSS rules that paint text', painted, ({selector, name, on}) => {
    const fg = varOf(name), back = varOf(on);
    if (!fg || !back) return;           // a variable defined as another var
    const r = ratio(fg, back);
    ok(r >= 4.5,
       `${selector} paints text in --${name} on --${on}, which is ` +
       `${r.toFixed(2)}:1 — below WCAG AA 4.5:1`);
  }, 10);

  console.log(`  labels placed: ${labels.length} of ${PLACED.length}`);
};
