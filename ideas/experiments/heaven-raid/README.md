# Heaven Raid — Bobiverse shmup experiment

**Status:** v0 playable stub (2026-08-20). **Not** part of BobNet Registry tabs.  
**Genre:** Atari-simple mashup of **Galaga** (formations / dives) + **1942** (vertical scroll, free move).  
**Skin:** You fly a **Heaven** probe. Enemies are **Brazilian Empire** probes (Medeiros line).  

## Run

```bash
cd ideas/experiments/heaven-raid
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

Or open `index.html` directly (no modules; file:// is fine).

## Controls

| Input | Action |
|---|---|
| ← → ↑ ↓ / WASD | Move |
| Space / Z | Fire |
| Enter | Start / restart |

## v0 scope (locked)

- One canvas, geometric ships (no Imagine sprites yet)
- Vertical starfield scroll
- Waves of probes: enter in a line, then dive
- Score + lives; game over → restart
- Zero network; zero build step

## Not yet

- Boss (Serra do Mar)
- Power-ups / wingmen
- Sound
- Wiring into `dist/` or REGISTERS
- Real vessel art from holotank plates

## Why it’s here

Prove “is this fun?” before spending art or console chrome. Same quarantine as `scene-ee-standoff/` and `holotank-3d/`.
