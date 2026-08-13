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

  // ---- the chip row has nothing to say here ------------------------------
  // The filters grade parentage. A blog post has none.
  const reg = get('REGISTERS').find(r => r.id === 'blog');
  ok(!reg.filters, 'the blog should not carry the provenance filter chips');

  reset();
  run('render()');
  console.log(`  ${all.length} posts · ${all.filter(p => p.voice === 'bobnet').length} Bill, ` +
              `${all.filter(p => p.voice === 'editor').length} registry`);
};
