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
    focus() { if (this._doc) this._doc.activeElement = this; },
    remove() {}, addEventListener() {},
    scrollIntoView() {}, closest() { return null }, querySelector() { return null },
    querySelectorAll() { return [] },
    appendChild() {}, getBoundingClientRect() { return {width: 0, height: 0, top: 0, left: 0} },
  };
}

function install(sandbox, {width = 1400} = {}) {
  const store = {};
  const tabs = [];
  const selectors = {};

  // Elements need a way back to the document so focus() can record itself.
  const own = el => { el._doc = sandbox.document; return el; };

  sandbox.document = {
    getElementById: id => store[id] || (store[id] = own(element(id))),
    // The console reads .tab to sync aria-selected. Hand back whatever the
    // register list registered, so a view that never got a tab shows up as a
    // test failure rather than passing silently.
    querySelectorAll: sel => (sel && sel.includes('.tab')) ? tabs : [],
    querySelector: sel => selectors[sel] || null,
    addEventListener: () => {},
    createElement: () => own(element()),
    activeElement: element(),
    body: element('body'),
    documentElement: element('html'),
    // Named nodes the app looks up by selector rather than by id. Registering
    // one here is what lets a test watch focus land on it.
    _register: (sel, el) => { selectors[sel] = own(el); return el; },
    _store: store,
    _setTabs: list => { tabs.length = 0; tabs.push(...list); },
  };

  sandbox.window = {
    innerWidth: width,
    innerHeight: 900,
    // Answer per query rather than yes to everything. Reduced motion has to be
    // true so the boot timers never start, but pretending to be a touchscreen
    // made the golden master record the phone's help text as the canonical
    // rendering, which is backwards.
    matchMedia: q => ({matches: /prefers-reduced-motion/.test(String(q))}),
    addEventListener: () => {},
    devicePixelRatio: 1,
    location: {hash: ''},
    // the console writes its address here; the stub just records it
    // Records which method was used, not just the result — "was this a new
    // place or the same place respelled?" is the whole distinction syncHash
    // draws, and it is invisible if you only look at the resulting hash.
    history: {
      calls: [],
      pushState(_a, _b, url) {
        this.calls.push(['push', String(url)]);
        sandbox.window.location.hash = String(url).replace(/^[^#]*/, '');
      },
      replaceState(_a, _b, url) {
        this.calls.push(['replace', String(url)]);
        sandbox.window.location.hash = String(url).replace(/^[^#]*/, '');
      },
    },
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
