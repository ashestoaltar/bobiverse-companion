"""Check books/ against books/MANIFEST.sha256.

The ebooks are gitignored, so git can neither protect nor restore them. This
answers the question git can't: is the copy sitting in books/ the same copy the
citations in data/bobs.json were built against?

Two levels, because they fail differently. A wrong hash means a different file.
A right hash with wrong chapter counts should be impossible — but a *different
edition* of the same book hashes differently and parses differently, and that
is the failure that silently renumbers chapters and invalidates every citation.
So the manifest records both, and this checks both.

    python3 src/verify_books.py           # hashes, then parse
    python3 src/verify_books.py --quick   # hashes only, no parsing
    python3 src/verify_books.py --update  # rewrite the manifest from what's here
"""

from __future__ import annotations

import hashlib
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import corpus  # noqa: E402
from parse_ebook import DRMError, parse  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = os.path.join(ROOT, "books")
MANIFEST = os.path.join(BOOKS, "MANIFEST.sha256")

# "# = <name> | book <n> | <n> chapters | <n> words | <n> bytes | <edition>"
EXPECT = re.compile(
    r"^# = (?P<name>.+?) \| book (?P<book>\d+) \| (?P<chapters>\d+) chapters "
    r"\| (?P<words>\d+) words \| (?P<bytes>\d+) bytes \| (?P<edition>.+)$")


def _sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def read_manifest() -> tuple[dict[str, str], dict[str, dict]]:
    """Returns (name -> sha, name -> expectations)."""
    shas: dict[str, str] = {}
    expect: dict[str, dict] = {}
    if not os.path.exists(MANIFEST):
        return shas, expect
    with open(MANIFEST) as fh:
        for line in fh:
            line = line.rstrip("\n")
            m = EXPECT.match(line)
            if m:
                d = m.groupdict()
                for k in ("book", "chapters", "words", "bytes"):
                    d[k] = int(d[k])
                expect[d["name"]] = d
                continue
            if line.startswith("#") or not line.strip():
                continue
            sha, _, name = line.partition("  ")
            shas[name.strip()] = sha.strip()
    return shas, expect


def verify(quick: bool = False) -> list[str]:
    problems: list[str] = []
    shas, expect = read_manifest()
    if not shas:
        return [f"no manifest at {os.path.relpath(MANIFEST, ROOT)} — "
                f"run with --update to write one"]

    present = {os.path.basename(p): p for _, p in corpus.discover()}

    for name, want in sorted(shas.items()):
        path = present.get(name) or os.path.join(BOOKS, name)
        if not os.path.exists(path):
            problems.append(f"{name}: MISSING")
            continue
        got = _sha256(path)
        if got != want:
            problems.append(f"{name}: hash mismatch — a different file or edition\n"
                            f"    expected {want}\n    got      {got}")
            continue
        print(f"  {name}: OK")

    for name in sorted(set(present) - set(shas)):
        problems.append(f"{name}: present but not in the manifest")

    if quick:
        return problems

    # Hashes can only tell us the bytes are identical. Parsing tells us the
    # chapter numbers our citations depend on still come out the same.
    print()
    for name, exp in sorted(expect.items(), key=lambda kv: kv[1]["book"]):
        path = present.get(name)
        if not path:
            continue
        try:
            got = parse(path, exp["book"])
        except DRMError as exc:
            problems.append(f"{name}: {exc}")
            continue
        words = sum(len(c["text"].split()) for c in got)
        if len(got) != exp["chapters"]:
            problems.append(f"{name}: parses to {len(got)} chapters, manifest says "
                            f"{exp['chapters']} — citations to book {exp['book']} "
                            f"are no longer trustworthy")
        elif words != exp["words"]:
            problems.append(f"{name}: {len(got)} chapters but {words:,} words, "
                            f"manifest says {exp['words']:,}")
        else:
            print(f"  book {exp['book']}: {len(got)} chapters, {words:,} words — OK")
    return problems


def update() -> None:
    from parse_ebook import parse as _parse
    rows = []
    _, old = read_manifest()
    for num, path in corpus.discover():
        name = os.path.basename(path)
        got = _parse(path, num)
        rows.append({
            "book": num, "name": name, "sha": _sha256(path),
            "bytes": os.path.getsize(path), "chapters": len(got),
            "words": sum(len(c["text"].split()) for c in got),
            "edition": old.get(name, {}).get("edition", "unrecorded — describe it here"),
        })

    head = [ln.rstrip("\n") for ln in open(MANIFEST)] if os.path.exists(MANIFEST) else []
    head = [ln for ln in head if ln.startswith("#") and not ln.startswith("# = ")]
    if not head:
        head = ["# Bobiverse ebook manifest", "#"]
    while head and not head[-1].strip("# "):
        head.pop()

    out = head + ["#"]
    for r in rows:
        out.append(f"# = {r['name']} | book {r['book']} | {r['chapters']} chapters "
                   f"| {r['words']} words | {r['bytes']} bytes | {r['edition']}")
    out.append("#")
    out += [f"{r['sha']}  {r['name']}" for r in rows]
    with open(MANIFEST, "w") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"wrote {os.path.relpath(MANIFEST, ROOT)} — {len(rows)} books")


def main() -> None:
    if "--update" in sys.argv:
        update()
        return
    problems = verify(quick="--quick" in sys.argv)
    if problems:
        print("\nPROBLEMS:", file=sys.stderr)
        for p in problems:
            print(f"  {p}", file=sys.stderr)
        sys.exit(1)
    print("\nbooks verified")


if __name__ == "__main__":
    main()
