# Heaven Raid — Bobiverse shmup experiment

**Status:** v1 playable (2026-08-20). **Not** part of BobNet Registry tabs.  
**Genre:** Atari-simple **Galaga** (formations / dives) + **1942** (vertical free-move).  
**Skin:** You fly a **Heaven** probe. Enemies are **Brazilian Empire** probes. Boss = **Serra do Mar**.

## Run

```bash
cd ideas/experiments/heaven-raid
python3 -m http.server 8765   # or another free port
# http://127.0.0.1:8765/  (hard-refresh if an old tab is open)
```

## Controls

| Input | Action |
|---|---|
| ← → ↑ ↓ / WASD | Move |
| Space / Z | Fire |
| Enter / tap | Start / restart |
| Touch | Drag to move; right side of screen fires |

## Structure (locked)

| Wave | Content |
|---|---|
| **1–4** | Probe formations (heavies from wave 2+) |
| **5** | **Serra do Mar** boss |
| Then | **Loop N+1** — more HP, faster shots, denser waves |

No fixed “end.” Survive loops. HUD shows `WAVE x/5` and `LOOP`.

## Busters

- Pickups drop from heavies / sometimes probes / always from Serra.
- Tiers: single → dual → triple → **buster max** (triple + side missiles).
- Taking a hit drops one tier (not all).
- At max, extra pickups bank score.

## Not yet

- Sound, wingmen, campaign map
- Imagine sprites / holotank art
- Wiring into `dist/` or REGISTERS

## Why it’s here

Prove fun in quarantine (`ideas/experiments/`), same as EE standoff / holotank-3d.
