# Bobiverse Replicant Genealogy

An interactive family tree of the replicants in Dennis E. Taylor's Bobiverse,
drawn as an engineering sheet — drafting border, title block, and line-type
conventions that encode how much we actually know about each lineage claim.

## The idea

Most fan genealogies present a single flat tree and leave you guessing where
each edge came from. This one grades every claim:

| tier | line style | source |
|---|---|---|
| T | solid, green | parent confirmed in the primary text, with a chapter citation |
| A | solid, blue | Taylor's own genealogy (April 2017) — accurate through book 2 only |
| B | dashed | Bobiverse Fandom wiki registry — reader-compiled, supplies designations and dates |
| P | dotted, violet | an ancestor is named but the generations between are not |
| C | dotted, grey | no ancestor on record; drawn in a separate register block |

The tier grades **parentage only**. A tier C Bob can still be thoroughly
documented — Herschel has twenty POV chapters and announces his own generation
on the page; we simply never learn who built him.

Where sources disagree, the disagreement is recorded rather than resolved
silently. Taylor's own tree turns out to be wrong about Loki.

## Setup

```bash
# 1. drop your DRM-free ebooks into books/  (nothing here is committed)
# 2. parse them
make corpus
# 3. build the drawing
make build && open dist/index.html
```

Requires Python 3.10+. No third-party dependencies.

## Working on the data

```bash
make validate                        # schema + referential integrity + tier rules
python src/extract.py --unresolved   # candidate passages for the tier C backlog
python src/extract.py --name Thor    # research one Bob
```

`src/extract.py` finds passages and prints them with citations. It never writes
to `data/bobs.json` — deciding what a passage establishes is a judgement call,
and the series makes that call harder than it looks. See CLAUDE.md.

## What's publishable

`data/bobs.json` contains facts — who cloned whom, when, in which system.
Facts aren't copyrightable and this file is yours to share. The parsed book
text under `.cache/` is a derivative work and stays on your machine; it's
gitignored and should remain so.

## Status

87 replicants, 38 with primary-text citations, 21 with a parent confirmed in
the books. Known gaps are listed at the bottom of CLAUDE.md.
