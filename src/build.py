"""Render data/bobs.json into dist/index.html.

The template is the console with its data literal replaced by a placeholder,
so the interface and the data evolve independently. Validation runs first;
a failing dataset never reaches dist/.
"""

from __future__ import annotations

import base64
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
VESSELS = os.path.join(ROOT, "data", "vessels.json")
PERSONS = os.path.join(ROOT, "data", "persons.json")
MEMORIUM = os.path.join(ROOT, "data", "memorium.json")
GUPPY = os.path.join(ROOT, "data", "guppy.json")
ASSETS = os.path.join(ROOT, "assets")

PLACEHOLDER = "/*__BOBS__*/[]"
TODO_PLACEHOLDER = "/*__TODO__*/null"
SYS_PLACEHOLDER = "/*__SYSTEMS__*/null"
SKY_PLACEHOLDER = "/*__SKY__*/null"
BEST_PLACEHOLDER = "/*__BESTIARY__*/null"
MEM_PLACEHOLDER = "/*__MEMORIUM__*/null"
BLOG = os.path.join(ROOT, "data", "blog.json")
BLOG_PLACEHOLDER = "/*__BLOG__*/null"
BOOKS = os.path.join(ROOT, "data", "books.json")
BOOKS_PLACEHOLDER = "/*__BOOKS__*/[]"
PEOPLE_PLACEHOLDER = "/*__PEOPLES__*/null"
VESSELS_PLACEHOLDER = "/*__VESSELS__*/null"
PERSONS_PLACEHOLDER = "/*__PERSONS__*/null"
GUPPY_PLACEHOLDER = "/*__GUPPY__*/null"
SANDBOX = os.path.join(ROOT, "data", "sandbox.json")
SANDBOX_PLACEHOLDER = "/*__SANDBOX__*/null"
HOLO = os.path.join(ROOT, "data", "holo.json")
HOLO_PLACEHOLDER = "/*__HOLO__*/null"
HOLO_MODELS = os.path.join(ROOT, "assets", "holo-models")
HOLO3D_JS = os.path.join(ROOT, "assets", "holo3d", "holo3d.js")
HOLO3D_PLACEHOLDER = "/*__HOLO3D_JS__*/"


def _check_pixels(art: dict, who: str = "guppy") -> None:
    """A ragged pixel grid renders as a mess rather than an error, so check here.

    Every row must be the declared width, every frame the declared height, and
    every character either transparent or a palette entry. Cheap to verify and
    impossible to eyeball once it's a JSON string.
    """
    w, h, palette = art["width"], art["height"], art["palette"]
    for name, rows in art["frames"].items():
        if len(rows) != h:
            print(f"ERROR: {who} frame {name!r} has {len(rows)} rows, expected {h}")
            sys.exit(1)
        for i, row in enumerate(rows):
            if len(row) != w:
                print(f"ERROR: {who} frame {name!r} row {i} is {len(row)} wide, expected {w}")
                sys.exit(1)
            unknown = {c for c in row if c != "." and c not in palette}
            if unknown:
                print(f"ERROR: {who} frame {name!r} row {i} uses {sorted(unknown)}, "
                      f"which are not in the palette")
                sys.exit(1)


def inject_holo(html: str) -> tuple[str, dict, int]:
    """The holotank's plates, inlined as data URIs.

    Same promise as every other asset: zero external requests, and the page has
    to keep working when it is double-clicked out of a folder. That means the
    bytes travel inside the file, so this is the one place where a decision
    about image size becomes a decision about page weight — 520px on the long
    edge, WebP, which is about 40KB a plate once base64 has had its third.

    Optional `model` on a plate names assets/holo-models/<model>.glb — inlined
    the same way for offline 3D holotank orbit. The Three.js viewer is injected
    separately from assets/holo3d/holo3d.js (bundled offline).

    The encoding happens offline and the optimised file is what gets committed.
    Nothing here needs an image library, which keeps the toolchain stdlib-only.
    """
    with open(HOLO) as fh:
        holo = json.load(fh)
    for key in [k for k in holo if k.startswith("_")]:
        holo.pop(key)
    total = 0
    models_used = False
    for plate in holo["plates"]:
        path = os.path.join(ROOT, "assets", "holo", plate["id"] + ".webp")
        if not os.path.exists(path):
            print(f"ERROR: holotank plate {plate['id']!r} has no file at "
                  f"{os.path.relpath(path, ROOT)}")
            sys.exit(1)
        with open(path, "rb") as fh:
            raw = fh.read()
        total += len(raw)
        plate["src"] = "data:image/webp;base64," + base64.b64encode(raw).decode()
        mid = plate.get("model")
        if mid:
            mpath = os.path.join(HOLO_MODELS, mid + ".glb")
            if not os.path.exists(mpath):
                print(f"ERROR: holotank plate {plate['id']!r} model {mid!r} "
                      f"missing at {os.path.relpath(mpath, ROOT)}")
                sys.exit(1)
            with open(mpath, "rb") as fh:
                mraw = fh.read()
            total += len(mraw)
            plate["modelSrc"] = ("data:model/gltf-binary;base64,"
                                 + base64.b64encode(mraw).decode())
            models_used = True
    if HOLO_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {HOLO_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(HOLO_PLACEHOLDER, json.dumps(holo, ensure_ascii=False), 1)

    # 3D viewer: only ship the bundle if a plate actually uses a model
    if models_used:
        if not os.path.exists(HOLO3D_JS):
            print(f"ERROR: 3D holotank needs {os.path.relpath(HOLO3D_JS, ROOT)} "
                  f"(build with esbuild from ideas/experiments/holotank-3d)")
            sys.exit(1)
        with open(HOLO3D_JS) as fh:
            holo3d = fh.read()
        if HOLO3D_PLACEHOLDER not in html:
            print(f"ERROR: placeholder {HOLO3D_PLACEHOLDER} missing from template")
            sys.exit(1)
        html = html.replace(HOLO3D_PLACEHOLDER, holo3d, 1)
        total += len(holo3d.encode())
    else:
        html = html.replace(HOLO3D_PLACEHOLDER, "", 1)

    return html, holo, total


def cut_sky(sky: dict) -> tuple[str, float]:
    """Drop the backdrop stars the console cannot render as distinct from each other.

    The extract is the record of what was taken from HYG and does not move; the
    display limit is a rendering decision, and the reasoning for the number is
    in the data file beside it. Cutting here rather than in the page keeps the
    bytes out of the shipped file — the whole point is that they were being
    downloaded to be drawn as identical grey specks.

    Returns the repacked star list and the limit actually applied, so the page
    can state its own faintest magnitude instead of carrying a hardcoded 6.
    """
    limit = sky.get("display_limit", sky["magnitude_limit"])
    if limit > sky["magnitude_limit"]:
        print(f"ERROR: skyfield display_limit {limit} is fainter than the "
              f"extract's own magnitude_limit {sky['magnitude_limit']} — "
              f"the stars to fill it were never taken from HYG")
        sys.exit(1)
    v = sky["stars"].split(",")
    if len(v) != sky["count"] * 5:
        print(f"ERROR: skyfield says {sky['count']} stars but holds "
              f"{len(v) / 5:.1f} — the packed list and the count disagree")
        sys.exit(1)
    cut = round(limit * 10)
    kept = [x for i in range(sky["count"])
            if int(v[i * 5 + 3]) <= cut
            for x in v[i * 5:i * 5 + 5]]
    return ",".join(kept), limit


def inject_register(html: str, path: str, key: str, register: str,
                    placeholder: str) -> tuple[str, dict, int]:
    """Load a companion register, attach any artwork, and splice it in.

    Companion registers work the same way, so they share this: strip the
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
ORDER = ["id", "name", "alias", "nameFrom", "parent", "src", "cite", "gen", "desig", "vessel",
         "born", "origin", "visited", "fate", "fateCite", "fateNote", "lostAt",
         "faction", "ref",
         "conflict", "partialNote", "priorClaim", "spoil", "note"]


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

    # The series. Everything that counts books reads this, so it goes in before
    # anything that might want to render a count.
    with open(BOOKS) as fh:
        series = json.load(fh)
    series.pop("_comment", None)
    if BOOKS_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {BOOKS_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(BOOKS_PLACEHOLDER,
                        json.dumps(series["books"], ensure_ascii=False), 1)

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
    stars, sky_limit = cut_sky(sky)
    sky_count = (stars.count(",") + 1) // 5 if stars else 0
    html = html.replace(SKY_PLACEHOLDER, json.dumps(
        {"count": sky_count, "stars": stars, "limit": sky_limit,
         "source": sky["source"], "licence": sky["licence"]}, ensure_ascii=False), 1)
    html, bestiary, drawn = inject_register(
        html, BESTIARY, "creatures", "bestiary", BEST_PLACEHOLDER)
    html, peoples, drawn_p = inject_register(
        html, PEOPLES, "entries", "peoples", PEOPLE_PLACEHOLDER)
    html, vessels, drawn_v = inject_register(
        html, VESSELS, "vessels", "vessels", VESSELS_PLACEHOLDER)
    html, persons, drawn_n = inject_register(
        html, PERSONS, "persons", "persons", PERSONS_PLACEHOLDER)

    # The In Memorium list is mostly assembled from bobs.json at render time;
    # this file carries only the entries that have no record to sit on.
    with open(MEMORIUM) as fh:
        memorium = json.load(fh)
    for key in [k for k in memorium if k.startswith("_")]:
        memorium.pop(key)
    if MEM_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {MEM_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(MEM_PLACEHOLDER, json.dumps(memorium, ensure_ascii=False), 1)

    # Bill's blog. Posts are ours in both voices — never a passage from the
    # books, and never a quotation from Taylor's own blog either.
    with open(BLOG) as fh:
        blog = json.load(fh)
    for key in [k for k in blog if k.startswith("_")]:
        blog.pop(key)
    if BLOG_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {BLOG_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(BLOG_PLACEHOLDER, json.dumps(blog, ensure_ascii=False), 1)

    with open(GUPPY) as fh:
        guppy = json.load(fh)
    for key in [k for k in guppy if k.startswith("_")]:
        guppy.pop(key)
    _check_pixels(guppy)
    if GUPPY_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {GUPPY_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(GUPPY_PLACEHOLDER, json.dumps(guppy, ensure_ascii=False), 1)

    with open(SANDBOX) as fh:
        sandbox = json.load(fh)
    for key in [k for k in sandbox if k.startswith("_")]:
        sandbox.pop(key)
    _check_pixels(sandbox, "sandbox")
    if SANDBOX_PLACEHOLDER not in html:
        print(f"ERROR: placeholder {SANDBOX_PLACEHOLDER} missing from template")
        sys.exit(1)
    html = html.replace(SANDBOX_PLACEHOLDER, json.dumps(sandbox, ensure_ascii=False), 1)

    html, holo, holo_bytes = inject_holo(html)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        fh.write(html)

    print(f"built {os.path.relpath(OUT, ROOT)} — {len(bobs)} records, "
          f"{len(todo['items'])} to-do items, "
          f"{len(systems['systems'])} systems, {sky_count} backdrop stars "
          f"to mag {sky_limit} (of {sky['count']} extracted), "
          f"{len(bestiary['creatures'])} creatures ({drawn} illustrated), "
          f"{len(peoples['entries'])} peoples and polities ({drawn_p} illustrated), "
          f"{len(vessels['vessels'])} vessels ({drawn_v} illustrated), "
          f"{len(persons['persons'])} persons ({drawn_n} illustrated), "
          f"{len(blog['posts'])} posts, "
          f"guppy {guppy['width']}x{guppy['height']} in {len(guppy['frames'])} frames, "
          f"sandbox {sandbox['width']}x{sandbox['height']} in "
          f"{len(sandbox['frames'])} frames, "
          f"{len(holo['plates'])} holotank plates ({holo_bytes / 1024:,.0f} KB), "
          f"{sum(1 for p in holo['plates'] if p.get('modelSrc'))} with 3D models, "
          f"{len(html):,} bytes")


if __name__ == "__main__":
    main()
