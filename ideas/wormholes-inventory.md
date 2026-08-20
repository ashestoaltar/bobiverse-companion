# Wormholes / GATES — canon ledger

**Status:** **Shipped** on main (2026-08-20) — `data/gates.json`, list + dossiers, schematic topology paint, cross-links to Chart/Galaxy.  
**Architecture:** local chart = geometry · gates = topology · galaxy = context · SCUT = comms ([`README.md`](README.md) §5).

| Decision | Choice |
|---|---|
| Register label | **GATES** |
| Data file | `data/gates.json` (+ `gates.schema.json`) |
| Unlocated places | Gates-only nodes — not forced into `systems.json` |
| Path kinds | `found` \| `constructed` \| `planned` |
| Layout | Manual `GATES_LAYOUT` seeds; ignores `ferry_ly` / `span_ly` / Chart xyz |
| Galaxy | Separate **GALAXY** register (bead + schematic mesh overlay) |

Census on ship: **10** nodes · **4** paths · **7** summaries.

---

## Shared physics (both layers)

Cited primarily from **Bk5 ch8** (Icarus discovery) and **Bk5 ch34** (Bill/Howard prototype):

1. A wormhole is created as a pair of **endpoints**.
2. One endpoint must be **flown STL** to the far system.
3. Without bracing, the endpoint collapses.
4. Travel only where an endpoint already exists.
5. Once open, a hop is **topological** — do not render it as a ly chord on the Chart.

`ferry_ly` / `span_ly` annotate **constructed/planned** logistics only. Forbidden on `found`.

---

## Layer A — Found alien mesh (Icarus / Dae)

### Summaries (not edge rows)

| id | Claim | Cite |
|---|---|---|
| `sum_first_hub` | First major hub: hundreds of signals | Bk5 ch8 |
| `sum_gate_map` | Hundreds of gates need addresses | Bk5 ch12 |
| `sum_hub_tour` | Eight hub hops ≈ sixty degrees; Orion Spur → Perseus Arm | Bk5 ch14 |
| `sum_terminal_hub` | First hub ~80 ly from Earth; no anti-spinward continuation | Bk5 ch14 |
| `sum_radial_core` | Hubs on radial lines; can hop inward toward core — **not** “every gate leads to centre” | Bk5 ch14, ch60 |
| `sum_endpoint_physics` | Pair + STL ferry + brace (shared with Bob tech) | Bk5 ch34 (also ch8) |

### Nodes

| id | Name | Located? | Notes | Cite |
|---|---|---|---|---|
| `hub_zero` | Hub Zero | no | Survey centre; 1000+ gates at the monster hub | Bk5 ch14; return ch52 |
| `hub_six` | Hub Six | no | Outermost spinward label; spine to Hub Zero | Bk5 ch14 |
| `roanoke` | Roanoke | no | Place at Hub Zero; Roanokians in peoples | Bk5 ch52 |
| `federation_capital` | Federation capital | no | Place at Hub Zero; Pan Galactic Federation | Bk5 ch68 |
| `dmz` | DMZ | no | Firewall stretch of the mesh | Bk5 ch28 (+ ch56, ch60) |
| `centaurvania` | Centaurvania | no | Gunther’s world; 8 ly STL to a wormhole | Bk5 ch48 |

### Paths

| id | Kind | Notes |
|---|---|---|
| `path_hub_six_zero` | found | Spinward hub spine (many gates, one label) |

### Galactic centre (do not overclaim)

Icarus/Dae’s **original sublight destination** was the galactic centre (Bk5 ch1). The alien mesh is **not** “all roads lead to the core”:

- Hubs lie on **radial lines**; early survey barely hops inward/outward (Bk5 ch14).
- Spinward hub-hopping at their radius; anti-spinward **terminal hub**.
- A later radial is ~**10,000 ly closer to the core** (Bk5 ch60) — possible visit, not a labelled highway to the centre.

---

## Layer B — Bob-built / WormNet

| id | Kind | Notes | Cite |
|---|---|---|---|
| `epsilon_eridani` | node (Chart) | WormNet / highway near end | Bk5 ch34, ch63 |
| `skippyland` | node | Highway far end; ~70 ly from EE | Bk5 ch34 |
| `sol` | node (Chart) | Direct WormNet link from EE | Bk5 ch63 |
| `omicron2_eridani` | node (Chart) | Direct WormNet link from EE | Bk5 ch63 |
| `path_ee_skippyland` | planned / building | 10 hops, 9 unnamed intermediates, 82 ly ferry / ~70 ly span | Bk5 ch34 |
| `path_ee_sol` | constructed / open | Direct link | Bk5 ch63 |
| `path_ee_omicron2` | constructed / open | Direct link | Bk5 ch63 |
| `sum_wormnet` | summary | Will’s nickname for the constructed mesh | Bk5 ch34, ch63 |

---

## Explicitly out of scope (still)

- Gate-by-gate alien catalogue (books never name individual gates)
- Fake xyz for Hub Zero / DMZ / Skippyland / etc.
- Wormhole chords on Chart
- Merging SCUT into GATES
- Hub One–Five as rows (count implied; roll call not on page)

---

## UI / peers

- **GATES** tab: schematic SVG (found left / Bob-built right) + paths/summaries list + dossiers
- Cross-links: Chart system dossiers → Gates termini; Gates ↔ Galaxy; Chart footer names the split
- Bill blog: `three-maps` — why the three surfaces stay separate

*Ledger for continuous ownership. Expand only from cite-checked chapter text.*
