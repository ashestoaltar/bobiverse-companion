"""Render data/bobs.json into dist/index.html.

The template is the console with its data literal replaced by a placeholder,
so the interface and the data evolve independently. Validation runs first;
a failing dataset never reaches dist/.
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from validate import validate  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "bobs.json")
TEMPLATE = os.path.join(ROOT, "templates", "genealogy.html")
OUT = os.path.join(ROOT, "dist", "index.html")

PLACEHOLDER = "/*__BOBS__*/[]"

# field order in the emitted literal — keeps diffs readable
ORDER = ["id", "name", "parent", "src", "cite", "gen", "desig", "vessel", "born",
         "origin", "visited", "status", "lostAt", "faction", "ref", "conflict",
         "partialNote", "note"]


def render_literal(bobs: list[dict]) -> str:
    lines = []
    for bob in bobs:
        ordered = {k: bob[k] for k in ORDER if k in bob}
        lines.append("  " + json.dumps(ordered, ensure_ascii=False))
    return "[\n" + ",\n".join(lines) + "\n]"


def main() -> None:
    with open(DATA) as fh:
        bobs = json.load(fh)["bobs"]

    errors, warnings = validate(bobs)
    for w in warnings:
        print(f"  warn: {w}")
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
        print("build aborted")
        sys.exit(1)

    template = open(TEMPLATE).read()
    if PLACEHOLDER not in template:
        print(f"ERROR: placeholder {PLACEHOLDER} missing from template")
        sys.exit(1)

    html = template.replace(PLACEHOLDER, render_literal(bobs), 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        fh.write(html)

    print(f"built {os.path.relpath(OUT, ROOT)} — {len(bobs)} records, {len(html):,} bytes")


if __name__ == "__main__":
    main()
