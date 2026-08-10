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
on the page; we simply never learn who built him.

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

Three views over the same 87 records, with live search across names, aliases,
designations, systems, notes and citations:

- **Register** — the full list, sortable on every column.
- **Lineage** — the descent tree. Filtering keeps the ancestors needed to reach
  a match, so branches never float free of the root.
- **Unresolved** — the Bobs whose trace can't reach Bob-1, with the two kinds of
  absence distinguished: never recorded, versus deleted.
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

Everything is one self-contained HTML file with no external requests. A **CRT**
toggle drops the scanlines and glow if you'd rather just read.

## Setup

```bash
# 1. drop your DRM-free ebooks into books/  (nothing here is committed)
# 2. parse them
make corpus
# 3. build the console
make build && open dist/index.html
```

Requires Python 3.10+. No third-party dependencies.

## Working on the data

```bash
make validate                        # schema, referential integrity, tier rules
python src/extract.py --unresolved   # candidate passages for the tier C and P backlog
python src/extract.py --name Thor    # research one Bob
```

`src/extract.py` finds passages and prints them with citations. It never writes
to `data/bobs.json` — deciding what a passage establishes is a judgement call,
and the series makes that call harder than it looks. A clone inherits its
parent's memories wholesale, so a Bob narrating his own creation may be
narrating his parent's. See CLAUDE.md.

`make validate` gates the build. Besides the tier rules it checks referential
integrity, ancestry cycles, and that Bobs sharing a Hipparcos catalogue number
agree about which system they were built in — since the designation states it.

## What's publishable

`data/bobs.json` contains facts — who cloned whom, when, in which system.
Facts aren't copyrightable and this file is yours to share. The parsed book
text under `.cache/` is a derivative work and stays on your machine; it's
gitignored and should remain so.

## Status

87 replicants, 52 with citations, 32 with a parent stated in the books, 2 with
their lineage deliberately expunged, and 30 carrying an unverified lead from a
dropped source. Biography is held to the same standard as lineage: `desig`,
`born` and `vessel` only where the books print them, and generation counted down
the tree except for the three the text states out loud.

The research backlog lives in `data/todo.json` and is a view in the console.
