// The series, and everything that counts it.
//
// This suite exists for one day that has not happened yet. Book 6 arrives on
// 10 Sept 2026 and book 7 is announced as the last, so the console will be
// told the series got longer twice more — and the failure mode is not loud.
// Nothing throws when a reading position goes missing from the prompt. The
// page just quietly stops offering somewhere a reader has been.
//
// So the assertions here are all of the same kind: every place that knows how
// many books there are must get the number from the same place. Not "is it
// five" — a test that has to be hand-updated is a test that will be wrong, and
// this one would be wrong exactly when it mattered.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, get, run, ROOT}) => {
  const BOOKS = get('BOOKS');
  const RELEASED = get('RELEASED');
  const BOOK_MAX = get('BOOK_MAX');
  const numWord = get('numWord');
  const doc = get('document');
  const state = get('state');

  // ---- the file reached the page ----------------------------------------
  ok(Array.isArray(BOOKS) && BOOKS.length, 'no series data reached the page');
  const seen = new Set();
  for (const b of BOOKS) {
    ok(Number.isInteger(b.n) && b.n > 0, `${JSON.stringify(b)} has no book number`);
    ok(!seen.has(b.n), `book ${b.n} listed twice`);
    seen.add(b.n);
    ok(typeof b.title === 'string' && b.title.length, `book ${b.n} has no title`);
    ok(typeof b.released === 'boolean', `book ${b.n} does not say whether it is out`);
  }
  ok(BOOKS.every((b, i) => b.n === i + 1), 'the series is not in order');

  // Released books must be a prefix — an unreleased one in the middle would put
  // a position nobody can occupy between two they can.
  const flags = BOOKS.map(b => b.released);
  ok(flags.indexOf(false) === -1 || !flags.slice(flags.indexOf(false)).includes(true),
     'an unreleased book sits before a released one');

  // ---- BOOK_MAX is derived, not declared --------------------------------
  ok(BOOK_MAX === RELEASED.length,
     `BOOK_MAX is ${BOOK_MAX} and ${RELEASED.length} books are released`);
  ok(BOOK_MAX === BOOKS.filter(b => b.released).length, 'RELEASED filtered something else');
  ok(state.book === BOOK_MAX, 'the default reading position is not "everything"');

  // The console must never be able to lead the series. The data lagging is
  // normal and will happen for as long as it takes to read a new book; a
  // citation past the last released one is prose nobody can reach.
  const cited = get('BOBS').flatMap(b => [b.cite, b.fateCite, b.nameFrom])
    .filter(Boolean).join(' ');
  for (const m of cited.matchAll(/\bBk(\d+)\b/g)) {
    ok(+m[1] <= BOOK_MAX, `a record cites Bk${m[1]} with ${BOOK_MAX} books released`);
  }

  // ---- the number as a word ---------------------------------------------
  ok(numWord(5) === 'five' && numWord(6) === 'six' && numWord(7) === 'seven',
     'the number words the next two releases need are wrong');
  ok(numWord(99) === '99', 'numWord should fall back to digits rather than undefined');
  ok(get('BOOK_WORD') === numWord(BOOK_MAX), 'BOOK_WORD drifted from BOOK_MAX');

  // ---- every control offers exactly the released books ------------------
  // This is the release-day assertion. Both the prompt and the selector build
  // their options from BOOK_MAX, and if either is ever hardcoded again this is
  // where it shows.
  const sel = doc.getElementById('book');
  const opts = [...sel.innerHTML.matchAll(/value="(\d+)"/g)].map(m => +m[1]);
  ok(opts.length === BOOK_MAX,
     `the reading-position selector offers ${opts.length} books, not ${BOOK_MAX}`);
  ok(opts[opts.length - 1] === BOOK_MAX, 'the selector does not reach the last book');
  ok(/BOOK \d+ — ALL/.test(sel.innerHTML), 'the last position is not marked as everything');

  const gate = doc.getElementById('gate');
  if (gate) {
    const asked = doc.getElementById('gate-count');
    ok(asked && asked.textContent === get('BOOK_WORD'),
       `the prompt says "${asked && asked.textContent}" books, not "${get('BOOK_WORD')}"`);
    const all = doc.getElementById('gate-all');
    ok(all && +all.dataset.book === BOOK_MAX,
       'I’VE FINISHED does not mean the last book');
    const choices = [...doc.getElementById('gate-books').innerHTML
      .matchAll(/data-book="(\d+)"/g)].map(m => +m[1]);
    ok(choices.length === BOOK_MAX - 1,
       `the prompt offers ${choices.length} mid-series positions, expected ${BOOK_MAX - 1}`);
    ok(!choices.includes(BOOK_MAX),
       'the last book appears twice — once as a choice and once as I’VE FINISHED');
  }

  // ---- no literal series length survives in the rendered page -----------
  // Counts are rendered from BOOK_MAX. What is left saying "five books" in the
  // source is a corpus-bounded claim, and validate.py's CORPUS_CLAIMS is what
  // holds those to account — but a *count* that slipped back into a literal
  // would render here and nowhere else, so it is worth one sweep.
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const stale = [...dist.matchAll(/across the (\w+) books/g)]
    .filter(m => m[1] !== get('BOOK_WORD'));
  ok(!stale.length, `"across the ${stale[0] && stale[0][1]} books" is a hardcoded count`);

  const pending = BOOKS.filter(b => !b.released);
  console.log(`  ${BOOK_MAX} released (${get('BOOK_WORD')})` +
              (pending.length ? `, ${pending.map(b => b.title).join(', ')} pending` : ''));
};
