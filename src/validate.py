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

# Tiers grade PARENTAGE confidence only. They say nothing about how well a Bob
# is documented otherwise — plenty of tier C Bobs have citations, generations
# and POV chapters; what they lack is a known parent.
TIERS = {
    "t": "parent confirmed in the primary text",
    "a": "Dennis E. Taylor's published genealogy, Apr 2017",
    "b": "Bobiverse Fandom wiki registry",
    "p": "ancestor named, generations unstated",
    "c": "no ancestor on record",
}
STATUSES = {"active", "lost", "unknown"}
REQUIRED = ("id", "name", "src")

ROOT_ID = "bob1"


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
        if src == "p" and not bob.get("partialNote"):
            warnings.append(f"{bob['id']}: tier P without partialNote explaining the gap")
        # Only lineage disputes need a citation to adjudicate them. Spelling and
        # name-collision conflicts are about the label, not about who begat whom.
        if bob.get("conflict") and not bob.get("cite"):
            about_lineage = not re.search(r"spell|name collision", bob["conflict"], re.I)
            if about_lineage:
                warnings.append(f"{bob['id']}: lineage conflict recorded without a citation")

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
