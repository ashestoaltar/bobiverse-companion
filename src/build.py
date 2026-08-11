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
PEOPLES = os.path.join(ROOT, "data", "peoples.json")
GUPPY = os.path.join(ROOT, "data", "guppy.json")
ASSETS = os.path.join(ROOT, "assets")

PLACEHOLDER = "/*__BOBS__*/[]"
TODO_PLACEHOLDER = "/*__TODO__*/null"
SYS_PLACEHOLDER = "/*__SYSTEMS__*/null"
SKY_PLACEHOLDER = "/*__SKY__*/null"
BEST_PLACEHOLDER = "/*__BESTIARY__*/null"
PEOPLE_PLACEHOLDER = "/*__PEOPLES__*/null"
GUPPY_PLACEHOLDER = "/*__GUPPY__*/null"


def _check_pixels(art: dict) -> None:
    """A ragged pixel grid renders as a mess rather than an error, so check here.

    Every row must be the declared width, every frame the declared height, and
    every character either transparent or a palette entry. Cheap to verify and
    impossible to eyeball once it's a JSON string.
    """
    w, h, palette = art["width"], art["height"], art["palette"]
    for name, rows in art["frames"].items():
        if len(rows) != h:
            print(f"ERROR: guppy frame {name!r} has {len(rows)} rows, expected {h}")
            sys.exit(1)
        for i, row in enumerate(rows):
            if len(row) != w:
                print(f"ERROR: guppy frame {name!r} row {i} is {len(row)} wide, expected {w}")
                sys.exit(1)
            unknown = {c for c in row if c != "." and c not in palette}
            if unknown:
                print(f"ERROR: guppy frame {name!r} row {i} uses {sorted(unknown)}, "
                      f"which are not in the palette")
                sys.exit(1)


def inject_register(html: str, path: str, key: str, register: str,
                    placeholder: str) -> tuple[str, dict, int]:
    """Load a companion register, attach any artwork, and splice it in.

    Both companion registers work the same way, so they share this: strip the
    editorial comment, inline assets/<register>/<id>.svg into each entry's
    `art`, and replace the placeholder.
    """
    with open(path) as fh:
        data = json.load(fh)
    data.pop("_comment", None)
    drawn = 0
    for entry in data[key]:
        art = load_art(register, entry["id"])
        if art:
            entry["art"] = art
            drawn += 1
    if placeholder not in html:
        print(f"ERROR: placeholder {placeholder} missing from template")
        sys.exit(1)
    return html.replace(placeholder, json.dumps(data, ensure_ascii=False), 1), data, drawn


def load_art(register: str, cid: str) -> str | None:
    """Inline assets/<register>/<id>.svg, if someone has drawn one.

    The console is a single file that makes no external requests, so an
    illustration can't be an <img src>. Inline SVG is the format that fits:
    a few KB, scales to any size, and can be stroked in phosphor so it looks
    native to the display rather than pasted on. A raster image works too —
    base64 it into a data: URI and drop it in the same field.

    Nothing here is hand-edited into bestiary.json. Draw a file, name it after
    the creature's id, rebuild.
    """
    path = os.path.join(ASSETS, register, f"{cid}.svg")
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
    html, bestiary, drawn = inject_register(
        html, BESTIARY, "creatures", "bestiary", BEST_PLACEHOLDER)
    html, peoples, drawn_p = inject_register(
        html, PEOPLES, "entries", "peoples", PEOPLE_PLACEHOLDER)

    with open(GUPPY) as fh:
        guppy = json.load(fh)
    for key in [k for k in guppy if k.startswith("_")]:
        guppy.pop(key)
    _check_pixels(guppy)
    if GUPPY_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {GUPPY_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(GUPPY_PLACEHOLDER, json.dumps(guppy, ensure_ascii=False), 1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        fh.write(html)

    print(f"built {os.path.relpath(OUT, ROOT)} — {len(bobs)} records, "
          f"{len(todo['items'])} to-do items, "
          f"{len(systems['systems'])} systems, {sky['count']} backdrop stars, "
          f"{len(bestiary['creatures'])} creatures ({drawn} illustrated), "
          f"{len(peoples['entries'])} peoples and polities ({drawn_p} illustrated), "
          f"guppy {guppy['width']}x{guppy['height']} in {len(guppy['frames'])} frames, "
          f"{len(html):,} bytes")


if __name__ == "__main__":
    main()
