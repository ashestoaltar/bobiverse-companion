// The timeline — the one axis nothing else reads.
//
// It owns no data. Every event is derived from a date already held somewhere
// else, which makes the interesting tests about derivation rather than about
// content: is it in order, does it only claim what it can source, and does it
// stop where the reader has stopped.

module.exports = ({ok, get, run, each, need}) => {
  const state = get('state');
  const BOBS = get('BOBS');
  const SYSTEMS = get('SYSTEMS');
  const BLOG = get('BLOG');
  const BOOK_MAX = get('BOOK_MAX');
  const dateIn = get('dateIn');

  const reset = (book = BOOK_MAX) => {
    Object.assign(state, {view: 'timeline', q: '', selected: null, book});
    state.filters = new Set();
  };

  // ---- the parser both date shapes go through ---------------------------
  ok(dateIn('24 Jun 2133').y === 2133 && dateIn('24 Jun 2133').m === 6, 'build date misparsed');
  ok(dateIn('Bk1 ch60 · Khan, Apr 2185').m === 4, 'citation date misparsed — month lost');
  ok(dateIn('Bk2 ch47 · Bob, September 2182').m === 9, 'long month name misparsed');
  ok(dateIn('2144').m === 0, 'a bare year should not claim a month');
  ok(dateIn('') === null && dateIn(undefined) === null, 'empty text should yield no date');
  ok(dateIn('Jan 2200').at < dateIn('Feb 2200').at, 'months do not order within a year');
  ok(dateIn('2200').at < dateIn('Jan 2200').at,
     'a bare year should sort ahead of anything dated inside it');

  // ---- shape and order ---------------------------------------------------
  reset();
  const all = run('events()');
  ok(all.length > 20, `expected a populated timeline, got ${all.length}`);
  for (const e of all) {
    ok(Number.isFinite(e.at) && e.y > 2000, `event has no usable date: ${JSON.stringify(e)}`);
    ok(typeof e.html === 'string' && e.html.length, 'event with nothing to say');
    ok(!/undefined|NaN/.test(e.html), `event has a hole in it: ${e.html}`);
  }
  for (let i = 1; i < all.length; i++) {
    ok(all[i - 1].at <= all[i].at, `out of order at ${all[i].y}`);
  }

  // Every date it prints has to come from a record, not from the view.
  const known = new Set();
  BOBS.forEach(b => { if (b.born) known.add(dateIn(b.born).at); });
  BOBS.forEach(b => { if (b.fateCite) known.add(dateIn(b.fateCite).at); });
  SYSTEMS.systems.forEach(s => { if (s.first_year) known.add(dateIn(String(s.first_year)).at); });
  BLOG.posts.forEach(p => known.add(dateIn(p.date.replace(/^(\d{4})-(\d{2}).*/,
    (_, y, m) => `${get('MONTHS')[+m - 1]} ${y}`)).at));
  for (const e of all) {
    ok(known.has(e.at) || e.kind === 'blank',
       `${e.y} ${e.kind}: a date the data does not hold`);
  }

  // ---- the original was not built by anybody -----------------------------
  const root = all.find(e => e.kind === 'built' && /Bob-1/.test(e.html));
  ok(root, 'the original is missing from the timeline');
  ok(/woken/.test(root.html) && !/built/.test(root.html),
     'Bob-1 is described as built — he was woken, 117 years after dying');

  // ---- the registry's own voice is not an event in the story -------------
  each('posts in the registry voice', BLOG.posts.filter(x => x.voice === 'editor'), p => {
    ok(!all.some(e => e.html.includes(p.title)),
       `an editor post is in the chronology: ${p.title}`);
  });
  ok(BLOG.posts.some(p => p.voice === 'bobnet' && all.some(e => e.html.includes(p.title))),
     "none of Bill's posts made it onto the timeline");

  // ---- it stops where the reader has stopped ----------------------------
  // The span should grow with the reading position and never shrink, and a
  // place must not date itself past the last thing the records reach — a system
  // carries a first-contact year and no citation to gate it with.
  let last = 0;
  for (let n = 1; n <= BOOK_MAX; n++) {
    reset(n);
    const ev = run('events()');
    ok(ev.length > 0, `book ${n} has no timeline at all`);
    const end = ev[ev.length - 1].y;
    ok(end >= last, `book ${n} ends at ${end}, earlier than book ${n - 1}'s ${last}`);
    last = end;

    const reachable = Math.max(...ev.filter(e => e.kind !== 'reached').map(e => e.at));
    for (const e of ev.filter(e => e.kind === 'reached')) {
      ok(e.at <= reachable,
         `book ${n}: ${e.y} names a place later than anything else on the page`);
    }
  }

  reset();
  console.log(`  ${all.length} events, ${all[0].y}–${all[all.length - 1].y}, ` +
              `${new Set(all.map(e => e.y)).size} years`);
};
