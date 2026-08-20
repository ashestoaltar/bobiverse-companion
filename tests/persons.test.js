// Persons register — named individuals who are not Heaven replicants.
//
// Species/polities stay in peoples.json; lineage stays in bobs.json. The short
// `label` beside each name is the collision fix (Moses · Deltan). Bios scale
// with importance. Holotank portraits may hang on persons/<id> later.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, need, ROOT}) => {
  const PERSONS = get('PERSONS');
  const PEOPLES = get('PEOPLES');
  const BOBS = get('BOBS');
  const state = get('state');
  const doc = get('document');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'persons.json'), 'utf8'));

  ok(PERSONS && Array.isArray(PERSONS.persons), 'no persons register reached the page');
  const list = PERSONS.persons;
  ok(list.length === source.persons.length,
     `page has ${list.length} persons, data has ${source.persons.length}`);
  ok(!('_comment' in PERSONS), '_comment should be stripped by the build');
  ok(list.length >= 20, 'cast-heavy seed should be on file');

  const peopleIds = new Set((PEOPLES.entries || [])
    .filter(e => e.kind === 'people').map(e => e.id));
  const bobIds = new Set(BOBS.map(b => b.id));

  each('persons', list, p => {
    ok(p.id && p.name, `${p.id}: missing id or name`);
    ok(['person', 'ami', 'replicant'].includes(p.kind), `${p.id}: bad kind ${p.kind}`);
    ok(p.label && p.role, `${p.id}: label and role required`);
    ok(p.cite && /^Bk\d+/.test(p.cite), `${p.id}: cite missing or malformed`);
    ok(p.note && p.note.length > 40, `${p.id}: note too thin`);
    ok(typeof p.spoil === 'number' && p.spoil >= 1, `${p.id}: spoil missing`);
    if (p.kind === 'ami') {
      ok(!p.species, `${p.id}: ami must not have species`);
    } else {
      ok(p.species && peopleIds.has(p.species), `${p.id}: species must be a people`);
    }
    for (const bid of p.bobs || []) {
      ok(bobIds.has(bid), `${p.id}: bob ${bid} not on file`);
    }
  }, 5);
  ok(new Set(list.map(p => p.id)).size === list.length, 'duplicate person id');

  ok(list.some(p => p.id === 'bridget'), 'Bridget should be on file');
  ok(list.some(p => p.id === 'landers'), 'Landers should be on file');
  ok(list.some(p => p.id === 'stephane_brodeur'), 'Stéphane Brodeur (not Gilligan)');
  ok(list.some(p => p.id === 'steven_gilligan'), 'Gilligan moot guest');
  ok(list.some(p => p.id === 'hannah_turnbull'), 'Turnbull moot guest');
  ok(list.some(p => p.id === 'julia_hendricks'), 'Julia Hendricks');
  ok(list.some(p => p.id === 'justin_hendricks'), 'Justin Hendricks');
  ok(list.some(p => p.id === 'moses' && p.label === 'Deltan'), 'Moses the Deltan');
  ok(list.some(p => p.id === 'archimedes' && p.kind === 'person' && p.label === 'Deltan'),
     'Archimedes is a Deltan, not an AMI');
  ok(list.some(p => p.id === 'charlie' && p.kind === 'ami'), 'Charlie is AMI');
  ok(list.some(p => p.id === 'henry_roberts' && p.kind === 'replicant'),
     'Henry Roberts is Australian replicant, not on bobs.json');
  ok(list.some(p => p.id === 'medeiros' && p.kind === 'replicant'
                 && p.substrate === 'foreign_probe'),
     'Medeiros is Brazilian foreign_probe, not on bobs.json');
  ok(list.some(p => p.id === 'matias_araujo' && p.kind === 'replicant'
                 && p.substrate === 'foreign_probe'),
     'Captain Matias Araújo is Brazilian foreign_probe (Sol), not Medeiros');
  ok(list.every(p => p.kind !== 'ami' || /AMI|android|artificial/i.test(p.note)),
     'any AMI entry must evidence it in the note');
  ok(list.some(p => p.id === 'hector_rodriguez'), 'Hector Rodriguez (human)');
  ok(list.every(p => (p.role || '').length <= 72), 'roles must stay short headlines');
  ok(list.filter(p => p.label === 'Deltan').length >= 8, 'Deltan circle should be populated');
  each('persons substrate', list, p => {
    ok(['biological', 'replicated', 'ami', 'foreign_probe'].includes(p.substrate),
       `${p.id}: bad substrate`);
    ok(typeof p.substrateFrom === 'number' && p.substrateFrom >= 1,
       `${p.id}: substrateFrom required`);
  }, 2);

  // Bridget spoiler: book 2 must not show matrix substrate
  const shownSubstrate = get('shownSubstrate');
  const bridget = need('bridget', list.find(p => p.id === 'bridget'));
  ok(bridget.substrate === 'replicated' && bridget.substrateFrom === 3,
     'Bridget end-state is replicated from book 3');
  state.book = 2;
  ok(shownSubstrate(bridget) === 'biological',
     'book 2 reader must see Bridget as biological');
  state.book = 3;
  ok(shownSubstrate(bridget) === 'replicated',
     'book 3+ may show Bridget replicated');
  state.book = get('BOOK_MAX');

  state.view = 'persons';
  state.person = 'bridget';
  state.book = 2;
  run('render()');
  const early = doc.getElementById('dossier').innerHTML;
  ok(!/replicated — matrix/i.test(early),
     'book 2 Bridget dossier must not show matrix substrate line');
  ok(!/scanned and woken/i.test(early),
     'book 2 Bridget dossier must not show replication prose');
  state.book = get('BOOK_MAX');
  run('render()');
  const late = doc.getElementById('dossier').innerHTML;
  ok(/replicated — matrix/i.test(late) || /SUBSTRATE/i.test(late),
     'full reading may show Bridget substrate');

  // ---- rendering ----
  state.view = 'persons';
  state.q = '';
  state.person = null;
  run('render()');
  const stage = () => doc.getElementById('stage').innerHTML;

  for (const p of list) {
    ok(stage().includes(`data-entry="${p.id}"`), `${p.id}: no card rendered`);
  }
  ok(stage().includes('Deltan') || stage().includes('DELTAN'), 'Deltan group should appear');
  ok(!/NaN|undefined/.test(stage()), 'persons stage contains NaN or undefined');

  state.q = 'bridget';
  run('render()');
  const found = [...stage().matchAll(/data-entry="([^"]+)"/g)].map(m => m[1]);
  ok(found.includes('bridget'), 'search should find Bridget');
  ok(found.length < list.length, 'search should narrow');

  state.q = '';
  state.person = 'bridget';
  run('render()');
  const dossier = doc.getElementById('dossier').innerHTML;
  ok(/Bridget Sheehy/.test(dossier), 'Bridget dossier opens');
  ok(/Howard/.test(dossier) || /howard/.test(dossier), 'Bridget should link related Bob');

  // Bob dossier reverse link
  state.view = 'register';
  state.selected = 'howard';
  state.person = null;
  run('render()');
  const bobDos = doc.getElementById('dossier').innerHTML;
  ok(/PERSONS ON RECORD/.test(bobDos) && /bridget/.test(bobDos),
     'Howard dossier should list Bridget under Persons');

  // collision pointers on Hector Rodriguez
  state.view = 'persons';
  state.person = 'hector_rodriguez';
  run('render()');
  const hDos = doc.getElementById('dossier').innerHTML;
  ok(/NAME COLLISION/.test(hDos), 'Hector Rodriguez should surface Bob name collisions');
};
