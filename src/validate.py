"""Validate data/bobs.json.

Checks structure, referential integrity, and the tier rules that keep the
provenance honest. Exits non-zero on any error so it can gate a build.
"""

from __future__ import annotations

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "bobs.json")

# Tiers grade PARENTAGE only, and the books are the only source. Taylor's 2017
# genealogy and the fandom wiki were dropped: a claim we can't point at a page
# for is not asserted, it's recorded in priorClaim as a lead. Tiers say nothing
# about how well documented a Bob is otherwise — plenty of tier C Bobs have
# citations, generations and POV chapters; what they lack is a parent.
TIERS = {
    "o": "the original — no parent exists",
    "t": "parent stated in the books",
    "p": "ancestor stated, generations not",
    "c": "no ancestor on record",
    "x": "record deliberately expunged",
}
STATUSES = {"active", "lost", "unknown"}
REQUIRED = ("id", "name", "src")

ROOT_ID = "bob1"


CITE = re.compile(r"Bk(\d+) ch(\d+) · ([A-Za-z\-']+), ([^;]+?)(?=$|;)")
_MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split()


def _when(text: str) -> tuple | None:
    """Reduce a date to (month, year) so 'Apr 2185' and 'April 2185' compare equal."""
    m = re.search(r"([A-Za-z]+)?\s*(\d{4})", text)
    if not m:
        return None
    mon = (m.group(1) or "")[:3].lower()
    return (_MONTHS.index(mon) + 1 if mon in _MONTHS else None, int(m.group(2)))


def _check_cites(bobs: list[dict]) -> list[str]:
    """Verify each citation names a chapter that exists, with the right POV and date."""
    path = os.path.join(ROOT, ".cache", "corpus.json")
    if not os.path.exists(path):
        return []
    with open(path) as fh:
        chapters = json.load(fh)
    if not chapters:
        return []
    index = {(c["book"], c["seq"]): c for c in chapters}

    out = []
    for bob in bobs:
        for bk, sq, pov, when in CITE.findall(bob.get("cite", "") or ""):
            bk, sq, when = int(bk), int(sq), when.strip()
            chapter = index.get((bk, sq))
            if chapter is None:
                out.append(f"{bob['id']}: cites Bk{bk} ch{sq}, which the corpus doesn't have")
                continue
            if chapter["pov"] == pov and _when(chapter["when"]) == _when(when):
                continue
            match = [c for c in chapters
                     if c["book"] == bk and c["pov"] == pov and _when(c["when"]) == _when(when)]
            fix = f"; looks like ch{match[0]['seq']}" if len(match) == 1 else ""
            out.append(f"{bob['id']}: cite Bk{bk} ch{sq} is {chapter['pov']}, "
                       f"{chapter['when']} — not {pov}, {when}{fix}")
    return out


def validate(bobs: list[dict]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    ids: set[str] = set()
    for i, bob in enumerate(bobs):
        where = bob.get("id") or f"index {i}"
        for key in REQUIRED:
            if not bob.get(key):
                errors.append(f"{where}: missing required field '{key}'")
        if bob.get("id") in ids:
            errors.append(f"{where}: duplicate id")
        ids.add(bob.get("id"))
        if bob.get("src") not in TIERS:
            errors.append(f"{where}: unknown tier {bob.get('src')!r}")
        if bob.get("status") and bob["status"] not in STATUSES:
            errors.append(f"{where}: unknown status {bob['status']!r}")

    # referential integrity
    for bob in bobs:
        parent = bob.get("parent")
        if parent and parent not in ids:
            errors.append(f"{bob['id']}: parent {parent!r} does not exist")
        if parent == bob.get("id"):
            errors.append(f"{bob['id']}: is its own parent")

    # exactly one root
    roots = [b for b in bobs if not b.get("parent") and b["id"] == ROOT_ID]
    for bob in bobs:
        if bob.get("src") == "o" and bob["id"] != ROOT_ID:
            errors.append(f"{bob['id']}: tier O is only for {ROOT_ID}")
        if bob.get("src") == "o" and bob.get("parent"):
            errors.append(f"{bob['id']}: tier O means there is no parent")
    for bob in bobs:
        if bob.get("src") == "o" and bob["id"] != ROOT_ID:
            errors.append(f"{bob['id']}: tier O is only for {ROOT_ID}")
        if bob.get("src") == "o" and bob.get("parent"):
            errors.append(f"{bob['id']}: tier O means there is no parent")
    if len(roots) != 1:
        errors.append(f"expected exactly one root ({ROOT_ID}), found {len(roots)}")

    # cycles
    by_id = {b["id"]: b for b in bobs}
    for bob in bobs:
        seen, cur = set(), bob
        while cur and cur.get("parent"):
            if cur["id"] in seen:
                errors.append(f"{bob['id']}: cycle in ancestry")
                break
            seen.add(cur["id"])
            cur = by_id.get(cur["parent"])

    # tier rules
    for bob in bobs:
        src = bob.get("src")
        if src == "t" and not bob.get("cite"):
            errors.append(f"{bob['id']}: tier T requires a cite")
        if src == "p" and not bob.get("parent"):
            errors.append(f"{bob['id']}: tier P means an ancestor is known — set parent")
        if src == "c" and bob.get("parent"):
            errors.append(f"{bob['id']}: tier C means no lineage — should have no parent")
        # Tier X claims the absence was deliberate, which is a stronger claim than
        # tier C. It has to be backed by the text, not by vibes.
        if src == "x":
            if bob.get("parent"):
                errors.append(f"{bob['id']}: tier X means the lineage was expunged — should have no parent")
            if not bob.get("cite"):
                errors.append(f"{bob['id']}: tier X requires a cite")
            if not bob.get("partialNote"):
                errors.append(f"{bob['id']}: tier X requires a partialNote saying who removed it and how we know")
        if src == "p" and not bob.get("partialNote"):
            warnings.append(f"{bob['id']}: tier P without partialNote explaining the gap")
        # Only lineage disputes need a citation to adjudicate them. Spelling and
        # name-collision conflicts are about the label, not about who begat whom.
        if bob.get("conflict") and not bob.get("cite"):
            about_lineage = not re.search(r"spell|name collision", bob["conflict"], re.I)
            if about_lineage:
                warnings.append(f"{bob['id']}: lineage conflict recorded without a citation")

    # A Hipparcos Catalog designation encodes the system the Bob was built in
    # — Bk1 ch15, where Bob reads his own origin straight off his serial. So two
    # Bobs sharing a HIC prefix must agree about where they were built.
    systems: dict[str, dict[str, list[str]]] = {}
    for bob in bobs:
        m = re.match(r"HIC(\d+)-\d+$", bob.get("desig", "") or "")
        if m and bob.get("origin"):
            systems.setdefault(m.group(1), {}).setdefault(bob["origin"], []).append(bob["id"])
    for cat, origins in systems.items():
        if len(origins) > 1:
            detail = "; ".join(f"{o} ({', '.join(ids)})" for o, ids in origins.items())
            errors.append(f"HIC{cat}: one catalogue number, disagreeing origins — {detail}")

    # Check citations against the parsed books when they're available. Warnings
    # rather than errors: the corpus is optional, and another edition could
    # legitimately number its chapters differently.
    warnings += _check_cites(bobs)

    # name collisions are legal but worth surfacing
    names: dict[str, list[str]] = {}
    for bob in bobs:
        names.setdefault(bob["name"], []).append(bob["id"])
    for name, holders in names.items():
        if len(holders) > 1:
            warnings.append(f"name collision {name!r}: {', '.join(holders)}")

    return errors, warnings


def main() -> None:
    with open(DATA) as fh:
        bobs = json.load(fh)["bobs"]

    errors, warnings = validate(bobs)

    counts = {tier: sum(1 for b in bobs if b.get("src") == tier) for tier in TIERS}
    print(f"{len(bobs)} records | " + " ".join(f"{k.upper()}:{v}" for k, v in counts.items()))
    print(f"{sum(1 for b in bobs if b.get('cite'))} cited, "
          f"{sum(1 for b in bobs if b.get('conflict'))} conflicts, "
          f"{sum(1 for b in bobs if b.get('faction'))} faction-tagged")

    for w in warnings:
        print(f"  warn: {w}")
    for e in errors:
        print(f"  ERROR: {e}")

    if errors:
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
