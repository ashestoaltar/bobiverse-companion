#!/usr/bin/env node
// Runs the console's own script against a stub DOM.
//
// The script under test is extracted from dist/index.html rather than from
// templates/genealogy.html, so what gets tested is what actually ships —
// including the data the build injects. Run `make build` first; `make test`
// does that for you.
//
//   node tests/run.js                 # every suite
//   node tests/run.js chart           # suites whose name contains "chart"
//   node tests/run.js --update-snapshots
//
// Suites are .test.js files in this directory. Each is handed a context object
// and runs inside the same VM as the app, so the app's top-level `const`
// declarations are in scope. (eval() cannot do this: lexical declarations
// inside a direct eval stay scoped to the eval.)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HERE = __dirname;
const ROOT = path.dirname(HERE);
const DIST = path.join(ROOT, 'dist', 'index.html');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update-snapshots');
const filters = args.filter(a => !a.startsWith('--'));

// ---- extract the app script -------------------------------------------
if (!fs.existsSync(DIST)) {
  console.error(`no ${path.relative(ROOT, DIST)} — run \`make build\` first`);
  process.exit(2);
}
const html = fs.readFileSync(DIST, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) {
  console.error('no <script> found in dist/index.html');
  process.exit(2);
}

// ---- build the sandbox -------------------------------------------------
const sandbox = {
  console, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp,
  Error, TypeError, Set, Map, Symbol, Promise, isNaN, isFinite, parseFloat,
  parseInt, encodeURIComponent, decodeURIComponent, Infinity, NaN, undefined,
};
sandbox.globalThis = sandbox;
require('./dom-stub').install(sandbox);
vm.createContext(sandbox);

let appError = null;
try {
  vm.runInContext(scripts.join('\n'), sandbox, {filename: 'console.js'});
} catch (e) {
  appError = e;
}
if (appError) {
  console.error('the console script threw on load:\n ', appError.stack);
  process.exit(1);
}

// Holotank Three.js ships beside the page and lazy-loads in the browser.
// Tests preload it into the same VM so HOLO3D exists without a network.
const HOLO3D_PATH = path.join(ROOT, 'dist', 'assets', 'holo3d', 'holo3d.js');
if (fs.existsSync(HOLO3D_PATH)) {
  try {
    vm.runInContext(fs.readFileSync(HOLO3D_PATH, 'utf8'), sandbox, {filename: 'holo3d.js'});
  } catch (e) {
    console.error('holo3d.js failed to load in the test VM:\n ', e.stack);
    process.exit(1);
  }
}

// ---- assertion plumbing ------------------------------------------------
let failures = [];
let checks = 0;
let suite = '';

const ok = (cond, message) => {
  checks++;
  if (!cond) failures.push(`${suite}: ${message}`);
};

/* Deriving expectations from the data instead of hardcoding them is right, and
   it has one blind spot: a case that computes an expected count of zero and
   observes zero passes without proving anything happened. A loop over an empty
   list runs no assertions and reports success in the same cheerful tone as a
   loop over eighty-seven. A bug that empties a register sails straight through.

   That is not hypothetical here. This project lost most of a day to a harness
   reporting 2,585 checks passed while the ebooks sat deleted on disk — the
   cache still held the parse, so everything downstream had something to agree
   with. This is that shape drawn smaller.

   `each` and `need` are the fix at the point of use: a collection has to have
   something in it before it is worth iterating, and a lookup that finds nothing
   is a failure rather than a quiet skip. Both return what they were given, so
   they drop into existing code without restructuring it. */
const each = (label, items, fn, min = 1) => {
  const list = Array.from(items || []);
  ok(list.length >= min,
     `${label}: expected at least ${min}, got ${list.length} — ` +
     `an empty list here asserts nothing at all`);
  list.forEach(fn);
  return list;
};

const need = (label, value) => {
  ok(value !== undefined && value !== null && value !== false,
     `${label}: nothing to test against — the case below would be skipped silently`);
  return value;
};
// Reach into the VM for a value the app declared at top level.
const get = name => {
  try { return vm.runInContext(name, sandbox); }
  catch { return undefined; }
};
// Run a snippet inside the VM, so tests can touch app internals directly.
const run = src => vm.runInContext(src, sandbox);

const snapshotDir = path.join(HERE, '__snapshots__');

function snapshot(name, value) {
  checks++;
  const file = path.join(snapshotDir, `${name}.json`);
  const serialized = JSON.stringify(value, null, 2);
  if (UPDATE || !fs.existsSync(file)) {
    fs.mkdirSync(snapshotDir, {recursive: true});
    fs.writeFileSync(file, serialized + '\n');
    console.log(`  ${UPDATE ? 'updated' : 'wrote'} snapshot ${name}`);
    return;
  }
  const before = fs.readFileSync(file, 'utf8').trimEnd();
  if (before === serialized) return;

  // Report the first differing key rather than dumping two large blobs.
  let detail = '';
  try {
    const a = JSON.parse(before), b = value;
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const k of keys) {
      const x = JSON.stringify(a[k]), y = JSON.stringify(b[k]);
      if (x === y) continue;
      const at = firstDiff(x || '', y || '');
      detail = `\n    first change in "${k}" at offset ${at}` +
               `\n    was: ...${(x || '(absent)').slice(Math.max(0, at - 40), at + 60)}...` +
               `\n    now: ...${(y || '(absent)').slice(Math.max(0, at - 40), at + 60)}...`;
      break;
    }
  } catch { /* fall through to the bare message */ }

  failures.push(`${suite}: snapshot "${name}" changed${detail}` +
                `\n    if this was intended: node tests/run.js --update-snapshots`);
}

function firstDiff(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return n;
}

// ---- run the suites ----------------------------------------------------
const ctx = {ok, get, run, snapshot, each, need, sandbox, ROOT, HERE};

const suites = fs.readdirSync(HERE)
  .filter(f => f.endsWith('.test.js'))
  .filter(f => !filters.length || filters.some(x => f.includes(x)))
  .sort();

if (!suites.length) {
  console.error(filters.length ? `no suite matched ${filters.join(', ')}` : 'no suites found');
  process.exit(2);
}

const counted = {};

for (const file of suites) {
  suite = file.replace(/\.test\.js$/, '');
  const before = failures.length;
  const beforeChecks = checks;
  console.log(`\n${suite}`);
  try {
    require(path.join(HERE, file))(ctx);
  } catch (e) {
    failures.push(`${suite}: threw — ${e.stack}`);
  }
  counted[suite] = checks - beforeChecks;
  const added = failures.length - before;
  if (added) console.log(`  ${added} failed`);
}

/* A floor under every suite, recorded like the golden master.
   `each` and `need` only guard the sites that use them, and a hand-written loop
   added tomorrow will not. This catches the class instead of the instances: if
   a suite runs materially fewer assertions than it did when the count was last
   recorded on purpose, something stopped being checked, and the run says so
   instead of reporting a smaller number in the same cheerful tone.

   It is a floor, not an equality, because counts grow with the data — 87
   records became 88 and every per-record assertion follows. Growth is silent.
   Only a drop is a failure, which is the direction that hides bugs. The
   tolerance absorbs a record being retired without a false alarm; anything
   past it wants a human to agree that fewer checks is correct, and to say so
   with --update-snapshots. */
const FLOOR_SLACK = 0.02;
const floorFile = path.join(snapshotDir, 'checks.json');
const recorded = fs.existsSync(floorFile)
  ? JSON.parse(fs.readFileSync(floorFile, 'utf8')) : {};

if (UPDATE || !fs.existsSync(floorFile)) {
  fs.mkdirSync(snapshotDir, {recursive: true});
  fs.writeFileSync(floorFile, JSON.stringify({...recorded, ...counted}, null, 2) + '\n');
  console.log(`\n  ${fs.existsSync(floorFile) ? 'updated' : 'wrote'} check floors`);
} else {
  for (const [name, n] of Object.entries(counted)) {
    checks++;
    const was = recorded[name];
    if (was === undefined) {
      failures.push(`${name}: no check floor recorded — run with --update-snapshots ` +
                    `to accept ${n} as the baseline`);
    } else if (n < Math.floor(was * (1 - FLOOR_SLACK))) {
      failures.push(`${name}: ran ${n} checks, down from ${was}. Something stopped ` +
                    `being asserted — usually a derived list that came back empty, ` +
                    `which passes without proving anything. If fewer is right, ` +
                    `re-record with --update-snapshots.`);
    }
  }
}

// ---- report ------------------------------------------------------------
console.log();
if (failures.length) {
  console.log(`${failures.length} FAILURES of ${checks} checks\n`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`all ${checks} checks passed across ${suites.length} suites`);
