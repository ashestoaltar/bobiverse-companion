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

// ---- assertion plumbing ------------------------------------------------
let failures = [];
let checks = 0;
let suite = '';

const ok = (cond, message) => {
  checks++;
  if (!cond) failures.push(`${suite}: ${message}`);
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
const ctx = {ok, get, run, snapshot, sandbox, ROOT, HERE};

const suites = fs.readdirSync(HERE)
  .filter(f => f.endsWith('.test.js'))
  .filter(f => !filters.length || filters.some(x => f.includes(x)))
  .sort();

if (!suites.length) {
  console.error(filters.length ? `no suite matched ${filters.join(', ')}` : 'no suites found');
  process.exit(2);
}

for (const file of suites) {
  suite = file.replace(/\.test\.js$/, '');
  const before = failures.length;
  console.log(`\n${suite}`);
  try {
    require(path.join(HERE, file))(ctx);
  } catch (e) {
    failures.push(`${suite}: threw — ${e.stack}`);
  }
  const added = failures.length - before;
  if (added) console.log(`  ${added} failed`);
}

// ---- report ------------------------------------------------------------
console.log();
if (failures.length) {
  console.log(`${failures.length} FAILURES of ${checks} checks\n`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`all ${checks} checks passed across ${suites.length} suites`);
