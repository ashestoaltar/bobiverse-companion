#!/usr/bin/env bash
# Open a GLB in Blender's GUI (import, not "open as .blend").
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLENDER="${BLENDER:-}"
if [[ -z "$BLENDER" ]]; then
  if [[ -x "$ROOT/bin/blender" ]]; then BLENDER="$ROOT/bin/blender"
  elif [[ -x "$HOME/bin/blender" ]]; then BLENDER="$HOME/bin/blender"
  elif command -v blender >/dev/null 2>&1; then BLENDER="$(command -v blender)"
  else echo "blender not found" >&2; exit 1; fi
fi

IN="${1:-}"
if [[ -z "$IN" ]]; then
  echo "Usage: $0 path/to/model.glb" >&2
  exit 2
fi
IN="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"
if [[ ! -f "$IN" ]]; then
  echo "Not found: $IN" >&2
  exit 1
fi

# Blender only auto-loads .blend from the CLI. GLB needs import_scene.gltf.
exec "$BLENDER" --python-expr "
import bpy, os
path = r'''$IN'''
# empty default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=path)
print('Imported', path)
"
