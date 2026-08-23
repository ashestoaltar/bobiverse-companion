# Agent handoff — BobNet Registry

**Read this first** after compacting a long chat, or when picking up the project cold.  
This file wins on **current product intent** when it conflicts with older review notes.

| Related | Role |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Ground rules, data layout, workflow |
| [`../data/todo.json`](../data/todo.json) | Item-level backlog (done vs open) |
| [`../COLLABORATIVE-REVIEW.md`](../COLLABORATIVE-REVIEW.md) | Historical multi-pass notes — many ideas **already shipped** |
| [`experiments/holotank-3d/README.md`](experiments/holotank-3d/README.md) | Local 3D spike tools (Blender clean, orbit test page) |
| [`experiments/scene-ee-standoff/README.md`](experiments/scene-ee-standoff/README.md) | Book 1 scene video test: Heaven-1 vs Serra do Mar (Bk1 ch15) |
| [`experiments/heaven-raid/README.md`](experiments/heaven-raid/README.md) | **Parked PoC** shmup: Heaven vs Empire probes (Galaga×1942). v1 good; develop later. Not a Registry tab. |

**Last handoff write-up:** 2026-08-22 — **Phases A + A2 + B + C.1**: World hub, first impression, multi-file dist, **3D Chart**.  
**Primary agent:** Grok / xAI (owner preference: one agent for code, data, tests, Imagine art, and 3D pipeline). **Do not re-litigate “locked” choices out of rigidity** — re-evaluate when quality or product sense says so; keep provenance and **offline** promises (local multi-file OK). Still operating under **`CLAUDE.md`** (no `AGENTS.md` rename yet).

**Owner intent (explicit):**  
- One agent can own the whole stack — no need to bounce LLMs for art or implementation.  
- Suggestions and improvements are welcome without being asked.  
- “Locked” decisions from earlier tools/sessions are **not sacred** if a better path appears.  
- Books stay local; never commit book text.  
- **Near-term:** stick to **code / data / product** until the console is where the owner wants it; **Imagine stills and video later** (PoC only for now). Imagine is the expensive budget — prefer code composites over re-rolls for multi-subject scenes.

**Parked experiments (do not reopen unless asked):** Heaven Raid shmup · EE standoff video · populated moot hall · Heaven gen-1 mesh redo (wanted, not started).

---

## 1. What this product is

| Layer | Reality |
|---|---|
| **In-console name** | **BobNet — Registry** |
| **Thesis** | **Provenance** — books-only parentage, graded tiers, honest gaps, conflicts |
| **Shell** | Amber phosphor; Guppy; brackets; SCUT boot; single `dist/index.html` |
| **Payload** | Holotank (2D stills + optional 3D orbit), Chart / Gates / Galaxy spatial stack, stroke cards |
| **Not** | Official BobNet house skin, a wiki, or tree-only fan site |

**Blog is the front door** (default view + first tab).  
**Genealogy is load-bearing for the mission, not the lobby.**  
Holotank openers: **phosphor green** (not amber) so attachments are visible. Label stays `[ATTACHMENT: id]` for now (not renamed to HOLOTANK — tank chrome already says holotank; soft rename later if needed).

**Canon one-liner:** BobNet = SCUT mesh; presentation is always local; this is a **Bill-shaped working surface**.

---

## 2. Current ship (do not re-plan from scratch)

### Registers (15) — top strip is 12 tabs

| Group | Top tabs |
|---|---|
| **Feed** | **Blog** (first, default) |
| **Replicants** | Register · Genealogy · Unresolved · In Memorium |
| **Space** | Chart · Systems · **Gates** · **Galaxy** |
| **World hub** | **WORLD** → in-stage sub-nav: Vessels · Bestiary · Peoples · Persons (deep links `#vessels/…` etc. unchanged; `#world` aliases to vessels) |
| **Log** | Timeline · To-do |

Encyclopaedia drawers share one top tab so the spatial stack stays first-class. See setup-evolution plan (session plan.md): Phase A2 impression → Phase B multi-file delivery → Phase C 3D Chart flair.

### Approximate census

- **89** Bobs · **22** systems · **10** gate nodes / **4** paths / **7** summaries · galaxy (2 arms) · **21** vessels · **9** fauna · **30** peoples/polities/factions · **26** persons  
- **11** blog posts · **64** timeline events  
- **18** holotank plates (VR + vessel stills + gorilloid specimen)  
- **1** plate with **3D model** (`vessel-heaven-1` → `assets/holo-models/vessel-heaven-1.glb`)  
- Shipped as **`dist/index.html` + `dist/assets/`** — HTML holds data/UI; stills, GLBs, and Three live beside it (prefer `make serve`) 
- Books 1–5 released; **Bk6 *The Infinite Extent*** 2026-09-10 (`released: false`)  
- Todo: **11** open / **44** done

### Major features already shipped

Provenance registry; spoiler **READ THROUGH**; URLs; cross-links; Sandbox Bob; mobile sheet; SCUT boot; filter cull; **holotank 2D**; **VESSELS**; dual-mode gorilloid; **3D holotank orbit** (gen 1); green attachments; blog-first IA; **PERSONS**; **GATES** topology (found + WormNet); **GALAXY** context; spatial peers wired Chart ↔ Gates ↔ Galaxy; Bill blog **three-maps**.

### Open research (not UI)

Marcus; Jeffrey/Milton/Zeke; Hector collision; Verne narrative confirm (optional); **9** wiki leads (was 12); bio sweep; Book 6 procedure; **grow Persons** as cast weight justifies (portraits later).  
**2026-08-17:** Icarus+Daedalus → Bill (Bk3 ch6); Isaac priorClaim cleared. See `data/todo.json`.

---

## 3. Ground rules (non-negotiable)

1. **Never commit book text.** Paraphrase + cite.  
2. **Books-only lineage** (wiki → `priorClaim` only).  
3. **Preserve disagreement** (`conflict`).  
4. **Inherited memory** caution.  
5. **Offline at runtime** — no CDN / no network. Local relative assets under `dist/assets/` are fine; stroke SVGs still inline. 
6. **`ORDER` whitelist** on Bob fields.  
7. **No plate without a citation.**  
8. **Presentation is personal** (amber is Bill’s room).  
9. **Ackbar rule:** description-driven art, not trademarked reference clones (Guppy, Riker bridge, Homer cartoon, Locutus, etc.).

---

## 4. Holotank architecture

### Design thesis (keep)

- **Chrome vs payload:** drab file manager, rich opened file.  
- Word is **holotank** (not holosphere).  
- Overlay, not a media-browser tab.  
- Address-keyed plates in `data/holo.json`: `about: "vessels/heaven_g1"` etc.  
- **Three empty states:** no file / withheld / attachment button.  
- Kinds: `vr` | `vessel` | `specimen` | `portrait`.

### 2D stills

- Source: `assets/holo/<plateId>.webp` → build copies to `dist/assets/holo/` and sets `src` to a **relative path**.  
- Card thumbs for vessels use **canvas + paint()** (not embedding bytes in stage HTML — spoiler scan false positives).

### 3D orbit (shipped, concept loved; mesh quality TBD)

| Piece | Path / behavior |
|---|---|
| Model files | `assets/holo-models/<id>.glb` → copied to `dist/assets/holo-models/` |
| Plate field | `"model": "vessel-heaven-1"` on plate in `holo.json` |
| Build | Sets `modelSrc` to `assets/holo-models/<id>.glb` (relative) |
| Viewer | `dist/assets/holo3d/holo3d.js` — lazy-loaded via `ensureHolo3d()` on first 3D open |
| UI | Open attachment → load viewer → **3D ORBIT** if model present; **STILL** toggle; reduced-motion / no WebGL / load fail → still only |
| Material | Amber standard material in-tank (textures stripped for size/schematic feel) |

**Owner feedback (2026-08-16):** concept is a **love**; current Heaven gen 1 mesh looks **tattered** (aggressive decimate + no textures for first live ship). **Will redo the 3D model.** Quality first; multi-file delivery (Phase B) removes the inline-size ceiling.

**Current live model:** ~10k faces, no textures, ~268 KB GLB. Spike full-quality clean was ~87 MB — fine beside the page after Phase B; still prefer a clean mesh over shipping Tripo soup.

### Ship recipe (2D plate)

1. Cite-check · Ackbar · face lock if Bob  
2. Imagine → keeper under `ideas/`  
3. Encode WebP ~520px → `assets/holo/<id>.webp`  
4. Entry in `data/holo.json`  
5. `make validate && make test` (build copies into `dist/assets/holo/`)

### Ship recipe (3D model on a plate)

1. Image→3D externally (Tripo / Meshy / etc.) from a **cropped** still (no moons in frame).  
2. Manual Blender cleanup (moon blobs) — auto scripts struggle on fragmented AI meshes.  
3. Export → `assets/holo-models/<id>.glb` (quality first; no longer capped by HTML inline size).  
4. Plate: `"model": "<id>"` (same basename as GLB).  
5. Rebuild Three bundle if updated:  
   `ideas/experiments/holotank-3d/` → `npx esbuild bundle/entry.js --bundle --format=iife --global-name=HOLO3D --outfile=../../assets/holo3d/holo3d.js --minify`  
6. `make validate && make test` — open via `make serve` to exercise 3D

### Local spike tools (not production)

`ideas/experiments/holotank-3d/`:

- Source stills for Heaven-1  
- `npm run serve` → http://127.0.0.1:8765/ orbit test page  
- Portable Blender: `~/bin/blender` (4.2.8 LTS under `~/tools/`)  
- `./scripts/open-glb.sh models/foo.glb` — GUI import (CLI `blender foo.glb` **fails**; GLB is import-only)  
- `./scripts/clean-glb.sh` — island/floater heuristics; **unreliable on Tripo soup**; prefer hand delete for moon  
- **Orbit test: PASSED** for Heaven gen 1 quality before production decimate  

### AI 3D options (discussed)

| Path | Notes |
|---|---|
| **Web (Tripo/Meshy)** | Fast; used for first mesh |
| **Local TripoSR etc.** | Installable; this machine has **no NVIDIA CUDA** (Ryzen 5500U) — CPU-only, slow |
| **Imagine** | **2D + short video only**, not GLB meshes |

---

## 5. Spatial models (architecture — do not fake)

> **Local chart is geometry. Wormholes are topology. Galaxy is context.**

| Layer | Status | Role |
|---|---|---|
| **Local chart** | Shipped | Euclidean, Sol-origin, ~≤49 ly, real astrometry |
| **Wormhole / GATES** | **Shipped** | 10 nodes / 4 paths / 7 summaries; schematic paint (not ly). Found mesh + WormNet. Peers: Chart, Galaxy. See [`wormholes-inventory.md`](wormholes-inventory.md). |
| **Galaxy view** | **Shipped** | Impression disk; local ≤49 ly bead at true ratio; schematic GATES overlay. Not a survey map. |
| **SCUT / BobNet** | Boot gestures | Comms, not travel topology |

**Do not** force Bk5+ mesh into Cartesian chart. Do not merge the three surfaces. Bill’s `three-maps` post is the in-world statement of that rule.

---

## 6. Vessels register

**Shipped.** Canonical home for fleet art (not Bob dossiers alone).

- Data: `data/vessels.json` + `vessels.schema.json`  
- Kinds: `design` | `hull` | `class` | `weapon`  
- Lines: `heaven` | `colony` | `exodus` | `medeiros` | `others` | `other`  
- Design gen ≠ hull name (Heaven-2 is a ship; generation 2 is a design step)  
- Bob `vessel` field links via `match`  
- Holotank plates: `about: "vessels/<id>"`  
- Cards show still thumbs when plates exist; 3D only when `model` set  

**Catalogue includes:** Heaven g1–g4 designs + named hulls + colony/Exodus + Serra do Mar + Medeiros probe class + death asteroid + Others cargo/attendants.

---

## 7. Layout / IA decisions

| Decision | Choice |
|---|---|
| Default view | **Blog** |
| Tab order | Blog → replicants → **space** (Chart/Systems/Gates/Galaxy) → **WORLD hub** → log |
| World strip | **Option A (2026-08-22):** encyclopaedia under one WORLD tab + sub-nav; spatial peers stay top-level |
| First impression | Boot lands on `Ready · FEED`; dismissible strip legend (`bobnet-strip-legend`); editor post `you-are-here` (spoil 1) |
| Attachment color | **Phosphor green** |
| Attachment label | Keep `[ATTACHMENT:…]` for now |
| Genealogy | Peer archive, not demoted, not front door |
| CRT | **Removed** |
| Offline promise | **Local folder / local server, no CDN** — single self-contained HTML was a genealogy-era ceiling; retire as dogma in Phase B (relative assets + lazy load). Aesthetic unchanged. |

---

## 8. Video / scene shorts (PoC done — not shipping yet)

Imagine can do **short video** (`image_to_video` ~6–10s, `reference_to_video` longer). Multi-shot movies = several clips + **FFmpeg concat**.

**In this Grok Build session (ZDR team):** `image_to_video` failed (needs `output.upload_url` not exposed on the tool). **Workaround that worked:** lock keyframe stills here → owner animates in Imagine externally → FFmpeg concat in-repo.

**Book 1 PoC (2026-08-17) — parked, not shipping:**  
**Heaven-1 vs Serra do Mar at Epsilon Eridani** (Bk1 ch15).  
Dir: [`experiments/scene-ee-standoff/`](experiments/scene-ee-standoff/).  
Final cut: `experiments/scene-ee-standoff/out/ee-standoff.mp4` (~30s, 5×6s clips, 736×400).  
Lessons: seed frames from **locked ship stills**; multi-ship Imagine merges designs — **code composite** for standoff identity (Heaven + Serra); simple one-motion prompts per clip.

Rules: paraphrase + cite; Ackbar; fan reconstruction labeling; no book prose.

---

## 9. File map (high signal)

### Production

| Path | Role |
|---|---|
| `data/holo.json` | Plates (cite, about, kind, optional `model`) |
| `assets/holo/*.webp` | 2D plates |
| `assets/holo-models/*.glb` | 3D models |
| `assets/holo3d/holo3d.js` | Bundled Three viewer (holotank + Chart) |
| `assets/chart3d/chart3d.js` | Chart 3D environment (`BobChart3D`); lazy-loaded with Three |
| `data/vessels.json` | Vessels register |
| `data/persons.json` | Persons register — not Heaven Bobs. `label`/`species` vs `substrate`/`substrateFrom`; kinds person / ami / replicant. **Bio discipline in CLAUDE.md** — open cite chapter first; no invented jobs/AMI; no book-text lifts. |
| `data/persons.schema.json` | Persons schema (substrate enum includes `foreign_probe`). |
| `data/gates.json` | Wormhole topology (nodes / paths / summaries). Unlocated OK; not Chart. |
| `data/gates.schema.json` | Gates schema — `found` \| `constructed` \| `planned`; ferry_ly only on Bob-built. |
| `data/galaxy.json` | Galaxy context metadata (diameter, arms, spoil-gated note). |
| `data/galaxy.schema.json` | Galaxy schema. |
| `ideas/wormholes-inventory.md` | Cite-checked GATES/WormNet ledger + core-radial caveat. |
| `templates/genealogy.html` | Console (tank 3D, REGISTERS, Persons, Gates, Galaxy, spatial peers) |
| `src/build.py` | Inline plates + models + HOLO3D; companion registers |
| `src/validate.py` | Holo + Persons + Gates + Galaxy + blog `about:` (incl. gates/*, galaxy/*) |

### Ideas / experiment

| Path | Role |
|---|---|
| `ideas/*.jpg` | Keeper stills (many untracked large files OK) |
| `ideas/rejected designs/` | Rejected art (incl. moot populate attempts) |
| `ideas/experiments/holotank-3d/` | Spike viewer, scripts, source stills |
| `ideas/experiments/scene-ee-standoff/` | Bk1 ch15 scene video PoC (frames, clips, final mp4) |
| `ideas/experiments/heaven-raid/` | **Parked PoC** shmup v1 (busters, Serra boss, 5-wave loops) |

### Locked face / character / set refs (do not re-roll)

| File | Subject | Notes |
|---|---|---|
| `ideas/jeeves-locked.jpg` | **Jeeves** | Locked 2026-08-17. Cleese likeness, tuxedo + tails, coffee tray (Bk1 ch13; Bk2 ch1, ch32; Bk5 ch66). Source: `ideas/ref-john-cleese-jeeves.jpg` (Wikimedia). |
| `ideas/moot-hall-empty-angled.jpg` | Moot hall (empty) | Three-quarter con-seminar hall (Vortex-panel energy, slight 2100s), virtual boards, pub door. Front-axis prior: `moot-hall-empty-keeper.jpg`. **Not shipped** as holotank plate yet. |
| `ideas/ship-heaven-1.jpg` / `assets/holo/vessel-heaven-1.webp` | Heaven-1 | Live plate + keeper still. |
| `ideas/vessel-serra-do-mar.jpg` / `assets/holo/vessel-serra-do-mar.webp` | Serra do Mar | Live plate + keeper still. |
| `assets/holo/vr-bob1.webp` | Bob face | Holotank Bob. |

**Moot populated scene:** Parked 2026-08-17. Multi-Bob + Jeeves identity/scale/gaze unreliable in Imagine; code composite better for scale but not production-ready. Rejects: `ideas/rejected designs/moot-hall-populated-*`. Empty hall only until a better approach.

---

## 10. Open / next (ordered)

### Near-term focus (owner)

**Code / data / product first** — console where owner wants it before more Imagine burn. Art and video are parked PoCs. Spatial stack live; **World hub IA shipped (Phase A)**.

### Setup evolution (locked direction)

1. **A — World hub** — **done 2026-08-22.**  
2. **A2 — First impression** — **done 2026-08-22.**  
3. **B — Delivery** — **done 2026-08-22.**  
4. **C.1 — 3D Chart** — **done 2026-08-22:** Three.js Chart (lazy HOLO3D + `assets/chart3d/chart3d.js`), hover tooltips, click-to-focus; legacy canvas+SVG fallback. Gates/Galaxy unchanged; Heaven mesh redo still open.

### Product (when resuming craft)

5. **Redo Heaven gen 1 3D mesh** — preferably after Phase B so size isn’t the ceiling.  
6. Optional: ship empty **moot hall** plate only if/when it earns a holotank cite path.  
7. Optional: polish/ship EE standoff video later (PoC exists; not in `dist/`).  
8. Optional: **Heaven Raid** game pass later (parked PoC in `experiments/heaven-raid/` — v1 accepted).

### Content backlog

9. **Grow Persons** — more cast as weight justifies; portraits on `persons/<id>` later. Foreign probes on file: Henry, Medeiros, Matias Araújo.  
10. More vessel stills/models.  
11. More dual-mode fauna (gorilloid pattern).  
12. Linus aged-VR; Heaven-5 if text supports.  
13. Grow vessels as cited.  
14. Further GATES harvest only when a **named** hub/place/path is cite-checked (no anonymous gate rows).

### Architecture (later)

15. Soft label `[HOLOTANK · …]` on attachments if wanted.  
16. Optional holotank still of the galaxy impression (cite path required).

### Research / calendar

17. Genealogy open items in `data/todo.json` (11 open).  
18. Book 6 release procedure (~2026-09-10).

### Explicitly deprioritized / wrong

- Dashboard home widgets  
- Moving plates onto Bob fields as primary home  
- Auto-clean scripts as sole mesh cleanup (hand Blender for hard cases)  
- Burning Imagine on multi-face populated moots until a better pipeline exists  
- Faking wormhole geometry on the Euclidean chart (spatial honesty stays)

### Retired as dogma (now staged goals)

- **Three.js Chart** — was “wrong forever”; now **Phase C** (delivery unlocked)  
- **Single-file base64 ceiling** — **retired in Phase B**  
- **Multi‑10 MB GLBs** — wrong on first paint; fine beside the page under `dist/assets/`

---

## 11. Agent pickup checklist

1. Read **this file**, then `CLAUDE.md`, then open `todo.json` items.  
2. `make validate && make test`.  
3. Prefer **data + console product** over shell rewrites and over new Imagine work (owner preference until further notice).  
4. New still → WebP + `holo.json`. New 3D → GLB in `holo-models` + `model` field.  
5. Re-read **§5 spatial models** + `wormholes-inventory.md` before Chart/Gates/Galaxy work.  
6. **Suggest improvements** when you see them; owner asked for that.  
7. Update **this file** when keepers, ship state, or architecture decisions change.  
8. Scene video: `experiments/scene-ee-standoff/README.md`. Shmup: `experiments/heaven-raid/README.md` (**parked**).

---

## 12. Session arc (2026-08-16) — prior day

1. Full current-state review after compact; handoff refresh.  
2. Layout: registry-first, blog default, green attachments.  
3. Heaven vessels → holotank; **VESSELS** register + plate migration.  
4. Dual-mode gorilloid; Medeiros/Others; Serra + death asteroid stills.  
5. 3D holotank; local spike; orbit **passed**; production Heaven gen 1.  
6. Owner: concept **loved**; mesh **redo** later; size **later**.

---

## 13. Session arc (2026-08-17) — wrap

1. Moot hall research (Bill + books): con-seminar aesthetic, virtual boards, pub annex — **sparse canon, house reconstruction**.  
2. Empty hall stills locked (angled keeper); populated multi-Bob + Jeeves **parked** (rejects).  
3. **Jeeves** standalone locked (`jeeves-locked.jpg`).  
4. EE standoff **scene video PoC**: keyframes + owner Imagine clips + FFmpeg → `out/ee-standoff.mp4`. **Not shipping.**  
5. Efficiency note: Imagine expensive; code-first until product is ready; video later.  
6. Spike server was already off from prior session.

---

## 14. Session arc (2026-08-20) — wrap

1. Catch-up / compaction; moot + EE video stayed parked.  
2. **PERSONS** live (`4da00ae`) — Medeiros + Captain Matias Araújo; bio guardrails.  
3. **Spatial stack shipped:** GATES (topology + WormNet + DMZ/Hub Six/radial-core) · GALAXY (bead + overlay) · Chart↔Gates↔Galaxy peers · Bill **three-maps** blog.  
4. Canon: radials can go **toward** the galactic core; not “every gate leads there.” Ledger: `wormholes-inventory.md`.  
5. **Heaven Raid** v1 PoC (`fd655c3` / `521fedd`): Galaga×1942, busters, Serra boss, 5-wave loops. **Parked** — good first pass; develop later. Not a Registry tab.  
6. Untracked keepers under `ideas/` stay local — cite path before `dist/`.

---

## 15. Session arc (2026-08-22) — setup evolution A → A2 → B

1. Discussed overall feel / crowded World strip / first impression; reopened genealogy-era limits.  
2. Locked direction: World IA **Option A**; offline = local multi-file / no CDN; roadmap **A → A2 → B → C**.  
3. **Phase A:** WORLD hub tab + sub-nav; spatial peers stay top-level; deep links preserved.  
4. **Phase A2:** boot `Ready · FEED`; dismissible strip legend; editor post **you-are-here**.  
5. **Phase B:** `dist/assets/` for WebP/GLB/Three; relative URLs; `ensureHolo3d()` lazy load.  
6. **Phase C.1:** 3D Chart environment — `BobChart3D` / `ensureChart3d()`; tooltips; click-to-focus; legacy fallback.

### Resume next with (pick one)

- **C.2** — Heaven mesh redo / richer Gates·Galaxy interaction  
- Genealogy research / Grow Persons / Book 6 prep  
- Heaven Raid (only if asked)

---

*Handoff for continuous ownership. Phases A → C.1 shipped 2026-08-22.*
