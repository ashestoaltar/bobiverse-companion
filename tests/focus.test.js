// Where focus is, and where it goes next.
//
// None of this is visible with a mouse, which is why it was all wrong. The tab
// bar carried role="tablist" and did not implement one — a screen reader tells
// the reader arrow keys will move between tabs, and they did nothing, which is
// worse than never claiming it. Opening a dossier left focus behind and closing
// one dropped it at the top of the document, so on a keyboard every dismissal
// cost you your place in the register.
//
// On a phone it matters more than it looks: there is no Escape key, so focus
// and the close button are the only ways out of a sheet.

module.exports = ({ok, get, run, each, need}) => {
  const doc = get('document');
  const win = get('window');
  const state = get('state');
  const REGISTERS = get('REGISTERS');
  const BOBS = get('BOBS');
  const DESK = win.innerWidth;
  const PHONE = 390;

  const reset = () => {
    Object.assign(state, {view: 'register', q: '', selected: null, beast: null,
                          people: null, blog: null});
    state.filters.clear();
    win.innerWidth = DESK;
    run('render()');
  };

  // ---- the tab bar keeps a tablist's promises ---------------------------
  reset();
  const tabsOf = () => [...doc.getElementById('tabs').innerHTML.matchAll(/<button[^>]*>/g)]
    .map(m => m[0]);

  const strip = run('tabStripIds()');
  each('tabs', tabsOf(), tab => {
    ok(/aria-controls="stage"/.test(tab), `a tab does not say what it controls: ${tab.slice(0, 60)}`);
    ok(/tabindex="(0|-1)"/.test(tab), `a tab has no explicit tab stop: ${tab.slice(0, 60)}`);
  }, strip.length);

  // A tablist is one tab stop, not ten. Without this, Tab walks every register
  // before it reaches the register.
  const stops = tabsOf().filter(t => /tabindex="0"/.test(t));
  ok(stops.length === 1, `the tab bar has ${stops.length} tab stops, expected 1`);
  ok(/aria-selected="true"/.test(stops[0]), 'the one tab stop is not the selected tab');

  // ---- arrow keys move, and the roving stop moves with them -------------
  // The handler is attached to document, which the stub does not dispatch, so
  // drive the same state transition the handler performs and assert the tab bar
  // follows. What is being tested is that the roving stop tracks the view — the
  // key mapping itself is asserted from the shipped source below.
  // Walk the top strip (WORLD stands in for vessels/bestiary/peoples/persons).
  each('registers to move between', strip, id => {
    state.view = id === 'world' ? run('worldTabTarget()') : id;
    run('render()');
    const one = tabsOf().filter(t => /tabindex="0"/.test(t));
    ok(one.length === 1 && new RegExp(`data-view="${id}"`).test(one[0]),
       `the tab stop did not follow the view to ${id}`);
  });

  // The key handling itself, read off the shipped page. A tablist that claims
  // arrow keys has to bind all four.
  const src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'dist', 'index.html'), 'utf8');
  ok(/ArrowLeft\|ArrowRight\|Home\|End/.test(src),
     'the tab bar does not bind the four keys a tablist promises');
  ok(/aria-controls="stage"/.test(src), 'tabs do not declare the region they control');

  // ---- closing puts focus back where it came from -----------------------
  // render() rewrites the stage, so the row that opened the dossier is a
  // different node by the time anyone closes it. What survives is the selector.
  reset();
  const id = BOBS[0].id;
  const row = doc.createElement();
  row.dataset.id = id;
  doc._register(`[data-id="${id}"]`, row);

  run('rememberOpener')(row);
  state.selected = id;
  run('render()');
  doc.activeElement = doc.getElementById('d-close');
  run('clearSelection()');
  ok(doc.activeElement === row,
     'closing the dossier did not put focus back on the row that opened it');

  // A close with no remembered opener must not throw and must not steal focus
  // to something arbitrary.
  const parked = doc.getElementById('q');
  doc.activeElement = parked;
  run('clearSelection()');
  ok(doc.activeElement === parked, 'closing moved focus with nowhere to put it back');

  // ---- an opening sheet takes focus, a desktop column never does --------
  reset();
  state.selected = id;
  run('render()');
  ok(doc.activeElement !== doc.getElementById('d-close'),
     'the desktop dossier took focus — it is a column, always there, and moving ' +
     'focus into it is a theft rather than a handoff');

  reset();
  win.innerWidth = PHONE;
  try {
    state.selected = id;
    doc.activeElement = parked;
    run('render()');
    ok(doc.activeElement === doc.getElementById('d-close'),
       'an opening sheet left focus outside it — with no Escape key on a phone, ' +
       'focus and the close button are the only ways out');

    // Only on the transition. syncSheet() runs on every render, and a sheet
    // that re-took focus each time would fight anybody typing in the search box
    // with a record still open.
    doc.activeElement = parked;
    run('render()');
    ok(doc.activeElement === parked,
       'the sheet re-took focus on a repaint, which would fight the search box');
  } finally {
    win.innerWidth = DESK;
  }

  reset();
  console.log(`  ${strip.length} top tabs (${REGISTERS.length} registers), one tab stop, focus returns on close`);
};
