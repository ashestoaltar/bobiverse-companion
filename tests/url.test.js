// Addressable state — #<view>/<selection>?q=&f=
//
// The point of this is that a link someone sends keeps working. So the tests
// that matter are the round trip (what we write, we can read back) and the
// hostile cases (a stale or hand-edited link must degrade, never throw).
//
// The general test is `every register is addressable`. Registers get added
// here regularly and the selection for each one lives in a different place —
// state.selected, CHART.sel, state.beast, state.people — so the next one is
// exactly the kind of thing that gets wired into the tab bar and forgotten in
// the URL. That test fails until it's declared.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const state = get('state');
  const win = get('window');
  const BOBS = get('BOBS');
  const REGISTERS = get('REGISTERS');
  const SYS = get('SYS');

  const reset = () => {
    state.view = 'register'; state.selected = null; state.beast = null;
    state.people = null; state.q = ''; state.filters.clear();
    get('CHART').sel = null;
  };

  // ---- writing -----------------------------------------------------------
  reset();
  ok(run('hashFor()') === '#register', `bare state should be '#register', got ${run('hashFor()')}`);

  state.selected = 'homer';
  ok(run('hashFor()') === '#register/homer', run('hashFor()'));

  state.q = 'in memorium';
  ok(run('hashFor()') === '#register/homer?q=in%20memorium', run('hashFor()'));

  state.q = '';
  state.filters.add('memorium');
  ok(run('hashFor()') === '#register/homer?f=memorium', run('hashFor()'));
  reset();

  // ---- round trip --------------------------------------------------------
  const trip = (hash, check, label) => {
    reset();
    win.location.hash = hash;
    const took = run('applyHash()');
    ok(took, `${label}: applyHash refused ${hash}`);
    check();
    ok(run('hashFor()') === hash, `${label}: ${hash} came back as ${run('hashFor()')}`);
  };
  trip('#genealogy/bill', () => ok(state.view === 'genealogy' && state.selected === 'bill'), 'genealogy');
  trip('#chart/82_eridani', () => ok(state.view === 'chart' && get('CHART').sel === '82_eridani'), 'chart');
  trip('#bestiary/dragon', () => ok(state.view === 'bestiary' && state.beast === 'dragon'), 'bestiary');
  trip('#peoples/deltans', () => ok(state.view === 'peoples' && state.people === 'deltans'), 'peoples');
  trip('#memorium/arthur', () => ok(state.view === 'memorium' && state.selected === 'arthur'), 'memorium');
  trip('#unresolved?f=c,lead', () => ok(state.filters.has('c') && state.filters.has('lead')), 'filters');

  // ---- every register is addressable -------------------------------------
  // Not just reachable by tab. A register nobody can link to is a register
  // nobody can share, which defeats the point of having an address at all.
  for (const reg of REGISTERS) {
    reset();
    win.location.hash = '#' + reg.id;
    ok(run('applyHash()'), `register '${reg.id}' is not addressable`);
    ok(state.view === reg.id, `#${reg.id} did not select that register`);
    ok(run('hashFor()') === '#' + reg.id, `#${reg.id} round-tripped as ${run('hashFor()')}`);
  }

  // ---- a renamed register keeps its old links ----------------------------
  // #lineage/ was the address until the register took Bill's word for the work.
  // A link is a promise, and the alias is the whole of how it stays one. The
  // bar should end up spelling it the new way without a history entry, so the
  // back button goes where the reader came from rather than to a dead name.
  reset();
  win.location.hash = '#lineage/bill';
  ok(run('applyHash()') === true, 'the old #lineage/ address should still resolve');
  ok(state.view === 'genealogy', `#lineage/bill landed on '${state.view}'`);
  ok(state.selected === 'bill', 'the selection should survive the alias');
  ok(run('hashFor()') === '#genealogy/bill', `alias came back as ${run('hashFor()')}`);

  win.history.calls.length = 0;
  run('syncHash()');
  ok(win.history.calls.length === 1 && win.history.calls[0][0] === 'replace',
     `an aliased link should be respelled in place, not pushed: ${JSON.stringify(win.history.calls)}`);

  // every alias has to point at a register that exists, or it is just a 404
  // with extra steps
  for (const [old, now] of Object.entries(run('VIEW_ALIAS'))) {
    ok(REGISTERS.some(r => r.id === now), `alias '${old}' points at missing register '${now}'`);
    ok(!REGISTERS.some(r => r.id === old), `alias '${old}' shadows a live register`);
  }

  // ---- hostile input -----------------------------------------------------
  // A link can outlive the record it points at. Land on the register, drop the
  // selection, never throw and never render an empty dossier for a ghost.
  reset();
  win.location.hash = '#register/no-such-bob';
  ok(run('applyHash()') === true, 'a known view with an unknown record should still be honoured');
  ok(state.view === 'register', 'view was not applied');
  ok(!state.selected, `selection 'no-such-bob' should have been dropped, got ${state.selected}`);

  reset();
  win.location.hash = '#chart/not_a_system';
  run('applyHash()');
  ok(!get('CHART').sel, 'an unknown system should not be selected');

  reset();
  win.location.hash = '#nonsense/whatever';
  ok(run('applyHash()') === false, 'an unknown view should be refused outright');
  ok(state.view === 'register', 'a refused hash must leave the view alone');

  reset();
  win.location.hash = '';
  ok(run('applyHash()') === false, 'an empty hash should be a no-op');

  // a filter id we don't have must not end up in the set
  reset();
  win.location.hash = '#register?f=memorium,bogus';
  run('applyHash()');
  ok(state.filters.has('memorium') && !state.filters.has('bogus'),
     `unknown filter survived: ${[...state.filters]}`);

  // ---- rendering still works from a cold link ----------------------------
  reset();
  win.location.hash = '#memorium/homer';
  run('applyHash()');
  run('render()');
  const doss = get('document').getElementById('dossier').innerHTML;
  ok(doss.includes('Homer'), 'a linked dossier did not render');
  ok(/ON THE LIST/.test(get('document').getElementById('stage').innerHTML),
     'a linked register did not render');

  // ---- the boot screen stands aside for a link ---------------------------
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  ok(/location\.hash \|\| ''\)\.length > 1/.test(html),
     'arriving on a link should skip the boot sequence');

  reset();
  win.location.hash = '';
  run('render()');
  console.log(`  ${REGISTERS.length} registers addressable, ${BOBS.length} records linkable`);
};
