# Bobiverse Replicant Genealogy

A registry of the replicants in Dennis E. Taylor's Bobiverse, presented as a
BobNet console. Every lineage claim carries its own provenance, and the ones
that can't be sourced say so instead of quietly closing the gap.

## The idea

Most fan genealogies present a single flat tree and leave you guessing where
each edge came from. This one grades every claim:

| tier | mark | source |
|---|---|---|
| T | ◆ green | parent confirmed in the primary text, with a chapter citation |
| A | ◆ amber | Taylor's own genealogy (April 2017) — accurate through book 2 only |
| B | ◇ dim | Bobiverse Fandom wiki registry — reader-compiled, supplies designations and dates |
| P | ◈ dim | an ancestor is named but the generations between are not |
| C | ✕ grey | no ancestor on record; listed in the unresolved register |
| X | ▨ red | the record was deliberately expunged |

The tier grades **parentage only**. A tier C Bob can still be thoroughly
documented — Herschel has eighteen POV chapters and announces his own generation
on the page; we simply never learn who built him.

Tier X is the interesting one. Starfleet stripped its own genealogy and location
data out of the databases during the war, so for its members the missing lineage
isn't a gap in anyone's reading — it's the deletion itself, and the registry says
so rather than shrugging.

Where sources disagree, the disagreement is recorded rather than resolved
silently. Taylor's own tree turns out to be wrong about Loki.

## The console

Three views over the same 87 records, with live search across names, aliases,
designations, systems, notes and citations:

- **Register** — the full list, sortable on every column.
- **Lineage** — the descent tree. Filtering keeps the ancestors needed to reach
  a match, so branches never float free of the root.
- **Unresolved** — the Bobs whose trace can't reach Bob-1, with the two kinds of
  absence distinguished: never recorded, versus deleted.

Selecting a record pulls its dossier and traces the route back to Bob-1
hop by hop, **grading each link separately**. A chain can be solid for two hops
and then run out of sources, and that's visible rather than smoothed over.
62 of the 87 traces reach Bob-1; 25 terminate.

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

87 replicants, 41 with primary-text citations, 21 with a parent confirmed in
the books, 2 with their lineage deliberately expunged. Known gaps and the
research backlog are at the bottom of CLAUDE.md.
