# Project context

An interactive genealogy of the replicants in Dennis E. Taylor's Bobiverse,
presented as a BobNet console. The point of the project is **provenance**:
every lineage claim carries a confidence tier, and disagreements between
sources are surfaced rather than smoothed over.

**Agent handoff:** read **`ideas/README.md` first** — product intent, holotank
2D+3D, vessels, spatial stack (chart · gates · galaxy), parked experiments
(Heaven Raid shmup, EE video), art/Ackbar rules,
experiment tools, open checklist. Owner preference: one primary agent (Grok)
owns code, data, tests, and media; suggest improvements freely; “locked”
choices are not sacred if quality demands change. Living backlog:
`data/todo.json`. This file stays ground rules and data layout.

**Near-term (2026-08-23 EOD wrap):** Phases **A → C.2** shipped. Genealogy
books 1–5 nulls closed + light bio recoveries (`7c1a2a3`). Todo 6 open / 49
done. Next: Gates polish / Chart→Galaxy zoom-out / Book 6 prep (~2026-09-10) /
opportunistic bio / Heaven mesh. Prefer code/data/console before Imagine burn.
Parked: EE video, moot populate, Heaven Raid. Read **`ideas/README.md`** §10
+ §16.

**3D holotank assets:** source under `assets/holo-models/*.glb` and
`assets/holo3d/holo3d.js`; build copies them to `dist/assets/` and the console
lazy-loads the viewer via `ensureHolo3d()`. Plate field `model` in
`data/holo.json`. Spike tools under `ideas/experiments/holotank-3d/`. Prefer
`make serve` over `file://` for 3D.

## Ground rules

This is a personal project done for fun. The aim is to get it *right*, not to
perform rigour — where a guideline below stops helping, change it.

**Never commit book text.** `books/` and `.cache/` are gitignored and must stay
that way. The corpus is derived from the user's own ebooks and stays local. What
this project publishes is `data/bobs.json` — facts about who descends from whom,
which aren't copyrightable. Don't paste passages into commit messages, issues,
or `note` fields; paraphrase and cite instead. `note` fields should be a
sentence or two in your own words. This one isn't negotiable.

**Watch out for inherited memory.** A clone inherits its parent's memories
wholesale, so a Bob narrating his own creation may be narrating his parent's.
Oliver's first chapter reads like an origin claim from one of Bob-1's first
cohort; he is actually a clone of Bill who inherited Bill's memory of that
moment. The reliable evidence is the *creating* Bob's POV — "my two newest
clones, Pete and Victor" from Bob-1 settles Pete and Victor cleanly. Prefer
that, or a second independent mention, before setting tier T.

**Preserve disagreement.** When sources conflict, set `conflict` describing the
disagreement and which source the tree follows. Don't silently pick a winner —
and record it when *we* turn out to be the wrong one. Loki is the cautionary
example. This file used to cite him as proof that "the author said so" isn't
decisive, on the grounds that Taylor put him under Khan while the text put him
in Bill's June 2185 cohort. Both halves are in Bk2 ch34, and we read them
wrongly: Bill assembles ten Bobs as the second strike force for 82 Eridani, but
that is the unit, not the source. In the same chapter Bill loads Khan's backup
at Khan's request, and the Bob who comes up names himself Loki — Bill notes that
this branch of the tree likes villains. Taylor was right. We reparented Loki to
Bill on our own bad reasoning, and have put him back under Khan.

**Factions are not lineage.** They cut across branches, so they can never be
drawn as subtrees. Use the `faction` field. There are four, and they appear once
replicative drift has gone far enough that Bill starts calling Bobs "joiners"
(Bk4 ch5):

| faction | what they are | named members on file |
|---|---|---|
| Starfleet | Morlock's group. Treat the Prime Directive as gospel, want no further contact with humans. Purged their own genealogy from the databases, and the Pangean Council eventually declared war on them (Bk4 ch42). | Homer, Gerry, Lenny |
| Skippies | Formally the **Singularity Project** — building a super AI. Dropped names for numeric designations and speech for packetized communication, but still answer to nicknames. | Hugh, Fearless Leader |
| Gamers | Run live-action D&D campaigns in virt. Solved the problem of getting into the Heaven's River megastructure. | Gandalf, Kevin, Tim, Verne, Pete |
| Borg | Bobs who went full-time Borg avatar. Joined the android design effort. | Locutus |

Starfleet's purge is the reason its members are so thin on lineage — that gap is
in-world, not a hole in our research.

**Sweeping for a fate: what the eight unaccounted turned up.** Every chapter
after each loss was searched for the name, the way Hannibal was moved out of
`presumed`. Nothing came back — no promotion, and that null result is now on the
page, because an unsearched gap and a searched one look identical unless the
page says which it is. Three of them are named exactly once in five books, in
the chapter where they are lost; a fourth only appears again in the printed
genealogy. The three blank rows stay drawn from five and the arithmetic does not
close.

Every later hit was somebody else, which is the finding worth keeping: Tom is
Tom Cruise and then Tom Sawyer, Jackson is Peter Jackson, Barney is a Quinlan
hotel. **Fred** is a Deltan hunter from Bk2 ch1 who becomes an antagonist
through book 3. **Hector Rodriguez** is a human in book 5, and separately there
is the eighteenth-generation Bob Hector who emails Bill in Bk5 ch38 — three
distinct Hectors, which is why that record carries a conflict rather than a
merge.

**Not every name in the books is a Bob.** The text is full of humans, Deltans,
Quinlans and Pav who sit in sentences right next to replicants. Bridget is Dr.
Sheehy; Diana is a Deltan; Barb is a Quinlan; the Jeffrey holding court at the
Deltan council circle is not the Jeffrey who died at 82 Eridani. Check the
species before adding the record.

## Confidence tiers

Tiers grade **parentage only**. They say nothing about how well documented a Bob
is otherwise — Herschel is tier C with eighteen POV chapters and a generation he
states out loud. We just don't know who made him. `cite`, `gen` and the rest are
welcome on any tier.

**The books are the only source.** Taylor's online tree and the fandom wiki were
dropped: a lineage claim we can't point at a page for should not be drawn as
though we know it. That cost 30 parentages and it was worth it. Dropped claims
aren't deleted — they move to `priorClaim`, recorded as a research lead and
never rendered as an edge. If the books later settle one, promote it and remove
the field.

**Eighteen were promoted that way**, all at once, when the appendices were
finally parsed: book 2 prints a genealogy of its own and book 4 reprints it.
That is back matter, exactly like the Cast of Characters, which had already been
supplying tier-T parentages for ten records. It agrees with all 26 parentages
the narrative had given us, contradicts none, names no Bob we lack a record for,
and settles precisely the 18 whose `priorClaim` read "Taylor's 2017 genealogy
put this Bob under X. The books don't say so." They do say so.

Do not read that as the rule bending. The rule found the page — the claims sat
unasserted for as long as we couldn't cite them, and were promoted the hour we
could. Note too that the printed tree is **not** the online one: where the
online tree spelled Jonny "Johnny" and Jacques "Jaques", the appendix matches
the narrative. Twelve wiki leads stand unchanged, and `priorClaim` still means
what it meant.

| tier | meaning | requirements |
|---|---|---|
| `o` | the original — no parent exists to find | `bob1` only; no `parent` |
| `t` | parent stated in the books | `cite` required, and it must support the parent link |
| `p` | an ancestor is stated, generations are not | `parent` = ancestor; explain in `partialNote` |
| `c` | no ancestor on record | no `parent`; listed in the unresolved register |
| `x` | the record was deliberately expunged | no `parent`; `cite` **and** `partialNote` both required |

**Two kinds of tier T.** Most come from narrative chapters. Ten come from the
**Cast of Characters appendix at the back of book 2**, which states parentage
outright — Garfield as Bill's first clone, Homer as Riker's first. It is back
matter rather than story, but it is Taylor's own words printed in the novel, so
it counts. Its cite is `Bk2 · Cast of Characters`. It only covers book 2, so it
says nothing about later generations.

**On tier X.** C and X are both "we can't reach Bob-1," but they are different
facts. C is silence. X is a deletion, and we can name who did it: Bill reports
that Starfleet "removed as much public information about themselves as they'd
been able," with large swaths of their genealogy and their location data simply
gone from the databases (Bk4 ch32), and he was still hitting manufactured dead
ends in his own genealogy work a decade later (Bk5 ch51). For a Starfleet member
with no lineage, the absence *is* the evidence.

Don't reach for X just because a record is empty and the Bob happens to be
Starfleet-adjacent. It asserts a cause, so the text has to account for it —
hence the mandatory cite and partialNote. Homer and Gerry are both Starfleet and
both tier T, because their parentage survives on the page regardless.

## Layout

```
books/           your DRM-free ebooks (gitignored, never committed)
                 named bobiverse-<n>-<title>.epub, though discovery matches on
                 the title, so any name carrying it will do
.cache/          parsed corpus (gitignored, and not cheap to lose — see below)
data/bobs.json   source of truth
data/schema.json field documentation and constraints
data/books.json  the series — titles, and which are out. The only place that
                 knows how long it is; BOOK_MAX and the validator both derive
data/todo.json   the research backlog, rendered as a view in the console
data/systems.json star systems with real astrometry, and the places in them
data/skyfield.json the naked-eye sky for the chart backdrop (HYG, CC BY-SA 4.0).
                 magnitude_limit is what was extracted and never moves;
                 display_limit is what the build ships — see the chart notes
data/bestiary.json non-sapient fauna; data/bestiary.schema.json documents it
data/peoples.json  sapient species and their polities; peoples.schema.json too
data/vessels.json  craft — design gens, hulls, classes; vessels.schema.json too
data/guppy.json   Guppy's pixel portrait — palette plus one grid per frame
assets/<register>/ <id>.svg illustrations, inlined into the page by the build
data/blog.json   dated posts in two voices; blog.schema.json documents them
data/memorium.json entries with no record to sit on — the three blank rows
templates/genealogy.html   the console — register, genealogy, unresolved,
                 in memorium, chart, systems, vessels, bestiary, peoples,
                 timeline, blog, to-do
data/vessels.json  hulls and design generations; holotank plates hang here
books/MANIFEST.sha256  hashes + chapter counts of your ebooks; the one thing in
                 books/ that IS committed, because it's facts about the files
src/parse_ebook.py  MOBI + EPUB -> chapters, refuses DRM
src/corpus.py       build/load the cached corpus
src/verify_books.py check books/ against the manifest
src/extract.py      surface candidate passages for review (never auto-writes)
src/validate.py     schema, referential integrity, tier rules
src/build.py        bobs.json + template -> dist/index.html
tests/              suites run against the shipped dist/index.html
tests/__snapshots__/  golden master, committed
```

**`build.py`'s `ORDER` list is a whitelist.** A field missing from it never
reaches the page, however well documented it is elsewhere. That bit twice —
`alias` and `priorClaim` were both added to the schema and used by the console
while the build quietly dropped them, so the HAS LEAD chip filtered to nothing
and Will's "/ Riker" never rendered. `_check_order()` now fails the build if the
schema and `ORDER` disagree in either direction.

## Workflow

```
make corpus      # once, after adding ebooks
make validate    # before every commit
make build       # writes dist/index.html
make test        # build, then every suite against the shipped page
make workbench   # the built page at four phone sizes, on :8000
make scan-history  # every version of every publishable file, and every commit
                   # message, checked for book text — run before going public
python src/extract.py --name Thor       # research one Bob
python src/extract.py --unresolved      # work the tier C and P backlog
```

**`make validate` runs before every commit and `make test` before every push.**
Four of the validator's checks — citation re-verification, mention counts, the
appendix pool and the no-passages scan — skip rather than fail when `.cache/` is
absent, because CI has no books. They are exactly the checks that need the
corpus, so the machine that has it is the one that has to run them.

`extract.py` prints passages with citations; it never edits `data/bobs.json`.
Reading the passage and deciding what it establishes is the human's job.

## Adding a register

The console is driven by a `REGISTERS` list. Each entry is one view, and the
tab bar, the dispatch in `render()`, the dossier pane and the resize handler all
read it — so a new register is **one entry plus one render function**, with no
console surgery:

```js
{id:'bestiary', label:'BESTIARY', render: renderBestiary}
```

`id`, `label` and `render` are required. Optional hooks, which exist because the
chart needed them and the next drawing register will too:

| hook | when |
|---|---|
| `rows()` | what feeds `render()` and the status line. Defaults to `visible()` — the filtered, sorted replicant list. A register over different data supplies its own. |
| `paint()` | after the stage is in the DOM, for anything that measures or draws to a canvas |
| `onResize()` | window resized while this view is up |
| `dossier()` | claim the right-hand pane. Return `null` to fall through to the replicant dossier — the chart does this when no system is selected. |
| `status(rows)` | the footer line. Defaults to the replicant tally. |

Registers are looked up on demand rather than through a cached map, so one
appended at runtime resolves like any other.

**Do not reintroduce `state.view === '...'` anywhere.** That's the pattern this
replaced: five views' worth of special cases scattered across the dispatch, the
dossier, the resize handler and the tab markup. `tests/registers.test.js` adds a
synthetic register at runtime and asserts every hook fires, so a new special
case that bypasses the list will fail it.

### Notes can have paragraphs

A blank line in a note, `fateNote`, `conflict`, `partialNote` or a companion
register's note becomes a paragraph break in the dossier; a single newline is
still just a space, as HTML would have it. Most notes are one paragraph and
should stay that way. Homer's is why the helper exists — his fate runs across
three books and set as one block it read as a wall of text.

Watch the faction/descent line while you're in there. Homer was tagged
`faction: Starfleet` for most of this project's life, and the schema says that
field is affiliation and not lineage. He died in 2176; Starfleet grew out of a
stolen backup more than a century later. He was the only Bob in the register
carrying a faction he could not possibly have joined, and the STARFLEET chip
listed him. Descent belongs in prose.

## Filters, and what belongs on the bar

`bar: false` on a `FILTERS` entry keeps it working as an address and takes its
chip off the toolbar. The two had been one decision and they are not the same
thing.

The row was thirteen chips and **eight of them did not filter**. Against 89
records: CITED keeps 83, which is a control that does nothing, and the status
line already prints the number. EXPUNGED isolates two, PARTIAL and BORG one
each — a one-record toggle is a link to that record wearing a chip's clothes.
IN MEMORIUM is a whole register with its own tab. And the four faction chips
stopped being the only route to that idea the day factions got first-class
entries in the peoples register, each listing its joiners as links: eleven
records across four chips, against one entry that gives you the names and the
history behind them.

Five are left, and they are one idea — how well the tree is sourced and how sure
the fate is: **TEXT · NO SOURCE · HAS LEAD · PRESUMED · DISPUTED**. DISPUTED
earns six records because those six are where the sources disagree, three of
them being where this register was wrong about itself.

**Nothing was deleted.** `#unresolved?f=c,lead` is a documented address and the
rule here is that a link somebody already has keeps working, so every id still
filters. A hidden filter that arrives active gets its chip back, or there is no
way to switch it off. `tests/core.test.js` holds both ends: no chip on the bar
may keep more than 80% of the records, and every off-bar filter must still work
and must reappear when active.

The test for the first of those is the one worth keeping. A chip creeps back on
by looking reasonable one at a time, which is how thirteen happened.

## Addresses

Every view is linkable: `#<view>/<selection>?q=<search>&f=<filters>`. Hash, not
query string, so the page still works from `file://` — it is meant to open by
double-clicking, and publishing must not break that.

Each register keeps its selection somewhere different — `state.selected`,
`CHART.sel`, `state.beast`, `state.people` — and `SEL` in the template is the
only place that knows which. **A new register declares itself there and nowhere
else**, and `tests/url.test.js` walks `REGISTERS` and fails until it has. A
register nobody can link to is a register nobody can share.

Anything in a hash that doesn't resolve is dropped rather than obeyed: an
unknown view is refused outright, an unknown record lands you on the right
register with nothing selected. Links outlive the records they point at.

`history.pushState` on a new view or record, `replaceState` otherwise — pushing
an entry per keystroke turns the back button into a way to retype your search
backwards. On `file://` Chrome refuses the History API entirely, so it falls
back to setting the hash.

## Guppy

He has been the voice of this console from the start — every bracketed line is
his, and the registry identifies Bobs by serial number because that is how he
does it. `data/guppy.json` gives him a face: a 20x20 pixel grid per frame, plus
a palette.

**The likeness is deliberately ours.** The books describe him as looking like
Admiral Ackbar, which is a Star Wars character we can't reproduce, so the
portrait is built from what that description implies rather than from the
reference. Don't "improve" it toward the source image.

**The eyes must break the silhouette.** They sit on bulges mounted at the sides
of the skull and protrude past its outline. This is the one feature doing the
work: the first attempt sank them into a rounded skull as dark sockets and came
out looking like a grey alien. The other load-bearing choices are a tall smooth
cranium, a broad jowly lower face with no chin taper, and a wide downturned
mouth with folds beneath it. Lose any of those and it drifts back to generic.

Palette values are **fill-opacity against `currentColor`**, not colours. That is
what lets one portrait be phosphor green on the boot screen and ash in the
dossier without a second copy; `pixelSvg()` merges horizontal runs into single
rects, so the 400-cell grid ships as about 80 shapes.

He blinks every few seconds and does nothing else. The text keeps returning to
his fishy poker face, so giving him more expression would be arguing with the
books. `guppyBlink()` sits out entirely under reduced motion.

A ragged grid renders as a mess rather than an error, so both `build.py` and
`tests/guppy.test.js` check that every row is the declared width, every frame
the declared height, and every character a palette key. The blink frame is
additionally checked not to move the silhouette — a shifting outline reads as a
flinch rather than a blink.

## The holotank

`data/holo.json` plus `assets/holo/<id>.webp` (copied to `dist/assets/holo/`
with relative URLs). Optional GLBs and the Three viewer live under
`dist/assets/` and load on demand. The console is a file manager and stays one;
a file you open is allowed to be rich.

**Why that is not a contradiction.** The phosphor shell is a presentation
choice, not a claim that the Bobiverse looks like a 1980s terminal. Bob starts
with crude VR, builds a library detailed enough to miss when he loses it, and
ends up inhabiting android bodies because Real hits harder than Virt. A
registry that could only ever draw stroke plates would be arguing with its own
source. The holotank is canon — 34 mentions, first at Bk1 ch21 — and is exactly
this: a thing you put an image in and look at.

So: **drab chrome, rich payload.** Tabs, brackets, Guppy, serials and the
bestiary's stroke plates stay as they are. The tank is where a capture lives.
The bestiary card keeps its specimen sketch *and* can carry a photographic
survey plate; those are two modes, not two competing truths.

**The one permanent rule is the citation.** No plate without one — not a
citation to the general idea, the chapter that describes the thing in the
picture. `validate.py` refuses a plate that has no cite, no note, no `kind`, a
`spoil` earlier than the book it is drawn from, an address that resolves to
nothing, or a missing file; and it warns about an image with no plate, which
would otherwise sit in the folder shipping nothing. A Bob whose parentage
nobody recorded does not get a beautiful room to make up for it.

**Three states, and they are three different sentences.**

| what the reader sees | what it means |
|---|---|
| `[ATTACHMENT: vr-bart]` | there is a file and you may open it |
| `▨ FILE WITHHELD — past book 2` | there is a file, cited later than you have read |
| `[NO FILE ON RECORD]` | there is nothing |

Collapsing the middle one into the last would be the register lying in the one
place it cannot afford to, and would also tell a reader on book one that
nothing is coming.

**Keyed by address, not by a field on a record.** `about: "register/bart"`, the
same shape as a blog post's, resolved through the same `ADDRESSABLE` map. Any
register gets attachments without every schema growing an art field, and
`bobs.json` stays a genealogy rather than a picture library.

`kind` is provenance rather than decoration, and the panel prints it: a VR
capture is somebody's room *as they configured it*, which is character
evidence; a vessel is an external view; a specimen is a survey image. The panel
also says the picture is **the registry's reconstruction from a cited
description**, never an illustration from the books — the same seam every
annotation here is signed across.

**Weight is the real cost and it was measured, not guessed.** 520px on the long
edge, WebP q72, about 40KB a plate once base64 has taken its third. Eleven
plates is 409KB, which took the page from 442KB to 881KB. That is roughly a
doubling for eleven pictures, so the set gets chosen rather than dumped in.
Encoding happens offline and the optimised file is committed, so the toolchain
stays stdlib-only — `build.py` only base64s what it finds.

**Two things caught me writing the first eleven.** The 12-gram guard rejected
the Saturn and log-cabin notes because I had transcribed the descriptions
almost exactly; they are paraphrased now, which is the rule working on the
person who wrote it down. And a plate held by the reading position originally
rendered as "no file on record", which is the collapse described above — found
by asking what the row says at book one rather than by reading the code.

## Sandbox Bob

`data/sandbox.json`, six frames on the same machinery as Guppy, and the second
character the console has. Bk1 ch13: Bob needs the kill order out of his own
code, so he runs an isolated copy and feeds it the recorded transmissions,
because something disposable should take the hit. What appears on the table is
an actual sandbox with a miniature Bob in a miniature chair, and Bob's own
comment on that is that he is not very mature. Bad payload: the copy twirls in
his chair, leaps up, grabs his throat, falls over, pixilates out. Clean: he hams
it up, stands, dances a jig, bows extravagantly and goes in a puff of smoke.
Riker keeps the habit — Bk1 ch49, Bk1 ch58, Bk2 ch18 — and in Bk2 ch28 it is how
they catch VEHEMENT-infected Homer.

**The console's untrusted transmission is an address it did not write itself.**
The one on the way in at load, or one somebody pasted, edited or reached with
the back button. Every link clicked inside the console is the console's own
writing, and the hashchange listener already tells the two apart — it has to,
or he fires on every click and becomes a mascot.

Three rules, and they are the whole design:

- **He never speaks.** Guppy talks in brackets; Sandbox Bob mimes. That is what
  keeps him from being a second Guppy, and the line beside him is Guppy's —
  including the take number, which is Guppy's line in the book too: Bob cannot
  finish the number and the fish finishes it for him. `tests/sandbox.test.js`
  fails the build if a `<text>` element ever appears in his sprite.
- **He is not the reading position.** He reacts to what an address claimed and
  could not deliver: an unknown register, a selection that resolves to nothing,
  a filter that does not exist. A record held back because you are on book two
  is the console protecting you, not an attack, and it has its own vocabulary
  already. There is a test for this, because it is the rule most likely to get
  helpfully broken.
- **He is rare by construction.** No address, no sandbox. The report survives
  exactly one render — the one that follows its own arrival — and then anything
  the reader does next clears it.

**And he has no record in `data/bobs.json`, deliberately.** He is the same
matrix, running, doing bits, and Guppy had counted twenty-four of him before the
scene we meet him in. The register does not hold him because *the books never
treat him as one*, and this register says what the books establish rather than
handing out personhood on its own authority — the same restraint as
`sapience: "contested"`. What that restraint costs is the subject of the blog
post that ships with him, and it is worth reading before anyone kindly adds him
to the tree. A test asserts he is not there.

`pixelSvg()` takes the sprite as its first argument for this reason; it used to
close over `GUPPY`.

## Testing

```
make test        # build, then run every suite
make snapshots   # re-record the golden master, on purpose only
node tests/run.js chart          # one suite
```

The suites run the console's **shipped** script — extracted from `dist/index.html`,
not from the template — inside a VM context with a stub DOM, so the app's
top-level `const` declarations are in scope and what gets tested is what gets
served. (`eval()` can't do this: lexical declarations inside a direct eval stay
scoped to the eval.)

| suite | covers |
|---|---|
| `core` | data integrity, ancestry traces, every view × filter × search, dossiers, sorting |
| `chart` | projection invariants, the fiction's own distances, astrophysics, label coverage and attribution |
| `legibility` | label decluttering, ring labels, spectral colour survival, WCAG contrast |
| `backdrop` | the HYG starfield, the display cut's own justification, unit-vector invariants, NaN sweeps |
| `snapshot` | golden master — exact HTML of 139 states |
| `spoilers` | what the reading position withholds — and a sweep of every register at every position for what leaks |
| `timeline` | the derived chronology: order, sourcing, and where it stops |
| `blog` | the feed, and keeping Bill's voice apart from the registry's |
| `registers` | the REGISTERS contract, with a synthetic register added at runtime |
| `url` | every view addressable, and stale links degrading rather than throwing |
| `mobile` | the rules that only fire under a media query, run at 390px |
| `shell` | doctype, theme colour, safe areas — the parts that are no register's |
| `boot` | the SCUT connect: derived figures, and the order of the handshake |
| `memorium` | the list, the blanks, and Taylor's spelling |
| `peoples`, `bestiary` | the people/fauna boundary, both directions |
| `guppy` | the pixel portrait — ragged grids, and a blink that must not move the silhouette |
| `books` | how long the series is, derived rather than declared — written for a day that has not happened yet |
| `systems` | the map: every place present, ordered by distance, and how firmly each is tied to a record |
| `focus` | where focus is and where it goes next — the tablist's promises, and getting your place back |

**The suites fail closed.** Deriving expectations from the data is right, and
it has one blind spot: a case that computes an expected count of zero and
observes zero passes without proving anything. A loop over an empty list runs
no assertions and reports success in exactly the same tone as a loop over
eighty-seven. Two layers stop that:

- `each(label, items, fn)` and `need(label, value)` in the harness. A
  collection has to have something in it before it is worth iterating, and a
  lookup that finds nothing fails instead of skipping. Both return what they
  were given, so they drop into existing code without restructuring it. Prefer
  them to a bare `for` or `if (found) {`.
- **A check floor per suite**, in `tests/__snapshots__/checks.json`, recorded
  like the golden master. `each` only guards the sites that use it; the floor
  catches the class. A suite that runs materially fewer assertions than when
  the count was last recorded on purpose fails. It is a floor and not an
  equality because counts grow with the data — growth is silent, only a drop is
  a failure, and 2% of slack absorbs a record being retired.

The audit that added this found `legibility` asserting almost nothing. Its
contrast check read `varOf('bg') || varOf('ink')` and neither variable has ever
existed — the background is `--void` — so it hit `continue` on every pass and
the check the suite is named for had never run. Its spectral-colour check
matched `class="star-body"`, which the chart has never emitted. The suite went
from 8 checks to 147 and immediately found two real failures: `.statusbar .keys`
and `.star.future .star-label` were both painting text in `--rule` at 2.41:1,
well below AA. Both are now `--ash`.

That check is now written the other way round — it walks every CSS rule that
paints text and measures whatever colour it finds, against that rule's own
background or the one it inherits. A fixed list of variables only ever covers
the ones somebody thought of.

**Assertions derive their expectations from `data/*.json` rather than hardcoding
counts.** The old scratch harness asserted "86 records" for a whole session after
the 87th landed; a test that must be hand-updated is a test that will be wrong.
Literals stay only where the literal *is* the point — the tier letters, Sol's
absolute magnitude of 4.83, Bill's stated distances.

### Sheets, focus and the cost of a drag

Four things the console did badly for anyone not using a mouse, fixed together
because they share a cause: each was a desktop behaviour that had never been
asked what it does at the other end.

**The tree scrolls now.** `.tree` is `white-space:pre` and had no width of its
own, so a deep branch ran past the right edge and the scroll container above
never learned there was anything to scroll to — as far as it could tell the
child was exactly as wide as it was. `width:max-content` is the whole fix, with
`min-width:100%` to keep the row highlight full-width on a shallow tree. It
matters most here of anywhere: the horizontal axis *is* the descent, so a
cut-off branch is a cut-off fact.

**The sheet behaves like a sheet.** It was a panel wearing a sheet's position —
fixed over a document that kept scrolling underneath it, no scrim, and the only
way out a 24px target. Those are one omission, not three: it looked modal and
wasn't. There is now a scrim that only exists at sheet widths, a scroll lock,
and a 40px close. All three are set in `syncSheet()` rather than at the click,
because the sheet can open and close without one — a hash arriving with a
selection, a resize across the breakpoint, a reading position dropping the
record that was open. One function decides whether the sheet is up, so one
function dresses it.

Its height and the chart stage's were `64dvh` and `58dvh`, chosen separately.
`--sheet` is that decision made once.

**Focus goes somewhere in particular.** The tab bar carried `role="tablist"` and
did not implement one, which is worse than not claiming it — a screen reader
tells the reader arrow keys will move between tabs and nothing happened. It now
has `aria-controls`, a roving tabindex (a tablist is *one* tab stop, not ten)
and the four keys. Closing a dossier returns focus to the row that opened it;
`render()` rewrites the stage, so what is remembered is the **selector, not the
node** — the element is gone by the time anyone closes it. An opening sheet
takes focus, and only on the transition, or it would fight anybody typing in
the search box with a record still open. A desktop dossier is a column that is
always there and never takes focus at all: moving it would be a theft.

**A drag costs less.** Measured before touching it, which the backlog note asked
for and was right to: the sky was **5.27ms of per-frame work** on a desktop, and
a phone is several times slower than that. The note's premise was wrong in one
detail — the backdrop is already on a canvas, not in the SVG — but
the cost was real and in three places. A star's colour, brightness and size are
properties of the star; rotating cannot change any of them, so computing them
per frame was 2,668 `ciColour()` calls and 2,668 template strings a frame to
arrive at the same values. `styleSky()` does it once. Assigning `canvas.width`
reallocates the backing store even when the value is unchanged, so that is now
conditional. And the gesture paths coalesce through `paintChartSoon()`, because
pointer events do not arrive at the refresh rate — a phone reports at 120Hz.

5.27ms became 3.18ms with the allocations and the reallocation gone on top.
`paintChart()` itself stays synchronous: `render()`, the resize hook and the
tests all want the chart drawn by the time they return. Only the continuous
gestures — drag, wheel, scrubber — go through the queue.

### The golden master

`tests/__snapshots__/views.json` holds the exact HTML for 139 states — every view,
filter, search, sort direction, a sample of dossiers, and the chart at pinned
cameras. It exists so a refactor can be checked by diff instead of by eye, which
is what makes restructuring safe to do aggressively.

It captures **every pane `render()` writes to**, not just `#stage`. That was a
real gap: the first version watched only the stage, and a changed filter-chip
label sailed straight through a passing run. A blind spot in the safety net is
worse than no safety net.

When output changes on purpose: read the reported diff, run `make snapshots`,
and commit the snapshot **with** the change that caused it. A snapshot updated in
its own commit tells you nothing. If a run is ever flaky, the flake is the bug —
nothing captured may vary between runs.

## Back matter

Books 2 and 4 print appendices; books 1, 3 and 5 do not. Book 4's are a reprint
of book 2's, identical line for line except that GUPPI joins the acronyms —
which is a useful accident, because the two editions use completely different
markup and agreeing exactly is a strong check that both parsed correctly.

Until now the parser walked past all of it. A chapter is recognised by its POV
and date; back matter has neither, so every detector rejected it and **every
automated sweep this project has ever run was blind to it.** That left the Cast
of Characters cited by ten records but unsearchable, and hid a Genealogy printed
in the novel itself.

Appendices are parsed as corpus entries with `kind: "appendix"`, no POV and no
date, numbered *after* the narrative so a citation can never collide with a
chapter number.

**Mention counts exclude them, deliberately.** `_chapters()` filters back matter
out by default, because the bestiary and peoples registers sort on how much of
the books an entry occupies, and an alphabetical Cast of Characters names
everyone exactly once whether they carry the series or appear in one scene.
Folding it in would add 18 to the Deltans and 1 to a creature nobody mentions
twice — it flattens the ordering into noise. The appendices are still corpus,
still searchable, still citable. They are just not evidence of presence. `books/MANIFEST.sha256` counts chapters and appendices
separately: citations index narrative chapters, so that number stays a tripwire,
while the appendix count is information.

Two shapes needed care. The **Genealogy** is a tree encoded purely as left
margins — `margin: 0 0 0 90pt` in book 2, `margin-left: 17%` in book 4 — so
depth comes from ranking the distinct values rather than reading them, and is
re-emitted as two spaces per level. It greps like text and parses like a tree.
The **Cast** is a two-column table in both, and is paired by table row. Two
cleverer rules failed first and are worth not repeating: pairing cells by
alternation breaks on any stray row, and filtering to the modal class threw
away every second description, because book 2 sets the list in two alternating
styles. Filtering to classes used more than once then lost Archimedes and
Victor, the first and last entries, which carry their own edge styling — and
those are precisely the two places nobody checks.

## Chapter parsing

Every chapter opens with an optional title, the POV Bob, an in-world date, and
usually a location. The date is the only field identifiable by shape, so it's
the anchor: find the date paragraph, the POV is the paragraph before it. Book 5
uses word numerals ("Chapter One"), which is why the parser doesn't rely on
chapter numbering.

Editions differ in where they put that header, so there are three detectors,
tried in order: header-as-paragraph (books 2–5), header-as-list-item (the 2016
EPUB of book 1), and a flat regex over untagged text (the MOBI of book 1, which
has no paragraph tags at all). A book that parses to zero chapters usually means
a fourth shape, not a bad file.

Because the anchor is the date, anything that doesn't look like a date silently
costs a whole chapter — and every chapter after it in that book shifts, which
quietly corrupts citations. Five such cases have been found and fixed; the corpus
went from 345 chapters to 351:

| what | where | effect |
|---|---|---|
| "Bob Version 1.0" — no dash before the version | Bk1 ch1–2 | book 1 was 2 out of step |
| "Sept 2172" — abbreviated month | Bk2 ch18 | book 2 was 1 out |
| "September, 2182" — month, comma, year, no day | Bk2 ch47, ch54 | book 2 was 3 out by the end |
| "Same Day" — a relative date, not a date | Bk4 ch30 | book 4 was 1 out |
| header in an `<li>`, not a `<p>` | Bk1, 2016 EPUB | whole book parsed to nothing |

**The regression test is the books' own chapter numbers.** Books 2 and 4 print
them in the chapter titles, and book 1's EPUB carries them as `<li value="n">`,
so `seq` should equal the printed number with no gaps — the parser says so on
stderr when it doesn't. Books 1, 2, 3 and 5 match exactly. Book 4 legitimately
restarts numbering at part 2, so our `seq` is a global index there and won't
match — that is the one expected divergence.

`make validate` re-checks every citation against the corpus whenever `.cache/`
exists, so a chapter number that drifts gets caught rather than believed.

### The cache is not disposable

`.cache/corpus.json` is derived from `books/`, but it is not cheap to regenerate:
when the ebooks went missing it was the only surviving copy of the parsed text,
and every citation in `data/bobs.json` is numbered against it. So `make corpus`
**refuses to overwrite the cache with a worse parse** — if any book comes back
with fewer chapters than the cache already has, it prints what it would have lost
and exits non-zero, changing nothing. Empty `books/` is likewise refused rather
than treated as an empty corpus. `--force` overrides, and should be reached for
only when the new parse really is the better one.

Do not restore `books/` or `.cache/` from `git archive` or any other rewind:
they're gitignored, so a rewind deletes them and brings nothing back. For the
same reason **`git clean -xdf` deletes every ebook and the cache in one stroke** —
it is not a safe tidy-up command in this repo.

Nothing in here protects the ebooks. They're gitignored, they sit on the same
disk as everything else, and git has never seen them. The real protection is a
backup somewhere else; that is the user's, and it is not optional.

### Verifying a restored copy

`books/MANIFEST.sha256` is committed — hashes and chapter counts, no text. It
can't protect the books, but it answers the question git can't: is the copy in
`books/` the same copy the citations were built against?

```
make verify-books                        # hashes, then what they parse to
sha256sum -c books/MANIFEST.sha256       # hashes only, no tooling
python3 src/verify_books.py --update     # after a deliberate edition change
```

Both levels matter, and they fail differently. A hash mismatch means a different
file. Matching chapter and word counts mean the *numbering* survived — which is
the thing citations actually depend on, and the thing a substituted edition
breaks silently. Book 1 has already been swapped from MOBI to the 2016 EPUB
once; it was luck that we noticed, and the manifest is so that next time it
isn't luck.

## Systems

`data/systems.json` holds the star systems, and they are real ones. Taylor built
the Bobiverse on the actual sky: **the HIC numbers in the Bobs' designations are
Hipparcos Catalogue numbers.** HIP 16537 really is Epsilon Eridani, which is why
Bob can read his own origin off his serial in Bk1 ch15. Verified against SIMBAD
for Delta Eridani, Alpha Centauri, Eta Cassiopeiae and Epsilon Eridani.

Astrometry comes from SIMBAD (ICRS J2000). **Distance and xyz are computed from
parallax, never transcribed** — one source summary called Alpha Centauri's 742
mas "1.35 light-years" when it is 1.35 parsecs, and that is exactly the kind of
error that produces a convincing wrong map.

The books check our arithmetic. In Bk3 ch21 Bill lists distances from 82 Eridani
— Epsilon Eridani at "twelve point five", Tau Ceti and Vulcan at "about twelve".
Our coordinates give 12.42, 11.87 and 12.00. Taylor computed real 3D separations,
so `make validate` re-runs that comparison and warns if it drifts.

`origin`, `lostAt` and `visited` on a Bob are **ids into this file**, and the
validator rejects one that doesn't resolve. Scope is books 1–4: the book 5
wormhole network is a topology, not a distance graph, and needs its own model.

### A chapter header names the scene, not the narrator

The `origin`/`visited` sweep started from the obvious rule — a Bob who narrates
a chapter set at a star was at that star — and the rule is wrong. Bill narrates
chapters headed Gliese 54, 82 Eridani, Delta Pavonis, Gamma Pavonis and Sol,
and in each one the prose says where he actually is: controlling drones *from
here in Epsilon Eridani*, visiting Claude's VR, hosting the meeting in the moot
VR, popping into Mack's VR. Applied mechanically, the rule would have put five
systems on the record of the one Bob who famously never leaves home.

So **`visited` means the Bob's matrix was there.** A moot, a video call, a VR
visit or a manny driven over SCUT is not presence — the same rule that stops a
moot from placing every Bob at Epsilon Eridani. Where the books show a manny and
never say where the matrix is, the record says nothing; Riker knocking on a door
on Romulus is left alone for exactly that reason.

`scenes` and `povs` in `systems.json` are the other half of the pair and are
*header*-derived on purpose: they index where the story happens and who tells
it. The dossier used to label that "NARRATED FROM HERE", which is a claim about
presence the data cannot support, so it now says what it is. Chapters headed en
route to somewhere count for nowhere.

Two errors fell out of checking the derivation rather than the values: Linus's
Epsilon Indi chapter was filed under Epsilon Eridani, and two of Icarus's
book-5 chapters were counted at Alpha Centauri because a wormhole destination is
called Centaurvania. Neither would have been caught by reading the file.

### The chart draws only what it can tell apart

Two judgement calls sat in the backlog for a week marked "one-line changes",
both phrased as questions about taste. Neither turned out to be about taste.

**The backdrop.** The question was whether magnitude 6 is too busy. The answer
is in `styleSky()`: a star's alpha is `(7.0 - m) / 5.2` clamped at **0.30**, so
everything fainter than magnitude **5.44** comes out at the same alpha and the
same 1.1px square. The 2,065 stars past that point were not carrying magnitude
any more — they were uniform speckle over the systems the chart exists to show,
and 37KB of it. `data/skyfield.json` now holds both numbers: `magnitude_limit`
6.0 is the record of what was taken from HYG and does not move, `display_limit`
5.5 is what the build ships. The page reads its own limit from the data rather
than stating a magnitude in prose, and `backdrop.test.js` asserts that a star at
the extract limit would render identically to one at the cut — **so the cut's
justification is falsifiable.** Retune the ramp and the test fails, which is
correct: the argument for throwing those stars away would no longer hold.

The general form: **a limit on what you keep is a claim about what you can tell
apart.** Write down the claim, not just the number.

**The glow.** It had been cut from 4.2x/85% to 2.6x/40% in one step, which mixed
two knobs that do different jobs. Radius decides whether neighbours merge — that
was the blob problem, and it stays at 2.6x. Opacity decides nothing about the
core, because **the core is drawn opaque on top of the glow**: everything inside
offset 1/2.6 = 38.5% is behind it and never seen. So the first two stops were
nearly decorative, and out where the gradient is actually visible it reached the
star's own edge at 0.11 alpha — **dimmer than the faintest star in the backdrop,
which sits at the 0.30 floor.** A system the chart exists to show had a halo
fainter than the speckle behind it. The stops move to where they can be seen.

### A missing label is honest; a misplaced one is not

Names were dropping off the chart because the placer offered each one four
positions — right, left, above, below — and the inner cluster is dense in
exactly those four directions. Diagonals and two further rings raised coverage
from **73% to 86%** across 24 camera-and-viewport combinations (measured, not
eyeballed: a placement rule tuned to one screenshot is tuned to one screenshot).

But reach without a guard is worse than the problem. A name far enough from its
dot stops labelling it and starts labelling whatever it drifted next to, and
that is a chart stating something false — where a dropped name is merely absent
and the dot is still there to click. So distance is not capped by a number
picked for the look of it. A label may go as far out as it likes provided **it
stays nearer to its own dot than to anybody else's.**

Getting that rule right took three attempts, and the failures are the useful
part. Measuring from the box **centre** collapsed coverage to 76%: a 90px-wide
name reads as sitting 45px from the star it is bolted to, so the cluster handed
almost every label to whichever star stood at the far end of it. Measuring to
the **nearest point of the box** was no better — a long name in a tight cluster
always sweeps past somebody on its way out, which is unavoidable and perfectly
readable. What works is the **anchor**: the corner of the box nearest its own
star, the end the eye follows back. Same principle, three formulations, and only
one of them measures the thing a reader actually judges by.

## Fate

`fate` grades what became of a Bob, on its own evidence, entirely separately
from `src`. Keeping the two apart matters: Herschel is tier C and alive, Arthur
is tier T and dead, and neither fact tells you anything about the other.

**The books put the line at the backup, not the hull.** A Bob whose differential
completed is restored into a new vessel and carries on — so a destroyed ship is
not a death, and a register that treats it as one is simply wrong. Bill states
the rule when Milo's transfer is cut off mid-send (Bk1 ch51): a forced restore
from a partial would come back insane or non-viable, so the partial is archived
and marked In Memorium instead.

| fate | meaning | requirements |
|---|---|---|
| `active` | nothing on record | no `fateCite`, no `fateNote` |
| `restored` | vessel or body destroyed, the Bob recovered | `fateCite` |
| `presumed` | vessel destroyed, backup never accounted for | `fateCite` + `fateNote` saying what is left open |
| `memorium` | confirmed beyond recovery | `fateCite` + `fateNote` |

This replaced a three-value `status` of active/lost/unknown, which collapsed all
four into one and got two records flatly wrong. **Elmer** was filed as lost; his
ship was destroyed at 82 Eridani covering Khan's retreat, and four paragraphs
later Bill confirms his backup completed. **Bender** was filed as lost for a
hundred and sixty years of story time, which the books themselves are careful
not to do — Bob draws the distinction in Bk4 ch2, and the entire Heaven's River
expedition exists to get him back, which it does in Bk4 ch64. The validator now
errors if `status` reappears on any record.

`restored` is not a courtesy tier. It is what the list is measured against: with
four named Bobs recovered from destroyed vessels, the seven who weren't mean
something.

### The In Memorium list

Taylor's spelling, and it is **In Memorium** — not the standard *In Memoriam*.
All three references use it (Bk1 ch47, ch51, ch60). `validate.py` fails the
build if anyone corrects it, because someone will.

It is Bill's list and Guppy keeps it. Riker forwards an entry about Arthur *for
the archives*; Bill tells Guppy to archive Milo's partial and mark it; Bill adds
three more after 82 Eridani. The phrase does not appear after book 1.

`data/memorium.json` holds only what has no record to sit on — chiefly **three
entries that are known to exist, known to be exactly three, and can never be
filled in.** Bill counted three failed transfers among the six vessels lost at
82 Eridani and never said which. They render as dashed rows in their place in
the chronology, not as a footnote: the count is a fact and the list would look
complete without them. Elmer is the one name ruled out.

The nine at `presumed` are the other half of it. Their ships were destroyed and
nobody afterwards mentions the backups either way. They are not on the list.
They are not off it either, and the register says so rather than picking.

Two things the register cannot hold. The wars killed Bobs in numbers nobody
counted — Riker watches half a squad die in one pass (Bk3 ch63) — and none of
them are named, so a register of named Bobs is much smaller than the body count.
And `lostAt` takes system ids only: Bender was recovered from inside Heaven's
River, which is a megastructure, so his is empty.

## Reading position

A companion to an unfinished series is a hazard to the person reading it. The
register states on its front page that Homer dies, that Bender comes back, that
Starfleet cut their own ancestry out of the databases — alphabetically, above
the fold. `READ THROUGH BOOK N` withholds the rest, and the whole mechanism runs
off citations that provenance had already forced onto the data.

### How long the series is

`data/books.json`, and nothing else. `BOOK_MAX` is `RELEASED.length`, the
validator's bounds are `sum(released)`, and the prompt's sentence, its finished
button, its per-book choices and the `READ THROUGH` selector all count the same
list. Before this, the number 5 was written into the template, the validator and
four rendered sentences, which is exactly the shape that survives right up until
the day it matters.

It matters twice more: **book 6, *The Infinite Extent*, is out 10 Sept 2026, and
Taylor has said book 7 will be the last.** The entry for 6 is already in the
file with `released: false`, so the file records what is coming without offering
a reading position nobody can have reached.

`released` is a stored boolean and deliberately **not** a comparison against
today's date. The page is static and its golden master is exact, so a date
comparison would change the rendered output overnight and fail the snapshot with
nobody having touched anything. Release day is: flip the boolean, add the ebook,
`make corpus`, `make validate`, `make snapshots`, `make build`.

The validator will refuse the build until every corpus-bounded claim has been
re-checked — see below, and note that it is in the way on purpose. `make corpus`
also invalidates every mention count in the bestiary and peoples registers the
same afternoon, because those are re-derived. That is the check working.

**Three things gate separately, because they spoil at different rates.**

| what | gated by | absent means |
|---|---|---|
| the record exists | earliest book across `cite` and `fateCite` | held |
| its fate | `fateCite` | held |
| our prose | `spoil` | held |

The split is the point. Someone you meet in book one dies in book four: the
record stays and the fate goes. A record-level filter alone gets that wrong.

**Absence is held, never shown.** `spoil` is undeclared on most records, so
their prose is withheld from anyone reading with a limit set — a blank panel
rather than a spoiled ending. The validator reports the count so the gap stays
visible; it does not fail, because declaring 100-odd notes is a data pass rather
than a blocker. Same for the companion registers, whose schemas do not carry
`spoil` yet.

**At `ALL` nothing is held and the output is byte-identical** to before the
feature existed. That is what makes it a real default rather than a setting that
leaves residue, and the golden master is what proves it.

**Everything a record shows goes through `shown()`.** Gating field by field at
each render site is how the leaks got in: the dossier was careful about fate and
the table beside it printed RESTORED next to Bender at book one, which gives
away the plot of book four. One masking function now stands between the data and
every renderer, so a field added later is held by default rather than by
somebody remembering. Search and the filters read the masked record too —
otherwise IN MEMORIUM lists Bobs whose deaths the reader has not reached, and a
search for a withheld note confirms it exists by finding it.

**Factions are book 4** (`FACTION_BOOK`). Bill only starts calling Bobs joiners
once drift has gone far enough, and the corpus agrees: Starfleet, Skippies and
Gamers appear in books 4 and 5 only. The tags are masked, and the filter chips
are removed — a row of faction filters tells a book-one reader that the
Bobiverse eventually splits, and names the pieces, before anything is clicked.

**A name is a spoiler too.** `nameFrom` records the chapter a Bob took the name
we file him under, as a citation like any other, so `_check_cites` verifies it
against the corpus. Below that book the console uses `alias` and drops the
second name: at book one he is Riker in the register, the tree, the trace and in
Homer's SOURCE BOB column. It folds into `shown()`, which is how it reached all
of those at once. An `alias` with no `nameFrom` is now a validation error — that
combination is the bug.

**Prose written into the template leaks too**, and the mask cannot see it. The
unresolved lead named Herschel, Marcus and Starfleet; the In Memorium lead named
Mack and Jacques; the note explaining the three blanks rules Hannibal out by way
of a squad he commands two books later. Where a sentence's examples are the
argument, gate the examples individually rather than the paragraph — the
sentence shortens and stays true, and at ALL it reproduces what was written by
hand, byte for byte.

**A note can span books, so paragraphs carry their own marker.** `spoil` is the
record's default; `@bk5 ` at the head of a paragraph overrides it for that
paragraph alone. Homer's fate note is five paragraphs — four are the book he
dies in and the fifth is the coda two books later — and holding the block
because of the last one told a reader who had just finished book two nothing
about a death they had just read. A partly held section says how much is
missing rather than serving four of five in silence.

The marker travels with the text rather than sitting in a parallel array,
because a positional scheme misaligns silently the first time somebody edits a
paragraph. It is stripped at render and a test asserts it never reaches the
page.

**This is a courtesy, not a boundary.** The whole dataset ships in the page —
every held record, every withheld paragraph, markers and all — and the console
chooses what to draw. Anyone who opens the source can read all of it. That is
inherent to a single self-contained file with no backend, and the alternative
is a server this project does not want. Do not describe it to a reader as
anything stronger than what it is.

**Test the negative.** `tests/spoilers.test.js` does not check that things
render; it checks that things don't. The blunt one earns its keep: no pane, in
any view, at any position, may contain a `Bk<n>` above the setting. It found
four leaks the day it was written — the backlog's notes, the memorium bulk
entry, the unresolved cards rendering prose straight past the gate, and multi-
part citations printing later chapters (Homer's runs book one to book five, so
at book two it announced he was still being discussed two books after he died).

**`null <= 1` is true.** The first version of the gate read
`!(attestedAt(b) <= state.book)` and leaked every uncited record, because null
coerces to zero and "we have no idea when this appears" compared as "book zero,
safe for everyone". Absence has to be tested for, never compared — `past()`
exists for exactly this and the helpers all go through it.

**The prompt reads a snapshot, not the address bar.** `ARRIVED_ON_LINK` is
captured at load, because `render()` writes the console's own address into the
bar on the first frame — by the time the boot has finished typing, six seconds
later, `location.hash` says `#register` whether or not anybody was sent here.
Checking it then meant every visitor looked like they had followed a link, and
nobody was ever asked.

**The question is asked once, and only of people who need it.** The control on
its own defaulted to showing everything, which made it protection for readers
who already knew to look for it — everyone else was spoiled in the first second
and found the setting afterwards. So the boot hands off to one prompt: how far
have you read, finished or still reading, with the true record count beside each
book so a sparse register reads as the guard working rather than the project
being thin.

It is **unbracketed and signed** — REGISTRY EDITOR, NOT BOBNET. Square brackets
are machine speech and nothing inside the fiction knows the books are books, so
dressing this up as an in-world clearance check would have been the console
lying about what a control does. Same seam the dossier already labels.

Three arrivals are not asked. Anyone who has answered before, because the answer
is remembered and asking twice is a nuisance. Anyone arriving on a link, because
someone chose to send them somewhere specific — they get COPY SAFE LINK on the
sender's side instead, which carries `b=` so a reader mid-series can share a
record without spoiling whoever opens it. And anyone who skips, who gets exactly
what the console did before any of this existed.

Note that reduced motion removes the boot outright rather than hurrying it, so
the handoff is wired to that path too. A prompt that only existed inside an
animation would have missed everyone who asked not to be animated.

**The TO-DO stands aside entirely.** It is written from having finished the
series and cites the end of it constantly; there is no honest way to show part
of it, so with a position set it says so and waits.

### Where a reading is allowed to live

`note` is the only field on a record that may hold an interpretation, and the
dossier labels it — ANNOTATION, REGISTRY EDITOR, NOT BOBNET. Everything else on
the page is a claim about the books with a page behind it.

Will's record is the working example. What the books state: he changed his name
in Bk3 ch57, April 2257, mid-evacuation, saying only that he wanted to leave the
Star Trek thing behind him; and seventy-four years later he says he had needed
distance from the old Riker persona **for a lot of reasons**, then names one,
and it is the least of them. So the text says the reasons were plural and never
lists them — which is a stated gap, not a missing source, and gets recorded as
one.

What the register reads into that — Homer, the century of evacuation, a war
survived rather than won — is marked in the prose as this register's reading and
not the books'. Say which is which inside the note. A reader who wants the
citations should never have to guess where they stopped.

### Absence is a research state, not a fact

Say **"no source found"**, never "no source exists". The distinction cost this
project eighteen records: `priorClaim` boilerplate read "The books don't say
so" on parentages that book 2's appendix states outright, and nobody could have
noticed while the appendix sat outside the corpus. FAITH's note said the books
never expand the acronym; the List of Terms does. The old `status` field said
Elmer and Bender were lost; both came back.

Recording what the books leave open is the point of this registry, so most
absence claims here are correct and stay — the pigoid really never learns. What
is not allowed is asserting absence *as a property of the books* when what was
actually established is that a search came back empty.

**A description is a passage, not a sentence.** The Others were nearly recorded
as having no physical description in the books at all. Five corpus sweeps came
back empty and the register briefly carried that as a finding. It was wrong:
Bk2 ch57 has Bill putting composite scan images in front of the moot and talking
the room through the anatomy for a page and a half, which makes it the most
detailed description of any species in the series.

Every sweep missed it the same way. They all looked for the plural name beside
anatomy words **within one sentence**, and the passage says "the Other", "the
creature", "the thing", with the anatomy spread across a page of dialogue. The
method could not have found it however many times it ran — and running it five
times read as corroboration rather than as one mistake repeated. **Failures of a
single method do not accumulate into evidence.** When a sweep comes back empty,
vary the shape of the search before believing it: the singular, the pronoun, the
generic noun, the chapter titles, the scene where somebody would plausibly be
looking at the thing.

The user found it from a page number in about a minute. That is worth
remembering next time a null result feels solid.

**A sweep for who speaks misses whoever is gestured at.** The moot scenes were
swept once and produced Tony, who has a dialogue tag on his line. A second pass
over the same chapters produced Wally and Ben, who do not: Wally is *interrupted
by* and *steps forward*, Ben is *nodded at*. Three Bobs in a crowd, one pattern
family, and it caught a third of them.

So the second pass ran four searches chosen to be unlike each other rather than
four spellings of one idea — every capitalised token diffed against the
register, every name in a speech tag, every name in a vocative, every name in a
list of three or more. The address pass is the one that earned its keep, because
it is the only one that can see a Bob nobody quotes. When varying a search, vary
what it keys on, not its wording.

It caught the lesson out immediately, too. The chapter set for the second pass
was built with `\bmoot\b`, which does not match *moots* — six chapters were
outside the set on the first run, one of them named for a moot in its own title.
They held no Bobs, so nothing was lost, but nothing about the method said so.
Vary the shape of the search **and** check that the search found the corpus you
think it did.

Two things made the output readable enough to check by hand. A proper name is a
token that essentially never appears lower-case anywhere in the 357 chapters —
cheaper and far better than any stopword list, and it does not need maintaining.
And the register has to be loaded with its aliases, or the sweep reports Riker
as an undiscovered Bob.

**Write down what the negatives resolved to.** The pass is recorded with every
unfamiliar name at a moot and what it turned out to be — Henry Roberts is
another probe's replicant and says outright that he does not clone himself,
Bridget and Hannah Turnbull and Steven Gilligan are human guests, Hersch and
Icky are Herschel and Icarus, Jock is what the Pav call Jacques, Pacino is Al.
"Swept and found nothing" is not a record of anything and cannot be audited or
resumed; a list of resolved names can be, and it is the only thing that makes
the word *exhausted* mean more than *tired*.

The stated reason for re-running it was wrong, by the way. The backlog said the
corpus had grown by six chapters — true, but they are the appendices of books 2
and 4, and an appendix contains no moot. Nothing about the evidence had changed.
**A sweep whose method you can improve is worth re-running against a corpus that
has not moved**, and the note that sends you back to it does not have to be
right about why.

And do not restate a derived number in prose. Five `fateNote`s said "six
vessels ... exactly half ... all six here" and were wrong on all three counts
within hours of being written, because Elmer's vessel was the seventh and
Hannibal was ruled out the same afternoon. The In Memorium arithmetic lives in
`memorium.json` and the register counts; `validate.py` rejects a pooled
candidate whose note restates it. Same rule as `gen`.

### A claim bounded by the corpus has to say so

Some sentences here are counts and some are findings, and they look identical.
"47 mentions across the five books" is arithmetic — it belongs to the data, and
it now renders from `BOOK_MAX` so it cannot drift. "Nobody in five books ever
goes back to it" is a **finding whose scope is the corpus that was searched**,
and it does not survive a new book by having its number incremented. If book 6
goes back to it, the sentence is simply wrong, and renumbering it to six would
launder a wrong claim into a bigger one — asserting that a book nobody has read
is also silent.

So the counts are rendered and the findings are registered by hand, in
`CORPUS_CLAIMS` in `validate.py`: file, a substring that locates the sentence,
and the number of books it was established against. The build fails on every one
of them the day the series grows, with the sentence in hand. Re-read it, then
re-establish, re-bound or withdraw — and say which by updating the entry. A
reworded sentence that no longer matches its registered substring is also an
error, because that is how this check would otherwise stop guarding anything
without telling anyone.

**Do not try to detect these by pattern.** "His fate runs across three books" and
"nobody in five books ever goes back to it" are the same shape and opposite
things — the first is a span inside the story and stays true forever. Only the
person writing the sentence knows which was meant, so the person writing it
writes it down. There are five on the register today.

## Field policy

The books are the only source for biography too, not just lineage. `desig`
survives intact — all eleven values appear verbatim. `vessel`, `born` and `gen`
were swept: 3 vessels, 17 birth dates and 43 generation numbers came out,
because they came from the dropped sources or from nowhere identifiable.

`gen` is the one worth understanding. It's only independent information when the
parent chain is broken — where the chain reaches Bob-1 it's just tree depth, and
storing it twice invites drift. Reparenting Loki to Khan moved him a generation
down and left his stored `gen` stale, which is exactly that failure. So it's now
stored only where the books say it out loud *and* the tree can't derive it:
Herschel, Neil and Hector. The console counts the rest, and the validator errors
if a stored value disagrees with the tree.

## The TO-DO

Bob starts a TO-DO list in his first hour as a replicant and it never gets
shorter — he adds to it in Bk1 ch2, ch3, ch12 and ch21, and by ch13 Guppy reports
it back as "[2,386 items, divided into the following categories: ...]". Ours is
`data/todo.json`, rendered as a view in the console in that same format.

**Keep the backlog there, not here.** This file carried an Open Questions list
that drifted out of date twice in one sitting. One home only.

## Open questions

Moved to `data/todo.json`, so there's a single copy and the console can show it.
**Don't restate them here.** This paragraph used to list them, and it went stale
the moment the printed genealogy settled eighteen of the thirty dropped-source
leads — it was still saying thirty. A summary of a list is a second copy of the
list. Open the file, or the register that renders it.

## Sources already worked

Don't re-run these expecting new names; they're exhausted.

- **POV coverage** — all 25 distinct POV names in the corpus have records.
- **Moot scenes** — 62 chapters say moot or moots; the first pass counted 55 and
  a later one 56, both because the pattern missed the plural. Two sweeps: the
  first turned up Victor and Tony, the second Wally and Ben. Every other
  unfamiliar name at a moot is resolved to a non-Bob in the backlog entry, which
  is what makes this bullet checkable rather than a memory.
- **Name co-occurrence** — capitalised names appearing in lists alongside two or
  more known Bobs. Everything it surfaced was either added or ruled non-Bob.
- **Faction enumeration** — swept for the mutual-interest groups. Four exist:
  Starfleet, Skippies, Gamers, Borg. No fifth appears in the text.
- **Renames** — swept for Bobs who changed their name. Two: Riker to Will
  (Bk3 ch57) and Jeremy to Morlock (Bk4 ch3). Everything else the sweep caught
  was either an original naming or an idiom — "call me Shirley" is a joke.

- **The Cast of Characters appendix** — mined. 26 parentage claims, every one
  agreeing with what we had and none contradicting. It rescued ten records onto
  primary-text footing when the secondary sources were dropped, settled Verne as
  Bill's clone (the narrative only hinted), and turned up **Surly**, a Bob we
  didn't have at all. Books 2 and 4 both carry it, identical to the line, along
  with a Genealogy and a terms list; books 1, 3 and 5 have none. This bullet used
  to say the parser rejected it and that book 4 had no equivalent, and was wrong
  on both counts from the day the back matter got parsed — which is the cost of
  writing "already worked" beside a method instead of beside a result.

## The blog, and its two voices

`data/blog.json`, rendered as a peer register at `#blog/<id>`. Bill's blog is
canon — Bk4 ch5, "You still haven't read my blog yet, have you?" — and public
features and blogs are named as BobNet features in Bk2 ch32, so a dated feed is
a thing the character does rather than a device this project invented.

What is **not** canon is a Bob discussing the novels as novels. Building the
register made that immediate: of the three posts written for it, two were about
appendices, parse failures and provenance rules, and none of that is knowable
from inside the story. So a post declares a `voice`:

- **`bobnet`** — Bill, first person, in-world. May not mention the books, the
  appendices, or Taylor. `validate.py` fails a bobnet post containing any of
  those words, because that drift arrives one edit at a time and each edit
  reads fine on its own.
- **`editor`** — this registry's own voice, the one the dossier already labels
  ANNOTATION — REGISTRY EDITOR, NOT BOBNET. It may discuss sources, appendices
  and its own mistakes freely, and it is labelled in the list and in the post
  so a reader never has to work out which they are reading.

**Bill's posts are dated near what they are about; the registry's are dated
now.** He spans Sept 2145 to June 2345 across 69 POV chapters, so his feed can
run the whole two centuries — which makes the blog the one register that reads
as a sequence. The others are alphabetical or structural. It also gates by
itself: the feed grows as somebody reads, from two posts at book one to eight at
the end, instead of sitting at one date with most of it withheld.

The dates are anchored to real chapters rather than invented — Milo's partial is
Bk1 ch51, Jan 2174; the losses at 82 Eridani are Bk1 ch60, Apr 2185; the purge
is Bk4 ch32, Jul 2334; the second Hector is Bk5 ch51, Sep 2343. A post carries
no citation on its face, because Bill would not cite a chapter at anybody, but
the date has to be a date he could have written on.

`spoil` is required rather than optional here: a post is prose from the title
down, with no citation underneath to fall back on, so an undeclared one would be
held forever rather than defaulting to anything sensible.

**Taylor's own blog is not a source.** It is the same class as the 2017 online
genealogy this project dropped — the author talking outside the text — and
re-admitting it would undo the rule that found the appendix. Link to it, cite it
as a lead in `priorClaim` if it ever settles something, and never quote it: his
prose is his, exactly as the novels are.

## The timeline

`#timeline`, and it owns no data. Every event is derived from a date already
held elsewhere: build dates on records, fate citations, first contact on
systems, Bill's posts, the failed transfers at 82 Eridani. It is an axis over
what exists, the way In Memorium was — copy that shape before inventing a new
file.

`dateIn()` is the one parser both date shapes go through, because there were two
of them living in the memorium view and two drift. A month of 0 means only a
year was given, and sorts ahead of anything dated inside that year rather than
claiming a precision it hasn't got.

Three rules worth keeping:

- **The original is woken, not built.** Bk1 ch2 — Landers gives him the date,
  a hundred and seventeen years after he died. The verb is conditional on
  having a parent.
- **The registry's own posts are not events in the story.** They are dated to
  now, so only `voice: bobnet` appears in the chronology.
- **A place is bounded by how far the records reach.** A system carries a
  first-contact year and no citation to gate it against, so a system a visible
  Bob merely passed through could date itself past the last thing the reader has
  read. Book two knew Gliese 877 in 2187 and was being told about somewhere in
  2247. The bound is the latest dated thing already on the page.

The visible span tracks the reading position — 2185, 2217, 2257, 2334, 2343 —
which is the property that makes it worth having at all.

## The system map

`#systems`, and like the timeline it owns no data: `origin`, `lostAt` and
`visited` on the records, `system` on a creature or a people, and the astrometry
already in `systems.json`. Copy that shape before writing a new file.

Three things it does that the chart cannot. It is a **list**, so the places can
be read instead of hunted for among overlapping dots. It answers a **search**,
which the chart ignores entirely. And it holds **Trantor and Jabberwocky**, the
two systems with no coordinates — a star map can only name them in a footnote,
because there is nowhere to draw a megastructure with no parallax.

**The tie mark is why it is worth having.** Filled for a place a record names,
half for one a chapter is merely set in, hollow for one in the file for its
astrometry alone. It moves with the reading position — eleven named by a record
at book one, twenty at the end. It made the thinness of `visited` visible
without anyone having to go looking for it, which is what put the sweep on the
backlog; nine of the twenty-two were hollow before it ran and two are now. Those
two are Tau Ceti and Kappa Ceti, which have no scenes and no narrator and are in
the file because the books name them as **distances rather than as
destinations**. That is the mark working, not a gap: a hollow mark is a
**research state, not a fact about the star**, and sometimes the research
finishes and the mark stays hollow.

The dossier is the chart's own, not a second copy — one system, one dossier,
however you arrived at it. And the timeline's rule for how late a place may date
itself now lives in `datedHorizon()`, read by both registers: a system carries a
first-contact year and no citation to gate it with, so it has to be held to the
latest dated thing already on the page. Two copies of a rule that fiddly drift
the first time either is edited.

## Links between registers

A link from one register into another is **just an address**. `<a href="#chart/82_eridani">`
inherits `applyHash` — which refuses an unknown view and drops a selection the
reading position holds back — plus the hashchange listener that renders it, plus
copy-link-address and middle-click into a new tab. There is no click handler to
keep in step, and a register becomes linkable the moment it declares itself in
`SEL`, which is the same place it declares itself to the URL.

`canLink(view, id)` is the gate and `linkTo()` the renderer. The distinction
that matters: in prose a held target falls back to plain text, but in a **list**
it vanishes, because in a list the name is the whole content and plain text
would leak exactly what the link was hiding. `linkList()` is the one to use for
rows of links.

The blog runs both directions off one declaration. A post's `about` is a list of
addresses; `ABOUT` inverts it at load, and `feedSection(view, id)` shows a record
which posts mention it. Two lists would disagree the first time somebody edited
one. `validate.py` resolves every address against the data file behind that
view, so a dead link is a build error rather than something that renders as
nothing.

Anchors had no styling at all until this went in — the two that existed were
driven by click handlers, and nobody had looked at them on a dark background,
where the browser default is bright blue and underlined.

## Companion registers

The same machinery — corpus, extractor, validator, console — carries every
register. Each needs its own data file, schema and view, and nothing else.

**Built:** the star chart (`systems.json`), the system map, the bestiary
(`bestiary.json`), peoples and polities (`peoples.json`), vessels
(`vessels.json`), persons (`persons.json`), wormhole **GATES**
(`gates.json` — topology, not Chart geometry), **GALAXY** context
(`galaxy.json` — impression + local bead + schematic mesh overlay, not a
survey), In Memorium (`memorium.json`, plus `fate` on each Bob), the blog
(`blog.json`), the timeline, and the holotank.
**Still open:** content second passes in `data/todo.json`
(6 open / 49 done as of 2026-08-23 EOD). Genealogy nulls closed for books 1–5;
bio pass partial (`7c1a2a3`). Remaining: opportunistic bio; Book 6 trio;
holotank craft.
Spatial rule: **local chart = geometry · gates = topology · galaxy = context**.
Do not draw wormhole chords on the Chart. Do not invent galactic xyz for
unlocated termini. See `ideas/wormholes-inventory.md` and Bill’s blog
`three-maps`.

**Persons (`data/persons.json`).** Named individuals who are **not** Heaven
Bobs (Original Bob’s clone tree). Species/polities stay in `peoples.json`;
lineage stays in `bobs.json`. Includes biological people, ex-humans, foreign
probe replicants, and AMIs (Charlie). Foreign probes on file: Henry Roberts
(Australian), Major Ernesto Medeiros (Brazilian multi-copy line), Captain
Matias Araújo (Brazilian Sol war-probe — Bk1 ch24, not Medeiros). Grow the
cast as weight justifies; portraits later on `persons/<id>`.

**GATES (`data/gates.json`).** Travel topology only. Layers: alien **found**
mesh + Bob **WormNet** / planned highways. Unlocated nodes are valid. Individual
alien gates are almost never named — file hubs, places, paths, and summaries,
not anonymous gate rows. `ferry_ly` / `span_ly` are logistics facts for
constructed/planned paths; layout paint must ignore them.

**GALAXY (`data/galaxy.json`).** Context frame, not a survey. Local bead sized
from Chart frontier (~48.8 ly) against ~100k ly disk; GATES overlay is
schematic. Spoiler-gate arms and mesh; the bead and disk stay visible early.

**Species vs substrate:** `label`/`species` = who they are; `substrate` =
biological | replicated | ami | foreign_probe. **`substrateFrom`** = earliest
book that may show the true substrate. Before that book, change-arcs display as
**biological** (Bridget replicates in Bk3 — critical spoiler). Entries met
already replicated (Gilligan, Turnbull) set `substrateFrom` to their cite book
so the whole card is held until then. `foreign_probe` requires `kind:
replicant` and textual evidence in the note.

**Persons bio discipline — non-negotiable (learned the hard way):**

1. **Open the cite chapter in the corpus before writing `role` or `note`.**
2. **Every factual claim must be supportable from that cite** (or `@bk`).
3. **Do not invent jobs** or AMI classifications (Archimedes is a Deltan;
   Butterworth is USE, not VEHEMENT).
4. **Spoiler-gate substrate changes** with `substrateFrom` + `@bk` prose — never
   put “she replicated” in an early ungated paragraph.
5. **`role` stays a short headline** (validator caps length).
6. Cite-chapter mention check is necessary, not sufficient — also no book-text
   lifts (12-word paraphrase rule).

**Three of those own no data file of their own** — In Memorium, the timeline and
the map — and that is the pattern to reach for first. Each is an axis over
records we already hold, plus at most a small file for the entries with nothing
to sit on. Before writing a new dataset, check whether the next register is a new
kind of thing or a column that already exists; it has been a column three times
running, and each of those cost one `REGISTERS` entry and one render function.

The map is also the clearest case of a register paying for itself immediately.
It was built to show what is at each place and it exposed, on the first render,
that seven of twenty-two systems have no record pointing at them — including
places a Bob narrated nine chapters from. A view over existing data can be a
research instrument, not just a presentation of one.

In Memorium is the one that isn't a new dataset — it is a view over `bobs.json`
plus a small file for the entries with no record to sit on. Worth copying when
the next register turns out to be an axis on something we already hold rather
than a new kind of thing.

The pattern that worked, for whatever comes next: survey the corpus first and
verify the candidate list before writing any of it down — both registers built
so far found that roughly half their inherited candidates were false positives.
Then one `REGISTERS` entry, one render function, one schema, one test suite.

**Planetary / system map.** Systems, who surveyed them, what was found, who
was lost there. `data/bobs.json` already carries `origin`, `visited` and
`lostAt`, so a first pass can be derived from the genealogy rather than
re-parsed. Sol, Epsilon Eridani, Delta Eridani, 82 Eridani, Omicron² Eridani,
Delta Pavonis, Gamma Pavonis, Eta Cassiopeiae, Poseidon, Gliese 877,
HIP 84051, Alpha Centauri, Ragnarök/Valhalla.

**Peoples and polities.** Built — `data/peoples.json`, thirty entries in three
kinds. A **people** is a sapient species. A **polity** is anything that governs,
organises or speaks for one: a state, a council, a movement, an enclave, a
resistance. A **faction** is the third thing, and it exists because the four Bob
groups would have broken the second one. A polity holds ground and speaks for a
population; Starfleet, the Skippies, the Gamers and the Borg hold nothing and
speak for one man who kept copying himself. Calling them governments to get them
in the door would have cost the register the distinction that makes it worth
having, so `validate.py` enforces the difference instead: a faction with a
`system`, a `place` or an `of` is an error.

They are here as well as on `bobs.json` because affiliation is a fact about a
Bob *and* a faction is a thing in the world with a history. `factionTag` ties the
two, `FACTIONS` in `validate.py` holds both ends against one list, and the
console runs the link in both directions — a record's FACTION field opens the
entry, and the entry lists its joiners the way a people lists its polities.

The second pass over this register cost the bestiary an entry; see below.

**Bestiary.** Built — `data/bestiary.json`, nine creatures, all nine drawn.
The inherited list that used to sit here was mostly wrong, and every entry was
checked against the corpus before it went in. Five of its eight items did not
survive: **landers** (92) is Dr. Landers, a human; **spits** (36) is the Spits,
a human faction; **boojums** (47) are Quinlan *drones*, machines not animals;
**hexghi** is the Deltan word for a family group, not a species; and **snarks**
are what the Bobs called the Quinlans before learning their own name — people,
so they belong in the peoples register. Only gorilloids, raptors and krakens
came through. The list also missed the biggest one entirely: **dragons**, 191
mentions, named by Mario.

The rule that keeps this register honest is that it holds **non-sapient fauna
only**. `validate.py` rejects a sapient entry by name and by the `sapience`
field, which has no "sapient" value to set. This is not fussiness: the series is
Bob working out who counts as a person, and filing the Deltans under "beasts"
would make the console argue the opposite. Where the books leave it open, use
`sapience: "contested"` rather than deciding for them.

**And then it happened here.** The dragons were in this file, `sapience: none`,
described as the most-discussed animal in the series. The first time anyone in
the books asks what to call them, the question is *do we have a name for the
intelligent species yet* — they build three-dimensional towns from medieval to
Renaissance, keep written records, fight a war of conquest under a dragon called
Alexander, and hold the residents of the next village to be barely above talking
animals. Howard and Bridget walk among them in dragon mannies without telling
them, which is the Quinlan arrangement exactly.

Two things about how it was caught. The rule worked: adding them to the peoples
register **failed the build**, because a name may not be filed as both, and the
check that caught it was written to catch exactly this. And the mention count
was part of what hid it — 191 sounds like a headline animal, but seventeen of
those are book 4, where the word is a D&D monster in the Gamers' campaign or the
idiom *dragon fodder*, and the entry's citation pointed at one of them. A
mention count that spans two meanings is not evidence about either.

`assets/bestiary/dragon.svg` is deliberately left behind, unused. It is a 4:3
side profile labelled *survey silhouette*, and the peoples register draws 16:10
portraits for a reason set out below. Carrying the plate across would have made
the drawing say what the entry no longer does.

Mention counts are re-derived from the corpus at validate time, so a number that
drifts gets caught. A creature whose name appears nowhere is flagged outright —
that one means we invented it.

**Illustrations.** `assets/<register>/<id>.svg` is inlined by the build into the
`art` field — the path is generic, so a register gets art the moment somebody
puts a file in the folder. Never hand-edit `art` in the JSON. Stroke-only, no `fill`, no
colour of its own: the console styles them with `stroke: currentColor` so one
file serves the card and the dossier in either palette, and they read as
phosphor drawings on the display rather than pictures pasted over it. The build
refuses any SVG containing a script or an external URL, because the page's
promise of zero external requests has to survive the artwork. Raster art works
the same way — base64 it into a `data:` URI. Creatures without art get a dashed
plate bearing their role mark, which reads as "reserved" rather than "broken".

### A specimen and a portrait are different claims

The two registers are drawn in deliberately different grammars, and the
difference is load-bearing rather than decorative.

| | frame | view | says |
|---|---|---|---|
| bestiary | 4:3 | side profile, whole animal | a specimen laid out for measurement |
| peoples | 16:10 | head and shoulders, eyes front | a portrait, looking back at you |

`validate.py` already refuses to let one name sit in both registers, because the
series is Bob working out who counts as a person and filing the Deltans under
beasts would make the console argue the opposite. **A drawing makes the same
argument.** The same anatomical study that suits a gorilloid turns a Deltan into
livestock, and it would do it silently, past a check that only reads names.

Two consequences worth keeping:

- **The Others get a portrait like everybody else.** They are the one species
  the Bobs fought instead of argued with, and drawing them in the bestiary's
  grammar would be the console taking a side the books spend five volumes
  refusing to take cheaply. The register grades what the books state, not who
  the reader is meant to side with.
- **No polity is drawn, and none should be.** A government is not a thing you
  draw. FAITH does not even get its acronym expanded, because nobody in the
  books unpacks it — an invented emblem would be a larger fabrication than an
  invented meaning. The dashed plate is the honest state.

**Line work, not photographs, and the reason is arithmetic.** All fourteen
drawings are 29 KB together. The one raster concept in `ideas/` is 325 KB on
disk and about 434 KB once base64'd into a page that has to open from a
`file://` double-click — a single photograph would cost more than every plate in
the console put together. Keep register plates as stroke SVG. If the raster
budget is ever spent, spend it once, on a single opened attachment, which is
where `[HOLOTANK]` would earn its label.

**Where a drawing is more speculative than the rest, say so in its own source.**
Hydra is named exactly once in five books with no description at all, so its
plate reads the name the Bobs gave it and stops, with the rearmost necks left
faint because we do not know how many there are — and the file says that. If the
corpus ever describes it, redraw it rather than defend it. Leviathan is the
other shape of the same problem: described only by scale, and a plate cannot
show scale without a reference the survey never recorded beside it, so the
composition carries it instead — the body runs off both edges and the frame
cannot hold the animal.

**Peoples and polities.** Built — `data/peoples.json`, five species and nine
polities; all five species drawn, no polity is. Its own register. Provenance works differently here: species and
governments have no parents, so the tier letters don't transfer. What's graded
instead is whether the books *state* a thing or leave it open.

The rule that spans this register and the bestiary: **a name is a people or it
is fauna, never both.** `validate.py` checks the two files against each other.
The console must not be able to call the Deltans a species in one view and a
beast in another — that is the argument the books are having, and getting it
wrong by accident would be picking a side.

Two fields carry most of the meaning:

- `contact` turns the Prime Directive thread into data — `uplifted` is Bob
  deciding that watching was also a choice, `covert` is walking among Quinlans
  without telling them, `aware` is a people that knows and has its own opinion.
- `expansion` holds what an acronym stands for **only where a character expands
  it on the page**. USE is the United States of Eurasia because Dr. Landers says
  so. VEHEMENT gets its expansion from Butterworth along with his own hedge —
  "or something close to that" — and the hedge is recorded because the hedge is
  the citation. FAITH has no expansion field at all: the books never unpack it,
  and inventing a plausible one is exactly the failure this project exists to
  avoid.

**Mention counts need explicit patterns here.** Matching a name
case-insensitively is fine for a coinage like "gorilloid" and disastrous for an
acronym: `USE` finds the verb 286 times against the state's 51, `FAITH` finds
the noun, and "the Others" collides with the ordinary word. Entries whose name
is ambiguous carry `mentionPattern`, and the validator uses it. This is the same
false-positive class that put Dr. Landers and the Spits in the bestiary's
candidate list — it recurs, so assume it rather than discover it.

Some names look like species and are not. **Bawbe** is the Deltan word for Bob.
**Hexghi** is a Deltan family group. **The Spits** is the Spitsbergen island
refuge. **Boojums** are Quinlan drones. Check what a word denotes before filing
it anywhere.

Same ground rules apply to all of them: derived text stays in `.cache/`, facts
are publishable, and every claim carries where it came from.

## The long game: a full Bobiverse companion

This is not a genealogy with a star chart bolted on. The end state is a complete
companion — lineage, star chart, bestiary, peoples and polities, ship designs,
the lot — presented as BobNet, the in-world network Bill actually runs. Website,
app, whatever it ends up being. The bar is the reference works Star Trek fans
have had for decades; the aim is something that stands next to those.

Two things follow from that. **Every register is a peer**, so none should be
special-cased into the genealogy's plumbing — `bobs.json`, `systems.json`,
`bestiary.json` and `peoples.json` are siblings.

And the console had to stop hardcoding its views, which it now does: the
`REGISTERS` list went in before the bestiary rather than halfway through it, and
both registers since have cost one entry each with every other rendered state
byte-identical. That was the right call and the golden-master snapshot is what
made it safe. Keep both when adding the next one.

Blog posts, status updates, and eventually images.

Worth knowing: **Bill's blog is canon.** In Bk4 ch5 he needles Bob with "You
still haven't read my blog yet, have you?" So dated posts in Bill's voice are
not a framing device we invented; they're a thing the character does. Site
updates should be written as BobNet posts, not as changelogs.

### What the books actually establish about BobNet

Checked against the corpus, because it's easy to invent this and then believe it.

**There is no BobNet lobby, and no shared look.** BobNet is the network, not a
place — Bill coins "Bobiverse" and "BobNet" in the same breath at the first moot
(Bk1 ch57). Connecting means popping into someone else's VR and standing inside
*their* metaphor: Bart's log cabin, Homer's space station. Doing it uninvited is
"a little rude" (Bk1 ch43), which tells you there's no neutral ground. An
undecorated VR is a bare blue room with no window and a hard floor (Bk1 ch11).
The Moot VR is the one shared venue and even that gets reconfigured per occasion
— Bill sets it up as a pub for an emergency moot (Bk3 ch21).

So the console's amber-console styling is **our** invention, and legitimately so:
canon is consistent that presentation is always somebody's personal choice. Two
things, though, are canon and worth keeping faithful:

**Square brackets are machine speech.** `[STATUS: Ready]`, `[HIC16537-1]`,
`[Incoming call]`, `[Bart]`, and Guppy's whole reports. Unbracketed text is a Bob
talking. The UI observes this: the metadata block is bracketed, and the `note`
field renders under "ANNOTATION — REGISTRY EDITOR, NOT BOBNET" because it's our
prose, not the registry's.

**Identity is the serial number.** Every Bob wears the same face, so they tell
each other apart by metadata tags (Bk2 ch33, Bk3 ch21), and Guppy flatly refuses
to use names — "It was their serial number or nothing." Oliver even gets his
designation before he's picked a name (Bk2 ch58). Hence the dossier leads with
the designation and demotes the name.

### Voice

The point of the project is that it's fun, so the writing has to carry Bob's
register or the whole thing reads like a database with a skin on it. What that
means concretely, from the text:

- **First person, past tense, conversational.** Contractions, sentence
  fragments, asides in parentheses. Never corporate, never breathless.
- **The joke is usually on the narrator.** Bill gets run over by his own
  fleeing NPC troops. Bob concedes points he was losing anyway. Self-deprecation
  over cleverness at someone else's expense.
- **Pop culture is the native vocabulary, not decoration.** Every Bob's name is
  already a joke — Riker, Bender, Marvin, Locutus, Gandalf, Fearless Leader,
  Homer and Lenny. Reference at that density and don't explain the joke.
- **Deadpan about the absurd, understated about the catastrophic.** Losing a
  system gets a dry sentence; a bad pun in a dungeon name gets a paragraph.
- **Use the in-world lexicon** — moot, manny, virt, roamer, autofactory, buster,
  SUDDAR, SCUT, replicative drift, Original Bob, Von Neumann-ing, Skippies. Two
  are deliberately loaded: *ephemeral* and *meatspace* are derogatory in-world
  and Bill objects to both, so only use them in a voice that would.
- **Jokes about being a computer.** Coffee and beer in VR that nobody needs,
  Guppy's flat AMI deadpan, arguing with your own backup.

Where the tone would cost accuracy, accuracy wins — but note fields are prose,
and prose in this project is allowed to be funny. What it is never allowed to be
is quoted book text; paraphrase and cite, same as everywhere else.
