// Gates register — wormhole travel topology (not Chart, not SCUT).

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, need, ROOT}) => {
  const GATES = get('GATES');
  const SYSTEMS = get('SYSTEMS');
  const PEOPLES = get('PEOPLES');
  const state = get('state');
  const doc = get('document');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'gates.json'), 'utf8'));

  ok(GATES && Array.isArray(GATES.nodes), 'no gates register reached the page');
  ok(!('_comment' in GATES), '_comment should be stripped by the build');
  ok(GATES.nodes.length === source.nodes.length, 'node count mismatch');
  ok(GATES.paths.length === source.paths.length, 'path count mismatch');
  ok(GATES.summaries.length === source.summaries.length, 'summary count mismatch');

  const sysIds = new Set((SYSTEMS.systems || []).map(s => s.id));
  const peopleIds = new Set((PEOPLES.entries || []).map(e => e.id));
  const nodeIds = new Set(GATES.nodes.map(n => n.id));
  const allIds = [...GATES.nodes, ...GATES.paths, ...GATES.summaries].map(e => e.id);
  ok(new Set(allIds).size === allIds.length, 'duplicate id across nodes/paths/summaries');

  each('gates nodes', GATES.nodes, n => {
    ok(n.id && n.name && n.cite && n.note, `${n.id}: missing core fields`);
    ok(['hub', 'system', 'place', 'faction_home'].includes(n.kind), `${n.id}: bad kind`);
    ok(['found', 'constructed'].includes(n.layer), `${n.id}: bad layer`);
    ok(typeof n.spoil === 'number' && n.spoil >= 5, `${n.id}: spoil should be book 5+ for v1`);
    if (n.system) ok(sysIds.has(n.system), `${n.id}: unknown system`);
    if (n.at) ok(nodeIds.has(n.at), `${n.id}: at must be a node`);
    for (const aid of n.also || []) ok(peopleIds.has(aid), `${n.id}: also ${aid}`);
  }, 3);

  each('gates paths', GATES.paths, p => {
    ok(p.ends && p.ends.length === 2, `${p.id}: two ends`);
    ok(p.ends.every(id => nodeIds.has(id)), `${p.id}: ends must be nodes`);
    ok(['found', 'constructed', 'planned'].includes(p.kind), `${p.id}: bad kind`);
    if (p.kind === 'found') {
      ok(p.ferry_ly_total == null && p.span_ly == null,
         `${p.id}: found path cannot carry ly fields`);
    }
  }, 1);

  ok(GATES.nodes.some(n => n.id === 'hub_zero' && !n.system), 'Hub Zero unlocated');
  ok(GATES.nodes.some(n => n.id === 'skippyland' && !n.system), 'Skippyland unlocated');
  ok(GATES.nodes.some(n => n.id === 'epsilon_eridani' && n.system === 'epsilon_eridani'),
     'EE links to Chart system');
  ok(GATES.paths.some(p => p.id === 'path_ee_skippyland' && p.hop_count === 10
                         && p.intermediate_count === 9),
     'EE–Skippyland highway counts');

  // Spoiler: book 4 sees nothing
  state.book = 4;
  state.view = 'gates';
  state.gate = null;
  run('render()');
  const stage4 = () => doc.getElementById('stage').innerHTML;
  ok(/READ THROUGH BOOK 5|NO MATCH/i.test(stage4()) || !/Hub Zero|Skippyland/.test(stage4()),
     'book 4 must not show Hub Zero / Skippyland');

  state.book = 5;
  run('render()');
  // Read the SVG node — stub DOM does not always reflect child paints on stage.innerHTML.
  const svgAt5 = doc.getElementById('gates-svg');
  ok(svgAt5 && /Hub Zero/.test(svgAt5.innerHTML), 'book 5 shows Hub Zero on the schematic');

  // Dossier + Chart link for located node
  state.gate = 'epsilon_eridani';
  run('render()');
  const doss = doc.getElementById('dossier').innerHTML;
  ok(/Epsilon Eridani/.test(doss), 'EE dossier opens');
  ok(/data-sys="epsilon_eridani"|chart\/epsilon_eridani/.test(doss),
     'EE dossier offers Chart link');

  state.gate = 'path_ee_skippyland';
  run('render()');
  ok(/ten hops|10/i.test(doc.getElementById('dossier').innerHTML),
     'path dossier shows hop count');

  // Topology paint: schematic SVG, not Chart geometry
  state.gate = null;
  state.view = 'gates';
  run('render()');
  const svg = doc.getElementById('gates-svg');
  ok(svg, 'gates schematic svg is on the stage');
  const markup = svg ? svg.innerHTML : '';
  ok(/data-gate="hub_zero"/.test(markup), 'Hub Zero is painted');
  ok(/data-gate="skippyland"/.test(markup), 'Skippyland is painted');
  ok(/data-gate="path_ee_skippyland"/.test(markup), 'highway path is painted');
  ok(/→ CHART|CHART/.test(markup), 'located nodes badge Chart');
  ok(/UNLOCATED/.test(markup), 'unlocated nodes say so');
  // Paint must not encode ferry distances as layout — hop label is fine; ly chords are not.
  ok(!/\b82\s*ly\b/i.test(markup) && !/\b70\s*ly\b/i.test(markup),
     'ferry/span ly must not appear in the schematic paint');

  const layout = get('gateLayoutPositions');
  const heldEntry = get('heldEntry');
  const hwy = GATES.paths.find(p => p.id === 'path_ee_skippyland');
  const before = JSON.stringify(layout(GATES.nodes.filter(n => !heldEntry(n))));
  // Mutate ferry fields — layout must be unchanged (topology ≠ logistics).
  const savedFerry = hwy.ferry_ly_total, savedSpan = hwy.span_ly;
  hwy.ferry_ly_total = 9999;
  hwy.span_ly = 9999;
  const after = JSON.stringify(layout(GATES.nodes.filter(n => !heldEntry(n))));
  hwy.ferry_ly_total = savedFerry;
  hwy.span_ly = savedSpan;
  ok(before === after, 'gateLayoutPositions ignores ferry_ly / span_ly');

  console.log(`  ${GATES.nodes.length} nodes · ${GATES.paths.length} paths · ${GATES.summaries.length} summaries`);
};
