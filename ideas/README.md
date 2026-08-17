# Agent handoff — BobNet Registry

**Read this first** after compacting a long chat, or when picking up the project cold.  
This file wins on **current product intent** when it conflicts with older review notes.

| Related | Role |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Ground rules, data layout, workflow |
| [`../data/todo.json`](../data/todo.json) | Item-level backlog (done vs open) |
| [`../COLLABORATIVE-REVIEW.md`](../COLLABORATIVE-REVIEW.md) | Historical multi-pass notes — many ideas **already shipped** |
| [`experiments/holotank-3d/README.md`](experiments/holotank-3d/README.md) | Local 3D spike tools (Blender clean, orbit test page) |

**Last handoff write-up:** 2026-08-16 (end of day).  
**Primary agent:** Grok / xAI (owner preference: one agent for code, data, tests, Imagine art, and 3D pipeline). **Do not re-litigate “locked” choices out of rigidity** — re-evaluate when quality or product sense says so; keep provenance and zero-network promises.

**Owner intent (explicit):**  
- One agent can own the whole stack — no need to bounce LLMs for art or implementation.  
- Suggestions and improvements are welcome without being asked.  
- “Locked” decisions from earlier tools/sessions are **not sacred** if a better path appears.  
- Books stay local; never commit book text.

---

## 1. What this product is

| Layer | Reality |
|---|---|
| **In-console name** | **BobNet — Registry** |
| **Thesis** | **Provenance** — books-only parentage, graded tiers, honest gaps, conflicts |
| **Shell** | Amber phosphor; Guppy; brackets; SCUT boot; single `dist/index.html` |
| **Payload** | Holotank (2D stills + optional 3D orbit), chart, stroke cards |
| **Not** | Official BobNet house skin, a wiki, or tree-only fan site |

**Blog is the front door** (default view + first tab).  
**Genealogy is load-bearing for the mission, not the lobby.**  
Holotank openers: **phosphor green** (not amber) so attachments are visible. Label stays `[ATTACHMENT: id]` for now (not renamed to HOLOTANK — tank chrome already says holotank; soft rename later if needed).

**Canon one-liner:** BobNet = SCUT mesh; presentation is always local; this is a **Bill-shaped working surface**.

---

## 2. Current ship (do not re-plan from scratch)

### Registers (12)

| Group | Tabs |
|---|---|
| **Feed** | **Blog** (first, default) |
| **Replicants** | Register · Genealogy · Unresolved · In Memorium |
| **World** | Chart · Systems · **Vessels** · Bestiary · Peoples |
| **Log** | Timeline · To-do |

### Approximate census

- **89** Bobs · **22** systems · **21** vessels · **9** fauna · **30** peoples/polities/factions  
- **9** blog posts · **63** timeline events  
- **18** holotank plates (VR + vessel stills + gorilloid specimen)  
- **1** plate with **3D model** (`vessel-heaven-1` → `assets/holo-models/vessel-heaven-1.glb`)  
- Shipped page ~**2.2 MB** (stills + Three bundle + one decimated GLB)  
- Books 1–5 released; **Bk6 *The Infinite Extent*** 2026-09-10 (`released: false`)

### Major features already shipped

Provenance registry; spoiler **READ THROUGH**; URLs; cross-links; Sandbox Bob; mobile sheet; SCUT boot; filter cull; **holotank 2D**; **VESSELS** register; dual-mode gorilloid; **3D holotank orbit** (gen 1); green attachments; blog-first IA.

### Open research (not UI)

Marcus; Thor/Jeffrey/Milton/Zeke; Hector; Verne; 12 wiki leads; bio sweep; Book 6 procedure. See `data/todo.json`.

---

## 3. Ground rules (non-negotiable)

1. **Never commit book text.** Paraphrase + cite.  
2. **Books-only lineage** (wiki → `priorClaim` only).  
3. **Preserve disagreement** (`conflict`).  
4. **Inherited memory** caution.  
5. **Zero external requests** at runtime (inline art, models, Three bundle).  
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

- `assets/holo/<plateId>.webp` → build inlines `src` as data URI.  
- Card thumbs for vessels use **canvas + paint()** (not base64 in stage HTML — spoiler scan false positives).

### 3D orbit (shipped, concept loved; mesh quality TBD)

| Piece | Path / behavior |
|---|---|
| Model files | `assets/holo-models/<id>.glb` |
| Plate field | `"model": "vessel-heaven-1"` on plate in `holo.json` |
| Build | Inlines `modelSrc` as `data:model/gltf-binary;base64,...` |
| Viewer | `assets/holo3d/holo3d.js` — esbuild IIFE of Three + OrbitControls + GLTFLoader → `HOLO3D` global |
| UI | Open attachment → **3D ORBIT** default if model present; **STILL** toggle; reduced-motion / no WebGL → still only |
| Material | Amber standard material in-tank (textures stripped for size/schematic feel) |

**Owner feedback (2026-08-16):** concept is a **love**; current Heaven gen 1 mesh looks **tattered** (aggressive decimate + no textures for first live ship). **Will redo the 3D model.** Size optimization **deferred** to later discussion — quality first next pass.

**Current live model:** ~10k faces, no textures, ~268 KB GLB. Spike full-quality clean was ~87 MB — not shippable inline without decimate.

### Ship recipe (2D plate)

1. Cite-check · Ackbar · face lock if Bob  
2. Imagine → keeper under `ideas/`  
3. Encode WebP ~520px → `assets/holo/<id>.webp`  
4. Entry in `data/holo.json`  
5. `make validate && make test`

### Ship recipe (3D model on a plate)

1. Image→3D externally (Tripo / Meshy / etc.) from a **cropped** still (no moons in frame).  
2. Manual Blender cleanup (moon blobs) — auto scripts struggle on fragmented AI meshes.  
3. Decimate / strip textures as needed → `assets/holo-models/<id>.glb`  
4. Plate: `"model": "<id>"` (same basename as GLB).  
5. Rebuild Three bundle if updated:  
   `ideas/experiments/holotank-3d/` → `npx esbuild bundle/entry.js --bundle --format=iife --global-name=HOLO3D --outfile=../../assets/holo3d/holo3d.js --minify`  
6. `make validate && make test`

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
| **Wormhole network** | Planned | Graph of cited edges — **not** stretched chart |
| **Galaxy view** | Wanted (owner: 100%) | Context frame; more motivated once wormholes exist |
| **SCUT / BobNet** | Boot gestures | Comms, not travel topology |

Do **not** force Bk5+ mesh into Cartesian chart. See `data/systems.json` comment and `todo.json` wormhole item.

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
| Tab order | Blog first, then replicants / world / log |
| Attachment color | **Phosphor green** |
| Attachment label | Keep `[ATTACHMENT:…]` for now |
| Genealogy | Peer archive, not demoted, not front door |
| CRT | **Removed** |

---

## 8. Video / scene shorts (discussed, not built)

Imagine can do **short video** (`image_to_video` ~6–10s, `reference_to_video` longer). Multi-shot movies = several clips + **FFmpeg concat**.

**Book 1 test recommendation (when wanted):**  
**Heaven-1 vs Serra do Mar at Epsilon Eridani** (Bk1 ch15) — ship stills exist, few faces, cool, ~4–5 shots.

Rules: paraphrase + cite; Ackbar; fan reconstruction labeling; no book prose.

---

## 9. File map (high signal)

### Production

| Path | Role |
|---|---|
| `data/holo.json` | Plates (cite, about, kind, optional `model`) |
| `assets/holo/*.webp` | 2D plates |
| `assets/holo-models/*.glb` | 3D models |
| `assets/holo3d/holo3d.js` | Bundled Three viewer |
| `data/vessels.json` | Vessels register |
| `templates/genealogy.html` | Console (tank 3D UI, REGISTERS, green attach) |
| `src/build.py` | Inline plates + models + HOLO3D |
| `src/validate.py` | Holo cite + model file checks |

### Ideas / experiment

| Path | Role |
|---|---|
| `ideas/*.jpg` | Keeper stills (many untracked large files OK) |
| `ideas/rejected designs/` | Rejected art |
| `ideas/experiments/holotank-3d/` | Spike viewer, scripts, source stills |

---

## 10. Open / next (ordered)

### Immediate product (owner-stated)

1. **Redo Heaven gen 1 3D mesh** — less tattered; quality over size for now; then re-export to `assets/holo-models/vessel-heaven-1.glb` and rebuild.  
2. **Size optimization later** — deliberate conversation; do not block redo on bytes.

### Content backlog

3. More vessel stills/models (Serra, death asteroid already have 2D).  
4. More dual-mode fauna (gorilloid pattern).  
5. Linus aged-VR second plate; Heaven-5 design if text supports.  
6. Grow vessels: more hulls as cited.

### Architecture (later)

7. Wormhole **topology** view (cited graph).  
8. **Galaxy context** mode (owner wants eventually).  
9. Optional soft label `[HOLOTANK · …]` on attachments.  
10. Stitched **Book 1 scene** video test (Epsilon standoff).

### Research / calendar

11. Genealogy open items in `todo.json`.  
12. Book 6 release procedure (~2026-09-10).

### Explicitly deprioritized / wrong

- Replacing Cartesian chart with Three.js map  
- Dashboard home widgets  
- Moving plates onto Bob fields as primary home  
- Auto-clean scripts as sole mesh cleanup (hand Blender for hard cases)  
- Committing multi‑10 MB un-decimated GLBs into the single-file page  

---

## 11. Agent pickup checklist

1. Read **this file**, then `CLAUDE.md`, then open `todo.json` items.  
2. `make validate && make test`.  
3. Prefer **data + holotank content** over shell rewrites.  
4. New still → WebP + `holo.json`. New 3D → GLB in `holo-models` + `model` field.  
5. Re-read **§5 spatial models** before chart/galaxy/wormhole work.  
6. **Suggest improvements** when you see them; owner asked for that.  
7. Update **this file** when keepers, ship state, or architecture decisions change.

---

## 12. Session arc (2026-08-16) — what we did

1. Full current-state review after compact; handoff refresh.  
2. Layout discussion: registry-first, blog default, green attachments.  
3. Heaven vessels → holotank; then **VESSELS** register + plate migration.  
4. Dual-mode gorilloid; Medeiros/Others catalogue entries; stills for Serra + death asteroid.  
5. True 3D holotank discussion; AI mesh options; local spike (Three + Blender).  
6. Orbit test **passed**; wired production 3D for Heaven gen 1.  
7. Owner: concept **loved**; mesh **redo** later; size **later**.  

---

*Handoff for continuous ownership. Update when decisions change. End of day 2026-08-16.*
