// The feed, and the seam running through it.
//
// Bill's blog is canon; a Bob discussing the novels as novels is not. So the
// register carries two voices and the interesting tests are about keeping them
// apart — a post that quietly slides from one to the other is the failure this
// register is most likely to have, and the least likely to be noticed.

module.exports = ({ok, get, run}) => {
  const state = get('state');
  const doc = get('document');
  const BLOG = get('BLOG');
  const VOICE = get('VOICE');

  ok(BLOG && Array.isArray(BLOG.posts), 'no blog data reached the page');
  const all = BLOG.posts;

  const reset = () => {
    Object.assign(state, {view: 'blog', q: '', blog: null, book: get('BOOK_MAX')});
    state.filters = new Set();
  };

  // ---- shape -------------------------------------------------------------
  const ids = new Set();
  for (const p of all) {
    ok(/^[a-z0-9-]+$/.test(p.id), `post id '${p.id}' is not a usable address`);
    ok(!ids.has(p.id), `duplicate post id '${p.id}'`);
    ids.add(p.id);
    ok(/^\d{4}-\d{2}-\d{2}$/.test(p.date), `${p.id}: date '${p.date}' is not a date`);
    ok(VOICE[p.voice], `${p.id}: voice '${p.voice}' has no rendering`);
    ok(p.body && p.body.length > 40, `${p.id}: no body worth reading`);
    ok(Number.isInteger(p.spoil), `${p.id}: a post with no spoil would be held forever`);
  }

  // ---- Bill does not know the books are books ---------------------------
  // The whole reason `voice` exists. An in-world post that says "appendix" is
  // a category error, and the sort that creeps in one edit at a time.
  const OUTSIDE = ['appendix', 'appendices', 'taylor', 'novel', 'canon', 'the reader'];
  for (const p of all.filter(x => x.voice === 'bobnet')) {
    const text = `${p.title} ${p.dek || ''} ${p.body}`.toLowerCase();
    for (const word of OUTSIDE) {
      ok(!text.includes(word),
         `${p.id} is in Bill's voice and says '${word}' — that post is the editor's`);
    }
  }
  ok(all.some(p => p.voice === 'editor'), 'expected at least one post in the registry voice');
  ok(all.some(p => p.voice === 'bobnet'), 'expected at least one post in Bill\'s voice');

  // ---- rendering ---------------------------------------------------------
  reset();
  run('render()');
  const stage = doc.getElementById('stage').innerHTML;
  for (const p of all) {
    ok(stage.includes(`data-post="${p.id}"`), `${p.id} is missing from the feed`);
  }
  ok(stage.indexOf(VOICE.editor.label) > 0, 'the registry voice should be labelled in the list');

  // newest first — a feed that is not in order is not a feed
  const order = [...stage.matchAll(/data-post="([a-z0-9-]+)"/g)].map(m => m[1]);
  const byDate = all.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
                    .map(p => p.id);
  ok(order.join() === byDate.join(), `feed order ${order.join()} is not newest-first`);

  // ---- one post open -----------------------------------------------------
  reset();
  state.blog = all[0].id;
  run('render()');
  const doss = doc.getElementById('dossier').innerHTML;
  ok(doss.includes(all[0].title), 'the open post did not render');
  ok(doss.includes(VOICE[all[0].voice].label), 'the open post does not say who is talking');
  ok(!/undefined|NaN/.test(doss), 'the post rendered undefined');

  // ---- search reaches the body ------------------------------------------
  reset();
  const word = all[0].body.split(/\s+/).find(w => w.length > 7).replace(/[^a-z]/gi, '');
  state.q = word;
  ok(run('posts()').some(p => p.id === all[0].id),
     `searching '${word}' should find the post it came from`);

  // ---- links, both directions -------------------------------------------
  // A post declares what it is about as addresses, and a record reads that list
  // backwards. One mapping, two directions — the alternative is two lists that
  // disagree the first time anybody edits one.
  const canLink = get('canLink');
  const linkTo = get('linkTo');
  const REGISTERS = get('REGISTERS');

  reset();
  for (const p of all) {
    for (const a of p.about || []) {
      const [view, id] = a.split('/');
      ok(REGISTERS.some(r => r.id === view), `${p.id}: about '${a}' names no register`);
      ok(canLink(view, id || null), `${p.id}: about '${a}' does not resolve to anything`);
    }
  }

  // forwards: the post carries the links
  const withLinks = all.find(p => (p.about || []).length);
  ok(withLinks, 'expected a post that points somewhere');
  reset();
  state.blog = withLinks.id;
  run('render()');
  const open = doc.getElementById('dossier').innerHTML;
  for (const a of withLinks.about) {
    ok(open.includes(`href="#${a}"`), `${withLinks.id}: no link to ${a}`);
  }

  // backwards: the thing it points at knows about the post
  const target = withLinks.about.map(a => a.split('/')).find(([, id]) => id);
  if (target) {
    const [view, id] = target;
    reset();
    state.view = view;
    run(`selOf(${JSON.stringify(view)})`).set(id);
    run('render()');
    const back = doc.getElementById('dossier').innerHTML;
    ok(back.includes(`href="#blog/${withLinks.id}"`),
       `${view}/${id} does not link back to the post about it`);
    ok(back.includes('ON THE FEED'), 'the reverse link is not labelled');
  }

  // held targets vanish from a link list rather than degrading to their name —
  // in a list the name is the whole content, so plain text would leak it
  const held = get('BOBS').find(b => run('attestedAt')(b) >= 4);
  if (held) {
    state.book = 1;
    ok(!canLink('register', held.id), `${held.id} should not be linkable at book 1`);
    ok(linkTo('register', held.id, held.name) === get('esc')(held.name),
       'a held link should fall back to plain text when it is prose');
    ok(!run('linkList')([['register', held.id, held.name]]),
       'a held link should vanish from a list, not fall back to its name');
    state.book = get('BOOK_MAX');
  }

  // ---- the chip row has nothing to say here ------------------------------
  // The filters grade parentage. A blog post has none.
  const reg = get('REGISTERS').find(r => r.id === 'blog');
  ok(!reg.filters, 'the blog should not carry the provenance filter chips');

  reset();
  run('render()');
  console.log(`  ${all.length} posts · ${all.filter(p => p.voice === 'bobnet').length} Bill, ` +
              `${all.filter(p => p.voice === 'editor').length} registry`);
};
