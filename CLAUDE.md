# Project context

An interactive genealogy of the replicants in Dennis E. Taylor's Bobiverse,
rendered as an engineering drawing. The point of the project is **provenance**:
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
disagreement and which source the tree follows. Don't silently pick a winner.
Taylor's own 2017 tree is wrong about Loki (it puts him under Khan; the text
puts him in Bill's June 2185 cohort), so "the author said so" is not decisive.

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
is otherwise — Herschel is tier C with twenty POV chapters and a generation he
states out loud. We just don't know who made him. `cite`, `gen` and the rest are
welcome on any tier.

| tier | meaning | requirements |
|---|---|---|
| `t` | parent confirmed in the primary text | `cite` required, and it must support the parent link |
| `a` | Taylor's published genealogy, Apr 2017 | accurate only through book 2 |
| `b` | Bobiverse Fandom wiki registry | reader-compiled; supplies designations, dates, vessels |
| `p` | an ancestor is named, generations are not | `parent` = ancestor; explain in `partialNote` |
| `c` | no ancestor on record | no `parent`; renders in the unresolved register |

## Layout

```
books/           your DRM-free ebooks (gitignored, never committed)
.cache/          parsed corpus (gitignored)
data/bobs.json   source of truth
data/schema.json field documentation and constraints
src/parse_ebook.py  MOBI + EPUB -> chapters, refuses DRM
src/corpus.py       build/load the cached corpus
src/extract.py      surface candidate passages for review (never auto-writes)
src/validate.py     schema, referential integrity, tier rules
src/build.py        bobs.json + template -> dist/index.html
templates/genealogy.html   the drawing, with a data placeholder
```

## Workflow

```
make corpus      # once, after adding ebooks
make validate    # before every commit
make build       # writes dist/index.html
python src/extract.py --name Thor       # research one Bob
python src/extract.py --unresolved      # work the tier C backlog
```

`extract.py` prints passages with citations; it never edits `data/bobs.json`.
Reading the passage and deciding what it establishes is the human's job.

## Chapter parsing

Every chapter opens with an optional title, the POV Bob, an in-world date, and
usually a location. The date is the only field identifiable by shape, so it's
the anchor: find the date paragraph, the POV is the paragraph before it. Book 1
in MOBI has no paragraph tags and falls back to a flat regex. Book 5 uses word
numerals ("Chapter One"), which is why the parser doesn't rely on chapter
numbering.

## Open questions

- Thor, Jeffrey, Milton, Zeke — parentage still unconfirmed by text. Jeffrey,
  Milton and Zeke now carry a citation for their *deaths* at 82 Eridani
  (Bk2 ch48), but nothing in the books names who built them.
- 25 Bobs at tier C. The richest are Will (501 mentions), Neil and Herschel
  (both stated eighth-generation), Gandalf, Marcus and Mack — all well
  documented, all missing a parent.
- Will and Marcus — major POV characters absent from every published tree
- Verne's parentage: he served on Loki's crew at 82 Eridani, and Loki's cohort
  is Bill's June 2185 batch. Suggestive, never stated. Left at tier C.
- Hector name collision: a 3rd-generation Hector lost at 82 Eridani, and an
  ~18th-generation Hector emailing Bill in 2343
- Gerry's exact relation to Charles: Charles himself says "Gerry was my
  descendant" (Bk5 ch51), which is what the tree follows; Benny calls him a
  collateral descendant from several generations up

## Sources already worked

Don't re-run these expecting new names; they're exhausted.

- **POV coverage** — all 25 distinct POV names in the corpus have records.
- **Moot enumerations** — swept all 55 moot chapters. Victor was the only real
  name they turned up, and he's now in.
- **Name co-occurrence** — capitalised names appearing in lists alongside two or
  more known Bobs. Everything it surfaced was either added or ruled non-Bob.
- **Faction enumeration** — swept for the mutual-interest groups. Four exist:
  Starfleet, Skippies, Gamers, Borg. No fifth appears in the text.

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

**Bestiary.** Well attested in the corpus already, by rough mention count:
gorilloids (166), landers (92), boojums (47), snarks (38 — later renamed
Quinlans), spits (36), raptors (48), krakens (11), hexghi (6), plus the
Deltans' fauna and the Heaven's River river life. Note that "manny" (370) is
an android body, not a creature — easy false positive.

**Peoples and polities**, if wanted: Deltans, Quinlans, Pav, the Others,
Zjentfen (Bk2 ch60), and the non-Bob organisations — the Pangean Council, the
Quinlan Resistance and Crew, and the Bawbes, which is what the locals call us.

Same ground rules apply to all of them: derived text stays in `.cache/`, facts
are publishable, and every claim carries where it came from.
