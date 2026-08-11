# Project context

An interactive genealogy of the replicants in Dennis E. Taylor's Bobiverse,
presented as a BobNet console. The point of the project is **provenance**:
every lineage claim carries a confidence tier, and disagreements between
sources are surfaced rather than smoothed over.

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

**The books are the only source.** Taylor's 2017 genealogy and the fandom wiki
were dropped: a lineage claim we can't point at a page for should not be drawn
as though we know it. That cost 30 parentages and it was worth it. Dropped
claims aren't deleted — they move to `priorClaim`, recorded as a research lead
and never rendered as an edge. If the books later settle one, promote it and
remove the field.

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
data/todo.json   the research backlog, rendered as a view in the console
data/systems.json star systems with real astrometry, and the places in them
data/skyfield.json the naked-eye sky for the chart backdrop (HYG, CC BY-SA 4.0)
data/bestiary.json non-sapient fauna; data/bestiary.schema.json documents it
assets/bestiary/  <id>.svg illustrations, inlined into the page by the build
templates/genealogy.html   the console — register, lineage, unresolved, chart,
                 bestiary, to-do
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
python src/extract.py --name Thor       # research one Bob
python src/extract.py --unresolved      # work the tier C and P backlog
```

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
| `chart` | projection invariants, the fiction's own distances, astrophysics |
| `legibility` | label decluttering, ring labels, spectral colour survival, WCAG contrast |
| `backdrop` | the HYG starfield, unit-vector invariants, NaN sweeps |
| `snapshot` | golden master — exact HTML of 95 states |

**Assertions derive their expectations from `data/*.json` rather than hardcoding
counts.** The old scratch harness asserted "86 records" for a whole session after
the 87th landed; a test that must be hand-updated is a test that will be wrong.
Literals stay only where the literal *is* the point — the tier letters, Sol's
absolute magnitude of 4.83, Bill's stated distances.

### The golden master

`tests/__snapshots__/views.json` holds the exact HTML for 95 states — every view,
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
Standing items at the time of writing: Marcus's parentage, the Hector collision,
the 30 dropped-source leads, and a biographical sweep to rebuild what the field
policy above swept out.

## Sources already worked

Don't re-run these expecting new names; they're exhausted.

- **POV coverage** — all 25 distinct POV names in the corpus have records.
- **Moot enumerations** — swept all 55 moot chapters. Victor was the only real
  name they turned up, and he's now in.
- **Name co-occurrence** — capitalised names appearing in lists alongside two or
  more known Bobs. Everything it surfaced was either added or ruled non-Bob.
- **Faction enumeration** — swept for the mutual-interest groups. Four exist:
  Starfleet, Skippies, Gamers, Borg. No fifth appears in the text.
- **Renames** — swept for Bobs who changed their name. Two: Riker to Will
  (Bk3 ch57) and Jeremy to Morlock (Bk4 ch3). Everything else the sweep caught
  was either an original naming or an idiom — "call me Shirley" is a joke.

- **Book 2's Cast of Characters appendix** — mined. 26 parentage claims, every
  one agreeing with what we had and none contradicting. It rescued ten records
  onto primary-text footing when the secondary sources were dropped, settled
  Verne as Bill's clone (the narrative only hinted), and turned up **Surly**, a
  Bob we didn't have at all. The parser rejects it as back matter, so it has to
  be read by hand. Books 4 and 5 have no equivalent.

## Planned: companion registers

Once the genealogy is settled, the same machinery — corpus, extractor,
validator, console — should carry other registers from the same books. The
parser and `extract.py` are already generic; what each needs is its own data
file, schema and view.

**Planetary / system map.** Systems, who surveyed them, what was found, who
was lost there. `data/bobs.json` already carries `origin`, `visited` and
`lostAt`, so a first pass can be derived from the genealogy rather than
re-parsed. Sol, Epsilon Eridani, Delta Eridani, 82 Eridani, Omicron² Eridani,
Delta Pavonis, Gamma Pavonis, Eta Cassiopeiae, Poseidon, Gliese 877,
HIP 84051, Alpha Centauri, Ragnarök/Valhalla.

**Bestiary.** Built — `data/bestiary.json`, nine creatures, its own register.
The inherited list that used to sit here was mostly wrong, and every entry was
checked against the corpus before it went in. Five of its eight items did not
survive: **landers** (92) is Dr. Landers, a human; **spits** (36) is the Spits,
a human faction; **boojums** (47) are Quinlan *drones*, machines not animals;
**hexghi** is the Deltan word for a family group, not a species; and **snarks**
are what the Bobs called the Quinlans before learning their own name — people,
so they belong in the peoples register. Only gorilloids, raptors and krakens
came through. The list also missed the biggest one entirely: **dragons**, 191
mentions across books 4 and 5, named by Mario.

The rule that keeps this register honest is that it holds **non-sapient fauna
only**. `validate.py` rejects a sapient entry by name and by the `sapience`
field, which has no "sapient" value to set. This is not fussiness: the series is
Bob working out who counts as a person, and filing the Deltans under "beasts"
would make the console argue the opposite. Where the books leave it open, use
`sapience: "contested"` rather than deciding for them.

Mention counts are re-derived from the corpus at validate time, so a number that
drifts gets caught. A creature whose name appears nowhere is flagged outright —
that one means we invented it.

**Illustrations.** `assets/bestiary/<id>.svg` is inlined by the build into the
`art` field. Never hand-edit `art` in the JSON. Stroke-only, no `fill`, no
colour of its own: the console styles them with `stroke: currentColor` so one
file serves the card and the dossier in either palette, and they read as
phosphor drawings on the display rather than pictures pasted over it. The build
refuses any SVG containing a script or an external URL, because the page's
promise of zero external requests has to survive the artwork. Raster art works
the same way — base64 it into a `data:` URI. Creatures without art get a dashed
plate bearing their role mark, which reads as "reserved" rather than "broken".

**Peoples and polities.** Confirmed for build. Species — Deltans, Quinlans,
Pav, the Others, Zjentfen (Bk2 ch60), and the gorilloids. Polities — the
Pangean Council, the UFS, the Quinlan Resistance and the Crew, the Newholme and
Pangea colonies, and the Bawbes, which is what the locals call us. Note that
these need a different provenance model than the Bobs: species and governments
don't have parents, so tiers T/A/B/P/C/X won't transfer directly. Design that
schema fresh rather than bending this one.

Same ground rules apply to all of them: derived text stays in `.cache/`, facts
are publishable, and every claim carries where it came from.

## The long game: a full Bobiverse companion

This is not a genealogy with a star chart bolted on. The end state is a complete
companion — lineage, star chart, bestiary, peoples and polities, ship designs,
the lot — presented as BobNet, the in-world network Bill actually runs. Website,
app, whatever it ends up being. The bar is the reference works Star Trek fans
have had for decades; the aim is something that stands next to those.

Two things follow from that, and they should shape decisions now rather than
later. **Every register is a peer**, so none of them should be special-cased into
the genealogy's plumbing — `bobs.json`, `systems.json` and whatever comes next
are siblings. And **the single-file console will stop being the right shape**:
it currently hardcodes every view into one template, which is fine for four and
won't be for eight. Worth restructuring deliberately before the bestiary rather
than discovering it halfway through.

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
