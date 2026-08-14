// The system map — what is at the places, rather than where they are.
//
// It owns no data, so the interesting tests are about derivation and about the
// two things it exists to do that the chart cannot: hold every system including
// the ones with no coordinates, and answer a search.
//
// The tie mark is the part worth guarding hardest. It says how firmly a place
// is attached to the rest of the register, and a mark that overstated the link
// would turn a research gap into an apparent fact about the system — which is
// the failure this whole project is arranged against.

module.exports = ({ok, get, run, each, need}) => {
  const state = get('state');
  const doc = get('document');
  const SYS = get('SYS');
  const SYSTEMS = get('SYSTEMS');
  const BOBS = get('BOBS');
  const BOOK_MAX = get('BOOK_MAX');
  const all = (SYSTEMS && SYSTEMS.systems) || [];

  const reset = (book = BOOK_MAX) => {
    Object.assign(state, {view: 'systems', q: '', system: null, book});
    state.filters.clear();
  };

  ok(all.length > 10, `only ${all.length} systems reached the page`);

  // ---- every system is on it, including the ones the chart cannot draw ----
  reset();
  const rows = run('mapRows()');
  ok(rows.length === all.length,
     `the map shows ${rows.length} of ${all.length} systems`);
  const unplaced = all.filter(s => !s.xyz_ly);
  ok(unplaced.length, 'expected at least one system with no coordinates');
  each('systems with no coordinates', unplaced, s => {
    ok(rows.some(r => r.id === s.id),
       `${s.id} is missing from the map — it is exactly what the chart cannot show`);
  });

  // ---- ordered by distance, the unmeasured last -------------------------
  const placed = rows.filter(s => s.xyz_ly);
  for (let i = 1; i < placed.length; i++) {
    ok(placed[i - 1].distance_ly <= placed[i].distance_ly,
       `out of order at ${placed[i].name}`);
  }
  const firstUnplaced = rows.findIndex(s => !s.xyz_ly);
  if (firstUnplaced >= 0) {
    ok(rows.slice(firstUnplaced).every(s => !s.xyz_ly),
       'a measured system sorts after an unmeasured one');
  }

  // ---- it answers a search, which the chart does not --------------------
  reset();
  state.q = all[0].name.split(' ')[0].toLowerCase();
  ok(run('mapRows()').some(s => s.id === all[0].id),
     `searching '${state.q}' should find the system it came from`);
  state.q = 'zzzznotasystem';
  ok(run('mapRows()').length === 0, 'a search matching nothing should return nothing');
  ok(/NO SYSTEM MATCHES/.test(run('renderSystemMap([])')), 'an empty map says so');
  reset();

  // ---- the tie mark ------------------------------------------------------
  const ties = run('systemTies()');
  ok(ties.size === all.length, 'the tie map does not cover every system');
  each('tie values', [...ties.values()], v => {
    ok(['record', 'pov', 'none'].includes(v), `unknown tie value ${v}`);
  }, all.length);

  // A record tie has to be earned by an actual reference, in either direction.
  const referenced = new Set();
  for (const b of BOBS) {
    [b.origin, b.lostAt, ...(b.visited || [])].filter(Boolean).forEach(id => referenced.add(id));
  }
  for (const c of ((get('BESTIARY') || {}).creatures) || []) if (c.system) referenced.add(c.system);
  for (const e of ((get('PEOPLES') || {}).entries) || []) if (e.system) referenced.add(e.system);
  for (const [id, kind] of ties) {
    if (kind === 'record') {
      ok(referenced.has(id), `${id} is marked as named by a record and nothing names it`);
    }
  }
  // And a hollow mark must mean nothing points at it — otherwise the map is
  // reporting a gap that is not there, which is the same lie in the other
  // direction and much harder to notice.
  for (const [id, kind] of ties) {
    if (kind === 'none') {
      ok(!referenced.has(id), `${id} is marked untied but a record names it`);
      ok(!(SYS[id].povs || []).length || !run('visiblePovs')(SYS[id]).length,
         `${id} is marked untied but is narrated from`);
    }
  }

  // ---- the reading position tightens it, never the reverse --------------
  let tied = 0, named = 0;
  for (let n = 1; n <= BOOK_MAX; n++) {
    reset(n);
    const t = run('systemTies()');
    const vals = [...t.values()];
    const nowNamed = vals.filter(v => v === 'record').length;
    const nowTied = vals.filter(v => v !== 'none').length;
    ok(nowNamed >= named, `book ${n} names ${nowNamed} systems, down from ${named}`);
    ok(nowTied >= tied, `book ${n} ties ${nowTied} systems, down from ${tied}`);
    named = nowNamed; tied = nowTied;

    // A first-contact year may never run past the last dated thing on the page.
    const horizon = run('datedHorizon()');
    const html = run('renderSystemMap(mapRows())');
    for (const s of all) {
      if (!s.first_year) continue;
      const at = run('dateIn')(String(s.first_year));
      if (at && at.at > horizon) {
        ok(!new RegExp(`>${s.first_year}<`).test(html),
           `book ${n}: ${s.id} shows first contact in ${s.first_year}, past the record`);
      }
    }
    // A held Bob must not be named as a narrator here either.
    for (const b of BOBS) {
      if (!run('heldRecord')(b)) continue;
      for (const s of all) {
        ok(!run('visiblePovs')(s).includes(b.name),
           `book ${n}: ${s.id} lists ${b.name}, who is held`);
      }
    }
  }
  reset();

  // ---- selecting opens the chart's own dossier, not a second one --------
  const sample = need('a system to open', all[0]);
  state.system = sample.id;
  run('render()');
  const doss = doc.getElementById('dossier').innerHTML;
  ok(doss.includes(sample.name), 'the selected system did not open');
  ok(doss === run(`renderSystemDossier(SYS[${JSON.stringify(sample.id)}])`),
     'the map renders a different dossier than the chart — there should be one');
  ok(!/undefined|NaN/.test(doss), 'the system dossier rendered a hole');

  // ---- the arrow to the chart is a real link, and only where there is a dot
  reset();
  const map = run('renderSystemMap(mapRows())');
  for (const s of all) {
    const has = new RegExp(`href="#chart/${s.id}"`).test(map);
    ok(has === !!s.xyz_ly,
       s.xyz_ly ? `${s.id} has no link to its dot on the chart`
                : `${s.id} links to a chart position it does not have`);
  }

  reset();
  const t = run('systemTies()');
  const c = k => [...t.values()].filter(v => v === k).length;
  console.log(`  ${all.length} systems · ${c('record')} named by a record, ` +
              `${c('pov')} narrated only, ${c('none')} untied · ` +
              `${unplaced.length} without coordinates`);
};
