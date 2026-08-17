"""
Remove far floaters (e.g. moon blobs) from fragmented AI GLBs.

Strategy: grow a spatial cluster from the largest face-island by merging any
island whose bounding box is near the cluster. Delete islands that never join.
That keeps a shattered ship together and drops a separated moon.

  blender --background --python scripts/glb_drop_small_islands.py -- in.glb out.glb

Env:
  GAP   max gap between bboxes to still merge (fraction of overall mesh diagonal,
        default 0.08). Raise if ship parts get cut; lower if moon sticks.
"""
from __future__ import annotations

import os
import sys
from collections import defaultdict

import bmesh
import bpy
from mathutils import Vector


def _argv():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return []


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)


def bbox_union(a, b):
    return (
        Vector((min(a[0].x, b[0].x), min(a[0].y, b[0].y), min(a[0].z, b[0].z))),
        Vector((max(a[1].x, b[1].x), max(a[1].y, b[1].y), max(a[1].z, b[1].z))),
    )


def bbox_gap(a, b):
    """Axis-aligned gap between two (min,max) boxes; 0 if overlapping."""
    gap = 0.0
    for i in range(3):
        if a[1][i] < b[0][i]:
            gap = max(gap, b[0][i] - a[1][i])
        elif b[1][i] < a[0][i]:
            gap = max(gap, a[0][i] - b[1][i])
    return gap


def islands_from_bmesh(bm):
    face_adj = defaultdict(set)
    for e in bm.edges:
        fs = e.link_faces
        for i, fa in enumerate(fs):
            for fb in fs[i + 1 :]:
                face_adj[fa].add(fb)
                face_adj[fb].add(fa)

    seen = set()
    out = []
    for f0 in bm.faces:
        if f0 in seen:
            continue
        stack = [f0]
        seen.add(f0)
        faces = [f0]
        while stack:
            f = stack.pop()
            for nb in face_adj[f]:
                if nb not in seen:
                    seen.add(nb)
                    stack.append(nb)
                    faces.append(nb)
        verts = {v for f in faces for v in f.verts}
        cos = [v.co.copy() for v in verts]
        mn = Vector((min(c.x for c in cos), min(c.y for c in cos), min(c.z for c in cos)))
        mx = Vector((max(c.x for c in cos), max(c.y for c in cos), max(c.z for c in cos)))
        out.append({"faces": faces, "n": len(faces), "bb": (mn, mx)})
    return out


def process_mesh_object(obj, gap_frac: float) -> int:
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()

    islands = islands_from_bmesh(bm)
    if len(islands) <= 1:
        print(f"  {obj.name}: {len(islands)} island(s) — nothing to do")
        bm.free()
        return 0

    # overall diagonal for gap scale
    all_mn = Vector((min(i["bb"][0].x for i in islands),
                     min(i["bb"][0].y for i in islands),
                     min(i["bb"][0].z for i in islands)))
    all_mx = Vector((max(i["bb"][1].x for i in islands),
                     max(i["bb"][1].y for i in islands),
                     max(i["bb"][1].z for i in islands)))
    world_diag = max((all_mx - all_mn).length, 1e-6)
    max_gap = world_diag * gap_frac

    islands.sort(key=lambda is_: is_["n"], reverse=True)
    print(f"  {obj.name}: {len(islands)} islands; largest n={islands[0]['n']}; "
          f"world_diag={world_diag:.3f} max_gap={max_gap:.3f}")

    # Grow cluster from largest
    in_cluster = [False] * len(islands)
    in_cluster[0] = True
    cluster_bb = islands[0]["bb"]
    changed = True
    while changed:
        changed = False
        for i, is_ in enumerate(islands):
            if in_cluster[i]:
                continue
            if bbox_gap(cluster_bb, is_["bb"]) <= max_gap:
                in_cluster[i] = True
                cluster_bb = bbox_union(cluster_bb, is_["bb"])
                changed = True

    to_delete = []
    kept_faces = 0
    dropped_islands = 0
    for i, is_ in enumerate(islands):
        if in_cluster[i]:
            kept_faces += is_["n"]
        else:
            dropped_islands += 1
            to_delete.extend(is_["faces"])
            print(f"    DROP island n={is_['n']} (outside cluster)")

    if not to_delete:
        print("    cluster holds everything")
        bm.free()
        return 0

    bmesh.ops.delete(bm, geom=to_delete, context="FACES")
    loose = [v for v in bm.verts if not v.link_faces]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bm.to_mesh(mesh)
    mesh.update()
    n = len(to_delete)
    bm.free()
    print(f"    kept ~{kept_faces} faces across cluster; deleted {n} faces "
          f"({dropped_islands} islands)")
    return n


def main():
    args = _argv()
    if len(args) < 2:
        print("Usage: blender --background --python glb_drop_small_islands.py -- in.glb out.glb")
        sys.exit(2)
    src, dst = args[0], args[1]
    gap_frac = float(os.environ.get("GAP", "0.08"))

    clear_scene()
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        print("ERROR: no mesh")
        sys.exit(1)

    if len(meshes) > 1:
        bpy.ops.object.select_all(action="DESELECT")
        for o in meshes:
            o.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
        meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

    total = sum(process_mesh_object(o, gap_frac) for o in meshes)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(dst), export_format="GLB")
    print(f"OK wrote {dst} (deleted {total} faces; GAP={gap_frac})")


if __name__ == "__main__":
    main()
