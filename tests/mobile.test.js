// The rules that only apply on a phone, evaluated at a phone's width.
//
// This suite exists because of a bug it would have caught. Every other suite
// runs at 1400px, where the dossier is a column and is never hidden — so the
// rule that hides it was never once executed, and a mobile pass shipped with
// three registers looking dead on a phone while 3,000 checks stayed green.
//
// The lesson generalises past this one bug: a rule that only fires under a
// media query needs a test that reproduces the media query. Anything added
// under `@media (max-width:860px)` that has a behavioural half belongs here.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const state = get('state');
  const win = get('window');
  const doc = get('document');
  const REGISTERS = get('REGISTERS');
  const BOBS = get('BOBS');
  const SYS = get('SYS');
  const BESTIARY = get('BESTIARY');
  const PEOPLES = get('PEOPLES');
  const doss = doc.getElementById('dossier');

  const PHONE = 390;                    // a small phone in portrait
  const DESK = win.innerWidth;          // whatever the harness installed

  // Width is read at call time, so borrowing it is enough — but put it back
  // even if an assertion throws, or every later suite runs on a phone.
  const at = (w, fn) => { win.innerWidth = w; try { fn(); } finally { win.innerWidth = DESK; } };

  const reset = () => {
    state.view = 'register'; state.selected = null; state.beast = null;
    state.people = null; state.q = ''; state.filters.clear();
    get('CHART').sel = null;
  };

  // One valid selection per register. A new register declares its sample here
  // the same way it declares itself in SEL, and the check below fails until it
  // does — otherwise a register joins the list and is silently tested with
  // nothing selected, which is the state that always passes.
  const SAMPLE = {
    chart:    Object.keys(SYS)[0],
    bestiary: (((BESTIARY && BESTIARY.creatures) || [])[0] || {}).id,
    peoples:  (((PEOPLES && PEOPLES.entries) || [])[0] || {}).id,
    blog:     (((get('BLOG') || {}).posts || [])[0] || {}).id,
  };
  const sampleFor = view => SAMPLE[view] || BOBS[0].id;
  const specFor = view => run(`selOf(${JSON.stringify(view)})`);

  // ---- a selection opens the sheet, whichever register holds it ----------
  for (const reg of REGISTERS) {
    reset();
    const spec = specFor(reg.id);
    const pick = sampleFor(reg.id);
    ok(spec.ok(pick), `register '${reg.id}' has no valid sample selection declared`);
    state.view = reg.id;
    spec.set(pick);
    at(PHONE, () => {
      run('render()');
      ok(!doss.hidden, `'${reg.id}' hid its dossier on a phone with '${pick}' selected`);
      ok(doss.innerHTML.trim().length > 0, `'${reg.id}' opened an empty dossier`);
    });
  }

  // A selection made outside render() has to survive the next one. This is the
  // exact chart bug: pointerup revealed the sheet, and any later repaint —
  // a keystroke in the search box, a resize — hid it again.
  reset();
  state.view = 'chart';
  get('CHART').sel = SAMPLE.chart;
  at(PHONE, () => {
    run('syncSheet()');
    ok(!doss.hidden, 'a tapped system did not open the sheet');
    run('render()');
    ok(!doss.hidden, 'a later render closed the sheet on a still-selected system');
  });

  // ---- nothing selected --------------------------------------------------
  reset();
  at(PHONE, () => {
    run('render()');
    ok(doss.hidden, 'an idle dossier should not cover the page on a phone');
  });
  reset();
  run('render()');
  ok(!doss.hidden, 'the dossier column should never be hidden on a desktop');

  // ---- closing clears what is actually selected --------------------------
  // Clearing state.selected dismissed nothing on the bestiary, because the
  // creature was never in it — the ✕ was a dead control at every width.
  for (const reg of REGISTERS) {
    reset();
    const spec = specFor(reg.id);
    state.view = reg.id;
    spec.set(sampleFor(reg.id));
    run('clearSelection()');
    ok(!spec.get(), `close left '${reg.id}' still selected`);
    at(PHONE, () => {
      run('syncSheet()');
      ok(doss.hidden, `close left the sheet open on '${reg.id}'`);
    });
  }

  // ---- the shipped page ---------------------------------------------------
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');

  ok((html.match(/clearSelection\(\)/g) || []).length >= 3,
     'the close button and Escape should both go through clearSelection()');

  // The breakpoint lives in two languages and they have to agree. CSS decides
  // when the dossier becomes a sheet; JS decides when to hide it. Drift is
  // silent — a band of widths where it covers the page with nothing in it.
  const w = get('SHEET_WIDTH');
  ok(new RegExp(`max-width:\\s*${w}px`).test(html),
     `SHEET_WIDTH is ${w}px but no stylesheet rule uses that breakpoint`);

  // iOS zooms a focused input under 16px and never zooms back. The body drops
  // to 12.5px on a phone, so the search box has to opt out of it by hand.
  ok(/\.prompt input\{font-size:16px\}/.test(html),
     'the search box will trigger iOS zoom at the mobile body size');

  // The sheet is fixed to the bottom edge, which is where the home indicator
  // is. Without this it renders underneath one.
  ok(/inset:auto var\(--gap\) max\(var\(--gap\), env\(safe-area-inset-bottom\)\)/.test(html),
     'the dossier sheet does not clear the home indicator');

  reset();
  run('render()');
  console.log(`  ${REGISTERS.length} registers open a dossier at ${PHONE}px, sheet below ${w}px`);
};
