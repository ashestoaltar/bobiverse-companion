// The point of the REGISTERS list is that adding a view costs one entry and no
// console surgery. That is a claim about the code's shape, and claims about
// shape rot quietly — so this suite actually adds a register at runtime and
// checks that everything picks it up.
//
// If someone later reintroduces a `state.view === 'x'` special case, the
// synthetic register below will miss whatever that case does, and this fails.

module.exports = ({ok, get, run}) => {
  const REGISTERS = get('REGISTERS');
  const state = get('state');
  const doc = get('document');

  const before = REGISTERS.length;
  const views = REGISTERS.map(r => r.id);

  // ---- the shape of the existing entries ----
  for (const r of REGISTERS) {
    ok(typeof r.id === 'string' && r.id, 'a register has no id');
    ok(typeof r.label === 'string' && r.label, `${r.id}: no label`);
    ok(typeof r.render === 'function', `${r.id}: render is not a function`);
    for (const hook of ['rows', 'paint', 'onResize', 'dossier', 'status']) {
      if (r[hook] !== undefined) {
        ok(typeof r[hook] === 'function', `${r.id}: ${hook} is present but not a function`);
      }
    }
  }
  ok(new Set(views).size === views.length, 'duplicate register id');

  // ---- the tab bar is generated, not hand-written ----
  // Hub children (hub:'world') share one WORLD tab; they keep their own URLs
  // and stay in REGISTERS, but they do not each own a top-strip button.
  state.view = views[0];
  run('render()');
  const tabs = doc.getElementById('tabs').innerHTML;
  const strip = run('tabStripIds()');
  ok(Array.isArray(strip) && strip.includes('world'), 'tabStripIds should include the world hub');
  ok(tabs.includes('data-view="world"'), 'world hub: no tab rendered');
  ok(tabs.includes('>WORLD<'), 'world hub: label missing from the tab bar');
  for (const r of REGISTERS) {
    if (r.hub === 'world') {
      ok(!tabs.includes(`data-view="${r.id}"`),
         `${r.id}: hub child should not own a top-strip tab`);
      continue;
    }
    ok(tabs.includes(`data-view="${r.id}"`), `${r.id}: no tab rendered`);
    ok(tabs.includes(`>${r.label}<`), `${r.id}: label "${r.label}" missing from the tab bar`);
  }
  ok((tabs.match(/aria-selected="true"/g) || []).length === 1,
     'exactly one tab should be selected');

  // Both spellings ship and CSS chooses; swapping the text by width would mean
  // a screen reader hears a different name depending on the size of the window.
  ok(tabs.includes('<span class="tab-short">WORLD</span>'),
     'world hub: no short label in the tab bar');
  for (const r of REGISTERS) {
    if (r.hub === 'world') continue;
    ok(tabs.includes(`<span class="tab-short">${r.short || r.label}</span>`),
       `${r.id}: no short label in the tab bar`);
  }

  // ---- filters belong to the views that have parentage to filter ----
  // The chips grade how well sourced a Bob's parents are, which is nothing to
  // offer above a star chart. Declared per register, so this has to be checked
  // per register — and it has to be re-evaluated on every render, since the
  // first version of this only ran when a chip was clicked and so never
  // updated when you switched tabs.
  const chips = doc.getElementById('chips');
  for (const r of REGISTERS) {
    state.view = r.id;
    run('render()');
    ok(chips.hidden === !r.filters,
       `${r.id}: filters are ${r.filters ? 'declared' : 'not declared'} but the chip row is ` +
       `${chips.hidden ? 'hidden' : 'shown'}`);
    if (!r.filters) ok(chips.innerHTML === '', `${r.id}: hidden chips still hold markup`);
  }

  // ---- selection follows state ----
  for (const v of views) {
    state.view = v;
    run('render()');
    const html = doc.getElementById('tabs').innerHTML;
    // Parse each tab whole rather than matching two attributes side by side.
    // The old pattern required them to be adjacent and broke the moment a
    // third attribute was added between them — which says nothing about the
    // markup and everything about the regex.
    const selected = [...html.matchAll(/<button[^>]*>/g)].map(m => m[0])
      .filter(t => /aria-selected="true"/.test(t))
      .map(t => (/data-view="([^"]+)"/.exec(t) || [])[1]);
    const expect = (REGISTERS.find(r => r.id === v) || {}).hub === 'world' ? 'world' : v;
    ok(selected.length === 1 && selected[0] === expect,
       `view ${v}: tab bar marks ${selected.join(',') || 'nothing'} as selected (want ${expect})`);
    if (expect === 'world') {
      ok(doc.getElementById('stage').innerHTML.includes('world-sub'),
         `view ${v}: world hub should render the in-stage sub-nav`);
    }
  }

  // ---- add one at runtime and see if the console notices ----
  run(`
    globalThis.__probe = {rows: 0, painted: 0, resized: 0, status: 0};
    REGISTERS.push({
      id: 'probe',
      label: 'PROBE',
      rows:    () => { globalThis.__probe.rows++; return [{id: 'x'}, {id: 'y'}]; },
      render:  rows => '<div class="probe">' + rows.length + ' rows</div>',
      paint:   () => { globalThis.__probe.painted++; },
      onResize:() => { globalThis.__probe.resized++; },
      status:  rows => { globalThis.__probe.status++;
                         document.getElementById('status').innerHTML = 'probe:' + rows.length; },
      dossier: () => '<div class="probe-dossier">claimed</div>',
    });
  `);
  ok(REGISTERS.length === before + 1, 'the register was not appended');

  state.view = 'probe';
  run('render()');

  const probe = run('globalThis.__probe');
  ok(doc.getElementById('tabs').innerHTML.includes('data-view="probe"'),
     'a new register got no tab — the tab bar is still hardcoded somewhere');
  ok(doc.getElementById('stage').innerHTML === '<div class="probe">2 rows</div>',
     `stage did not render the new register: ${doc.getElementById('stage').innerHTML.slice(0, 60)}`);
  ok(probe.rows === 1, `rows() called ${probe.rows} times, expected 1`);
  ok(probe.painted === 1, `paint() called ${probe.painted} times, expected 1`);
  ok(probe.status === 1, `status() called ${probe.status} times, expected 1`);
  ok(doc.getElementById('status').innerHTML === 'probe:2',
     'the register did not get to write its own status line');
  ok(doc.getElementById('dossier').innerHTML === '<div class="probe-dossier">claimed</div>',
     'the register did not get to claim the dossier pane');

  // resize must reach the active register, and only the active one
  run("window.addEventListener === undefined || 0");
  run("(function(){ const on = currentRegister().onResize; if (on) on(); })()");
  ok(run('globalThis.__probe.resized') === 1, 'onResize did not reach the active register');

  // a register that claims nothing falls through to the replicant dossier
  run(`REGISTERS[REGISTERS.length - 1].dossier = () => null;`);
  state.selected = null;
  run('render()');
  ok(doc.getElementById('dossier').innerHTML.includes('NO RECORD SELECTED'),
     'returning null from dossier() should fall through to the default pane');

  // ---- put it back ----
  run(`REGISTERS.pop(); delete globalThis.__probe;`);
  state.view = views[0];
  state.selected = null;
  run('render()');
  ok(REGISTERS.length === before, 'the probe register was not removed');
  ok(!doc.getElementById('tabs').innerHTML.includes('probe'), 'a probe tab survived cleanup');

  console.log(`  ${before} registers, all hooks reachable`);
};
