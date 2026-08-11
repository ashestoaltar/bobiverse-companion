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

# Match files to book numbers by title in the filename. Matching on the title
# rather than a naming convention means a file dropped in straight from a store,
# with whatever baroque name it came with, still lands in the right slot.
# books/ is named bobiverse-<n>-<title>.epub, but nothing depends on that.
SEP = r"[-_ ]?"
BOOK_PATTERNS = [
    (1, rf"we{SEP}are{SEP}legion"),
    (2, rf"for{SEP}we{SEP}are{SEP}many"),
    (3, rf"all{SEP}these{SEP}worlds"),
    (4, r"heaven"),
    (5, rf"not{SEP}till{SEP}we{SEP}are{SEP}lost"),
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


def _existing_counts() -> dict[int, int]:
    """Chapters per book in the cache we already have, if any."""
    if not os.path.exists(CACHE):
        return {}
    try:
        with open(CACHE) as fh:
            cached = json.load(fh)
    except (OSError, ValueError):
        return {}
    counts: dict[int, int] = {}
    for chapter in cached:
        counts[chapter["book"]] = counts.get(chapter["book"], 0) + 1
    return counts


def _regression(fresh: dict[int, int], have: dict[int, int]) -> list[str]:
    """Books the new parse understands worse than the cache already does."""
    return [f"book {num}: cache has {old} chapters, this parse found {fresh.get(num, 0)}"
            for num, old in sorted(have.items()) if fresh.get(num, 0) < old]


def build(verbose: bool = True, force: bool = False) -> list[dict]:
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

    # The cache is derived from books/, but it is not cheap to lose: when the
    # ebooks went missing it was the only copy of the parsed text, and every
    # citation in data/bobs.json is numbered against it. A book that suddenly
    # parses to fewer chapters means a header shape we don't match yet — a
    # missing file, a different edition — not a book that got shorter. Refuse
    # rather than quietly overwrite good chapter numbers with worse ones.
    lost = _regression({num: sum(1 for c in chapters if c["book"] == num)
                        for num in {c["book"] for c in chapters}}, _existing_counts())
    if lost and not force:
        print("\nRefusing to overwrite the cache — this parse is worse than what's cached:",
              file=sys.stderr)
        for line in lost:
            print(f"  {line}", file=sys.stderr)
        print("\nThe cache is unchanged. Fix the parser, or re-run with --force if the\n"
              "new parse really is the one you want.", file=sys.stderr)
        raise SystemExit(1)

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
        # Never treat "no books" as "empty corpus" — that would wipe the cache.
        print(f"No ebooks found in {BOOKS_DIR}/ — drop your DRM-free files there.")
        print("The cache, if you have one, is untouched.")
        sys.exit(1)
    build(force="--force" in sys.argv)
