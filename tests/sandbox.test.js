// Sandbox Bob — the console's canary on an address it did not write itself.
//
// Bk1 ch13: Bob runs an isolated copy and feeds it the recorded transmissions,
// because something disposable should take the hit. The copy twirls in his
// chair, then leaps up, grabs his throat and falls over; on the clean take he
// does a jig, bows and vanishes in a puff of smoke. Riker keeps the practice,
// and in Bk2 ch28 it is how they catch VEHEMENT-infected Homer.
//
// Three of these checks are not about rendering at all. They are the rules that
// keep him from turning into a second Guppy or into a Bob, and each of them is
// a decision that would otherwise live only in somebody's memory.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, each, ROOT}) => {
  const ART = get('SANDBOX_ART');
  const state = get('state');
  const doc = get('document');
  const box = () => doc.getElementById('sandbox');
  const say = () => doc.getElementById('sandbox-say').innerHTML;
  const art = () => doc.getElementById('sandbox-art').innerHTML;
  const go = hash => { get('window').location.hash = hash; run('applyHash()'); };

  const source = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sandbox.json'), 'utf8'));

  // ---- the sprite reached the page intact ---------------------------------
  ok(ART && ART.frames, 'no sandbox sprite reached the page');
  ok(!('_comment' in ART), '_comment should be stripped by the build');
  const FRAMES = ['idle', 'throat', 'fallen', 'jig', 'bow', 'puff'];
  each('sandbox frames', FRAMES, name => {
    const rows = ART.frames[name];
    ok(Array.isArray(rows) && rows.length === ART.height,
       `${name}: ${rows && rows.length} rows, expected ${ART.height}`);
    ok(rows.every(r => r.length === ART.width), `${name}: a row is not ${ART.width} wide`);
    ok(rows.every(r => [...r].every(c => c === '.' || c in ART.palette)),
       `${name}: uses a character that is not in the palette`);
    const svg = run(`pixelSvg(SANDBOX_ART, ${JSON.stringify(name)})`);
    ok(/^<svg /.test(svg) && /<rect /.test(svg), `${name}: rendered nothing`);
  }, 6);
  ok(ART.width === source.width && ART.height === source.height,
     'the shipped sprite is not the size the data file declares');

  // The box is in every frame. The scale is the joke — an actual sandbox on the
  // table with a miniature Bob in it — and a frame without it is a man standing
  // in the dark.
  each('every frame keeps the box', FRAMES, name => {
    ok(ART.frames[name].some(r => r.includes('r')), `${name}: no sandbox drawn`);
  }, 6);

  // ---- HE NEVER SPEAKS ----------------------------------------------------
  // Guppy talks in brackets; Sandbox Bob mimes. If a <text> element ever turns
  // up in his sprite, or the line beside him stops being Guppy's, he has become
  // a second Guppy and the two characters have collapsed into one.
  each('frames carry no text', FRAMES, name => {
    ok(!/<text|<foreignObject/i.test(run(`pixelSvg(SANDBOX_ART, ${JSON.stringify(name)})`)),
       `${name}: the sprite is rendering words`);
  }, 6);

  // ---- HE IS NOT A BOB ----------------------------------------------------
  // He is an isolated copy run to be destroyed, and Guppy had already counted
  // twenty-four of him before the scene we meet him in. The register does not
  // hold him, and this is the check that keeps somebody from kindly adding him.
  const BOBS = get('BOBS');
  ok(!BOBS.some(b => b.id === 'sandbox' || /sandbox/i.test(b.name) ||
                     /sandbox/i.test(b.alias || '')),
     'Sandbox Bob has a record in the genealogy, and must not');

  // ---- he runs on an address, and only on an address ----------------------
  go('#register/bill');
  ok(box().hidden, 'a clean address should leave nothing behind');
  ok(/SANDBOX/.test(say()) && /No triggers/.test(say()),
     `the clean report is wrong: ${say()}`);

  const take = () => +/TAKE (\d+)/.exec(say())[1];
  const before = take();
  go('#register/nosuchbob');
  ok(!box().hidden, 'an unresolvable selection should show the report');
  ok(/register\/nosuchbob/.test(say()), `the report does not name what was dropped: ${say()}`);
  ok(take() === before + 1, 'Guppy is not counting the takes');
  ok(/<rect /.test(art()), 'the sandbox is showing nothing at all');

  go('#nosuchview/whatever');
  ok(!box().hidden && /a register called nosuchview/.test(say()),
     `an unknown register should be named: ${say()}`);

  go('#register?f=nosuchfilter');
  ok(!box().hidden && /a filter called nosuchfilter/.test(say()),
     `an unknown filter should be named: ${say()}`);

  go('#register/nosuchbob?f=nosuchfilter');
  ok(/None of it is on file/.test(say()), `two drops should read as plural: ${say()}`);

  // ---- the reading position is NOT his job --------------------------------
  // A record held back because of where the reader has got to is the console
  // doing its job, and running that past the sandbox would call it an attack.
  const late = BOBS.find(b => /Bk5/.test(b.cite || '') && !/Bk[1-4]/.test(b.cite || ''));
  if (late) {
    state.book = 1;
    go(`#register/${late.id}`);
    ok(box().hidden,
       `${late.id} is held at book one and the sandbox fired on it anyway`);
    ok(run('state.selected') !== late.id, 'the held record was selected after all');
    state.book = get('BOOK_MAX');
  }

  // ---- the report does not follow the reader around -----------------------
  go('#register/nosuchbob');
  ok(!box().hidden, 'expected the report to be up');
  run('render()');
  ok(!box().hidden, 'the report should survive the render that follows its arrival');
  run('render()');
  ok(box().hidden, 'the report should be gone by the next render');

  // ---- dismissable --------------------------------------------------------
  go('#register/nosuchbob');
  run('sandboxHide()');
  ok(box().hidden, 'dismissing should hide the report');

  state.view = 'register';
  get('window').location.hash = '';
  run('render()');

  console.log(`  ${ART.width}x${ART.height}, ${FRAMES.length} frames, mute`);
};
