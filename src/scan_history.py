"""Pre-publish check: has a passage of the books EVER been committed?

validate.py checks the working tree. Going public publishes the history, and a
passage that was pasted and later paraphrased away is still in the repository
for anyone who clones it. Same 12-gram rule, applied to every version of every
publishable file that has ever existed, plus every commit message.
"""
import json, re, subprocess, sys, os, glob

N = 12
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def grams(text):
    w = re.findall(r"[a-z0-9']+", text.lower())
    for i in range(len(w) - N + 1):
        yield " ".join(w[i:i + N])


def walk(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)


# ---- the corpus, as a set of 12-grams ---------------------------------
corpus = set()
for f in sorted(glob.glob(os.path.join(ROOT, ".cache", "*.json"))):
    d = json.load(open(f))
    chs = d if isinstance(d, list) else d.get("chapters", [])
    for ch in chs:
        if isinstance(ch, dict):
            corpus.update(grams(ch.get("text") or ""))
print(f"corpus: {len(corpus):,} distinct {N}-grams")


def git(*a):
    return subprocess.run(["git", "-C", ROOT, *a], capture_output=True, text=True).stdout


def scan(text, label, hits):
    for g in grams(text):
        if g in corpus:
            hits.append((label, g))
            return  # one report per source is enough


hits = []

# ---- every blob that has ever existed at a publishable path -----------
objs = git("rev-list", "--all", "--objects")
paths = {}
for line in objs.splitlines():
    parts = line.split(" ", 1)
    if len(parts) != 2:
        continue
    sha, path = parts
    if (path.startswith("data/") and path.endswith(".json") and "skyfield" not in path) \
       or path.endswith(".md") or (path.startswith("templates/") and path.endswith(".html")):
        paths.setdefault(path, []).append(sha)

nblobs = sum(len(v) for v in paths.values())
print(f"scanning {nblobs} blob versions across {len(paths)} publishable paths")
for path, shas in sorted(paths.items()):
    for sha in shas:
        raw = git("cat-file", "-p", sha)
        if path.endswith(".json"):
            try:
                text = " ".join(walk(json.loads(raw)))
            except Exception:
                text = raw
        else:
            text = raw
        scan(text, f"{path}@{sha[:8]}", hits)

# ---- every commit message ---------------------------------------------
msgs = git("log", "--all", "--format=%H%x00%B%x1e")
n = 0
for rec in msgs.split("\x1e"):
    if not rec.strip():
        continue
    sha, _, body = rec.strip().partition("\x00")
    n += 1
    scan(body, f"commit message {sha[:8]}", hits)
print(f"scanning {n} commit messages")

# ---- verdict -----------------------------------------------------------
print()
if hits:
    print(f"{len(hits)} SOURCES CONTAIN BOOK TEXT")
    for label, g in hits:
        print(f"  {label}\n    {g[:90]}...")
    sys.exit(1)
print("clean — no run of 12 words from the books appears anywhere in the history")
