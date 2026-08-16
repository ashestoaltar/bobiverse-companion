# Agent handoff — BobNet Registry

**Read this first after compacting a long chat, or when picking up the project cold.**  
Durable product decisions, architecture, art rules, file map, and ordered next work.  
Companion to [`../CLAUDE.md`](../CLAUDE.md) (ground rules + data layout) and [`../data/todo.json`](../data/todo.json) (item-level backlog).  
Historical multi-pass notes: [`../COLLABORATIVE-REVIEW.md`](../COLLABORATIVE-REVIEW.md) — many ideas there are **already shipped**; this file wins on current intent.

**Last full review:** 2026-08-16. Validate OK (Hector name-collision warning only). Test suite green (~15.9k checks / 22 suites).  
**Vessel plates landed:** same day — 15 holotank plates, ship ~950 KB.

**Owner intent:** One agent (Grok / xAI) can own code, data, tests, **and** Imagine art. No need to bounce between LLMs for plates. Books stay local; never commit book text.

---

## 1. What this product is

| Layer | Reality |
|---|---|
| **In-console name** | **BobNet — Registry** (`<title>`, banner **REGISTRY**, “PUBLIC FEATURES + ARCHIVES”) |
| **Thesis** | **Provenance** — books-only parentage, graded tiers, honest gaps, conflicts recorded |
| **Shell** | Amber phosphor; Guppy; bracketed machine speech; SCUT-style boot; single `dist/index.html` |
| **Payload** | Holotank attachments, chart canvas, stroke SVG cards — rich only when you open a file |
| **Not** | Official BobNet skin, a wiki, or a tree-only fan site |

**Blog is the front door** (default view + first tab): public BobNet surface.  
**Genealogy is load-bearing for the mission, not the lobby.** Register/genealogy are a tab away. Holotank openers use **phosphor green** so they read as a different class of control than amber chrome.  
Repo path/docs still say “genealogy” in places; chrome already says registry.  
**Planned:** dedicated **VESSELS** register (Heavens, Medeiros, colony, Others, etc.); Bob dossier hang-ons for hull art are temporary.

**Canon one-liner:** BobNet = SCUT social/technical mesh; look-and-feel is always local; this console is **Bill-shaped working surface** (genealogy + In Memorium are his specialty archives; blogs are public BobNet features).

---

## 2. Current ship (do not re-plan)

### Registers (11)

| Group | Tabs | Role |
|---|---|---|
| **Replicants** | Register · Genealogy · Unresolved · In Memorium | Directory, tree, gaps, deaths |
| **World** | Chart · Systems · Bestiary · Peoples | Real sky, places, fauna, sapients/polities/factions |
| **Log** | Timeline · Blog · To-do | Derived chronology, Bill + editor posts, backlog |

Tab bar already uses visual gaps between groups. Soft group **labels** are optional polish only.

### Data snapshot (order of magnitude)

- **89** Bobs — O1 T51 P1 C34 X2 · ~53 traces to Bob-1 · 12 `priorClaim` · 6 conflicts  
- **22** systems · max distance ~**48.8 ly** · real SIMBAD/HYG math  
- **9** bestiary (stroke SVG) · **7** peoples · **19** polities · **4** Bob factions  
- **9** blog posts · **63** timeline events · **11** holotank VR plates (~409 KB inlined WebP)  
- Books **1–5** released; **Bk6 *The Infinite Extent*** 2026-09-10 (`released: false`); 7 promised last  

### Features already done (do not rebuild)

Spoiler **READ THROUGH** (record / fate / prose separate); URL state; cross-register links; Sandbox Bob; mobile sheet+scrim; SCUT boot; filter bar cull (**5 chips on bar**, 8 address-only); CRT **removed**; **holotank VR core shipped** (`data/holo.json` + `assets/holo/*.webp` + validate + build + `tests/holo.test.js`).

### Open research (not UI)

Marcus parentage; Thor/Jeffrey/Milton/Zeke; Hector collision; Verne narrative confirm; 12 wiki leads; light bio sweep. Book 6: flip release flag → corpus → **CORPUS_CLAIMS** re-check → re-sweep. See `data/todo.json`.

---

## 3. Ground rules (non-negotiable)

1. **Never commit book text.** `books/` and `.cache/` gitignored. Paraphrase + cite in notes.  
2. **Books are the only lineage source.** Wiki/online tree → `priorClaim` only until cited.  
3. **Preserve disagreement** (`conflict`). Don’t silently pick winners.  
4. **Inherited memory** — creating Bob’s POV preferred over clone’s self-narration.  
5. **No external requests** in the shipped page. Art inlined (SVG / WebP data URIs). Stdlib Python build.  
6. **`ORDER` whitelist** on Bob fields — schema + `build.py` must agree or the field never ships.  
7. **No plate without a citation.** Handsome media must never paper over missing knowledge.  
8. **Presentation is personal** — amber CRT is Bill’s room, not house-style BobNet.

---

## 4. Holotank — shipped architecture (keep)

### Design thesis

- **Chrome vs payload:** drab file manager, rich document.  
- **Word is holotank** (~34 book hits). **Not holosphere** (0 hits).  
- Holotank = **inspect** a file. Manny/VR inhabit = different (we only reconstruct stills).  
- Overlay, **not** a 12th media-browser tab — leaving the manager for a moment.

### Implementation (live)

| Piece | Path / rule |
|---|---|
| Manifest | `data/holo.json` → `plates[]` |
| Images | `assets/holo/<id>.webp` (~520px long edge, offline encode, ~40 KB/plate) |
| Inject | `build.py` → base64 data URI into page |
| Validate | `_check_holo()` — cite, kind, note, spoil, `about` address, file exists |
| UI | Overlay `#tank`; dossier row `attachRow()` |

**Plates are keyed by console address**, not Bob fields:

```text
about: "register/homer"   // same idea as blog posts' about
kind:  vr | vessel | specimen | portrait
cite:  required  (chapter that describes the thing in the picture)
note:  required  (what the citation actually says; may use @bkN paragraph gates)
spoil: book number for plate visibility
```

Why address-keying wins:

- `bobs.json` stays genealogy, not a picture library  
- Any register can gain attachments without schema/`ORDER` growth  
- Empty stays empty: **`[NO FILE ON RECORD]`** vs **`▨ FILE WITHHELD`** vs **`[ATTACHMENT: id]`**

### Shipped plates (15)

**VR (11):** `vr-bob1`, `vr-bill`, `vr-riker`, `vr-homer-cartoon`, `vr-homer`, `vr-bart`, `vr-garfield`, `vr-mario`, `vr-linus`, `vr-locutus`, `vr-howard`

**Vessel (4) — Heaven design gens, 2026-08-16:**

| id | about | cite | title |
|---|---|---|---|
| `vessel-heaven-1` | `register/bob1` | Bk1 ch12 | Heaven design, generation 1 |
| `vessel-heaven-2` | `register/bill` | Bk1 ch17 | Heaven design, generation 2 |
| `vessel-heaven-3` | `register/calvin` | Bk1 ch22 | Heaven design, combat class |
| `vessel-heaven-4` | `register/loki` | Bk2 ch50 | Heaven design, carbon-black |

Honesty pass applied: freighter-ugly DNA, red/green/**blue** running lights, no hull labels; v4 = same silhouette painted stealth, not a redesign. Ship **names** (Heaven-2, Heaven-6, …) ≠ design **generations**.  

**Specimen (1) — dual-mode fauna, 2026-08-16:**

| id | about | cite | title |
|---|---|---|---|
| `specimen-gorilloid` | `bestiary/gorilloid` | Bk1 ch35 | Gorilloid — survey capture |

Stroke SVG stays on the bestiary **card**; photoreal opens only in the **holotank**. Pattern for further fauna.  
Source JPGs under `ideas/`; ship is WebP under `assets/holo/`.

### Charter for VR stills (books)

- **Bk1 ch17:** same face, **different rooms** in the video array. Face lock across Bobs is correct.  
- Bare **blue room**, no window, hard floor = undecorated matrix.  
- **Linus:** do not drop for “no cite” — **Bk1 ch40** Saturn dome cities. Aging / “had some issues” (Bk2) is a **second plate** opportunity, not a reason to delete the first.  
- **Homer:** two plates — cartoon avatar then station after he dropped it (books date the switch).

### Ackbar rule (Guppy principle)

Build from **description**, not trademarked reference art:

| Subject | Books give | Do not ship |
|---|---|---|
| Riker | Red uniform, spaceship bridge, no beard (then grows one later) | Enterprise-D, LCARS, Starfleet delta |
| Homer cartoon | Cartoon avatar + catchphrase; later dropped | Unmistakable Groening/Fox house style as the claim |
| Locutus | Borg-like, **more armor**, **steampunk**, “evolving” (Bk4 ch9) | Stock TNG Locutus costume |

IP-flavored v1s live in `rejected designs/`. Ackbar-compliant re-prompts were promoted.

### What not to do to holotank

- Do **not** move plates onto Bob records  
- Do **not** add a media library register  
- Do **not** pull Three.js for stills  
- Do **not** give tier-C parentage a handsome room “to make up for it”  
- Measure weight before adding dozens more plates (~11 already ~half of page growth from pre-holo)

### Ship recipe (new plate)

1. Cite-check description in books (paraphrase only in notes).  
2. Generate/edit art (Imagine OK); Ackbar + face lock; no text labels on hulls.  
3. Encode offline → `assets/holo/<id>.webp` (~520px long edge).  
4. Add plate to `data/holo.json` (`id`, `about`, `kind`, `title`, `cite`, `spoil`, `note`).  
5. `make validate && make test` (or project’s validate + test entrypoints).  
6. Keep source / rejects under `ideas/` as desired; only WebP + json ship.

---

## 5. Spatial models — three languages (never fake one with another)

**One-line rule:**

> **Local chart is geometry. Wormholes are topology. Galaxy is context. Never use one to fake another.**

### A. Local chart (shipped)

- Euclidean, Sol-origin, real coordinates, spectral colour, magnitude sizing, year scrubber  
- Story bubble ~**≤ 49 ly** (farthest system on file: Eta Leporis ~48.8 ly)  
- **Do not** stretch axes to fit wormhole endpoints or remote civilizations  
- `systems.json` already notes: *book 5 wormhole network is not a distance graph and needs its own model*

### B. Wormhole network (not built — planned)

Book 5+ **expand reach**, not the Cartesian chart.

| Wrong | Right |
|---|---|
| Zoom the chart out and plot gates with invented ly | **Graph:** nodes + cited edges |
| Collapse SCUT, sublight, and wormholes into one map | Three networks, three jobs |
| Assume every terminus has Hipparcos coords | **Unlocated terminus** is valid (like systems without coords) |

Suggested shape (when implementing):

- Data e.g. `data/network.json` (or equivalent): nodes, edges with `cite`, optional control/era, spoil  
- **Register or Chart mode: NETWORK** — schematic/force layout, not light-years  
- Cross-link to Chart/Systems **only** when a node has real coordinates  
- Spoiler-gate edges the same way everything else is gated  
- Holotank may hold a **schematic still** of a gate; it is not the system of record  

Also keep **SCUT / BobNet** distinct (comms / presence). Boot already gestures at system list + connect; that is not the wormhole mesh.

### C. Galaxy view (wanted — planned; owner: 100% want)

- **Without** wormholes: mostly scale joke (“whole story &lt; 1 px of the galaxy”) + decoration  
- **With** wormholes: **where the mesh sits** + scale honesty  

Implement as **context mode** (on Chart or adjacent), not a second fake survey map:

- Local Bob bubble highlighted as a bead  
- Remote nodes only with book-backed rough placement; otherwise mark unlocated  
- Label artist’s impression / not survey precision (HYG ShareAlike already constrains embedded sky; MW art is separate honesty)  
- **Not** a full-bleed background on every view  

**Dependency order when building:** topology (network) first if remote nodes exist → galaxy context as frame. Galaxy alone does not replace the graph.

### D. Holotank vs chart

| Interactive local sky / scrubber | Chart register (canvas + SVG) |
|---|---|
| Topology graph | Network view (future) |
| Still image of a room/hull/specimen | Holotank plate |
| Optional: chart pane “feels like a tank” | Framing chrome only (brackets, `[HOLOTANK]` label) — not WebP pipeline |

---

## 6. Layout / IA (product, not a rewrite)

Already true:

- Product title is Registry  
- Default tab is Register  
- Genealogy is peer + research backlog  

Optional polish (low priority):

1. README/CLAUDE lead with “registry/console,” genealogy as specialty archive  
2. Soft labels on the three tab groups  
3. Default stays **Register** (Blog only if deliberately “news first”)  

**Do not:** invent a widget home dashboard; bury Genealogy; dramatic tab reordering for its own sake.

**Filters:** second-row density already improved (8 chips address-only). Further collapse only if still painful; feature stays.

---

## 7. Ships (Heaven design line) — art keepers, not yet in holotank

Five **design generations** in text (v1–v5). Heaven-6/8/9/10 are usually **ship names**, not “version 10.”

| Ver | Book delta (exterior) | Keeper |
|---|---|---|
| **1** | Elliptical, **ugly**, airlocks/doors, red/green/**blue** lights, SURGE ring, radiators separate (not ring flaps) · Bk1 ch12 | `ship-heaven-1.jpg` |
| **2** | Larger; bigger SURGE/reactor; shielding; **rail-gun**; buster storage · Bk1 ch13–17 | `ship-heaven-2.jpg` |
| **3** | Combat ~10 g, dual reactor, more busters, SUDDAR jam · Bk1 ch22 | `ship-heaven-3.jpg` |
| **4** | **Carbon-black**, near-zero albedo, radar-quiet — **not a new silhouette** · Bk2 ch50 | `ship-heaven-4.jpg` |
| **5** | “Virtual dreadnought”; cloaking-era plans · weak exterior text · Bk2 ch61 | *not generated* |

**Before shipping as `kind: vessel`:** honesty pass vs Bk1 ch12 — current renders may be **too pretty** and **missing blue** running lights. No flap-as-ring; no “SURGE DRIVE” labels (rejects exist).

Attach `about` to vessel records or system/Bob as data allows — same address pattern.

---

## 8. File map

### Concept art keepers (`ideas/`)

| File | Status / notes |
|---|---|
| `vr-*.jpg` (11 rooms) | **Shipped** as matching `assets/holo/vr-*.webp` (ids shortened) |
| `ship-heaven-1.jpg` … `4.jpg` | Keepers after honesty pass; **shipped** as `vessel-heaven-1`…`4` WebP |
| `beast-gorilloid-survey.jpg` | Photoreal **specimen** dual-mode (shipped as `specimen-gorilloid`); stroke card stays |
| `bob-original-1.jpg` | Portrait candidate — interpretive ~31; books give age/height/skin, not a face recipe |
| `bridget-replicant-1.jpg` | ~28, red hair, dimples · Bk3 ch41; face lock for Howard tropical plate |
| `archimedes-1.jpg` | Young Deltan, stone-only tools |

### Rejected (`ideas/rejected designs/`)

Heaven flaps/labels; too-different / too-subtle / too-dark ship takes; Riker Enterprise-y; Homer Groening-y; Locutus TNG; Earth-ape gorilloid. Names are descriptive — `ls` the folder.

### Shipped art (console)

| Path | Content |
|---|---|
| `assets/holo/*.webp` | 11 VR plates |
| `assets/bestiary/*.svg` | Stroke fauna (currentColor) |
| `assets/peoples/*.svg` | Species portraits (stroke) |
| `data/guppy.json` / sandbox | Pixel sprites |

`ideas/` JPGs are **not** injected by the build. Only `assets/` + data manifests ship.

---

## 9. Ordered next work

### A. Immediate content

1. ~~**Heaven vessels → holotank**~~ **done** (v1–v4 plates live).  
2. ~~**One dual-mode specimen**~~ **done** (gorilloid); extend pattern to more fauna/peoples as wanted.  
3. Optional: Linus “aged VR” second plate; Heaven-5 only if text supports a readable delta.  
4. **VESSELS register** (planned) — better home for fleet than Bob hang-ons.  

### B. Architecture when spatial scope grows

1. **Wormhole network data + topology view** (cited edges, spoil-gated).  
2. **Galaxy context mode** (scale honesty, local bead, unlocated OK).  
3. Do **not** merge (1)(2) into an expanded fake Cartesian chart.  

### C. Research / calendar

- Genealogy open items when in reading mode (`todo.json` Genealogy category).  
- **Book 6 (~2026-09-10):** flip `data/books.json` → `make corpus` → re-check CORPUS_CLAIMS → re-sweep parentage/memorium/leads. Don’t invent placeholders before the text.  

### D. Explicitly deprioritize

- Three.js / Bobmap clone for glow  
- Galaxy as only feature without network model  
- Home dashboard widgets  
- Re-implementing holotank on Bob fields  
- CRT overlay  
- Shipping every ideas plate at once  

---

## 10. How to work this repo

```bash
make validate    # before commit; some checks need .cache/ + books
make build       # → dist/index.html
make test        # build + Node suites against shipped page
make workbench   # multi phone sizes
make corpus      # after ebooks change
make scan-history  # before public: no book text in history
```

- Golden master / fail-closed suites — re-record snapshots only on intentional UI change.  
- Publish path already exists (Pages); license: code MIT, data/prose CC BY, skyfield HYG → **built page ShareAlike**.  
- Live: ashestoaltar.github.io/bobiverse-companion (+ custom domain per todo).  

---

## 11. Agent checklist on pickup

1. Read **this file**, then `CLAUDE.md`, then open items in `todo.json`.  
2. `make validate && make test` to confirm baseline.  
3. Prefer extending **holotank plates** and **data** over shell rewrites.  
4. Any new image: cite → encode WebP → `holo.json` → tests.  
5. Wormholes/galaxy: re-read §5 before writing code.  
6. Update **this file** when keepers, ship status, or architecture decisions change.

---

*Handoff for continuous ownership: code, data, tests, and image generation. Update when decisions change.*
