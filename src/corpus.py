"""Build and load the local chapter corpus.

The corpus is derived from your own ebooks and is NOT part of this repo — it
lands in .cache/ which is gitignored. Nothing under books/ or .cache/ should
ever be committed or published. The publishable artifact is data/bobs.json,
which holds facts (who cloned whom, when, where), not prose.
"""

from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from parse_ebook import DRMError, parse  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS_DIR = os.path.join(ROOT, "books")
CACHE = os.path.join(ROOT, ".cache", "corpus.json")

# Match files to book numbers by filename. Adjust if yours are named differently.
BOOK_PATTERNS = [
    (1, r"we[_ ]?are[_ ]?legion"),
    (2, r"for[_ ]?we[_ ]?are[_ ]?many"),
    (3, r"all[_ ]?these[_ ]?worlds"),
    (4, r"heaven"),
    (5, r"not[_ ]?till[_ ]?we[_ ]?are[_ ]?lost"),
]


def discover() -> list[tuple[int, str]]:
    found = []
    if not os.path.isdir(BOOKS_DIR):
        return found
    for name in sorted(os.listdir(BOOKS_DIR)):
        if name.startswith("."):
            continue
        low = name.lower()
        for num, pattern in BOOK_PATTERNS:
            if re.search(pattern, low):
                found.append((num, os.path.join(BOOKS_DIR, name)))
                break
    return sorted(set(found))


def build(verbose: bool = True) -> list[dict]:
    chapters: list[dict] = []
    for num, path in discover():
        try:
            got = parse(path, num)
        except DRMError as exc:
            print(f"  book {num}: SKIPPED — {exc}", file=sys.stderr)
            continue
        chapters += got
        if verbose:
            words = sum(len(c["text"].split()) for c in got)
            print(f"  book {num}: {len(got):>3} chapters, {words:>7,} words")
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with open(CACHE, "w") as fh:
        json.dump(chapters, fh)
    if verbose:
        print(f"  cached -> {os.path.relpath(CACHE, ROOT)} ({len(chapters)} chapters)")
    return chapters


def load() -> list[dict]:
    if not os.path.exists(CACHE):
        return build()
    with open(CACHE) as fh:
        return json.load(fh)


def cite(chapter: dict) -> str:
    """Canonical citation string for a chapter, matching data/bobs.json style."""
    return f"Bk{chapter['book']} ch{chapter['seq']} \u00b7 {chapter['pov']}, {chapter['when']}"


if __name__ == "__main__":
    if not discover():
        print(f"No ebooks found in {BOOKS_DIR}/ — drop your DRM-free files there.")
        sys.exit(1)
    build()
