// Reading position — what the console withholds, and whether it actually does.
//
// The other suites check that things render. This one checks that things
// DON'T, which is a different and less forgiving question: a filter that
// half works still looks fine, and the failure is invisible until it has
// already spoiled a book for somebody.
//
// So the central test is not "does the register hide Homer" but "does any
// pane, in any view, at any reading position, contain something it should be
// holding". It walks every book, every register, and every element render()
// writes to, and looks for leaks by id and by prose.

module.exports = ({ok, get, run}) => {
  const state = get('state');
  const doc = get('document');
  const BOBS = get('BOBS');
  const REGISTERS = get('REGISTERS');
  const BOOK_MAX = get('BOOK_MAX');
  const byId = get('byId');

  const PANES = ['stage', 'dossier', 'status', 'chips', 'tabs'];
  const panes = () => PANES.map(id => {
    const el = doc.getElementById(id);
    return el.innerHTML || el.textContent || '';
  }).join('\n');

  const reset = (book = BOOK_MAX) => {
    Object.assign(state, {view: 'register', q: '', sort: 'name', dir: 1,
                          selected: null, beast: null, people: null, book});
    state.filters = new Set();
    get('CHART').sel = null;
  };

  const at = (book, fn) => { reset(book); fn(); reset(); };
  const held = () => BOBS.filter(b => run('heldRecord')(b));

  // ---- the default changes nothing --------------------------------------
  // "ALL" has to mean the console behaves exactly as it did before any of this
  // existed, or the feature has a cost for everyone who never touches it.
  reset(BOOK_MAX);
  ok(run('gating()') === false, 'the top setting should not be gating anything');
  ok(run('visible()').length === BOBS.length,
     `every record should be listed at book ${BOOK_MAX}`);
  ok(held().length === 0, 'nothing should be held at the top setting');
  ok(!/WITHHELD/.test(panes()), 'the default view should have nothing withheld in it');

  // Records with no citation at all are held only while a limit is set — they
  // are undated, not late, and hiding them by default would be a data purge.
  const uncited = BOBS.filter(b => !b.cite && !b.fateCite);
  ok(uncited.length > 0, 'expected some records with no citation to test with');
  ok(uncited.every(b => !run('heldRecord')(b)),
     'an uncited record should still be listed when no limit is set');
  at(1, () => ok(uncited.every(b => run('heldRecord')(b)),
     'an uncited record cannot be shown to someone reading with a limit'));

  // ---- more books, never fewer records ----------------------------------
  let last = -1;
  for (let n = 1; n <= BOOK_MAX; n++) {
    at(n, () => {
      const count = run('visible()').length;
      ok(count >= last, `book ${n} shows ${count} records, fewer than book ${n - 1}'s ${last}`);
      last = count;
    });
  }
  ok(last === BOOK_MAX_COUNT(), 'the top setting should end up showing everything');
  function BOOK_MAX_COUNT(){ return BOBS.length; }

  // ---- nothing held may appear anywhere ---------------------------------
  // The real guarantee. Every register, every pane, every position.
  for (let n = 1; n < BOOK_MAX; n++) {
    at(n, () => {
      const hidden = held();
      const ids = hidden.map(b => b.id);
      ok(hidden.length > 0, `book ${n} should be holding something back`);
      const scan = where => {
        const html = panes();
        for (const id of ids) {
          ok(!html.includes(`data-id="${id}"`), `book ${n}, ${where}: held '${id}' is on the page`);
        }
      };
      for (const reg of REGISTERS) {
        state.view = reg.id;
        run('render()');
        scan(reg.id);
      }
      // And with every record open, not just the default view. A dossier lists
      // other records — the trace, the roster of clones — and those are exactly
      // the places a gate gets forgotten: Bill's dossier named four clones at
      // book one that the reader could not have met.
      state.view = 'register';
      for (const b of run('visible()')) {
        state.selected = b.id;
        run('render()');
        scan(`dossier:${b.id}`);
      }
      state.selected = null;
    });
  }

  // ---- no page may name a book the reader has not reached ---------------
  // The bluntest check here and the one that earns its keep. A citation field
  // often holds several, and the later ones give the game away on their own:
  // Homer's runs from book one to book five, so printing it whole at book two
  // announces that he is still being discussed two books after he dies. Any
  // "Bk<n>" above the setting, anywhere on the page, is a leak.
  for (let n = 1; n < BOOK_MAX; n++) {
    at(n, () => {
      for (const reg of REGISTERS) {
        state.view = reg.id;
        state.selected = (run('visible()')[0] || {}).id || null;
        run('render()');
        const found = [...panes().matchAll(/Bk(\d)/g)].map(m => +m[1]).filter(v => v > n);
        ok(found.length === 0,
           `book ${n}, ${reg.id}: page cites Bk${[...new Set(found)].join(', Bk')}`);
      }
    });
  }

  // ---- prose is held until it says how far it reaches --------------------
  // Notes are escaped on the way into the page, so compare like for like —
  // Bill's "R&D" ships as "R&amp;D" and a raw substring never matches it.
  const esc = get('esc');
  const opening = b => esc(b.note.slice(0, 40));

  const dossierAt = (book, id) => {
    let html = '';
    at(book, () => {
      state.view = 'register';
      state.selected = id;
      run('render()');
      html = doc.getElementById('dossier').innerHTML;
    });
    return html;
  };

  // Anything still undeclared stays withheld. This is empty as of the pass that
  // declared them all, and it is kept because the next record added will not be.
  for (const b of BOBS.filter(b => b.note && !b.spoil).slice(0, 5)) {
    const doss = dossierAt(Math.max(1, run('attestedAt')(b) || 1), b.id);
    ok(doss.includes('WITHHELD'), `${b.id}'s undeclared prose should be withheld`);
    ok(!doss.includes(opening(b)), `${b.id}'s undeclared note is on the page`);
  }

  // Declared prose turns up at the book it declares and not one earlier. Only
  // records whose prose reaches past their own citation can be tested both
  // ways — the rest are held as records before their prose is even a question.
  const reaching = BOBS.filter(b => b.note && b.spoil &&
                                    b.spoil > (run('attestedAt')(b) || BOOK_MAX));
  ok(reaching.length > 0, 'expected prose that reaches past its own record');
  for (const b of reaching.slice(0, 8)) {
    const before = dossierAt(b.spoil - 1, b.id);
    ok(before.includes(b.name), `${b.id} should be readable at book ${b.spoil - 1}`);
    ok(!before.includes(opening(b)),
       `${b.id}'s note reaches book ${b.spoil} but showed at ${b.spoil - 1}`);
    const after = dossierAt(b.spoil, b.id);
    ok(after.includes(opening(b)),
       `${b.id}'s note is declared safe at book ${b.spoil} and did not appear`);
  }

  // no note text of any kind may survive at book 1
  at(1, () => {
    for (const reg of REGISTERS) {
      state.view = reg.id;
      run('render()');
      const html = panes();
      for (const b of BOBS) {
        if (!b.note || b.note.length < 40) continue;
        if (b.spoil === 1) continue;                 // declared safe, may appear
        ok(!html.includes(esc(b.note.slice(0, 40))),
           `book 1, ${reg.id}: ${b.id}'s note is on the page`);
      }
    }
  });

  // ---- a fate can be held while the Bob is not --------------------------
  // Someone you met in book one dies in book four. The record stays; the fate
  // goes. This is the case a record-level filter alone would get wrong.
  const bookOf = run('bookOf');
  const late = BOBS.find(b => b.fateCite && b.cite &&
                              bookOf(b.cite) < bookOf(b.fateCite));
  ok(late, 'expected a Bob whose fate is recorded later than the Bob is');
  if (late) {
    at(bookOf(late.cite), () => {
      state.view = 'register';
      state.selected = late.id;
      run('render()');
      const doss = doc.getElementById('dossier').innerHTML;
      ok(doss.includes(late.name), `${late.id} should be readable at book ${state.book}`);
      ok(!doss.includes('IN MEMORIUM') && !doss.includes('FATE UNACCOUNTED'),
         `${late.id}'s fate leaked at book ${state.book}`);
      ok(!doss.includes(late.fateCite), `${late.id}'s fate citation leaked`);
    });
    at(bookOf(late.fateCite), () => {
      state.view = 'register';
      state.selected = late.id;
      run('render()');
      ok(doc.getElementById('dossier').innerHTML.includes(late.fateCite),
         `${late.id}'s fate should appear once you have reached it`);
    });
  }

  // ---- the trace keeps its shape ----------------------------------------
  // A held ancestor is redacted in place. The number of steps back to Bob-1 is
  // the claim the trace makes, and it must not change with the setting.
  const deep = BOBS.filter(b => run('trace')(b).length >= 4);
  ok(deep.length > 0, 'expected a deep lineage to test with');
  for (const b of deep.slice(0, 5)) {
    const full = run('trace')(b).length;
    at(1, () => ok(run('trace')(b).length === full,
       `${b.id}: the trace changed length under a reading position`));
  }

  // ---- addresses --------------------------------------------------------
  reset(BOOK_MAX);
  ok(!/b=/.test(run('hashFor()')), 'a link should not carry b= when nothing is held');
  reset(2);
  ok(/b=2/.test(run('hashFor()')), `book 2 should be in the address, got ${run('hashFor()')}`);

  const win = get('window');
  reset();
  win.location.hash = '#register?b=3';
  run('applyHash()');
  ok(state.book === 3, `#register?b=3 gave book ${state.book}`);

  // a link pointing at something its own b= holds back must drop the selection
  reset();
  const late2 = BOBS.find(b => (run('attestedAt')(b) || 9) >= 4);
  ok(late2, 'expected a late record to link to');
  if (late2) {
    win.location.hash = `#register/${late2.id}?b=1`;
    run('applyHash()');
    ok(state.book === 1, 'the reading position should have been applied');
    ok(state.selected !== late2.id,
       `a link to '${late2.id}' at book 1 selected it anyway`);
  }

  // out-of-range values are ignored rather than obeyed
  for (const bad of ['0', '9', 'x', '-2']) {
    reset(BOOK_MAX);
    win.location.hash = `#register?b=${bad}`;
    run('applyHash()');
    ok(state.book === BOOK_MAX, `b=${bad} should have been ignored, got ${state.book}`);
  }

  // ---- companion registers gate on the same evidence --------------------
  const BESTIARY = get('BESTIARY');
  const PEOPLES = get('PEOPLES');
  for (const [name, all, rows] of [['bestiary', (BESTIARY || {}).creatures, 'beasts'],
                                   ['peoples',  (PEOPLES  || {}).entries,  'peoples']]) {
    if (!all) continue;
    reset(BOOK_MAX);
    ok(run(`${rows}()`).length === all.length, `${name}: everything should show at the top`);
    at(1, () => {
      const shown = run(`${rows}()`);
      ok(shown.length < all.length, `${name}: nothing was held at book 1`);
      ok(shown.every(e => bookOf(e.cite) === 1),
         `${name}: something cited past book 1 is being shown`);
    });
  }

  reset();
  run('render()');
  console.log(`  ${BOBS.length} records · ` +
    [1, 2, 3, 4, 5].map(n => { reset(n); return run('visible()').length; }).join('/') +
    ' visible by book');
};
