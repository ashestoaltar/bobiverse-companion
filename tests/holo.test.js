// The holotank, and the rule that makes it safe to have.
//
// The console is allowed to open a rich picture because the books are not set
// in a green-screen terminal: Bob's VR gets better and better across five
// volumes and ends with him walking around in android bodies, so a registry
// that could only ever draw phosphor would be arguing with its own source. The
// shell stays a drab file manager; the file you open is allowed to be rich.
//
// What a rich picture must never do is stand in for knowledge nobody has. Every
// check below that matters is a version of that one sentence.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, need, ROOT}) => {
  const HOLO = get('HOLO');
  const BOBS = get('BOBS');
  const state = get('state');
  const doc = get('document');
  const BOOK_MAX = get('BOOK_MAX');

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'holo.json'), 'utf8'));

  ok(HOLO && Array.isArray(HOLO.plates), 'no holotank plates reached the page');
  ok(!('_comment' in HOLO), '_comment should be stripped by the build');
  ok(HOLO.plates.length === source.plates.length,
     `page has ${HOLO.plates.length} plates, data has ${source.plates.length}`);

  // ---- NO PLATE WITHOUT A CITATION ----------------------------------------
  // The permanent rule. A handsome picture on a record nobody can source is the
  // page knowing less than it looks like it knows, and that is the exact
  // failure this whole project is built to avoid.
  each('plates', HOLO.plates, p => {
    ok(p.cite && /^Bk\d+ ch\d+ · /.test(p.cite), `${p.id}: cite missing or malformed: ${p.cite}`);
    ok(p.note && p.note.length > 40, `${p.id}: note too thin to be a citation's meaning`);
    ok(p.title, `${p.id}: no title`);
    ok(['vr', 'vessel', 'specimen', 'portrait'].includes(p.kind), `${p.id}: bad kind ${p.kind}`);
    ok(typeof p.spoil === 'number' && p.spoil >= 1 && p.spoil <= BOOK_MAX,
       `${p.id}: spoil ${p.spoil} is not a book`);
    ok(p.spoil >= +/^Bk(\d+)/.exec(p.cite)[1],
       `${p.id}: its note is marked safe earlier than the chapter it is drawn from`);
  }, 5);

  // ---- plates resolve to local assets (offline, no CDN) -------------------
  each('plate images', HOLO.plates, p => {
    ok(/^assets\/holo\/[a-z0-9-]+\.webp$/.test(p.src || ''),
       `${p.id}: expected a relative assets/holo/*.webp path, got ${p.src}`);
    const file = path.join(ROOT, 'dist', p.src);
    ok(fs.existsSync(file), `${p.id}: missing on disk at dist/${p.src}`);
    ok(fs.statSync(file).size > 1000, `${p.id}: image is suspiciously small`);
  }, 5);

  // ---- every plate hangs on something that exists -------------------------
  const pools = {
    register: new Set(BOBS.map(b => b.id)),
    bestiary: new Set(((get('BESTIARY') || {}).creatures || []).map(c => c.id)),
    peoples: new Set(((get('PEOPLES') || {}).entries || []).map(e => e.id)),
    vessels: new Set(((get('VESSELS') || {}).vessels || []).map(v => v.id)),
    chart: new Set(Object.keys(get('SYS') || {})),
  };
  each('plate addresses', HOLO.plates, p => {
    const [view, id] = String(p.about).split('/');
    ok(pools[view], `${p.id}: about names no register we can attach to: ${p.about}`);
    ok(pools[view] && pools[view].has(id), `${p.id}: about '${p.about}' points at nothing`);
  }, 5);

  // ---- the three states of the attachment row -----------------------------
  // These are three different sentences and the register may not collapse them.
  const rowFor = (view, id) => run(`attachRow(${JSON.stringify(view)}, ${JSON.stringify(id)})`);
  state.book = BOOK_MAX;
  const withPlate = need('a record with a plate', HOLO.plates.find(p => p.about.startsWith('register/')));
  const owner = withPlate.about.split('/')[1];
  ok(/data-plate="/.test(rowFor('register', owner)), `${owner}: no attachment offered`);

  const bare = need('a record with no plate',
    BOBS.find(b => !HOLO.plates.some(p => p.about === `register/${b.id}`)));
  ok(/NO FILE ON RECORD/.test(rowFor('register', bare.id)),
     `${bare.id}: a record with nothing attached should say so plainly`);

  // A plate the reading position holds back EXISTS. Reporting it as absent
  // would be false, and would also tell a reader on book one that there is
  // nothing coming — which is the opposite of what the gate is for.
  const late = need('a plate cited to a later book', HOLO.plates.find(p => /^Bk[45]/.test(p.cite)));
  const lateOwner = late.about.split('/')[1];
  state.book = 1;
  const held = rowFor(late.about.split('/')[0], lateOwner);
  ok(!/data-plate="/.test(held), `${late.id}: offered at book one, before it is cited`);
  ok(/WITHHELD/.test(held), `${late.id}: a held plate is being reported as no file on record`);
  ok(!/NO FILE ON RECORD/.test(held), `${late.id}: held and absent must not read the same`);
  state.book = BOOK_MAX;

  // ---- opening one --------------------------------------------------------
  run(`openTank(${JSON.stringify(withPlate.id)})`);
  const tank = doc.getElementById('tank');
  ok(tank && !tank.hidden, 'the tank did not open');
  ok(doc.getElementById('tank-img').src === withPlate.src, 'the tank shows the wrong image');
  ok(doc.getElementById('tank-title').textContent === withPlate.title, 'wrong title');
  const fields = doc.getElementById('tank-fields').innerHTML;
  ok(fields.includes(withPlate.cite.split(';')[0]), 'the tank does not show what it was built from');
  // The picture is ours, drawn from a description. Saying so is not decoration:
  // it is the same seam every annotation on this page is signed across.
  ok(/registry reconstruction/.test(fields),
     'the tank does not say whose picture this is');
  ok(!/NaN|undefined/.test(doc.getElementById('tank-body') ? '' : fields), 'tank rendered a hole');

  // 3D models: relative GLB beside the page; Three viewer lazy-loads from
  // assets/holo3d/. Stub DOM may lack WebGL — assert paths + viewer global.
  const modeled = HOLO.plates.filter(p => p.modelSrc);
  ok(modeled.length > 0, 'expected at least one plate with a 3D model');
  each('3D plates', modeled, p => {
    ok(/^assets\/holo-models\/[a-z0-9-]+\.glb$/.test(p.modelSrc),
       `${p.id}: modelSrc should be assets/holo-models/*.glb, got ${p.modelSrc}`);
    const file = path.join(ROOT, 'dist', p.modelSrc);
    ok(fs.existsSync(file), `${p.id}: missing GLB at dist/${p.modelSrc}`);
    ok(fs.statSync(file).size > 1000, `${p.id}: model payload suspiciously small`);
  }, 1);
  ok(fs.existsSync(path.join(ROOT, 'dist', 'assets', 'holo3d', 'holo3d.js')),
     'HOLO3D viewer bundle should be copied to dist/assets/holo3d/');
  const lib = get('HOLO3D');
  ok(lib && lib.THREE && lib.OrbitControls && lib.GLTFLoader,
     'HOLO3D viewer should be available to the test VM (preloaded from dist)');
  ok(typeof get('ensureHolo3d') === 'function', 'ensureHolo3d should exist for lazy load');

  run('closeTank()');
  ok(tank.hidden, 'the tank did not close');
  ok(doc.getElementById('tank-img').src === '', 'closing should drop the image');

  // A held plate cannot be opened by asking for it directly either.
  state.book = 1;
  run(`openTank(${JSON.stringify(late.id)})`);
  ok(doc.getElementById('tank').hidden, `${late.id} opened at book one`);
  state.book = BOOK_MAX;

  // ---- no orphans in either direction -------------------------------------
  const dir = path.join(ROOT, 'assets', 'holo');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5));
  const ids = new Set(HOLO.plates.map(p => p.id));
  each('image files', files, f => ok(ids.has(f), `assets/holo/${f}.webp has no plate and ships nothing`), 5);
  ok(new Set(HOLO.plates.map(p => p.id)).size === HOLO.plates.length, 'duplicate plate id');

  console.log(`  ${HOLO.plates.length} plates, ` +
              `${HOLO.plates.filter(p => p.modelSrc).length} with 3D`);
};
