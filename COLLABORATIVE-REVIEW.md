# Collaborative review — thoughts and ideas

**Review by Grok** (xAI), 11 August 2026  
**Scope:** read-only pass over the Bobiverse genealogy project. No code or data was changed.  
**Audience:** the project author; a second set of eyes, not a mandate.

This is a collaborative note: what looks strong, what is worth chewing on next, and a few mild watch-outs. Treat every idea as optional. Where this conflicts with the books, the books win; where it conflicts with your taste, your taste wins.

---

## Snapshot of what was reviewed

| Area | Impression |
|---|---|
| Provenance model (tiers O/T/P/C/X, `priorClaim`, `conflict`) | Core strength |
| Data (`bobs`, systems, bestiary, peoples, todo, guppy) | Careful and consistent |
| Build / validate / corpus pipeline | Defensive for good reasons |
| Console (`REGISTERS`, single HTML ship) | Architecture matches ambition |
| Tests (golden master, data-derived expectations) | Above fan-project norms |
| Docs (README, CLAUDE.md) | Exceptionally clear |

Rough coverage at review time: **87** replicants, **22** systems, **9** creatures, **5** species / **9** polities, one self-contained `dist/index.html`.

---

## What works really well

### Honesty as a feature

Most fan genealogies quietly invent edges. This project does the opposite: it dropped parentages it could not cite, kept them as `priorClaim` leads, and put the awkward score on the page (34 of 87 traces reach Bob-1). That restraint is what makes the registry trustworthy.

The **C vs X** distinction is especially good. "We never learned" and "Starfleet deleted it" are different facts; the UI treats them that way instead of collapsing both into a shrug.

### The books-only rule, enforced by machinery

`validate.py` is not decoration. Citation re-checks against the corpus, generation stored only when the tree cannot derive it, HIC prefixes agreeing with origin, Bill's stated distances from 82 Eridani as a regression test, mention counts re-derived rather than trusted — these are the habits of someone who has already been burned and built guards.

The Loki mis-reparenting story, written into `conflict` and CLAUDE.md, is the right culture: record your own mistakes.

### Architecture that matches the ambition

- Single self-contained HTML, zero network requests
- `REGISTERS` list so a new companion view is one entry plus one render function
- Golden-master snapshots so aggressive UI refactors stay safe
- `extract.py` never auto-writes; human judgment stays in the loop for inherited-memory traps
- Corpus cache refuses to downgrade after the missing-books incident

The long-game note in CLAUDE.md is right: this is already shaped like a **full Bobiverse companion**, not a genealogy with extras bolted on. Bestiary and peoples already prove the peer-register model works.

### Documentation

README and CLAUDE.md together are better than most commercial READMEs. The recurring lesson — *a word that looks like a name usually isn't one* — and the exhausted-sweeps list (POV, moots, renames, factions) are gold for future-you and anyone who ever joins.

### Voice

Bracketed machine speech vs unbracketed annotation, serial-first identity, Guppy's deadpan to-do, phosphor art with `currentColor` — the console feels in-world without pretending to be canon UI. That is hard to get right.

---

## Ideas worth chewing on

None of these are required. Ordered roughly by impact-per-hour if you ever want a shortlist.

### 1. Cross-register links as first-class navigation

The data already supports click paths: `origin` / `visited` / `lostAt` → systems, creatures → worlds, peoples → contact with Bobs. Something like **Herschel → Epsilon Eridani → gorilloids → Deltans** would make the companion feel whole long before every register is "done." Even one-way links ("Bobs built here", "fauna of this world") would pay off.

### 2. Timeline as a register (or a mode)

Chapter dates, `born`, chart years 2133–2345, and systems' `first_year` / `last_year` already exist. A chronological scrubber of *events* (activations, losses, first contact, Starfleet purge, Others war) would sit naturally next to the star chart and answer questions the tree cannot. Could start as the existing year lighting expanded with a thin event list derived from fields you already store.

### 3. URL state / shareable dossiers

`?bob=riker` or `#system/82_eridani` would make the single-file app shareable and bookmarkable without a backend. Cheap win when you publish.

### 4. Research workflow inside the console (optional)

`extract.py` is excellent CLI research tooling. A "leads" mode on tier-C dossiers that shows *where to look next* (from `priorClaim`, plus paraphrased research notes — never raw book text) would turn the Unresolved register into a workbench. Same copyright bar you already hold: citations and paraphrase only.

### 5. Ship designs as the next register

Already on the roadmap. Same pattern as the bestiary: corpus survey first, kill false positives (Heaven-*n* extrapolations already taught that lesson), stroke-only SVG optional. Existing designations and vessels are a seed list, not the register.

### 6. Factions as polities

Your own todo flags this. Lean **yes**: list Starfleet, Skippies, Gamers, and Borg in peoples as polities, keep `faction` on the Bob for filtering, and link both ways. They cut across trees, which is exactly why they behave like polities.

### 7. Book 5 wormhole network as a separate model

You already call this out. Do not force it into the Cartesian chart. A second "topology" view (SCUT / wormhole graph, no fake distances) keeps both the math and the fiction honest. Local chart stays local; network chart is a peer.

### 8. Publishing path

When you want others to open it:

| Piece | Suggestion |
|---|---|
| Code + `data/*.json` | GitHub + GitHub Pages (or any static host) — `dist/index.html` is the whole site |
| License | Dual: code MIT/Apache; data CC0 or CC BY (facts + your prose notes); skyfield is already CC BY-SA |
| Books | Never ship; keep "bring your own DRM-free ebooks" as documented |
| HYG ShareAlike | You already note it; a root LICENSE that states the split will save future surprise |

### 9. Onboarding for non-obsessives

Power users will love the tiers. Casual fans may need a one-screen "how to read this" (once, or a collapsed legend): ○ original, ◆ cited parent, ◈ partial, ✕ unknown, ▨ expunged. Keeping the table free of a loud legend so gaps feel like missing data is still right — offer help so the honesty lands instead of looking like a broken tree.

### 10. Template size

`genealogy.html` is large and growing. Not urgent — golden masters make splits safe — but when ships and a timeline arrive, consider extractable register modules that the build concatenates. Same single-file ship, easier human editing. Only when it hurts.

### 11. Accessibility polish (later)

Reduced motion, `aria-*` on tabs/selection, and a skippable boot are already there. Next tier when you care: focus rings that survive the CRT look, Escape to close the dossier (if not already), and contrast checks on the dimmest tier marks in the same spirit as `legibility.test.js`.

### 12. Mobile

`overflow: hidden` plus a fixed dossier column will fight phones. Not required for a desktop BobNet aesthetic, but a full-screen dossier sheet on narrow widths would make the thing usable on a couch.

### 13. Content: Bill's blog

When site updates go out in Bill's voice, three ready-made posts: the **Surly** discovery, the **Loki** own-goal, and the **landers / spits / boojums** false-positive purge. Funny, in-voice, and they teach the project's epistemology without a manifesto.

### 14. Contribution model (if you ever open it)

If people send PRs: require `cite` for any new `parent`, run `make validate` and `make test`, never accept raw book quotes in `note`. A short CONTRIBUTING.md that says "the books are the only source; we record disagreement" will filter helpful-but-wiki-shaped patches.

### 15. Suggested priority if picking work by impact

1. Cross-links between registers (navigation glue)
2. Biographical sweep for high-POV Bobs (Herschel, Marcus, and company)
3. Marcus + Hector lineage mysteries (story hooks)
4. Ship register (new toy, same proven pattern)
5. Chase the 30 `priorClaim` leads (slow, high integrity value)
6. Illustrate the rest of the bestiary (delight)
7. Galaxy-scale view last (correctly marked decoration in todo)

---

## Mild tensions / watch-outs

Not problems yet — things to keep an eye on.

- **53 terminating traces** is honest. If the project becomes socially visible, pressure to "fill in" from the wiki will return. The machinery is the resistance: keep `priorClaim` non-rendering unless the books promote it.
- **Single-author voice** in notes is a strength now. If notes proliferate, the Voice section in CLAUDE.md is already half a style guide — lean on it so notes do not drift corporate.
- **Fiction-only systems** (e.g. places without real astrometry): keep the chart's "nothing invented" promise true for the sky; mark or separate anything that is not a real star.
- **Tests derive counts from data** — excellent. Watch the opposite failure mode: a bug that empties a register still matching "0 of 0." Occasional mental check that critical lists fail closed.

---

## Bottom line

This is one of those projects where the *process* is as impressive as the artifact. A classic fan-wiki failure mode — confident wrong trees — has been turned into a console that teaches how knowledge works in a series full of inherited memory, purged databases, and unreliable first-person narration. That is thematically perfect for the Bobiverse and technically rare.

The path to "reference work next to the old Star Trek companions" is already sketched, and the register architecture means you can grow sideways without rewriting the core. Protect the books-only bar, keep building peer registers, and ship the single HTML when you want company.

---

## Follow-up: richer media, holotank, and extensibility

*Added in the same collaborative pass after a short design conversation. Still thoughts only — no implementation commitment.*

### Grok Imagine from this environment

Yes — from the Grok Build session, **Grok Imagine** is available for image work (`image_gen` for new images, `image_edit` for transforms). That does not change the project's ship rules:

- The console promises **no external requests** and inlines art as SVG / `data:` URIs, so Imagine output would need to be **saved, converted or inlined, and wired through the build** (same path as bestiary art).
- Stroke-only phosphor-style SVGs (dragon, kraken) are a different pipeline than photoreal Imagine output. Imagine is strong for concept art, posters, or optional raster plates; pure CRT line art may still be happier as hand/SVG work.
- Copyright / likeness: keep avoiding the Ackbar comparison for Guppy (the portrait is already designed around that constraint).

Imagine can sit inside a future media model as concept reference or as optional full-colour "manny still / VR snapshot" attachments — not as a rebrand of the amber shell.

### Richer media while staying BobNet-faithful

**Opening a file and actually seeing something is realistic in-universe.** BobNet is the network, not a terminal protocol; presentation is whoever's VR you are standing in. A phosphor registry is a valid *skin* (yours, or "Bill's genealogy terminal"), not a law of physics.

When Bobs need to *see* something, the series already has charts, sensor plots, SUDDAR returns, manny cameras, and VR reconstructions. So "open dossier → open attachment → look at a thing" is not a genre break. It is closer to how they work than a pure TTY library catalog.

The load-bearing canon bits that should stay are not visual:

| Keep | Why |
|---|---|
| Brackets = machine / AMI | Voice of the system |
| Serial-first identity | Guppy's rule |
| Provenance / missing data as missing | Especially Starfleet purge |
| No pretending this *is* the shared lobby | There isn't one |
| Someone's aesthetic, not "official BobNet chrome" | Presentation is personal |

**Chrome vs payload.** Two good instincts are slightly at war: sparse CRT honesty, and in-world realism that a working tool would show plates and schematics. They stack if imagery is **payload**, not **chrome**:

- Chrome = shell, tabs, phosphor, Guppy, bracketed metadata → stay terminal.
- Payload = "file" the matrix opened → can be richer without the whole app becoming a glossy wiki.

That is how a real workstation feels: drab file manager, rich document.

**Ways you could tweak later (if ever):**

1. **Attachment model (most faithful)** — Dossier stays text-first. Art is `[ATTACHMENT: dragon.plate]` / type line, then a panel that is clearly the opened file. Empty plate stays "no file on record."
2. **Two fidelity modes** — REGISTRY (current) vs optional VIEWPORT / VR PREVIEW for one selected object. Cover story: still Bill's admin skin; "open in virt" for a local look. CRT toggle already teaches presentation-is-optional.
3. **Native vs imported media** — Registry chrome amber mono; schematics stroke/`currentColor`; photographs and full-colour maps as inlined raster *evidence files*, not a rebrand.
4. **Don't tweak the shell at all** — Also coherent. Dashed empty plates already say this is a provenance-first archive. Enriching everything can soften the honesty that is the product.

**Should you?** Not as a priority, and not as a redesign of the chrome. Sweet spot if anything: keep the amber shell sacred; allow **one opened attachment** in the dossier to be richer; label it as machine-attached media; never let missing lineage get a pretty invented tree to match.

### Canon vocabulary: not holosphere — **holotank**

"Holosphere" does not appear in the books (zero corpus hits). What Taylor uses for "look at the 3D thing":

| Term | Role | Rough frequency in corpus |
|---|---|---|
| **hologram** / **holographic** | Image floating over the desk / in the air | common |
| **holotank** | Dedicated 3D display for schematics, systems, tactical | ~34 |
| **holoview** | Same family (rare) | rare |
| **VR** / **virt** | Full environment you're *in*, not a file you open | very common |

Typical early-book texture: holographic ships and systems floating over the desk; *schematic in the holotank*; *"Let's get the mission status up in the tank, Guppy."*

If a richer view mode is ever labelled in-console:

- **`[HOLOTANK]`** or **open in holotank** — best match for tactical / system / schematic views
- **hologram** — fine for a floating dossier plate
- **VR / virt** — only if stepping into a full room, not inspecting an attachment

**Holotank** is the distinctive Taylor word; holosphere is a plausible coinage that isn't Bobiverse lexicon.

### Is the infrastructure there to add holotank later?

**Mostly yes.** You can add a holotank-style "open the file and look" later without redesigning the project. You would still rebuild the single HTML and re-record snapshots for intentional UI changes — normal here, not a greenfield rewrite.

**Already in place:**

| Piece | Why it helps later |
|---|---|
| **`REGISTERS` list** | New view = one entry + render function (+ optional `paint` / `dossier` / `onResize` / `onClick`). Chart already uses those hooks. |
| **Per-register dossier** | Chart, bestiary, peoples each claim the right pane; default falls through to the Bob dossier. Holotank can be a register *or* a dossier mode. |
| **`load_art` / `assets/<register>/`** | Stroke SVG inlined at build; comments already allow raster as a `data:` URI. Same path as dragon/kraken. |
| **Chart** | Closest existing holotank: canvas, year scrubber, real coords, system dossier. Pattern for "rich payload, amber chrome." |
| **Golden masters + `registers.test.js`** | Refactors stay checkable; synthetic-register test discourages `state.view === '...'` special cases. |
| **Validate gates build** | New media can stay honest without inventing parentage to match pretty art. |

**Not there yet (and does not need to be pre-built):** nothing named holotank; no generic attachment model on Bobs; no dual REGISTRY / VIEWPORT toggle; no second media type beyond bestiary/peoples art and the chart canvas. Those are product choices, not missing foundations.

**Watch when wiring Bob-level media:** `ORDER` is a whitelist for `bobs.json`. If holotank metadata ever lives on a Bob record (`art`, `attachments`, …), it must go in schema **and** `ORDER`, or the build drops it silently (already fixed once for `alias` / `priorClaim`). Companion registers use their own inject path, so ship/bestiary-style art does **not** need `ORDER`.

**Likely addition shapes (no big bang):**

1. **Attachment in dossier** (smallest) — creature/ship plates; reuse `art` + optional raster; label `[HOLOTANK]`.
2. **Viewport on chart / system** — "mission status up in the tank"; extend chart dossier or paint layer.
3. **New register** — only if holotank becomes a cross-type media browser; same cost as bestiary/peoples.

**Would break things if you are careless:** special-casing `state.view` outside `REGISTERS`; hand-editing art into JSON instead of `assets/` + build; external image URLs (build already refuses external reach for SVG); shipping Imagine output without inlining; updating snapshots in a separate commit from the real change.

| Question | Answer |
|---|---|
| Rebuild the whole stack? | No. |
| Touch lineage / provenance? | No, unless art lives on Bob records. |
| New register / dossier mode later? | Yes — same path as bestiary/chart. |
| Free forever with zero work? | No — normal `make build`, tests, snapshot update when UI changes. |
| Decision lock-in now? | None. CRT shell and chart already prove the pattern. |

**Bottom line on holotank:** infrastructure is there enough that it is a **feature later**, not a **platform rewrite**. No need to pre-build it. When wanted, register / dossier / art / chart are the right hooks, and the golden master is what keeps "without breaking something" true.

---

## How this document should be treated

- **Not** a design doc or a commitment to implement anything above.
- **Not** a substitute for CLAUDE.md or the research backlog in `data/todo.json`.
- Safe to edit, argue with, strike through, or delete. It is a conversation starter from an outside pass, not project canon.

*Review by Grok — collaborative thoughts only.*
