// The smallest DOM the console will run against. It is deliberately dumb: the
// tests exercise the functions that BUILD markup, and read the strings they
// return. Nothing here needs to lay anything out.
//
// Kept honest by one rule — if a test would pass only because the stub is
// lenient, the stub is wrong. Hence getContext() returning null on demand, and
// elements remembering what was written to them.

function element(id = '') {
  return {
    id,
    innerHTML: '', textContent: '', hidden: false, value: '',
    dataset: {},
    _attrs: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); }, remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
      toggle(c, on) { on === undefined ? (this._set.has(c) ? this._set.delete(c) : this._set.add(c))
                                       : (on ? this._set.add(c) : this._set.delete(c)); },
    },
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k] ?? null; },
    focus() {}, remove() {}, addEventListener() {},
    scrollIntoView() {}, closest() { return null }, querySelector() { return null },
    querySelectorAll() { return [] },
    appendChild() {}, getBoundingClientRect() { return {width: 0, height: 0, top: 0, left: 0} },
  };
}

function install(sandbox, {width = 1400} = {}) {
  const store = {};
  const tabs = [];

  sandbox.document = {
    getElementById: id => store[id] || (store[id] = element(id)),
    // The console reads .tab to sync aria-selected. Hand back whatever the
    // register list registered, so a view that never got a tab shows up as a
    // test failure rather than passing silently.
    querySelectorAll: sel => (sel && sel.includes('.tab')) ? tabs : [],
    querySelector: () => null,
    addEventListener: () => {},
    createElement: () => element(),
    activeElement: element(),
    body: element('body'),
    documentElement: element('html'),
    _store: store,
    _setTabs: list => { tabs.length = 0; tabs.push(...list); },
  };

  sandbox.window = {
    innerWidth: width,
    innerHeight: 900,
    matchMedia: () => ({matches: true}),   // reduced motion -> skips boot timers
    addEventListener: () => {},
    devicePixelRatio: 1,
    location: {hash: ''},
  };
  sandbox.navigator = {userAgent: 'test'};
  sandbox.setTimeout = () => 0;
  sandbox.clearTimeout = () => {};
  sandbox.requestAnimationFrame = () => 0;
  sandbox.devicePixelRatio = 1;
  sandbox.localStorage = {
    _s: {},
    getItem(k) { return this._s[k] ?? null },
    setItem(k, v) { this._s[k] = String(v) },
    removeItem(k) { delete this._s[k] },
  };
  return sandbox;
}

module.exports = {install, element};
