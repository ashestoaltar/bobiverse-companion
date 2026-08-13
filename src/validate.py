"""Validate data/bobs.json.

Checks structure, referential integrity, and the tier rules that keep the
provenance honest. Exits non-zero on any error so it can gate a build.
"""

from __future__ import annotations

import glob
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "bobs.json")
SYSTEMS = os.path.join(ROOT, "data", "systems.json")

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
# Graded on its own evidence, separately from src. The books put the line at
# the backup rather than the hull, so a destroyed vessel is not a death.
FATES = {
    "active":   "nothing on record",
    "restored": "vessel destroyed, the Bob recovered",
    "presumed": "vessel destroyed, the backup never accounted for",
    "memorium": "confirmed beyond recovery",
}
FATE_NEEDS_CITE = {"restored", "presumed", "memorium"}
FATE_NEEDS_NOTE = {"presumed", "memorium"}
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


PC_TO_LY = 3.261563777

# Bill lists distances from 82 Eridani in Bk3 ch21. Our coordinates should
# reproduce them — if a parallax ever gets fat-fingered, this is what catches it.
STATED_FROM_82 = [("epsilon_eridani", 12.5), ("omicron2_eridani", 12.0), ("tau_ceti", 12.0)]


def _load_systems() -> dict:
    if not os.path.exists(SYSTEMS):
        return {}
    with open(SYSTEMS) as fh:
        return {s["id"]: s for s in json.load(fh)["systems"]}


def _check_systems(bobs: list[dict]) -> tuple[list[str], list[str]]:
    """Systems file integrity, and that every Bob points at a system that exists."""
    systems = _load_systems()
    errors: list[str] = []
    warnings: list[str] = []
    if not systems:
        return errors, warnings

    for sid, sysm in systems.items():
        plx, dist, xyz = sysm.get("parallax_mas"), sysm.get("distance_ly"), sysm.get("xyz_ly")
        if plx:
            want = (1000.0 / plx) * PC_TO_LY
            if dist is None or abs(dist - want) > 0.01:
                errors.append(f"system {sid}: distance {dist} doesn't follow from parallax {plx} (expected {want:.3f})")
        if xyz and dist:
            r = math.sqrt(sum(v * v for v in xyz))
            if abs(r - dist) > 0.02:
                errors.append(f"system {sid}: xyz magnitude {r:.3f} disagrees with distance {dist}")
        if plx is None and sysm.get("xyz_ly") and sid != "sol":
            warnings.append(f"system {sid}: has coordinates but no parallax to justify them")

    # the fiction's own distances, as a check on the astrometry
    e82 = systems.get("82_eridani", {}).get("xyz_ly")
    if e82:
        for sid, said in STATED_FROM_82:
            xyz = systems.get(sid, {}).get("xyz_ly")
            if not xyz:
                continue
            got = math.dist(e82, xyz)
            if abs(got - said) > 1.0:
                warnings.append(f"{sid} is {got:.2f} ly from 82 Eridani; Bk3 ch21 says about {said}")

    # every system a Bob claims must exist
    for bob in bobs:
        refs = [bob.get("origin"), bob.get("lostAt")] + list(bob.get("visited") or [])
        for ref in [r for r in refs if r]:
            if ref not in systems:
                errors.append(f"{bob['id']}: unknown system {ref!r}")
    return errors, warnings


BESTIARY = os.path.join(ROOT, "data", "bestiary.json")

# Species the books establish as people. If one of these turns up in the
# bestiary, the register has drifted into saying something the books argue
# against — so it's an error, not a warning.
SAPIENT = {"deltan", "quinlan", "snark", "pav", "other", "bawbe", "arcadian"}


def _check_bestiary() -> tuple[list[str], list[str]]:
    """Fauna entries: no sapients, systems and places resolve, counts hold up."""
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(BESTIARY):
        return errors, warnings
    with open(BESTIARY) as fh:
        creatures = json.load(fh)["creatures"]

    systems = _load_systems()
    ids: set[str] = set()
    for c in creatures:
        cid = c.get("id") or "?"
        if cid in ids:
            errors.append(f"bestiary {cid}: duplicate id")
        ids.add(cid)

        # the boundary this register exists to keep
        if c.get("name", "").strip().lower().rstrip("s") in SAPIENT:
            errors.append(f"bestiary {cid}: {c.get('name')!r} is a people, not fauna — "
                          f"sapient species belong in the peoples register")
        if c.get("sapience") not in ("none", "contested"):
            errors.append(f"bestiary {cid}: sapience {c.get('sapience')!r} is not a bestiary value")
        if c.get("sapience") == "none" and not c.get("cite"):
            errors.append(f"bestiary {cid}: claiming non-sapience needs a cite that settles it")

        # locations must resolve into the systems file
        sid = c.get("system")
        if sid and systems and sid not in systems:
            errors.append(f"bestiary {cid}: unknown system {sid!r}")
        elif sid and c.get("place"):
            known = {p["name"] for p in (systems.get(sid, {}).get("places") or [])}
            if known and c["place"] not in known:
                warnings.append(f"bestiary {cid}: place {c['place']!r} isn't listed in "
                                f"{sid} ({', '.join(sorted(known)) or 'none'})")
        if c.get("place") and not sid:
            errors.append(f"bestiary {cid}: has a place but no system to put it in")

    warnings += _check_counts(creatures, "bestiary")
    return errors, warnings


def _chapters(narrative_only: bool = True) -> list[dict]:
    """Corpus entries. Back matter is excluded by default, and that is a claim.

    Mention counts are what the bestiary and peoples registers sort on — how
    much of the books an entry actually occupies. An alphabetical Cast of
    Characters names everyone exactly once whether they carry the series or
    appear in one scene, so counting it flattens the ordering into noise: it
    would add 18 to the Deltans and 1 to a creature nobody mentions twice, and
    the register's whole claim is that the difference means something.

    The appendices are still corpus and still searchable and still citable —
    they settled eighteen parentages. They are just not evidence of presence.
    """
    path = os.path.join(ROOT, ".cache", "corpus.json")
    if not os.path.exists(path):
        return []
    with open(path) as fh:
        chapters = json.load(fh)
    if narrative_only:
        chapters = [c for c in chapters if c.get("kind") != "appendix"]
    return chapters


def _mention_re(entry: dict) -> "re.Pattern | None":
    """How to count this entry's name in the books.

    The name alone is only good enough when it's an unambiguous coinage.
    Acronyms and ordinary words need an explicit pattern: counting 'USE'
    case-insensitively finds the verb 286 times instead of the state's 51, and
    'the Others' collides with the ordinary word. Same false-positive class that
    put Dr. Landers and the Spits in the bestiary's candidate list.
    """
    raw = entry.get("mentionPattern")
    if raw:
        try:
            return re.compile(raw)
        except re.error:
            return None
    return re.compile(r"\b" + re.escape(entry["name"]) + r"(?:e?s)?\b", re.I)


def _check_counts(entries: list[dict], label: str) -> list[str]:
    """Mention counts are derived from the books, so re-derive and compare."""
    chapters = _chapters()
    if not chapters:
        return []

    out = []
    for e in entries:
        pattern = _mention_re(e)
        if pattern is None:
            out.append(f"{label} {e['id']}: mentionPattern {e['mentionPattern']!r} is not a valid regex")
            continue
        got = sum(len(pattern.findall(ch["text"])) for ch in chapters)

        # Run this whether or not a count is recorded. An entry with no textual
        # presence at all is the failure these registers most need to catch —
        # something nobody wrote down is something we invented.
        if got == 0:
            out.append(f"{label} {e['id']}: {e['name']!r} appears nowhere in the corpus — "
                       f"either the name is wrong or the label is ours, not the books'")
            continue

        want = e.get("mentions")
        if want is None:
            out.append(f"{label} {e['id']}: no mention count recorded; the corpus has {got}")
            continue
        # Words are ambiguous — "hydra" also appears as "hydrae", "dragon" turns
        # up in VR and idiom. Flag a real drift, not a rounding difference.
        if abs(got - want) > max(3, want * 0.15):
            out.append(f"{label} {e['id']}: recorded {want} mentions, corpus has {got}")
    return out


PEOPLES = os.path.join(ROOT, "data", "peoples.json")
MEMORIUM = os.path.join(ROOT, "data", "memorium.json")

# Long enough that a hit is a passage rather than a phrase. Citations quote
# short and often; twelve words in the author's order is something else.
PASSAGE_LEN = 12


def _check_memorium(bobs: list[dict], by_id: dict) -> tuple[list[str], list[str]]:
    """The In Memorium list: the unnamed entries stay honest, and the spelling stays Taylor's.

    The counted-but-unnamed entries are the point of the file, so they get the
    strictest checks in the project. `n` has to stay smaller than the pool it is
    drawn from — if it ever equalled it we would know every name and they would
    not be unnamed — and every id in that pool has to be a real record at fate
    'presumed', because a Bob we have since resolved must not still be sitting in
    a bucket of maybes.
    """
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(MEMORIUM):
        return errors, warnings
    with open(MEMORIUM) as fh:
        doc = json.load(fh)

    # Taylor spells it "In Memorium" in all three references. Standard English
    # says Memoriam, so this is exactly the kind of thing a careful reader
    # corrects on the way past. It is a quotation, not a spelling mistake.
    # Checked over the payload only — the _comment keys have to be able to say
    # the wrong spelling in order to warn anyone off it.
    payload = json.dumps({k: v for k, v in doc.items() if not k.startswith("_")})
    for text in (payload, "".join(b.get("fateNote", "") for b in bobs)):
        if re.search(r"[Mm]emoriam", text):
            errors.append("'Memoriam' — the books spell it 'Memorium'; it is "
                          "Taylor's word, not a typo. See data/memorium.json.")

    systems = _load_systems()
    named = {b["id"] for b in bobs if b.get("fate") == "memorium"}
    if not named:
        errors.append("memorium.json: no Bob is at fate 'memorium' — the list "
                      "cannot be empty while the books name four")

    for i, entry in enumerate(doc.get("unnamed", [])):
        where = f"memorium.json unnamed[{i}]"
        n = entry.get("n")
        pool = entry.get("of", [])
        if not isinstance(n, int) or n < 1:
            errors.append(f"{where}: n must be a positive integer")
        if not entry.get("cite"):
            errors.append(f"{where}: a counted absence still needs the page that counts it")
        if not entry.get("note"):
            errors.append(f"{where}: needs a note saying what is and isn't known")
        if entry.get("where") and entry["where"] not in systems:
            errors.append(f"{where}: unknown system {entry['where']!r}")
        # The pool's arithmetic — how many died, how many were restored, how many
        # candidates are left — changes every time one of them is settled, and it
        # is derived from this file and the fate fields. Prose does not update
        # itself: within hours of being written, five fateNotes saying "six
        # vessels ... exactly half ... all six here" were wrong on all three
        # counts, because Elmer's vessel was the seventh and Hannibal had since
        # been ruled out. Keep the count in one place and let the register do the
        # counting.
        for bid in pool:
            note = (by_id.get(bid) or {}).get("fateNote") or ""
            stale = re.search(r"\bhalf\b|\ball (?:three|four|five|six|seven)\b", note, re.I)
            if stale:
                errors.append(f"{where}: {bid}'s fateNote says {stale.group(0)!r} about the pool. "
                              "That arithmetic changes whenever a candidate is settled — state it "
                              "once, in this file's note, and let the register derive the rest")
            if bid not in by_id:
                errors.append(f"{where}: candidate {bid!r} is not a record")
            elif by_id[bid].get("fate") != "presumed":
                errors.append(f"{where}: candidate {bid!r} is at fate "
                              f"{by_id[bid].get('fate')!r}, not 'presumed' — either it was "
                              "resolved and belongs out of the pool, or the pool is stale")
        if isinstance(n, int) and pool and n >= len(pool):
            errors.append(f"{where}: {n} unnamed drawn from a pool of {len(pool)} — "
                          "at n == pool the names would all be known")

    return errors, warnings


def _check_no_passages() -> list[str]:
    """Nothing we publish may contain a passage of the books.

    The rule has always been paraphrase and cite, and until now it was kept by
    remembering it. This checks it: every run of PASSAGE_LEN consecutive words
    in anything publishable is looked up against the corpus, and a hit means
    someone pasted rather than paraphrased.

    The length is the judgement. Short quotation is the point of a citation —
    "It's Will, now" has to be allowed to appear — while twelve consecutive
    words in Taylor's order is a passage however it got there. Words are
    lowercased and stripped of punctuation first, so retyping it with different
    quote marks doesn't get past.
    """
    chapters = _chapters(narrative_only=False)
    if not chapters:
        return []

    def grams(text: str):
        words = re.findall(r"[a-z0-9']+", text.lower())
        for i in range(len(words) - PASSAGE_LEN + 1):
            yield " ".join(words[i:i + PASSAGE_LEN])

    # Collect from everything that gets published, then scan the corpus once.
    ours: dict[str, str] = {}
    # The template is scanned too. It carries as much of our prose as the data
    # does — the idle panel, the trace endings, every sec-label — and all of it
    # ships inside dist/index.html. It was outside this check purely because the
    # check was written the day the data was the only place prose lived.
    for path in sorted(glob.glob(os.path.join(ROOT, "data", "*.json"))) + \
                sorted(glob.glob(os.path.join(ROOT, "*.md"))) + \
                sorted(glob.glob(os.path.join(ROOT, "templates", "*.html"))):
        name = os.path.basename(path)
        if name == "skyfield.json":       # packed integers, no prose
            continue
        with open(path) as fh:
            raw = fh.read()
        if name.endswith(".json"):
            def walk(node):
                if isinstance(node, str):
                    yield node
                elif isinstance(node, dict):
                    for v in node.values():
                        yield from walk(v)
                elif isinstance(node, list):
                    for v in node:
                        yield from walk(v)
            text = " ".join(walk(json.loads(raw)))
        else:
            text = raw
        for g in grams(text):
            ours.setdefault(g, name)

    if not ours:
        return []
    out = []
    seen: set[str] = set()
    for ch in chapters:
        for g in grams(ch["text"]):
            if g in ours and g not in seen:
                seen.add(g)
                where = f"Bk{ch['book']} ch{ch['seq']}"
                out.append(f"{ours[g]}: {PASSAGE_LEN} consecutive words from {where} — "
                           f"paraphrase and cite instead: \"{g[:70]}...\"")
    return out


def _check_peoples() -> tuple[list[str], list[str]]:
    """Peoples and polities: locations resolve, kinds are coherent, counts hold."""
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(PEOPLES):
        return errors, warnings
    with open(PEOPLES) as fh:
        entries = json.load(fh)["entries"]

    systems = _load_systems()
    ids = {e["id"] for e in entries}
    peoples = {e["id"] for e in entries if e.get("kind") == "people"}

    seen: set[str] = set()
    for e in entries:
        eid = e.get("id") or "?"
        if eid in seen:
            errors.append(f"peoples {eid}: duplicate id")
        seen.add(eid)

        if e.get("kind") not in ("people", "polity"):
            errors.append(f"peoples {eid}: kind {e.get('kind')!r} is not people or polity")
        if not e.get("cite"):
            errors.append(f"peoples {eid}: needs a cite")
        if e.get("contact") and e.get("kind") != "people":
            errors.append(f"peoples {eid}: contact is about a species, not a polity")

        # a polity has to belong to somebody we know, when it belongs to anyone
        owner = e.get("of")
        if owner and owner not in peoples:
            errors.append(f"peoples {eid}: of {owner!r} is not a people in this file")
        if owner and e.get("kind") == "people":
            errors.append(f"peoples {eid}: a people doesn't belong to another people")

        sid = e.get("system")
        if sid and systems and sid not in systems:
            errors.append(f"peoples {eid}: unknown system {sid!r}")
        elif sid and e.get("place"):
            known = {p["name"] for p in (systems.get(sid, {}).get("places") or [])}
            if known and e["place"] not in known:
                warnings.append(f"peoples {eid}: place {e['place']!r} isn't listed in {sid}")
        if e.get("place") and not sid:
            errors.append(f"peoples {eid}: has a place but no system to put it in")

    warnings += _check_counts(entries, "peoples")
    errors += _check_no_overlap(entries)
    return errors, warnings


def _check_no_overlap(entries: list[dict]) -> list[str]:
    """A name may not be filed as both a people and a beast.

    This is the one rule that spans the two registers, and it's the whole reason
    the split exists: the Deltans are people, and the console must never be able
    to say otherwise in one view while saying the opposite in another.
    """
    if not os.path.exists(BESTIARY):
        return []
    with open(BESTIARY) as fh:
        creatures = json.load(fh)["creatures"]
    fauna = {c["name"].strip().lower().rstrip("s"): c["id"] for c in creatures}
    out = []
    for e in entries:
        key = e["name"].strip().lower().removeprefix("the ").rstrip("s")
        if key in fauna:
            out.append(f"peoples {e['id']}: {e['name']!r} is also in the bestiary "
                       f"as {fauna[key]!r} — a people cannot also be fauna")
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
        fate = bob.get("fate")
        if fate not in FATES:
            errors.append(f"{where}: unknown fate {fate!r}")
        else:
            # A fate other than active is a claim about the text and needs a page.
            if fate in FATE_NEEDS_CITE and not bob.get("fateCite"):
                errors.append(f"{where}: fate {fate!r} needs a fateCite")
            if fate in FATE_NEEDS_NOTE and not bob.get("fateNote"):
                errors.append(f"{where}: fate {fate!r} needs a fateNote")
            if fate == "active" and (bob.get("fateCite") or bob.get("fateNote")):
                errors.append(f"{where}: fate is active but carries fate evidence")
        if bob.get("status") is not None:
            errors.append(f"{where}: 'status' was replaced by 'fate'; it collapsed "
                          "restored and presumed into 'lost'")

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

    sys_errors, sys_warnings = _check_systems(bobs)
    errors += sys_errors
    warnings += sys_warnings

    best_errors, best_warnings = _check_bestiary()
    errors += best_errors
    warnings += best_warnings

    ppl_errors, ppl_warnings = _check_peoples()
    errors += ppl_errors
    warnings += ppl_warnings

    mem_errors, mem_warnings = _check_memorium(bobs, by_id)
    errors += mem_errors
    warnings += mem_warnings

    errors += _check_no_passages()

    # `gen` is only independent information when the parent chain is broken.
    # Where the chain reaches Bob-1 it's derivable, so any disagreement means one
    # of the two is stale — as happened when Loki was reparented a level down.
    for bob in bobs:
        if bob.get("gen") is None:
            continue
        depth, cur, guard = 1, bob, 0
        while cur.get("parent") and guard < 50:
            cur = by_id.get(cur["parent"])
            if cur is None:
                break
            depth, guard = depth + 1, guard + 1
        if cur is not None and cur["id"] == ROOT_ID and depth != bob["gen"]:
            errors.append(f"{bob['id']}: gen {bob['gen']} but the tree makes it {depth}")

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
