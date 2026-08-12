# Bobiverse Replicant Genealogy

A registry of the replicants in Dennis E. Taylor's Bobiverse, presented as a
BobNet console. Every lineage claim carries its own provenance, and the ones
that can't be sourced say so instead of quietly closing the gap.

## The idea

Most fan genealogies present a single flat tree and leave you guessing where
each edge came from. This one grades every claim:

| tier | mark | source |
|---|---|---|
| O | ○ amber | the original, Bob-1 — there is no parent to find |
| T | ◆ green | parent stated in the books, with a citation |
| P | ◈ dim | an ancestor is stated but the generations between are not |
| C | ✕ grey | no ancestor on record; listed in the unresolved register |
| X | ▨ red | the record was deliberately expunged |

**The books are the only source.** Taylor's 2017 genealogy and the fandom wiki
used to supply 30 of these parentages; they've been dropped, because a lineage
we can't point at a page for shouldn't be drawn as though we know it. Those
claims aren't lost — each sits on its record as an unverified lead, visible in
the dossier and never drawn as an edge.

The tier grades **parentage only**. A tier C Bob can still be thoroughly
documented — Herschel has eighteen POV chapters and announces his own generation
on the page; we simply never learn who built him. What became of a Bob is graded
separately, on its own evidence, in a field of its own.

Tier X is the interesting one. Starfleet stripped its own genealogy and location
data out of the databases during the war, so for its members the missing lineage
isn't a gap in anyone's reading — it's the deletion itself, and the registry says
so rather than shrugging.

Ten tier-T records come from an unexpected place: the **Cast of Characters
appendix at the back of book 2**, which states parentage outright. Back matter
rather than story, but Taylor's own words printed in the novel — and it turned
up a Bob the narrative never introduces.

Where sources disagree, the disagreement is recorded rather than resolved
silently — including when the disagreement turns out to be our own fault. We had
Loki reparented away from Khan on a misreading, and the `conflict` field on his
record now says so.

## The console

Seven registers, with live search across names, aliases, designations, systems,
notes and citations:

- **Register** — the full list, sortable on every column.
- **Lineage** — the descent tree. Filtering keeps the ancestors needed to reach
  a match, so branches never float free of the root.
- **Unresolved** — the Bobs whose trace can't reach Bob-1, with the two kinds of
  absence distinguished: never recorded, versus deleted.
- **Chart** — the star chart. Real positions from real astrometry, drag to
  rotate, wheel to zoom, and a year scrubber from 2133 to 2345 that lights each
  system as the Bobs first reach it. Stars are drawn in their true spectral
  colour and sized by absolute magnitude, so an F2 dwarf really does outshine an
  M3. The backdrop is the real naked-eye sky — 5,070 stars to magnitude 6 from the
  HYG Database, in their true colours. Nothing on the chart is invented.
- **Bestiary** — the non-sapient fauna, loudest first by how much of the books
  they actually occupy. Fauna only: the Deltans, Quinlans, Pav and the Others are
  people, and people get their own register. That line is enforced by the build,
  because the series is largely Bob working out where to draw it.
- **In Memorium** — the Bobs who didn't come back. The books put the line at
  the backup rather than the hull: a Bob whose transfer completed is restored
  into a new vessel and carries on, so a destroyed ship is not a death. Four
  names, and three entries that will always be blank — Bill counted three failed
  transfers after the first battle of 82 Eridani and never said which three, so
  the list carries them as dashed rows in their place in the chronology. Nine
  more sit in their own section, ships destroyed and backups never mentioned
  again, on neither side of the line because the books never put them there.
- **Peoples** — the sapient species and the polities that claim to speak for
  them, with `contact` recording how each stands with the Bobs: uplifted, walked
  among without being told, aware and unimpressed, or at war. Acronyms are only
  expanded where a character expands them on the page, so FAITH stays FAITH.
- **To-do** — the research backlog, reported the way Guppy reports Bob's:
  a bracketed count divided into categories. It has never once got shorter.

Selecting a record pulls its dossier and traces the route back to Bob-1
hop by hop, **grading each link separately**. A chain can be solid for two hops
and then run out of sources, and that's visible rather than smoothed over.
34 of the 87 traces reach Bob-1; 53 terminate — an honest number rather than a
flattering one.

Two details follow the books rather than taste. Bobs all wear the same face, so
the registry identifies them the way Guppy does — by serial number, with the
name secondary. And square brackets mean machine output, so the metadata block
is bracketed while the editorial notes are explicitly not.

**Guppy** runs the terminal. He comes up with the link on the boot screen and
waits in the dossier when nothing is selected — a pixel portrait drawn from the
books' description rather than the Star Wars character they compare him to,
rendered in `currentColor` so he takes the colour of wherever he is. He blinks
occasionally. That is the whole performance, which is the joke.

The console boots the way a terminal should — Guppy first, then the link, then
each line typed out with its own pause. About six seconds, skippable with any
key.

Everything is one self-contained HTML file with no external requests: no fonts,
no scripts, no images. The artwork is inline SVG and the star backdrop is packed
integers. A **CRT** toggle drops the scanlines and glow if you'd rather just
read.

## Setup

```bash
# 1. drop your DRM-free ebooks into books/  (nothing here is committed)
# 2. parse them
make corpus
# 3. build the console
make build && open dist/index.html
```

Requires Python 3.10+. No third-party dependencies.

EPUB and MOBI both work, and files are matched to books by the title in the
filename — whatever name yours arrived with should be fine. `make corpus` won't
replace a cached parse with a thinner one, so an edition the parser doesn't
understand yet fails loudly instead of quietly renumbering every citation.

`books/MANIFEST.sha256` records the hash and chapter count of each ebook — facts
about the files, not their contents, so it's safe to commit. `make verify-books`
checks a copy against it. Different editions number their chapters differently,
and citations are numbered against a specific parse, so this is worth running
after restoring the books on a new machine.

Note that `git clean -xdf` would delete `books/` and `.cache/` — both are
gitignored, so git cannot bring them back. Keep your ebooks backed up elsewhere.

## Working on the data

```bash
make validate                        # schema, referential integrity, tier rules
make test                            # build, then run the console's test suites
python src/extract.py --unresolved   # candidate passages for the tier C and P backlog
python src/extract.py --name Thor    # research one Bob
```

`make test` needs Node. It runs the shipped script from `dist/index.html` against
a stub DOM — data integrity, every view under every filter, the chart's
projection geometry and astrophysics, label legibility, and a golden-master
snapshot of 109 rendered states.

`src/extract.py` finds passages and prints them with citations. It never writes
to `data/bobs.json` — deciding what a passage establishes is a judgement call,
and the series makes that call harder than it looks. A clone inherits its
parent's memories wholesale, so a Bob narrating his own creation may be
narrating his parent's. See CLAUDE.md.

`make validate` gates the build. Besides the tier rules it checks referential
integrity, ancestry cycles, and that Bobs sharing a Hipparcos catalogue number
agree about which system they were built in — since the designation states it.

## Credits

Star positions, spectral types and magnitudes for the Bobiverse systems come from
[SIMBAD](https://simbad.u-strasbg.fr/). The backdrop sky is the
[HYG Database v4.4](https://codeberg.org/astronexus/hyg) by David Nash, used under
CC BY-SA 4.0 — note that ShareAlike propagates to anything that embeds it.

## What's publishable

`data/bobs.json` contains facts — who cloned whom, when, in which system.
Facts aren't copyrightable and this file is yours to share. The parsed book
text under `.cache/` is a derivative work and stays on your machine; it's
gitignored and should remain so.

## Status

**87 replicants** — 52 with citations, 32 with a parent stated in the books, 2
with their lineage deliberately expunged, and 30 carrying an unverified lead from
a dropped source. 34 traces reach Bob-1; 53 terminate. Biography is held to the
same standard as lineage: `desig`, `born` and `vessel` only where the books print
them, and generation counted down the tree except for the three the text states
out loud.

**22 star systems** in `data/systems.json`, 20 with coordinates. They're real
stars — Taylor used Hipparcos catalogue numbers, which is why a Bob can read his
own origin off his serial — so the astrometry is real too, from SIMBAD, with
distances and Cartesian positions computed from parallax rather than copied. The
backdrop is 5,070 naked-eye stars from the HYG Database.

**4 Bobs on the In Memorium list**, plus three that are counted and unnamed;
9 more whose vessels were destroyed and whose fate the books never settle, and 4
recovered from destroyed vessels. `fate` replaced a three-value `status` that had
Elmer among the dead and Bender among the lost — the books say plainly that both
came back, and one of them is the whole plot of book 4.

**9 creatures** in `data/bestiary.json`, each pinned to the world it lives on and
cited to its first appearance; 2 illustrated so far.

**5 species and 9 polities** in `data/peoples.json`. A name may be a people or
fauna, never both, and the build checks the two files against each other.

The research backlog is `data/todo.json` — 21 items, 5 cleared — and is a view in
the console. It has never once got shorter.

## How it's kept honest

Everything above is checked rather than asserted:

- `make validate` gates the build — tier rules, referential integrity, ancestry
  cycles, and that Bobs sharing a Hipparcos number agree about where they were
  built, since the designation states it.
- Every citation is re-verified against the parsed books, so a chapter number
  that drifts gets caught rather than believed.
- Mention counts in the companion registers are re-derived from the corpus; an
  entry whose name appears nowhere is flagged, because that means we invented it.
- `make test` runs 2,935 checks across 11 suites against the shipped page,
  including a golden-master snapshot of 118 rendered states.
- Where a count comes from the books rather than from us — the three unnamed
  In Memorium entries — the tests check the page against the cited number, and
  refuse a pool of candidates small enough that the names would be knowable.

The recurring lesson, which has now bitten in four separate registers: **a word
that looks like a name usually isn't one.** "Landers" is a person, "Spits" is an
island, "boojums" are drones, "hexghi" is a family, "manny" is a robot body, the
"Fred" in book 3 is a Deltan and the "Hector" in book 5 is a human executive.
Check what a word denotes before filing it anywhere.

Its companion, learned building the In Memorium list: **a category with too few
values will quietly assert things you never decided.** A three-value status of
active/lost/unknown had no way to say "his ship was destroyed and he came back",
so it said he was lost — about Elmer, who is alive on the page four paragraphs
later, and about Bender, whose recovery is the plot of a whole novel.
