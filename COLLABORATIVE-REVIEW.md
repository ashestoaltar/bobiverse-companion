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

### Concept art experiment (same session)

Grok Imagine was used exploratively for a Deltan / Archimedes concept, grounded in the books' first-sighting description (bat/pig mashup, long spiderish limbs, light brownish-gray to orangey-tan fur, expressive ears). Edits corrected Imagine's habit of inventing handled tools: the books have most Deltans holding **naked stone**; Archimedes starts with a couple of rocks splitting flint.

**Keeper (not wired into the build):** `ideas/archimedes-1.jpg` — near-finished flint point / knife, modest cobble striker, no handle. Session WIP only; quarantine under `ideas/` is correct until an attachment / illustration pipeline exists.

---

## Second pass — project review (later the same day)

**Scope:** read-only after further project commits and the session above. Opinions only.

### Snapshot at second pass

| Area | Then |
|---|---|
| Replicants | **87** — roughly O1 / **T50** / P1 / **C33** / X2 |
| Traces to Bob-1 | **52** reach, **35** terminate (was 34/53 before back matter) |
| Systems | 22 |
| Bestiary | 9 creatures, 2 illustrated |
| Peoples | 14 entries |
| Registers | **8** (In Memorium added) |
| Research backlog | 11 done of 35 |
| Ship story | single HTML, Pages workflow, LICENSE split, URL hashes, mobile first pass |
| Session artifacts | this file; `ideas/archimedes-1.jpg` |

The headline change since the first review is not more chrome. The tree got **more honest and more complete** at once: book 2/4's printed Genealogy was always on the page; the parser had walked past it; eighteen parentages promoted under the same books-only rule. Twelve wiki leads still do not get edges.

### What is strongest now

1. **Provenance paid rent** — dropping the online tree was right; promoting from printed appendices is the vindication. Re-running sweeps against back matter is the boring half that makes the flashy half trustworthy.

2. **In Memorium** — best new idea since tiers. Separates parentage from fate; refuses to call the living dead; keeps three permanently blank rows for failed transfers at 82 Eridani (known count, unknown names). Enforcing Taylor's spelling *Memorium* in validate is peak project energy.

3. **Ship readiness without selling out** — URL hashes (`#chart/82_eridani`, `#memorium/homer`); LICENSE.md split (MIT code / CC BY data+prose / HYG CC BY-SA); Pages gated on public repo; mobile first pass. Difference between a personal tool and something you can send.

4. **Process** — outside review items taken onto the backlog; notes audited so prose does not restate derived numbers; prior art surveyed. `url.test.js` walks every register the way `registers.test.js` walks hooks.

5. **Architecture still holds** — In Memorium and URL coverage fit `REGISTERS` without the old multi-site special-case tax.

### Opinions on direction (second pass)

**Keep:** books-only promote-when-the-page-says-so; blankness as data; peer registers; fail closed when a silent-failure class appears.

**Don't rush:** holotank / Imagine art (quarantine is right); galaxy view (decoration); spoiler gating — do it *before* wide publish if first-timers matter, not as a bolt-on after deep links exist.

**Watch-outs:** template growth; social pressure after publish to complete remaining parentages; three different "we don't fully know" axes (fate / status / priorClaim) need labels that teach; decide later whether this review file and `ideas/` are repo story or scratch.

**Suggested impact order (opinion):** (1) publish when the gate is green, (2) cross-register links, (3) Marcus / Hector / remaining C, (4) biographical sweep, (5) spoiler gating if first-timers are audience, (6) art / holotank after the archive is shareable.

**Bottom line (second pass):** closer to a citable mini-companion with a conscience than a fan wiki with a skin. **52 of 87** is better than a pretty false **87 of 87**. Incomplete and legible beats complete and invented.

---

## Deep review — HTML console and mobile

**Scope:** read-only pass over `templates/genealogy.html` (~2.1k lines; ship ~299KB). Focus on mobile viewing and improvement opportunities. No changes.

### What already works well

| Area | Assessment |
|---|---|
| Viewport / `100dvh` | Sensible; height *and* width break the fixed shell |
| Mobile = scrolling document | Correct diagnosis of landscape collapse (furniture ate the scroll row) |
| Chart gestures | Multi-pointer: one finger rotate, two pinch+pan, tap-vs-drag (`moved < 8`) |
| Star hit targets | Transparent stroke on coarse pointers |
| Chart stage height | `flex:none` + `min(58dvh, 420px)` — the flex-basis:0 lesson is documented and correct |
| Dossier sheet | Bottom fixed sheet with max-height is the right mobile pattern |
| CRT / reduced motion | Prefer-reduced-motion skips boot; CRT toggle persisted |
| Deep links skip boot | Hash arrival = no six-second wait |
| Register architecture | Tabs / dossier / paint stay data-driven |

The CSS comments (why height is the trigger, why `flex:1` killed the chart) are unusually good engineering notes. Keep them.

### Critical / high — mobile behavior

#### 1. Dossier visibility only keys off `state.selected` (defect)

```js
doss.hidden = window.innerWidth <= 860 && !state.selected;
```

Chart / bestiary / peoples selections live in `CHART.sel`, `state.beast`, `state.people`. On a phone:

- Tap a beast → `render()` → dossier stays **hidden** even though the dossier renderer would fill it  
- Chart sets `hidden = false` on pointerup, then **any later `render()` hides it again**  
- Same class of bug for peoples and system jumps from other registers  

URL code already has `selOf(view)`. Mobile show/hide should use **"does this view currently have a selection?"**, not only `state.selected`.

**Close / Escape incomplete the same way:** `#d-close` and Escape only clear `state.selected`, not chart/beast/people selection. **Highest-priority mobile fix** if only one lands.

#### 2. Dossier sheet vs page scroll

Fixed sheet over a scrolling document with no scrim, no scroll lock, no tap-outside-to-close. Close control is **24×24px** (under ~44px guidance). Sheet `64dvh` fights chart `58dvh`. Add: scrim, overflow lock while open, larger close hit area, `padding-bottom: env(safe-area-inset-bottom)`, optional taller sheet.

#### 3. Chart may trap vertical page scroll

`touch-action: none` on `.chart-svg` is required for gestures, but a ~58vh non-scrolling band on a document-scroll layout blocks one-finger page scroll. Already flagged in `data/todo.json`. Options: claim gesture only after movement threshold; edge zones; slightly shorter chart; verify on device before redesigning.

#### 4. Tab bar does not fit eight registers

REGISTER · LINEAGE · UNRESOLVED · CHART · BESTIARY · IN MEMORIUM · PEOPLES · TO-DO — multi-row fortress or overflow on ~390px. Opportunities: horizontal scroll tab strip; short labels under 860px; filters disclosure; keep search+filters on a second row deliberately.

#### 5. Filter chips + long search placeholder

Large filter set = tall chip cloud before content. Placeholder is long. Collapse filters; shorter placeholder ("name, desig, system…"); optional sticky compact toolbar.

### High — chart performance on phone

#### 6. Full chart rebuild on every pointermove

`paintChart()` rewrites SVG `innerHTML` and repaints ~5k-star canvas on drag. Throttle to `requestAnimationFrame`; skip or sparsify sky during drag; consider default **CRT off** on `(pointer: coarse)`.

#### 7. Label declutter at phone width

Narrower pane drops more labels (Gliese 54 / Zeta Tucanae / Gliese 877 already stack). Mobile-specific default camera or "selected + neighbors" labels.

#### 8. Year scrubber under thumb

Full-width order is good. Add hit padding, optional ± year buttons for precision.

### Medium — layout of other registers

#### 9. Register table

`min-width: 600px` + `.scroll-x` is correct. Sticky thead inside nested scroll is flaky on iOS when the *page* scrolls. Optional card list for narrow screens is a larger lift. Verify `.opt` hides the right columns.

#### 10. Lineage tree

`.tree { white-space: pre }` will horizontal-overflow deep branches. Needs own `overflow-x: auto` (like the table) or tighter mobile indent.

#### 11. Memorium breakpoints

Different rules in the shared height/width query vs width-only query; landscape can hit one path and not the other. One coherent mobile layout.

#### 12. Bestiary / peoples

Grids are fine. Large dossier art inside a bottom sheet may force excess scroll — smaller art on mobile.

#### 13. Idle Guppy

Empty dossier hidden on mobile is fine. Hop `.edge { white-space: nowrap }` can squeeze names in a narrow sheet.

### Medium — document shell and platform

#### 14. No HTML5 envelope

File starts at `<meta charset>` — no doctype / `html` / `body` / `lang`. Risk quirks-mode edge cases; miss `theme-color`, `color-scheme: dark`, safe-area meta. Cheap for Pages; one-time snapshot update.

#### 15. Safe areas

No `env(safe-area-inset-*)`. Fixed dossier bottom will clip under the home indicator.

#### 16. iOS input zoom

Body drops to **12.5px** under 860px; search inherits it. iOS zooms focused inputs under 16px. Fix: `input { font-size: 16px }` on small screens.

#### 17. Boot copy

"CLICK OR PRESS ANY KEY" → also **TAP TO SKIP** on touch. Boot pre wrapping already well done.

#### 18. Clear selection on touch

Keyboard help is correctly hidden; rely less on Escape — large close / scrim.

### Lower priority

| Topic | Note |
|---|---|
| CRT on mobile | Scanlines + multiply cost GPU and readability; default off on coarse pointer |
| `aria-live` on whole dossier | Can be noisy; prefer status line only |
| Tabs a11y | tablist present; no aria-controls / roving tabindex |
| Focus management | Open dossier should focus close/title; close should restore row focus |
| `visualViewport` | iOS URL bar show/hide can leave chart gaps |
| Single 2k-line template | Snapshots protect refactors; not a runtime issue |

### Mobile end-to-end friction

1. Chrome height (banner + search + 8 tabs + chips) before first content  
2. Selection/dossier bug for non-Bob registers  
3. Chart as scroll trap  
4. Table side-scroll discoverability  
5. Sheet close target small; no tap-outside  
6. Deep link to `#bestiary/dragon` may fill DOM while sheet stays hidden  

### Suggested priority if working mobile next

| Pri | Item | Effort | Impact |
|---|---|---|---|
| **P0** | Fix mobile dossier `hidden` + close/Escape via `selOf(view)` | Small | Unblocks bestiary/peoples/chart dossiers on phone |
| **P0** | Device-verify chart scroll trap + chart stage height | Check | Confirms or closes open todo |
| **P1** | Scrollable/short tabs; collapse filters | Medium | Usable chrome |
| **P1** | Dossier sheet: safe-area, larger close, scrim, scroll lock | Medium | Feels like an app sheet |
| **P1** | iOS input 16px; HTML5 shell + theme-color | Small | Platform polish |
| **P2** | rAF throttle chart; CRT default off on coarse pointer | Medium | Jank/readability |
| **P2** | Lineage overflow-x; table edge affordance | Small | Horizontal content |
| **P2** | Boot TAP TO SKIP; mobile chart label policy | Small | Details |
| **P3** | Card layout for register on narrow screens | Larger | Delight |
| **P3** | Focus management / quieter live regions | Medium | A11y |

### Bottom line (HTML / mobile)

First mobile pass was **structural and correct**. Next pass is less "make it render" and more **"make every register open a dossier, keep chrome short, and stop the chart from fighting the document."** The P0 selection/`hidden` mismatch is a **defect**, not an enhancement — on a phone, bestiary and peoples can look broken even though the desktop path works.

Highest-leverage sequence: **fix dossier visibility → real-device chart scroll check → tab/filter chrome → sheet polish.**

---

## Canon audit — BobNet in the books

*Corpus-checked (books 1–5). Paraphrase only.*

### What BobNet is

**BobNet is the network, not a place and not a look.** Bill coins **Bobiverse** and **BobNet** together (Bk1 ch59). First “Welcome to BobNet” is Bill over **SCUT** into someone else’s VR: instant (or near-instant) interstellar comms (Bk1 ch45; Bk2 ch6).

| BobNet is | BobNet is not |
|---|---|
| SCUT-backed interconnect between matrices | A single shared lobby or official skin |
| Instant presence *inside someone’s VR* | A corporate website with house style |
| Blogs, public features, accounts, domains, firewalls | Pure text TTY as the only UI |
| Something you can scan, mirror, partition, attack, rebuild | Immutable “the console” |

### How Bobs experience it

- **Personal VR always** — library, bridge, log cabin, Deltan village; visitor appears *in your* metaphor. Undecorated = blue room, no window, hard floor (Bk1 ch17). Popping in uninvited is “a little rude” (Bk1 ch45) → no neutral lobby. Shared venue = **moot VR**, reconfigured per occasion.
- **Social layer** — blogs (primary news surface), public features + blogs for guests (Bk2 ch32), domain + firewall, accounts (e.g. Bridget), later partitions and Starfleet/Skippy attacks on **BobNet software**.
- **Identity** — metadata tags; Guppy: serial number or nothing (Bk3 ch21).
- **Machine voice** — square brackets (`[STATUS: Ready]`, `[Incoming SCUT…]`, `[HIC16537-1]`). Unbracketed = people.
- **Genealogy / archives** — In Memorium (Bill/Guppy); Starfleet purged **genealogy** and location from **databases** (Bk4 ch33); Bill’s **genealogy investigations** (Bk5 ch51). Function is canon; productized tab bar is fan presentation.

### Scorecard vs this project

**Strong yes:** brackets / Guppy / serials; In Memorium spelling + backup-vs-hull; missing lineage including purge; Bill · EE framing; no invented shared lobby; holotank as payload; CRT as *someone’s* taste.

**Soft inventions (OK if labeled):** amber CRT skin; eight-register IA; “Lineage Registry” as product name (later softened — see rename below).

**Watch-outs:** don’t imply one official BobNet look; blogs are the in-world center of gravity, genealogy is Bill’s specialty; public vs private exists in text; deep links are shared files not uninvited pop-ins; don’t fake live relay status.

**One-sentence model:** BobNet = SCUT social/technical mesh; look-and-feel is always local; machine speech is brackets; Bill keeps shared databases including genealogy and In Memorium. This console is faithful when it behaves like **one Bob’s (Bill-shaped) working surface on that mesh**.

---

## First “login” — what they see (books 1–2)

There is no official BobNet splash. Pattern: **build SCUT → console UI → ping Bill → Bill appears (video or full VR).**

### SCUT / BobNet connect

| Scene | What appears |
|---|---|
| **Riker** Bk1 ch41 | Ugly hardware (no chrome/logo). Console: “Connections available” + system names; menus; register; Bill’s **video image**; Homer’s video window. |
| **Mulder** Bk2 ch6 | Switch → console **scrolls system names** (Sol, EE, Alpha Cen, Omicron²…); menu prompts; **register on network**; select EE; **connect**; transmitting icon; then **Bill pops into Mulder’s VR** + “Welcome to BobNet…”. |
| **Mario** Bk2 ch15 | SCUT “kludge… almost steampunk”; connection confirmations flood; **global directory** → email, IM, chat; account; Bill appears at Mario’s **desk**. |
| **Bart** Bk1 ch45 | Bill in Bart’s **log cabin** VR; Bart checks **VR quality** first (“they all did that”). |

**Network features named at first access:** node list, menus, register, connect, global directory, email/IM/chat, account, video call, avatar pop-in, public features/blogs, domain+firewall.

### Matrix boot (not BobNet)

- New clone: **blue room**, no window, hard floor, serial `[HIC…]`, `[GUPPI Ready]` (Bk1 ch17).
- First VR build: furniture → pixel body → La-Z-Boy, desk, holograms, Guppy (Bk1 ch13+).

**Implication for boot UI:** more “first SCUT connect” (system names scrolling → register/connect flavor → Guppy) than mainframe IPL; amber chrome remains *Bill’s room*, not what Mulder saw on the SCUT console.

---

## Layout, CRT, blog, and the preview sandbox

### Are there too many tabs?

**Too many controls visible at once, not too many ideas.** Eight peer registers are fine; the pain was filter chips always on + CRT in the primary row + long tab labels on narrow screens.

### What the CRT button did

Toggled `body.plain`: scanlines, vignette, text-shadow, chart glow. Persisted as `bobnet-crt`. **Not load-bearing** — accessibility + “presentation is personal.” Felt pointless because unlabeled, same weight as filters. Options: move to footer, rename SCANLINES, default off on touch, or remove.

### How to add Bill’s blog (architecture)

Same as other peer registers — no redesign:

- `data/blog.json` (posts: id, date, by, title, dek, tags, body — original prose, never book quotes)
- One `REGISTERS` entry, inject in build, URL `#blog/<id>`, **no** lineage filter chips on that view
- Canon: blogs are a **public BobNet feature**; site updates as dated posts in Bill’s voice

### Preview sandbox (implemented, side path)

So experiments don’t overwrite the live console:

| | Live | Preview |
|---|---|---|
| Template | `templates/genealogy.html` | `templates/genealogy-preview.html` |
| Output | `dist/index.html` | `dist/preview.html` |
| Build | `make build` | `make preview` / `make preview-serve` (:8001) |

**Preview tweaks:** filter chips only on Bob-centric views; scrolling tab row + short mobile labels; tab group gaps; SCANLINES in footer; sample BLOG tab + `data/blog.json`; mobile dossier uses `selOf(view)` not only `state.selected`.

**Layout bug found and fixed in preview:** green banner was a 5th shell child while CSS still had **four** grid rows, so the toolbar sat in the `1fr` slot and search/tabs/filters painted over the table. Fix: five-row grid + toolbar as column (search+tabs row, then chips). See `PREVIEW.md`.

**Main console** at the time of writing still used the original toolbar layout unless later merged; preview is the sandbox.

---

## Naming: lineage → genealogy

### Corpus finding

| Term | In the books |
|---|---|
| **lineage** | **0 hits** — our word, not Bob-speak |
| **family tree** | 0 |
| **genealogy** | Bill’s word: Starfleet genealogy purged; “my genealogy investigations”; printed **Genealogy** appendix |
| **ancestry** / **ancestor** | Later books, when fragmentation makes “are you one of mine?” matter |
| **cohort** / **generation** | Everyday clone language |
| **In Memorium** | Canon list name |

### Change made (main + preview)

| Before | After |
|---|---|
| Tab LINEAGE (`#lineage/...`) | **GENEALOGY** (`#genealogy/...`) |
| Title / masthead Lineage Registry | **BobNet — Registry** / **REGISTRY** |
| Boot “Mounting lineage registry” | **Mounting registry** |
| Todo category “Lineage” | **Genealogy** |

Spelling: **genealogy** (not “geneology”). Tests and snapshots updated. Old `#lineage/` URLs no longer resolve.

### Is focus already off genealogy-only?

**Structure yes; greeting was still genealogy-weighted.**

Already peer-style: chart, bestiary, peoples, memorium, todo; provenance as method; register as default list. Rename + REGISTRY masthead stop *labeling* the whole product as a lineage app.

Still Bob-centric by default: REGISTER first, parentage filters on Bob views, repo name `bobiverse-genealogy`, Unresolved tab. Further shift is product choice (default Chart/Blog, ship blog on main, cross-links) — not a shell redesign.

---

## Document map (what lives in this file)

| Section | What it is |
|---|---|
| Opening + first review | Overall project strengths, ideas 1–15, watch-outs |
| Holotank / media / Imagine / infrastructure | Canon vocabulary, chrome vs payload, extensibility |
| Concept art experiment | `ideas/archimedes-1.jpg` |
| Second pass project review | Post-appendices, In Memorium, publish path |
| Deep HTML / mobile review | Console template opportunities, especially phone |
| Canon audit — BobNet | What the books establish; scorecard vs console |
| First login visuals | SCUT connect + matrix boot descriptions |
| Layout / CRT / blog / preview | Chrome density, sandbox, grid bug |
| Lineage → genealogy | Naming corpus + rename + focus |

---

## How this document should be treated

- **Not** a design doc or a commitment to implement anything above.
- **Not** a substitute for CLAUDE.md or the research backlog in `data/todo.json`.
- Safe to edit, argue with, strike through, or delete. It is a conversation starter from an outside pass, not project canon.
- Several items above already appear on the backlog or in code (`PREVIEW.md`, rename, etc.); prefer `todo.json` as the work queue and this file as the rationale.
- Implemented items in later sections are still summarized here so the collaborative trail stays in one place.

*Review by Grok — collaborative thoughts only. Sections from the collaborative session(s).*
