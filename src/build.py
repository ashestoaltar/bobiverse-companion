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
TODO = os.path.join(ROOT, "data", "todo.json")
SYSTEMS = os.path.join(ROOT, "data", "systems.json")
SKYFIELD = os.path.join(ROOT, "data", "skyfield.json")
TEMPLATE = os.path.join(ROOT, "templates", "genealogy.html")
OUT = os.path.join(ROOT, "dist", "index.html")

PLACEHOLDER = "/*__BOBS__*/[]"
TODO_PLACEHOLDER = "/*__TODO__*/null"
SYS_PLACEHOLDER = "/*__SYSTEMS__*/null"
SKY_PLACEHOLDER = "/*__SKY__*/null"

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

    with open(TODO) as fh:
        todo = json.load(fh)
    todo.pop("_comment", None)

    html = template.replace(PLACEHOLDER, render_literal(bobs), 1)
    if TODO_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {TODO_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(TODO_PLACEHOLDER, json.dumps(todo, ensure_ascii=False), 1)

    with open(SYSTEMS) as fh:
        systems = json.load(fh)
    systems.pop("_comment", None)
    if SYS_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {SYS_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(SYS_PLACEHOLDER, json.dumps(systems, ensure_ascii=False), 1)

    with open(SKYFIELD) as fh:
        sky = json.load(fh)
    if SKY_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {SKY_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(SKY_PLACEHOLDER, json.dumps(
        {"count": sky["count"], "stars": sky["stars"], "source": sky["source"],
         "licence": sky["licence"]}, ensure_ascii=False), 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        fh.write(html)

    print(f"built {os.path.relpath(OUT, ROOT)} — {len(bobs)} records, "
          f"{len(todo['items'])} to-do items, "
          f"{len(systems['systems'])} systems, {sky['count']} backdrop stars, "
          f"{len(html):,} bytes")


if __name__ == "__main__":
    main()
