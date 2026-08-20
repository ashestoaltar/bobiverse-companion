# Wormholes — Phase 0 canon ledger

**Status:** Shipped (2026-08-20) — `data/gates.json` + **GATES** list/dossiers + schematic topology paint. Galaxy still open.  
**Architecture:** local chart = geometry · wormholes = topology · galaxy = context · SCUT = comms ([`README.md`](README.md) §5).

**Working freezes:**

| Decision | Choice |
|---|---|
| Register label | **GATES** (avoid BobNet/“network” clash) |
| Data file | `data/gates.json` |
| Unlocated places | **Gates-only nodes** — not forced into `systems.json` |
| Path kinds | `found` \| `constructed` \| `planned` |
| v1 depth | Named nodes + path/summary objects; not a full transit harvest |
| Galaxy | After GATES graph exists |

---

## Shared physics (both layers)

Cited primarily from **Bk5 ch8** (Icarus discovery) and **Bk5 ch34** (Bill/Howard prototype):

1. A wormhole is created as a pair of **endpoints**.
2. One endpoint must be **flown STL** to the far system (aliens did this; Bobs rediscover it).
3. Without bracing, the endpoint collapses — even light may not get through.
4. You can only travel where an endpoint already exists; new reach = logistics + time.
5. Once open, a hop is **topological** — do not render it as a ly chord on the Euclidean chart.

`ferry_ly` (real distance) may annotate **constructed/planned** STL hauls only. Forbidden on `found` alien hops.

---

## Layer A — Found alien mesh (Icarus / Dae)

### Rules / scale (summaries, not edge rows)

| id | Claim | Cite | File as |
|---|---|---|---|
| `sum_hub_signals` | First major hub: hundreds of individual signals | Bk5 ch8 | summary |
| `sum_gate_map` | Map of hundreds of wormhole gates in various orbits; addressing needed or they are “random” | Bk5 ~ch12 Tech Sleuthing | summary |
| `sum_hub_tour` | Eight hub hops in six months ≈ sixty degrees around the galaxy; Orion Spur → Perseus Arm | Bk5 ch14 Network Tours | summary |
| `sum_hub_degree` | Typical hub ~200–500 local connections; one hub >1000; locals up to a couple hundred ly | Bk5 ch14 | summary |

**Do not** expand these into hundreds of anonymous gate rows.

### Named nodes (seeded)

| id | Name | Located? | Notes | Cite anchors |
|---|---|---|---|---|
| `hub_zero` | Hub Zero | **no** | Bobs’ name for theoretical center of explored mesh | Bk5 ch14; return ch52 |
| `hub_six` | Hub Six | **no** | Outermost spinward survey label | Bk5 ch14 |
| `roanoke` | Roanoke | **no** | Abandoned world; species in `peoples.json` (`roanokians`) | Bk5 ch52 |
| `federation_capital` | Federation capital | **no** | Pan Galactic Federation capital via Hub Zero | Bk5 ch68 |
| `dmz` | DMZ | **no** | Firewall stretch of the alien mesh | Bk5 ch28 (+ ch56, ch60) |
| `centaurvania` | Centaurvania | **no** | Gunther’s world; **8 ly STL** to a wormhole system | Bk5 ch48; return ch52 |
| `epsilon_eridani` | Epsilon Eridani | **yes** | WormNet / highway near end | Bk5 ch34, ch63 |
| `skippyland` | Skippyland | **no** | Highway far end | Bk5 ch34 |
| `sol` | Sol | **yes** | Direct WormNet link from EE | Bk5 ch63 |
| `omicron2_eridani` | Omicron² Eridani | **yes** | Direct WormNet link from EE | Bk5 ch63 |

### Galactic centre (do not overclaim)

Icarus/Dae’s **original sublight destination** was the galactic centre (Bk5 ch1). The alien mesh is **not** “every gate leads to the centre”:

- Hubs lie on **radial lines**; early survey barely hops inward/outward (Bk5 ch14).
- Spinward hub-hopping circumnavigates at their radius; anti-spinward end is a **terminal hub** (~80 ly from Earth).
- A later radial is ~**10,000 ly closer to the core** — possible core visit, not a labelled highway to the centre (Bk5 ch60).

### Edges / links (verify before filing)

| Candidate | Kind | Status |
|---|---|---|
| Centaurvania ↔ (unnamed) wormhole system | mixed: STL note + found gate | File as node note + optional edge to a placeholder `gunther_gate_system` **only if** we want a second unlocated node — else keep in Centaurvania note |
| Hub Zero ↔ Roanoke | found? | **Unverified** — narrative co-location in ch52 header; confirm a real gate before adding an edge |
| Gunther’s parallel exploration | — | Mention in Hub Zero / mesh summary; not our edge list |

---

## Layer B — Bob-built highway (Bill / Howard)

### Physics demo

| Claim | Cite |
|---|---|
| Create wormhole, split endpoints; move one 100 km (distance record, still local) | Bk5 ch34 Prototype |
| Matter successfully pushed through | Bk5 ch34 |
| Pair created together; far endpoint flown STL | Bk5 ch34 |

### Named nodes

| id | Name | Located? | Notes | Cite |
|---|---|---|---|---|
| `epsilon_eridani` | Epsilon Eridani | **yes** — `systems.json` | Chart cross-link | throughout; highway Bk5 ch34–38 |
| `skippyland` | Skippyland | **no** | Skippy home / quarantine; Howard gives ~70 ly from EE | Bk5 ch34; also peoples `skippies` |

### Path object (not nine invented stars)

| id | Claim | Kind | Cite |
|---|---|---|---|
| `path_ee_skippyland` | Highway EE ↔ Skippyland: **ten hops**, **nine** intermediate systems (unnamed in this cite), chain length **82 ly**, EE–Skippyland **~70 ly** as the crow flies | `planned` → later `constructed` | Bk5 ch34; endpoints underway Bk5 ch38 |
| — | Howard wants a fuller quiet network “for fun and profit” | note on path | Bk5 ch38 |

**Intermediates:** store as `intermediate_count: 9` on the path — **do not invent Hipparcos names** unless a later sweep finds them on the page.

---

## Out of scope for v1

- Gate-by-gate alien catalogue  
- Fake xyz for Hub Zero / Roanoke / Centaurvania / Skippyland  
- Wormhole chords on Chart  
- Merging SCUT into GATES  
- Galaxy context register (separate todo; after GATES)

---

## Strawman schema (Phase 1)

```text
data/gates.json
  nodes[]:     id, name, kind, system?, cite, spoil, note, also?[]
  edges[]:     id, from, to, kind(found|constructed|planned), cite, spoil, note, ferry_ly?, status?
  paths[]:     id, ends[], hop_count?, intermediate_count?, ferry_ly_total?, kind, cite, spoil, note
  summaries[]: id, text/note, cite, spoil
```

Validation: resolve endpoints; `ferry_ly` only on constructed/planned; Chart link iff `system` has `xyz_ly`; paraphrase + cite rules; Book 5 spoil default.

UI Phase 2: World tab **GATES** — schematic graph + dossiers; list view acceptable for Phase 1.

---

## Open verifies (before seed JSON)

1. Does ch52 establish a **gate** Hub Zero–Roanoke, or only shared setting language?  
2. Any **named** intermediate on the EE–Skippyland chain elsewhere in Bk5?  
3. Final data filename: `gates.json` vs `network.json`.  
4. Owner override on register label **GATES**.

---

*Ledger for continuous ownership. Expand cites to chapter-accurate lines when seeding. Update [`README.md`](README.md) §5 when this freezes into implementation.*
