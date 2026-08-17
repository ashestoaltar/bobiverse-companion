#!/usr/bin/env bash
# Drop small mesh islands (moon blobs, floaters) from a GLB via headless Blender.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLENDER="${BLENDER:-}"
if [[ -z "$BLENDER" ]]; then
  if [[ -x "$ROOT/bin/blender" ]]; then
    BLENDER="$ROOT/bin/blender"
  elif command -v blender >/dev/null 2>&1; then
    BLENDER="$(command -v blender)"
  elif [[ -x "$HOME/bin/blender" ]]; then
    BLENDER="$HOME/bin/blender"
  else
    echo "blender not found. Expected $ROOT/bin/blender or blender on PATH." >&2
    exit 1
  fi
fi

IN="${1:-}"
OUT="${2:-}"
if [[ -z "$IN" ]]; then
  echo "Usage: $0 input.glb [output.glb]" >&2
  echo "  default output: <input>_clean.glb next to input" >&2
  exit 2
fi
IN="$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"
if [[ -z "$OUT" ]]; then
  base="${IN%.glb}"
  OUT="${base}_clean.glb"
fi

export GAP="${GAP:-0.08}"
echo "Blender: $BLENDER"
echo "In:      $IN"
echo "Out:     $OUT"
echo "GAP=$GAP (bbox gap as fraction of model size; raise if ship is cut, lower if moon remains)"
"$BLENDER" --background --python "$ROOT/scripts/glb_drop_small_islands.py" -- "$IN" "$OUT"
ls -lh "$OUT"
