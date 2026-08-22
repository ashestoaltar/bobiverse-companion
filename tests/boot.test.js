// The boot sequence.
//
// It reports counts, and a splash screen quoting stale numbers is worse than no
// splash screen — it is the first thing anyone reads and it would be lying. So
// every figure is derived at runtime, and this checks the derivation rather
// than the animation. The timings are checked too, because the first version
// ran the whole thing in 1.2 seconds and nobody could read it.

module.exports = ({ok, get, run}) => {
  const lines = run('bootLines()');
  const BOBS = get('BOBS');
  const SYSTEMS = get('SYSTEMS');
  const SKYFIELD = get('SKYFIELD');
  const BESTIARY = get('BESTIARY');
  const PEOPLES = get('PEOPLES');

  ok(Array.isArray(lines) && lines.length >= 5, `expected several boot lines, got ${lines.length}`);

  for (const [text, pause] of lines) {
    ok(typeof text === 'string' && text.length > 0, 'empty boot line');
    ok(/^\[.*\]$/.test(text), `boot line should be bracketed machine speech: ${text}`);
    ok(!/NaN|undefined|null/.test(text), `boot line has a hole in it: ${text}`);
    ok(Number.isFinite(pause) && pause >= 0, `boot line has a bad pause: ${text}`);
  }

  const all = lines.map(l => l[0]).join('\n');

  // Each figure must match the data it claims to describe.
  ok(all.includes(`${BOBS.length} replicant records`),
     `boot does not report ${BOBS.length} records`);
  ok(all.includes(`${BOBS.filter(b => b.src === 'c').length} with no source on file`),
     'boot misreports the no-source count');
  ok(all.includes(`${BOBS.filter(b => b.src === 'x').length} expunged`),
     'boot misreports the expunged count');
  ok(all.includes(`${SYSTEMS.systems.length} systems`),
     `boot does not report ${SYSTEMS.systems.length} systems`);
  ok(all.includes(SKYFIELD.count.toLocaleString()),
     `boot does not report ${SKYFIELD.count} background stars`);
  ok(all.includes(`${BESTIARY.creatures.length} creatures`),
     'boot misreports the creature count');
  const species = PEOPLES.entries.filter(e => e.kind === 'people').length;
  const polities = PEOPLES.entries.filter(e => e.kind === 'polity').length;
  ok(all.includes(`${species} species`), 'boot misreports the species count');
  ok(all.includes(`${polities} polities`), 'boot misreports the polity count');
  ok(/STATUS: Ready/.test(all), 'boot never says it is ready');
  // First impression: Ready names the lobby so Blog does not feel accidental.
  ok(/STATUS: Ready · FEED/.test(all) || /STATUS: Ready \u00b7 FEED/.test(all),
     'boot Ready line should name the FEED lobby');

  // ---- it is a SCUT connect, not a mainframe coming up -------------------
  // The books show this twice and agree — Riker in Bk1 ch41, Mulder in Bk2 ch6.
  // Turn it on, the console lists the systems already on the network, register
  // yourself, pick one, connect, transmit, the far end answers. Nobody mounts
  // anything, and nothing indexes itself at a Bob.
  for (const wrong of ['Mounting', 'Indexing', 'Loading', 'Initialising', 'Initializing']) {
    ok(!all.includes(wrong), `boot says '${wrong}', which is a mainframe and not a transceiver`);
  }
  const at = re => lines.findIndex(([t]) => re.test(t));
  const available = at(/Connections available/);
  const connect = at(/connect\]/);
  const ready = at(/STATUS: Ready/);
  ok(available >= 0, 'boot never lists the connections available');
  ok(connect > available, 'boot connects before it has offered anywhere to connect to');
  ok(ready === lines.length - 1, 'the sequence should land on ready, not pass through it');
  ok(/FEED/.test(lines[ready][0]), 'the landing line should name FEED');

  // The systems it offers are derived, not typed: the earliest contacted, in
  // order. That they come out as the four the books print is checkable rather
  // than asserted, and it stops the list going stale if a system is added.
  const reached = SYSTEMS.systems.filter(s => s.first_year)
    .sort((a, b) => a.first_year - b.first_year).slice(0, 4).map(s => s.name);
  ok(reached.length === 4, 'not enough dated systems to offer a connection list');
  for (const name of reached) {
    ok(lines[available][0].includes(name), `connections list omits ${name}`);
  }
  ok(lines[connect][0].includes(reached[0]),
     'the console should connect to the first system on the network, as Mulder does');

  // Long enough to read. 8 lines that nobody can follow is just a flash.
  // The multiplier has to come from the page, not be repeated here — a test
  // that computes a duration the console doesn't actually use is worse than no
  // test, because it reports a number with confidence and the number is wrong.
  const speed = get('BOOT_SPEED');
  ok(typeof speed === 'number' && speed > 0, `BOOT_SPEED is ${speed}`);
  const chars = lines.reduce((n, [t]) => n + t.length, 0);
  const pauses = lines.reduce((n, [, p]) => n + p, 0);
  const total = (260 + chars * 5 + pauses) * speed;
  ok(total > 2400, `boot runs in ${Math.round(total)}ms — too fast to read`);
  ok(total < 7000, `boot runs in ${Math.round(total)}ms — too long to sit through on a reload`);

  // It must be skippable, and it must not trap anyone who can't watch it.
  const html = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'dist', 'index.html'), 'utf8');
  ok(/boot-hint/.test(html), 'no visible hint that the boot screen can be skipped');
  ok(/prefers-reduced-motion/.test(html), 'boot does not respect reduced motion');

  console.log(`  ${lines.length} lines, ~${(total / 1000).toFixed(1)}s, skippable`);
};
