# Holotank 3D spike (local experiment)

**Not production.** Not wired into `dist/index.html` or the BobNet console.  
Purpose: decide if AI image→3D quality is good enough for an orbitable vessel in a future true holotank.

## What’s set up on this machine

| Piece | Path |
|---|---|
| Source still (Heaven gen 1) | `source/heaven-g1.jpg` (full), `heaven-g1-upload.jpg`, `heaven-g1.png` |
| Orbit viewer | `index.html` + `viewer.js` |
| Three.js (local) | `node_modules/three` after `npm install` |
| GLB drop zone | `models/` + optional `models/manifest.json` |

## One-time install

```bash
cd ideas/experiments/holotank-3d
npm install
```

## Run the viewer

Must be served over HTTP (ES modules + import map). From this directory:

```bash
npm run serve
```

Then open **http://127.0.0.1:8765/**  
(Do not double-click `index.html` — `file://` will fail module loads.)

## Get a GLB (external AI — not automated here)

No image→3D API key is configured in-repo. Use any of:

- [Meshy](https://www.meshy.ai/) — image to 3D, export **GLB**
- [Tripo](https://www.tripo3d.ai/) — same idea
- Similar tools that export glTF binary

**Recommended input:** `source/heaven-g1-upload.jpg`  
(Heaven design generation 1 still — freighter + SURGE ring.)

Steps:

1. Upload the still → image-to-3D.  
2. Export **GLB**.  
3. Save as:

```text
ideas/experiments/holotank-3d/models/heaven-g1.glb
```

4. Write a tiny manifest so the dropdown finds it:

```bash
# from this directory
printf '%s\n' '["heaven-g1.glb"]' > models/manifest.json
```

Or just **drag the .glb onto the black tank** (no manifest needed).

5. Refresh the viewer, orbit/zoom, judge silhouette vs the 2D plate.

### Clean a GLB (moon blobs / floaters)

**Blender 4.2.8 LTS** is installed portable (no root):

- Binary: `~/bin/blender` (also `bin/blender` here)
- Full tree: `~/tools/blender-4.2.8-linux-x64/`

**Quick auto-clean** (drops mesh islands smaller than 15% of the largest):

```bash
# from this directory
./scripts/clean-glb.sh models/heaven-g1.glb
# → models/heaven-g1_clean.glb
# more aggressive: MIN_FRAC=0.25 ./scripts/clean-glb.sh models/in.glb models/out.glb
```

**Manual (GUI)** if auto-clean is too rough:

```bash
# Do NOT: blender models/foo.glb  (only .blend opens that way; GLB errors)
./scripts/open-glb.sh models/heaven-g1.glb
# Select moon → X Delete → File → Export → glTF 2.0 (.glb)
```

## Pass / fail for “worth productizing”

**Result (2026-08-16): orbit test PASSES for Heaven gen 1.**

- [x] Reads as the same ship as the holotank still (after hand-deleting moon blob in Blender GUI)  
- [x] Ring / freighter bulk visible when orbiting  
- [ ] File size tolerable — **not yet** (`heaven-g1_clean.glb` ~87 MB; production needs decimate/compress hard)  
- [ ] Worth full product wire-up — **quality yes, weight/pipeline later**

Notes: Tripo (or similar) image→3D from `source/heaven-g1-upload.jpg`. Auto island-clean scripts struggle on fragmented AI meshes; **manual Blender delete** worked for the moon. Viewer: `npm run serve` → http://127.0.0.1:8765/

## Not in scope for this spike

- Wiring into `genealogy.html` / `holo.json`  
- Zero-network production rules for Three.js  
- Cite/spoil for models  
- Multiple vessels  

Those come only if this experiment looks good.
