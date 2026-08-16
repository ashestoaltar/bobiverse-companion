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
    state.people = null; state.vessel = null; state.q = ''; state.filters.clear();
    get('CHART').sel = null;
  };

  // One valid selection per register. A new register declares its sample here
  // the same way it declares itself in SEL, and the check below fails until it
  // does — otherwise a register joins the list and is silently tested with
  // nothing selected, which is the state that always passes.
  const SAMPLE = {
    chart:    Object.keys(SYS)[0],
    systems:  Object.keys(SYS)[0],
    bestiary: (((BESTIARY && BESTIARY.creatures) || [])[0] || {}).id,
    peoples:  (((PEOPLES && PEOPLES.entries) || [])[0] || {}).id,
    vessels:  ((((get('VESSELS') || {}).vessels) || [])[0] || {}).id,
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

  // ---- the sheet behaves like a sheet -----------------------------------
  // It was a panel wearing a sheet's position: fixed over a document that
  // kept scrolling underneath it, no scrim, and the only way out a 24px
  // target. All three are the same omission — it looked modal and wasn't.
  const scrim = doc.getElementById('scrim');
  ok(scrim, 'there is no scrim behind the sheet');
  const body = doc.body;

  reset();
  state.view = 'register';
  specFor('register').set(BOBS[0].id);
  at(PHONE, () => {
    run('render()');
    ok(!doss.hidden, 'the sheet did not open');
    ok(!scrim.hidden, 'the sheet is open with nothing behind it');
    ok(body.classList.contains('sheet-open'),
       'the document still scrolls under an open sheet');
  });
  // Closing takes all three down together.
  at(PHONE, () => {
    run('clearSelection()');
    ok(doss.hidden && scrim.hidden, 'the scrim outlived the sheet');
    ok(!body.classList.contains('sheet-open'), 'the scroll lock outlived the sheet');
  });
  // On a desktop the dossier is a column and covers nothing, so neither the
  // scrim nor the lock may ever apply — locking the scroll there would freeze
  // a page the dossier is not even on top of.
  reset();
  specFor('register').set(BOBS[0].id);
  run('render()');
  ok(scrim.hidden, 'the scrim is showing on a desktop');
  ok(!body.classList.contains('sheet-open'), 'the desktop page has been scroll-locked');
  reset();
  run('render()');

  ok((html.match(/clearSelection\(\)/g) || []).length >= 4,
     'tapping the scrim should dismiss the sheet through clearSelection()');
  ok(/body\.sheet-open\{overflow:hidden\}/.test(html),
     'nothing locks the document scroll while the sheet is up');
  ok(/\.scrim\{\s*display:block; position:fixed; inset:0/.test(html),
     'the scrim is not laid over the page');

  // A thumb wants about 44px and this is the only way out of a sheet — there
  // is no Escape key on a phone.
  const closeSize = /\.dossier-close\{width:(\d+)px; height:(\d+)px/.exec(html);
  ok(closeSize && +closeSize[1] >= 40 && +closeSize[2] >= 40,
     `the sheet's close target is ${closeSize ? closeSize[1] : '?'}px, below a thumb`);

  // The sheet's height and the chart's were chosen separately and sat a fifth
  // of a screen apart. One custom property is the decision made once; two
  // literals is the drift starting again.
  ok(/:root\{--sheet:/.test(html), '--sheet is not declared');
  ok(/\.chart-stage\{flex:none; height:var\(--sheet\)\}/.test(html),
     'the chart stage no longer reads the shared sheet height');
  ok(/max-height:var\(--sheet\)/.test(html),
     'the sheet no longer reads the shared sheet height');
  ok(!/max-height:min\(64dvh/.test(html), 'the old hand-picked sheet height is back');

  // The tree is the one view whose horizontal axis carries meaning — the
  // indent is the descent — so a branch running off the right edge with no way
  // to reach it loses a fact rather than some whitespace. The table learned
  // this and the tree did not.
  state.view = 'genealogy';
  state.selected = null;
  run('render()');
  const stageHtml = doc.getElementById('stage').innerHTML;
  ok(/<div class="scroll-x"><div class="tree">/.test(stageHtml),
     'the tree is not inside a horizontal scroll container');
  // A block that does not size to its content overflows silently: the scroll
  // container sees a child exactly as wide as itself and offers no scroll.
  ok(/\.tree\{[^}]*width:max-content/.test(html),
     '.tree does not size to its widest branch, so .scroll-x has nothing to scroll');
  ok(/\.tree\{[^}]*min-width:100%/.test(html),
     '.tree should still fill the width when the tree is shallow');
  reset();

  // The sheet is fixed to the bottom edge, which is where the home indicator
  // is. Without this it renders underneath one.
  ok(/inset:auto var\(--gap\) max\(var\(--gap\), env\(safe-area-inset-bottom\)\)/.test(html),
     'the dossier sheet does not clear the home indicator');

  reset();
  run('render()');
  console.log(`  ${REGISTERS.length} registers open a dossier at ${PHONE}px, sheet below ${w}px`);
};
