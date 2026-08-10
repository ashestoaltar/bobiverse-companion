"""Surface candidate lineage passages from the corpus for human review.

This deliberately does NOT write to data/bobs.json. It finds passages worth
reading and prints them with citations; you decide what a passage actually
establishes and edit the data yourself.

That split exists because first-person testimony in this series is
systematically unreliable about lineage: a clone inherits its parent's
memories wholesale, so a Bob recalling his own creation may be recalling his
parent's. Oliver opens his first chapter sounding like an original from
Bob-1's first cohort; he is in fact a clone of Bill who inherited Bill's
memory of that moment. Corroborate against the parent's POV before promoting
anything to tier T.

Usage:
    python src/extract.py                 # all lineage cues
    python src/extract.py --name Loki     # everything about one Bob
    python src/extract.py --unresolved    # only Bobs at tier C or P
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import corpus  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "bobs.json")

CUES = re.compile(
    r"\b(clone[ds]?|cloning|my clone|clone of|cohort|descend\w+|generation|"
    r"progenitor|built (?:him|me|two|three|four|ten|another)|"
    r"new Bob|new name|source Bob|spawn|offspring)\b",
    re.I,
)

WINDOW = 380


def known_names() -> list[str]:
    with open(DATA) as fh:
        bobs = json.load(fh)["bobs"]
    return sorted({b["name"] for b in bobs}, key=len, reverse=True)


def scan(name: str | None = None, unresolved: bool = False, min_names: int = 2):
    chapters = corpus.load()
    if not chapters:
        print("Corpus is empty. Run: python src/corpus.py", file=sys.stderr)
        return []

    with open(DATA) as fh:
        bobs = json.load(fh)["bobs"]

    if unresolved:
        targets = [b["name"] for b in bobs if b.get("src") in ("c", "p")]
    elif name:
        targets = [name]
    else:
        targets = known_names()

    name_re = re.compile(r"\b(" + "|".join(re.escape(n) for n in known_names()) + r")\b")
    target_re = re.compile(r"\b(" + "|".join(re.escape(t) for t in targets) + r")\b")

    results = []
    for chapter in chapters:
        text = chapter["text"]
        for match in target_re.finditer(text):
            start = max(0, match.start() - WINDOW)
            end = min(len(text), match.end() + WINDOW)
            window = text[start:end]
            if not CUES.search(window):
                continue
            present = sorted(set(name_re.findall(window)))
            if len(present) < min_names and not name:
                continue
            results.append(
                {
                    "cite": corpus.cite(chapter),
                    "book": chapter["book"],
                    "seq": chapter["seq"],
                    "pov": chapter["pov"],
                    "where": chapter["where"],
                    "subject": match.group(1),
                    "names": present,
                    "window": window,
                }
            )
            break  # one hit per chapter per target
    return results


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", help="focus on a single Bob")
    ap.add_argument("--unresolved", action="store_true",
                    help="only Bobs at tier C or P. Tier X is excluded on purpose: "
                         "those records were expunged in-world, so there is no "
                         "lineage left in the text to find")
    ap.add_argument("--json", action="store_true", help="emit JSON")
    args = ap.parse_args()

    hits = scan(name=args.name, unresolved=args.unresolved)
    if args.json:
        print(json.dumps(hits, indent=1, ensure_ascii=False))
        return

    print(f"{len(hits)} candidate passages\n")
    for hit in hits:
        print(f"=== {hit['cite']}  [{hit['subject']}]  {hit['where'] or ''}")
        print(f"    names present: {', '.join(hit['names'])}")
        print(f"    {hit['window'][:600]}\n")


if __name__ == "__main__":
    main()
