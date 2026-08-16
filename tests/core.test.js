// Data integrity and every render path.
//
// Counts are read from data/*.json rather than written in as literals. The old
// scratch harness hardcoded "86 records" and quietly asserted a stale number
// for a whole session after the 87th record landed — a test that has to be
// hand-updated is a test that will be wrong. Where a literal IS the point (the
// tier letters, Sol's absolute magnitude) it stays a literal.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const BOBS = get('BOBS');
  const byId = get('byId');
  const FILTERS = get('FILTERS');
  const COLS = get('COLS');
  const state = get('state');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bobs.json'), 'utf8')).bobs;

  // ---- the build shipped what the data holds ----
  ok(BOBS.length === source.length,
     `console has ${BOBS.length} records, data/bobs.json has ${source.length}`);
  ok(new Set(BOBS.map(b => b.id)).size === BOBS.length, 'duplicate id reached the console');

  // ---- referential integrity, as the console sees it ----
  BOBS.forEach(b => {
    if (b.parent) ok(byId[b.parent], `${b.id}: parent ${b.parent} missing from byId`);
    ok(b.src && 'otpcx'.includes(b.src), `${b.id}: unknown tier ${b.src}`);
  });

  // Tier rules the console depends on when it draws edges.
  BOBS.forEach(b => {
    if (b.src === 'c' || b.src === 'x') ok(!b.parent, `${b.id}: tier ${b.src} must not have a parent`);
    if (b.src === 'o') ok(!b.parent, `${b.id}: tier O must not have a parent`);
  });

  // ---- ancestry traces terminate ----
  let reach = 0, term = 0;
  BOBS.forEach(b => {
    const h = run(`trace(byId[${JSON.stringify(b.id)}])`);
    ok(h.length > 0 && h.length < 40, `${b.id}: trace length ${h.length}`);
    const last = h[h.length - 1];
    ok(!last.parent, `${b.id}: trace ended on a node that still has a parent`);
    last.id === 'bob1' ? reach++ : term++;
  });
  ok(reach + term === BOBS.length, 'trace did not cover every record');

  // ---- generation agrees with the tree wherever the tree can tell ----
  BOBS.forEach(b => {
    const g = run(`generation(byId[${JSON.stringify(b.id)}])`);
    if (!g) return;
    if (g.stated) ok(b.gen === g.n, `${b.id}: stated gen ${b.gen} but generation() says ${g.n}`);
    else ok(b.gen == null, `${b.id}: gen ${b.gen} is derivable and should not be stored`);
  });

  // ---- every view renders under every filter, empty state and search ----
  const REGISTERS = get('REGISTERS');
  const views = REGISTERS ? REGISTERS.map(r => r.id)
                          : ['register', 'genealogy', 'unresolved', 'chart', 'todo'];
  ok(views.length >= 5, `expected at least 5 views, found ${views.length}`);

  const attempt = (label, fn) => {
    try { fn(); } catch (e) { ok(false, `${label}: ${e.message}`); }
  };

  for (const v of views) {
    for (const f of ['', ...FILTERS.map(x => x.id)]) {
      Object.assign(state, {view: v, q: '', selected: null});
      state.filters = new Set(f ? [f] : []);
      attempt(`${v} + filter '${f || 'none'}'`, () => run('render()'));
    }
    Object.assign(state, {view: v, q: 'zzzznomatch'});
    state.filters = new Set();
    attempt(`${v} empty state`, () => run('render()'));
    state.q = 'eridani';
    attempt(`${v} search`, () => run('render()'));
  }

  // ---- the dossier renders for every record, in every list view ----
  Object.assign(state, {q: '', selected: null});
  state.filters = new Set();
  for (const v of ['register', 'genealogy', 'unresolved']) {
    state.view = v;
    for (const b of BOBS) {
      state.selected = b.id;
      attempt(`dossier ${b.id} in ${v}`, () => run('render()'));
    }
  }

  // ---- sorting never drops or duplicates a row ----
  Object.assign(state, {selected: null, view: 'register', q: ''});
  state.filters = new Set();
  for (const c of COLS) {
    state.sort = c.key;
    for (const d of [1, -1]) {
      state.dir = d;
      const rows = run('visible()');
      ok(rows.length === BOBS.length, `sort ${c.key} dir ${d}: ${rows.length} of ${BOBS.length} rows`);
      ok(new Set(rows.map(r => r.id)).size === rows.length, `sort ${c.key} dir ${d}: duplicated a row`);
    }
  }
  state.sort = 'name'; state.dir = 1;

  // ---- filters actually filter, and are not silently empty ----
  for (const f of FILTERS) {
    state.filters = new Set([f.id]);
    const rows = run('visible()');
    ok(rows.length > 0, `filter '${f.id}' matches nothing — a dead chip`);
    ok(rows.length <= BOBS.length, `filter '${f.id}' returned more rows than exist`);
  }
  state.filters = new Set();

  // ---- the bar carries the ones that change the shape of the table ---------
  // The row was thirteen chips and eight of them barely moved it. A filter that
  // keeps almost everything is a control that does nothing, and this is the
  // check that stops one drifting back onto the toolbar.
  const doc = get('document');
  const chipsIn = () => [...doc.getElementById('chips').innerHTML
    .matchAll(/data-filter="([^"]+)"/g)].map(m => m[1]);
  state.view = 'register'; state.book = get('BOOK_MAX');
  run('renderChips()');
  const onBar = chipsIn();
  ok(onBar.length >= 3 && onBar.length <= 6,
     `${onBar.length} chips on the bar — the point of the cut was that thirteen was furniture`);
  for (const id of onBar) {
    const f = FILTERS.find(x => x.id === id);
    state.filters = new Set([id]);
    const kept = run('visible()').length;
    ok(kept <= BOBS.length * 0.8,
       `${f.label} keeps ${kept} of ${BOBS.length} — that is not a cut, it is a control that does nothing`);
  }
  state.filters = new Set();

  // A filter that has no chip still has to work, because its address is public
  // and a link somebody already has keeps working here. And when one arrives
  // active it gets its chip back, or there is no way to switch it off.
  const hidden = FILTERS.filter(f => f.bar === false && !f.since);
  ok(hidden.length > 0, 'expected some filters to be off the bar');
  for (const f of hidden) {
    ok(!onBar.includes(f.id), `${f.id} is marked off the bar and is on it`);
    state.filters = new Set([f.id]);
    ok(run('visible()').length > 0, `${f.id} stopped filtering when its chip came off`);
    run('renderChips()');
    ok(chipsIn().includes(f.id),
       `${f.id} arrived active with no chip to clear it with`);
  }
  state.filters = new Set();
  run('renderChips()');

  // ---- search matches on name and on the fields the dossier shows ----
  state.q = 'bob';
  ok(run('visible()').length > 0, 'searching "bob" found nothing');
  state.q = '';

  console.log(`  ${BOBS.length} records · traces reaching Bob-1: ${reach}, terminating early: ${term}`);
};
