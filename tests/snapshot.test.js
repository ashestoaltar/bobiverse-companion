// Golden master.
//
// Captures the exact HTML every view produces under a fixed set of states, so a
// refactor can be checked by diff instead of by eye. This is what makes the
// console restructure safe to do aggressively: if the snapshot is unchanged,
// the rendering is unchanged, whatever moved underneath.
//
// When output changes ON PURPOSE, look at the reported diff first, then:
//     node tests/run.js --update-snapshots
// and commit the snapshot alongside the change that caused it. A snapshot
// updated in its own commit tells you nothing.
//
// The chart is captured at a pinned camera, and anything genuinely variable
// (timestamps, random ids) must not appear — if this suite is flaky, the flake
// is the bug.

module.exports = ({ok, get, run, snapshot}) => {
  const state = get('state');
  const CHART = get('CHART');
  const BOBS = get('BOBS');
  const REGISTERS = get('REGISTERS');
  const views = REGISTERS ? REGISTERS.map(r => r.id)
                          : ['register', 'lineage', 'unresolved', 'chart', 'todo'];

  const reset = () => {
    Object.assign(state, {q: '', sort: 'name', dir: 1, selected: null});
    state.filters = new Set();
    Object.assign(CHART, {yaw: -0.62, pitch: 0.50, zoom: 1, panx: 0, pany: 0,
                          year: 2345, sel: null});
  };

  // Every element render() writes to. Capturing only #stage left a blind spot:
  // a change to a filter chip's label sailed straight through a "passing"
  // golden master, because chips live in their own element.
  // Some panes are written with innerHTML and some with textContent
  // (chart-stat, chart-year), so read whichever the console actually set.
  const PANES = ['stage', 'dossier', 'status', 'chips', 'chart-stat', 'chart-year'];
  const pane = id => {
    const el = get('document').getElementById(id);
    return el.innerHTML || el.textContent || '';
  };
  const all = () => Object.fromEntries(PANES.map(id => [id, pane(id)]));

  const stage = () => pane('stage');
  const dossier = () => pane('dossier');

  const shot = {};

  // ---- each view, default state: capture every pane ----
  for (const v of views) {
    reset();
    state.view = v;
    run('render()');
    for (const [id, html] of Object.entries(all())) shot[`${v}:${id}`] = html;
    // the tab bar's selected state is markup too
    shot[`${v}:tabs`] = views.map(x => `${x}=${x === v}`).join(' ');
  }

  // ---- each view with a selection, so the dossier is captured too ----
  const sample = ['bob1', 'bill', 'riker', 'homer', 'howard']
    .filter(id => BOBS.some(b => b.id === id));
  ok(sample.length >= 3, `snapshot needs stable sample ids; found ${sample.length}`);

  for (const v of ['register', 'lineage', 'unresolved']) {
    for (const id of sample) {
      reset();
      Object.assign(state, {view: v, selected: id});
      run('render()');
      shot[`dossier:${v}:${id}`] = dossier();
    }
  }

  // ---- filters and search ----
  const FILTERS = get('FILTERS');
  for (const f of FILTERS) {
    reset();
    Object.assign(state, {view: 'register'});
    state.filters = new Set([f.id]);
    run('render()');
    shot[`filter:${f.id}`] = stage();
    shot[`filter:${f.id}:chips`] = pane('chips');   // labels and pressed state
  }
  for (const q of ['eridani', 'starfleet', 'zzzznomatch']) {
    reset();
    Object.assign(state, {view: 'register', q});
    run('render()');
    shot[`search:${q}`] = stage();
  }

  // ---- sorting ----
  const COLS = get('COLS');
  for (const c of COLS) {
    for (const d of [1, -1]) {
      reset();
      Object.assign(state, {view: 'register', sort: c.key, dir: d});
      run('render()');
      shot[`sort:${c.key}:${d}`] = stage();
    }
  }

  // ---- the chart at pinned cameras, and a system dossier ----
  for (const [yaw, pitch, zoom] of [[-0.62, 0.50, 1], [0, 0, 1], [1.2, -0.8, 2.5]]) {
    reset();
    state.view = 'chart';
    Object.assign(CHART, {yaw, pitch, zoom});
    run('render()');
    shot[`chart:${yaw},${pitch},${zoom}`] = stage();
  }
  reset();
  state.view = 'chart';
  CHART.sel = 'epsilon_eridani';
  run('render()');
  shot['chart:dossier:epsilon_eridani'] = dossier();

  reset();

  // Some panes are legitimately empty in some views — chart-stat outside the
  // chart, for instance — so only the stage must always have content.
  for (const [k, v] of Object.entries(shot)) {
    ok(typeof v === 'string', `snapshot key "${k}" captured a ${typeof v}`);
    if (k.endsWith(':stage') || k.startsWith('view:')) {
      ok(v.length > 0, `snapshot key "${k}" captured nothing`);
    }
    ok(!/NaN|undefined/.test(v), `snapshot key "${k}" contains NaN or undefined`);
  }

  snapshot('views', shot);
  console.log(`  ${Object.keys(shot).length} states captured`);
};
