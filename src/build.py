"""Render data/bobs.json into dist/index.html.

The template is the console with its data literal replaced by a placeholder,
so the interface and the data evolve independently. Validation runs first;
a failing dataset never reaches dist/.
"""

from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from validate import validate  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "bobs.json")
SCHEMA = os.path.join(ROOT, "data", "schema.json")
TODO = os.path.join(ROOT, "data", "todo.json")
SYSTEMS = os.path.join(ROOT, "data", "systems.json")
SKYFIELD = os.path.join(ROOT, "data", "skyfield.json")
TEMPLATE = os.path.join(ROOT, "templates", "genealogy.html")
OUT = os.path.join(ROOT, "dist", "index.html")

BESTIARY = os.path.join(ROOT, "data", "bestiary.json")
ART_DIR = os.path.join(ROOT, "assets", "bestiary")

PLACEHOLDER = "/*__BOBS__*/[]"
TODO_PLACEHOLDER = "/*__TODO__*/null"
SYS_PLACEHOLDER = "/*__SYSTEMS__*/null"
SKY_PLACEHOLDER = "/*__SKY__*/null"
BEST_PLACEHOLDER = "/*__BESTIARY__*/null"


def load_art(cid: str) -> str | None:
    """Inline assets/bestiary/<id>.svg, if someone has drawn one.

    The console is a single file that makes no external requests, so an
    illustration can't be an <img src>. Inline SVG is the format that fits:
    a few KB, scales to any size, and can be stroked in phosphor so it looks
    native to the display rather than pasted on. A raster image works too —
    base64 it into a data: URI and drop it in the same field.

    Nothing here is hand-edited into bestiary.json. Draw a file, name it after
    the creature's id, rebuild.
    """
    path = os.path.join(ART_DIR, f"{cid}.svg")
    if not os.path.exists(path):
        return None
    with open(path) as fh:
        svg = fh.read()
    # Strip anything that belongs to a standalone document rather than an
    # inline fragment; an <?xml?> declaration mid-page is invalid.
    svg = re.sub(r"<\?xml.*?\?>", "", svg, flags=re.S)
    svg = re.sub(r"<!DOCTYPE.*?>", "", svg, flags=re.S | re.I)
    svg = svg.strip()
    if not svg.startswith("<svg"):
        print(f"  warn: {os.path.relpath(path, ROOT)} doesn't start with <svg>, skipped")
        return None
    # The page promises no external requests. Art must keep that promise.
    for bad in ("http://", "https://", "<script", "xlink:href=\"http"):
        if bad in svg.lower():
            print(f"  warn: {os.path.relpath(path, ROOT)} reaches outside the page ({bad}), skipped")
            return None
    return svg

# Field order in the emitted literal — keeps diffs readable. It is also, in
# effect, a whitelist: a field missing here never reaches the page. That bit
# twice, silently — `alias` and `priorClaim` were both added to the schema and
# the console without being added here, so the HAS LEAD chip filtered to nothing
# and Will's "/ Riker" never appeared. _check_order() below makes the schema and
# this list agree, so the next field can't go missing the same way.
ORDER = ["id", "name", "alias", "parent", "src", "cite", "gen", "desig", "vessel",
         "born", "origin", "visited", "status", "lostAt", "faction", "ref",
         "conflict", "partialNote", "priorClaim", "note"]


def _check_order() -> None:
    """Every documented field must be emitted, or the console silently loses it."""
    with open(SCHEMA) as fh:
        known = json.load(fh)["properties"]["bobs"]["items"]["properties"]
    missing = [f for f in known if f not in ORDER]
    unknown = [f for f in ORDER if f not in known]
    if missing:
        print(f"ERROR: schema fields the build would drop: {', '.join(missing)}")
    if unknown:
        print(f"ERROR: ORDER lists fields the schema doesn't define: {', '.join(unknown)}")
    if missing or unknown:
        sys.exit(1)


def render_literal(bobs: list[dict]) -> str:
    lines = []
    for bob in bobs:
        ordered = {k: bob[k] for k in ORDER if k in bob}
        lines.append("  " + json.dumps(ordered, ensure_ascii=False))
    return "[\n" + ",\n".join(lines) + "\n]"


def main() -> None:
    _check_order()

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
    with open(BESTIARY) as fh:
        bestiary = json.load(fh)
    bestiary.pop("_comment", None)
    drawn = 0
    for creature in bestiary["creatures"]:
        art = load_art(creature["id"])
        if art:
            creature["art"] = art
            drawn += 1
    if BEST_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {BEST_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(BEST_PLACEHOLDER, json.dumps(bestiary, ensure_ascii=False), 1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        fh.write(html)

    creatures = len(bestiary["creatures"])
    print(f"built {os.path.relpath(OUT, ROOT)} — {len(bobs)} records, "
          f"{len(todo['items'])} to-do items, "
          f"{len(systems['systems'])} systems, {sky['count']} backdrop stars, "
          f"{creatures} creatures ({drawn} illustrated), "
          f"{len(html):,} bytes")


if __name__ == "__main__":
    main()
