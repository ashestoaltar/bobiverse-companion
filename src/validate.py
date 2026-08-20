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
# The four mutual-interest groups. They live in two files on purpose: a tag on
# the record, because affiliation is a fact about a Bob, and an entry in the
# peoples register, because a faction is a thing in the world with a history.
# The two are tied by `factionTag` and this set, so neither can drift alone.
FACTIONS = {"Starfleet", "Skippies", "Gamers", "Borg"}

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
        cites = (bob.get("cite", "") or "") + "; " + (bob.get("nameFrom", "") or "")
        for bk, sq, pov, when in CITE.findall(cites):
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


PROSE_FIELDS = ("note", "fateNote", "partialNote", "priorClaim", "conflict")

BOOKS_FILE = os.path.join(ROOT, "data", "books.json")


def _series() -> list[dict]:
    with open(BOOKS_FILE) as fh:
        return json.load(fh)["books"]


# How long the series is. Derived, not declared — the console reads the same
# file, so the validator's bounds and the reader's positions cannot disagree.
BOOKS = sum(1 for b in _series() if b.get("released"))
PARA_MARK = re.compile(r"^@bk(\d+)\s+")


def _paragraphs(text: str | None, fallback: int | None):
    """Split prose into (book, text), honouring a paragraph's own @bk marker.

    A note can span books — four of Homer's five fate paragraphs are the book he
    dies in and the fifth is the coda two books later. The marker travels with
    the paragraph rather than sitting in a parallel array, so editing the prose
    cannot silently misalign it.
    """
    out = []
    for para in [p.strip() for p in (text or "").split("\n\n") if p.strip()]:
        m = PARA_MARK.match(para)
        if not m:
            out.append((fallback, para))
            continue
        n = int(m.group(1))
        out.append((n if 1 <= n <= BOOKS else None, para[m.end():]))
    return out


def _book_of(cite: str | None) -> int | None:
    m = re.search(r"Bk(\d)", cite or "")
    return int(m.group(1)) if m else None


def _check_spoil(bobs: list[dict]) -> tuple[list[str], list[str]]:
    """`spoil` says how far a record's own prose reaches.

    The console withholds undeclared prose from a reader who has set a reading
    position, so a missing value costs a blank panel rather than a spoiled book
    — which is why this reports rather than fails. What it does fail is a value
    that cannot be true: prose that claims to be safe earlier than the record it
    annotates is either the wrong number or a note about the wrong Bob.
    """
    errors: list[str] = []
    undeclared: list[str] = []
    for bob in bobs:
        has_prose = any(bob.get(f) for f in PROSE_FIELDS)
        spoil = bob.get("spoil")
        if spoil is None:
            if has_prose:
                undeclared.append(bob["id"])
            continue
        if not has_prose:
            errors.append(f"{bob['id']}: spoil {spoil} but the record carries no prose")
            continue
        attested = [n for n in (_book_of(bob.get("cite")), _book_of(bob.get("fateCite"))) if n]
        if attested and spoil < min(attested):
            errors.append(
                f"{bob['id']}: spoil {spoil} is earlier than book {min(attested)}, "
                f"where the record is first cited — an annotation cannot be safe "
                f"before the thing it annotates"
            )
        # A paragraph that names a later book than it is safe at gives itself
        # away. Checked per paragraph, since a paragraph may carry its own
        # marker: Homer's fate note is book two for four paragraphs and book
        # five for the fifth, and the whole-field check called that a conflict.
        for field in PROSE_FIELDS:
            for i, (at, text) in enumerate(_paragraphs(bob.get(field), spoil)):
                if at is None:
                    errors.append(f"{bob['id']}: {field} paragraph {i + 1} carries an "
                                  f"unreadable @bk marker")
                    continue
                inline = _book_of(text)
                if inline and inline > at:
                    errors.append(f"{bob['id']}: {field} paragraph {i + 1} is marked safe "
                                  f"at book {at} but cites Bk{inline}")
    # the companion registers gate their prose the same way and get the same
    # two checks — a note cannot be safe before its entry, and cannot name a
    # book past the one it claims to reach
    for path, key in ((BESTIARY, "creatures"), (PEOPLES, "entries"),
                      (VESSELS, "vessels"), (PERSONS, "persons")):
        if not os.path.exists(path):
            continue
        with open(path) as fh:
            entries = json.load(fh)[key]
        name = os.path.basename(path).split(".")[0]
        for e in entries:
            spoil, note = e.get("spoil"), e.get("note")
            if spoil is None:
                if note:
                    undeclared.append(f"{name}/{e['id']}")
                continue
            cited = _book_of(e.get("cite"))
            if cited and spoil < cited:
                errors.append(f"{name} {e['id']}: spoil {spoil} is earlier than its own "
                              f"citation in Bk{cited}")
            for i, (at, text) in enumerate(_paragraphs(note, spoil)):
                if at is None:
                    errors.append(f"{name} {e['id']}: note paragraph {i + 1} carries an "
                                  f"unreadable @bk marker")
                    continue
                inline = _book_of(text)
                if inline and inline > at:
                    errors.append(f"{name} {e['id']}: note paragraph {i + 1} is marked safe "
                                  f"at book {at} but cites Bk{inline}")
    # Gates: nodes, paths, and summaries all carry gated prose.
    if os.path.exists(GATES):
        with open(GATES) as fh:
            gates = json.load(fh)
        for key in ("nodes", "paths", "summaries"):
            for e in gates.get(key) or []:
                spoil, note = e.get("spoil"), e.get("note")
                if spoil is None:
                    if note:
                        undeclared.append(f"gates/{e.get('id')}")
                    continue
                cited = _book_of(e.get("cite"))
                if cited and spoil < cited:
                    errors.append(f"gates {e.get('id')}: spoil {spoil} is earlier than its own "
                                  f"citation in Bk{cited}")
                for i, (at, text) in enumerate(_paragraphs(note, spoil)):
                    if at is None:
                        errors.append(f"gates {e.get('id')}: note paragraph {i + 1} carries an "
                                      f"unreadable @bk marker")
                        continue
                    inline = _book_of(text)
                    if inline and inline > at:
                        errors.append(
                            f"gates {e.get('id')}: note paragraph {i + 1} is marked safe "
                            f"at book {at} but cites Bk{inline}")

    warnings = []
    if undeclared:
        warnings.append(
            f"{len(undeclared)} records carry prose with no `spoil`, so it is withheld "
            f"from anyone reading with a book limit set: {', '.join(sorted(undeclared)[:6])}"
            + (" ..." if len(undeclared) > 6 else "")
        )
    return errors, warnings


def _check_names(bobs: list[dict]) -> list[str]:
    """`nameFrom` is the chapter a Bob started going by the name we file him under.

    It only means anything next to `alias`: without one there is no earlier name
    to fall back to, and the field would be recording a change from nothing.
    """
    out = []
    for bob in bobs:
        if bob.get("nameFrom") and not bob.get("alias"):
            out.append(f"{bob['id']}: nameFrom without an alias — there is no earlier "
                       f"name to show before that chapter")
        if bob.get("alias") and not bob.get("nameFrom"):
            out.append(f"{bob['id']}: has an alias but no nameFrom, so a reader with a "
                       f"book limit set will be shown a name he has not taken yet")
    return out


BLOG = os.path.join(ROOT, "data", "blog.json")
VESSELS = os.path.join(ROOT, "data", "vessels.json")
PERSONS = os.path.join(ROOT, "data", "persons.json")
GATES = os.path.join(ROOT, "data", "gates.json")
VOICES = {"bobnet", "editor"}
VESSEL_KINDS = {"design", "hull", "class", "weapon"}
VESSEL_LINES = {"heaven", "colony", "exodus", "medeiros", "others", "other"}
PERSON_KINDS = {"person", "ami", "replicant"}
PERSON_SUBSTRATES = {"biological", "replicated", "ami", "foreign_probe"}
PERSON_REQUIRED = ("id", "name", "kind", "label", "substrate", "substrateFrom",
                   "role", "cite", "note", "spoil")
# Role is a headline, not a second bio — long roles invite invented jobs.
PERSON_ROLE_MAX = 72
# AMI classification is easy to invent (Archimedes was wrongly filed as AMI once).
PERSON_AMI_EVIDENCE = re.compile(
    r"\bAMI\b|artificial mind|android|not a(?:n)?(?:\s+Heaven)?\s+replicant", re.I)
# Non-Bob matrix minds (Henry Roberts) — must not be slipped onto bobs.json casually.
PERSON_REPLICANT_EVIDENCE = re.compile(
    r"\breplicant\b|not a(?:n)?(?:\s+Heaven)?\s+Bob\b|Australian (?:probe )?replicant", re.I)
GATE_NODE_KINDS = {"hub", "system", "place", "faction_home"}
GATE_LAYERS = {"found", "constructed"}
GATE_PATH_KINDS = {"found", "constructed", "planned"}
GATE_PATH_STATUS = {"surveyed", "planned", "building", "open"}
GATE_ROLE_MAX = 72


def _person_search_token(name: str) -> str:
    """Surname / distinctive token used to verify the cite chapter mentions them."""
    n = re.sub(r"^(Dr\.|Colonel|Professor)\s+", "", name or "", flags=re.I).strip()
    parts = n.split()
    return parts[-1] if parts else n


def _ids(path: str, key: str, field: str = "id") -> set | None:
    if not os.path.exists(path):
        return None
    with open(path) as fh:
        return {x[field] for x in json.load(fh)[key]}


def _bob_ids() -> set | None:
    if not os.path.exists(DATA):
        return None
    with open(DATA) as fh:
        return {b["id"] for b in json.load(fh)["bobs"]}


def _system_ids() -> set | None:
    systems = _load_systems()
    return set(systems) if systems else None


# Which pool an address's id has to be found in. The replicant views all list
# the same records, so they share one; todo has no selectable items at all.
ADDRESSABLE = {
    "register":   _bob_ids,
    "genealogy":  _bob_ids,
    "unresolved": _bob_ids,
    "memorium":   _bob_ids,
    "chart":      _system_ids,
    "systems":    _system_ids,
    "bestiary":   lambda: _ids(BESTIARY, "creatures"),
    "peoples":    lambda: _ids(PEOPLES, "entries"),
    "vessels":    lambda: _ids(VESSELS, "vessels"),
    "persons":    lambda: _ids(PERSONS, "persons"),
    "blog":       lambda: _ids(BLOG, "posts"),
    "todo":       lambda: None,
}


def _check_vessels() -> tuple[list[str], list[str]]:
    """Craft register: designs, hulls, classes — and the match strings that
    let a Bob dossier link into it without inventing a second vessel field."""
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(VESSELS):
        return errors, warnings
    with open(VESSELS) as fh:
        vessels = json.load(fh)["vessels"]
    bob_ids = _bob_ids() or set()
    by_id = {v.get("id"): v for v in vessels}
    ids: set[str] = set()
    matches: dict[str, str] = {}
    for v in vessels:
        vid = v.get("id") or "?"
        if vid in ids:
            errors.append(f"vessels {vid}: duplicate id")
        ids.add(vid)
        if v.get("kind") not in VESSEL_KINDS:
            errors.append(f"vessels {vid}: kind {v.get('kind')!r} not in {sorted(VESSEL_KINDS)}")
        if v.get("line") not in VESSEL_LINES:
            errors.append(f"vessels {vid}: line {v.get('line')!r} not in {sorted(VESSEL_LINES)}")
        if not v.get("cite"):
            errors.append(f"vessels {vid}: needs a citation")
        if not v.get("note") or len(v.get("note") or "") < 40:
            errors.append(f"vessels {vid}: note too thin")
        spoil = v.get("spoil")
        if not isinstance(spoil, int) or spoil < 1:
            errors.append(f"vessels {vid}: spoil must be a book number")
        design = v.get("design")
        if design and design not in by_id:
            errors.append(f"vessels {vid}: design {design!r} is not a vessel id")
        elif design and by_id[design].get("kind") != "design":
            errors.append(f"vessels {vid}: design {design!r} is not kind design")
        for bid in v.get("crew") or []:
            if bid not in bob_ids:
                errors.append(f"vessels {vid}: crew {bid!r} is not a Bob on file")
        m = v.get("match")
        if m:
            if m in matches:
                errors.append(f"vessels {vid}: match {m!r} already used by {matches[m]}")
            matches[m] = vid
    # Every free-text vessel label on a Bob should resolve, or we are advertising
    # a link the console cannot make. Soft warning until the catalogue is full.
    if os.path.exists(DATA):
        with open(DATA) as fh:
            bobs = json.load(fh)["bobs"]
        for b in bobs:
            lab = b.get("vessel")
            if lab and lab not in matches:
                warnings.append(f"bob {b['id']}: vessel {lab!r} has no vessels.match entry")
    return errors, warnings


def _check_persons() -> tuple[list[str], list[str]]:
    """Named people and AMIs who are not replicants: species resolve, Bobs resolve.

    Bios are easy to invent. Guardrails here are necessary but not sufficient:
    the cite chapter must mention them, AMI kind needs textual evidence, roles
    stay short. Wrong paraphrase (Butterworth as VEHEMENT liaison) still needs
    a human reading the chapter — see CLAUDE.md Persons discipline.
    """
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(PERSONS):
        return errors, warnings
    with open(PERSONS) as fh:
        persons = json.load(fh)["persons"]
    bob_ids = _bob_ids() or set()
    systems = _load_systems()
    chapters = _chapters()
    index = {(c["book"], c["seq"]): c for c in chapters} if chapters else {}
    people_ids: set[str] | None = None
    if os.path.exists(PEOPLES):
        with open(PEOPLES) as fh:
            people_ids = {e["id"] for e in json.load(fh)["entries"]
                          if e.get("kind") == "people"}
    ids: set[str] = set()
    by_name: dict[str, list[dict]] = {}
    for p in persons:
        pid = p.get("id") or "?"
        if pid in ids:
            errors.append(f"persons {pid}: duplicate id")
        ids.add(pid)
        if not re.match(r"^[a-z0-9_]+$", pid):
            errors.append(f"persons {pid}: id must match ^[a-z0-9_]+$")
        for key in PERSON_REQUIRED:
            if not p.get(key) and p.get(key) != 0:
                errors.append(f"persons {pid}: missing required field '{key}'")
        if p.get("kind") not in PERSON_KINDS:
            errors.append(f"persons {pid}: kind {p.get('kind')!r} not in {sorted(PERSON_KINDS)}")
        if p.get("kind") == "person":
            species = p.get("species")
            if not species:
                errors.append(f"persons {pid}: kind person needs a species")
            elif people_ids is not None and species not in people_ids:
                errors.append(f"persons {pid}: species {species!r} is not a people "
                              f"in peoples.json")
            note = p.get("note") or ""
            if re.search(r"\bis an AMI\b|\bas an AMI\b", note, re.I):
                errors.append(f"persons {pid}: note claims AMI but kind is person")
        elif p.get("kind") == "ami":
            if p.get("species"):
                errors.append(f"persons {pid}: kind ami must not have a species")
            note = p.get("note") or ""
            if not PERSON_AMI_EVIDENCE.search(note):
                errors.append(
                    f"persons {pid}: kind ami needs the note to state AMI / android / "
                    f"artificial mind / not a replicant — do not invent this classification")
        elif p.get("kind") == "replicant":
            species = p.get("species")
            if not species:
                errors.append(f"persons {pid}: kind replicant needs a species "
                              f"(usually humans)")
            elif people_ids is not None and species not in people_ids:
                errors.append(f"persons {pid}: species {species!r} is not a people "
                              f"in peoples.json")
            note = p.get("note") or ""
            if not PERSON_REPLICANT_EVIDENCE.search(note):
                errors.append(
                    f"persons {pid}: kind replicant needs the note to state they are a "
                    f"replicant / not a Heaven Bob — Henry Roberts is the type case")
        substrate = p.get("substrate")
        if substrate not in PERSON_SUBSTRATES:
            errors.append(f"persons {pid}: substrate {substrate!r} not in "
                          f"{sorted(PERSON_SUBSTRATES)}")
        sub_from = p.get("substrateFrom")
        if not isinstance(sub_from, int) or sub_from < 1:
            errors.append(f"persons {pid}: substrateFrom must be a book number")
        # kind ↔ substrate consistency
        if substrate == "ami" and p.get("kind") != "ami":
            errors.append(f"persons {pid}: substrate ami requires kind ami")
        if substrate == "foreign_probe" and p.get("kind") != "replicant":
            errors.append(f"persons {pid}: substrate foreign_probe requires kind replicant")
        if substrate in ("biological", "replicated") and p.get("kind") not in ("person",):
            errors.append(f"persons {pid}: substrate {substrate} requires kind person")
        # Change-arc: replicated with substrateFrom > cite book is Bridget-shaped;
        # if substrateFrom equals cite book they appeared already replicated.
        cite_book = _book_of(p.get("cite"))
        if (substrate == "replicated" and isinstance(sub_from, int) and cite_book
                and sub_from < cite_book):
            errors.append(
                f"persons {pid}: substrateFrom {sub_from} is earlier than cite book "
                f"{cite_book} — cannot reveal matrix status before they appear")
        role = p.get("role") or ""
        if len(role) > PERSON_ROLE_MAX:
            errors.append(f"persons {pid}: role is {len(role)} chars "
                          f"(max {PERSON_ROLE_MAX}) — keep the job title short")
        if not p.get("note") or len(p.get("note") or "") < 40:
            errors.append(f"persons {pid}: note too thin")
        spoil = p.get("spoil")
        if not isinstance(spoil, int) or spoil < 1:
            errors.append(f"persons {pid}: spoil must be a book number")
        cite = p.get("cite") or ""
        if cite and not cite.startswith("Bk"):
            errors.append(f"persons {pid}: cite {cite!r} does not start with Bk")
        # Early prose must not leak a gated substrate change (Bridget).
        if (substrate == "replicated" and isinstance(sub_from, int) and sub_from > 1):
            for i, (at, para) in enumerate(_paragraphs(p.get("note"), spoil)):
                if at is None:
                    continue
                if at < sub_from and re.search(
                        r"\breplicat|\bmatrix\b|post-life|scanned and woken", para, re.I):
                    errors.append(
                        f"persons {pid}: note paragraph {i + 1} is safe at book {at} but "
                        f"mentions replication before substrateFrom {sub_from}")
        # Cite chapter must actually mention them (corpus present).
        token = _person_search_token(p.get("name") or "")
        m = re.match(r"^Bk(\d+)\s+ch(\d+)", cite)
        if chapters and m and token:
            bk, sq = int(m.group(1)), int(m.group(2))
            chapter = index.get((bk, sq))
            if chapter is None:
                errors.append(f"persons {pid}: cites Bk{bk} ch{sq}, which the corpus lacks")
            elif not re.search(r"\b" + re.escape(token) + r"\b", chapter.get("text") or "", re.I):
                # Accent-fold: Stephane vs Stéphane
                fold = unicodedata_normalize(token)
                text = chapter.get("text") or ""
                if not re.search(r"\b" + re.escape(fold) + r"\b",
                                 unicodedata_normalize(text), re.I):
                    errors.append(
                        f"persons {pid}: cite Bk{bk} ch{sq} never mentions {token!r} — "
                        f"open the chapter before writing the bio")
        for bid in p.get("bobs") or []:
            if bid not in bob_ids:
                errors.append(f"persons {pid}: bob {bid!r} is not a Bob on file")
        sid = p.get("system")
        if sid and systems and sid not in systems:
            errors.append(f"persons {pid}: unknown system {sid!r}")
        if p.get("name"):
            by_name.setdefault(p["name"], []).append(p)
    for p in persons:
        pid = p.get("id") or "?"
        for aid in p.get("also") or []:
            if aid in ids or aid in bob_ids:
                continue
            errors.append(f"persons {pid}: also {aid!r} is neither a person nor a Bob on file")
    for name, holders in by_name.items():
        if len(holders) < 2:
            continue
        labels = [h.get("label") for h in holders]
        if len(set(labels)) < len(holders):
            who = ", ".join(h.get("id") or "?" for h in holders)
            warnings.append(f"persons name collision {name!r}: {who}")
    return errors, warnings


def _check_gates() -> tuple[list[str], list[str]]:
    """Wormhole travel topology — not Chart geometry, not SCUT.

    Nodes may be unlocated. Paths may carry ferry_ly only when kind is
    constructed or planned. Summaries hold counted-mesh facts that must not
    become fake edge rows. Ids are unique across nodes+paths+summaries.
    """
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(GATES):
        return errors, warnings
    with open(GATES) as fh:
        data = json.load(fh)
    nodes = data.get("nodes") or []
    paths = data.get("paths") or []
    summaries = data.get("summaries") or []

    systems = set()
    if os.path.exists(SYSTEMS):
        with open(SYSTEMS) as fh:
            systems = {s["id"] for s in json.load(fh)["systems"]}
    people_ids: set[str] = set()
    if os.path.exists(PEOPLES):
        with open(PEOPLES) as fh:
            people_ids = {e["id"] for e in json.load(fh)["entries"]}

    ids: set[str] = set()
    node_by_id = {}
    for n in nodes:
        nid = n.get("id") or "?"
        if nid in ids:
            errors.append(f"gates {nid}: duplicate id")
        ids.add(nid)
        node_by_id[nid] = n
        if n.get("kind") not in GATE_NODE_KINDS:
            errors.append(f"gates {nid}: kind {n.get('kind')!r} not in {sorted(GATE_NODE_KINDS)}")
        if n.get("layer") not in GATE_LAYERS:
            errors.append(f"gates {nid}: layer {n.get('layer')!r} not in {sorted(GATE_LAYERS)}")
        if not n.get("cite") or not str(n.get("cite")).startswith("Bk"):
            errors.append(f"gates {nid}: needs a Bk citation")
        if not n.get("note") or len(n.get("note") or "") < 40:
            errors.append(f"gates {nid}: note too thin")
        if not isinstance(n.get("spoil"), int) or n["spoil"] < 1:
            errors.append(f"gates {nid}: spoil must be a book number")
        role = n.get("role") or ""
        if len(role) > GATE_ROLE_MAX:
            errors.append(f"gates {nid}: role is {len(role)} chars (max {GATE_ROLE_MAX})")
        sid = n.get("system")
        if sid and sid not in systems:
            errors.append(f"gates {nid}: unknown system {sid!r}")
        for aid in n.get("also") or []:
            if aid not in people_ids:
                errors.append(f"gates {nid}: also {aid!r} is not a peoples entry")

    for n in nodes:
        nid = n.get("id") or "?"
        at = n.get("at")
        if at and at not in node_by_id:
            errors.append(f"gates {nid}: at {at!r} is not a gates node")
        elif at and at == nid:
            errors.append(f"gates {nid}: at cannot reference itself")

    for p in paths:
        pid = p.get("id") or "?"
        if pid in ids:
            errors.append(f"gates {pid}: duplicate id")
        ids.add(pid)
        if p.get("kind") not in GATE_PATH_KINDS:
            errors.append(f"gates {pid}: kind {p.get('kind')!r} not in {sorted(GATE_PATH_KINDS)}")
        status = p.get("status")
        if status is not None and status not in GATE_PATH_STATUS:
            errors.append(f"gates {pid}: status {status!r} not in {sorted(GATE_PATH_STATUS)}")
        if not p.get("cite") or not str(p.get("cite")).startswith("Bk"):
            errors.append(f"gates {pid}: needs a Bk citation")
        if not p.get("note") or len(p.get("note") or "") < 40:
            errors.append(f"gates {pid}: note too thin")
        if not isinstance(p.get("spoil"), int) or p["spoil"] < 1:
            errors.append(f"gates {pid}: spoil must be a book number")
        role = p.get("role") or ""
        if len(role) > GATE_ROLE_MAX:
            errors.append(f"gates {pid}: role is {len(role)} chars (max {GATE_ROLE_MAX})")
        ends = p.get("ends") or []
        if len(ends) != 2:
            errors.append(f"gates {pid}: ends must be exactly two node ids")
        for end in ends:
            if end not in node_by_id:
                errors.append(f"gates {pid}: end {end!r} is not a gates node")
        # ferry / span distances are logistics facts for Bob-built work only
        if p.get("kind") == "found":
            if p.get("ferry_ly_total") is not None or p.get("span_ly") is not None:
                errors.append(f"gates {pid}: found paths cannot carry ferry_ly_total or span_ly")

    for s in summaries:
        sid = s.get("id") or "?"
        if sid in ids:
            errors.append(f"gates {sid}: duplicate id")
        ids.add(sid)
        if not s.get("cite") or not str(s.get("cite")).startswith("Bk"):
            errors.append(f"gates {sid}: needs a Bk citation")
        if not s.get("note") or len(s.get("note") or "") < 40:
            errors.append(f"gates {sid}: note too thin")
        if not isinstance(s.get("spoil"), int) or s["spoil"] < 1:
            errors.append(f"gates {sid}: spoil must be a book number")
        role = s.get("role") or ""
        if len(role) > GATE_ROLE_MAX:
            errors.append(f"gates {sid}: role is {len(role)} chars (max {GATE_ROLE_MAX})")

    # Soft: cite chapter should mention a distinctive token from the name.
    chapters = _chapters()
    index = {(c["book"], c["seq"]): c for c in chapters} if chapters else {}
    if chapters:
        # Nodes must be named in their cite chapter. Paths check via end names.
        # Summaries are editorial scale facts — title tokens need not appear.
        for e in list(nodes) + list(paths):
            eid = e.get("id") or "?"
            cite = e.get("cite") or ""
            m = re.match(r"^Bk(\d+)\s+ch(\d+)", cite)
            if not m:
                continue
            token = _person_search_token(e.get("name") or "")
            bk, sq = int(m.group(1)), int(m.group(2))
            chapter = index.get((bk, sq))
            if chapter is None:
                errors.append(f"gates {eid}: cites Bk{bk} ch{sq}, which the corpus lacks")
                continue
            text = chapter.get("text") or ""
            ok = False
            candidates = [token] if token and len(token) >= 4 else []
            for end in e.get("ends") or []:
                n = node_by_id.get(end)
                if n:
                    t2 = _person_search_token(n.get("name") or "")
                    if t2:
                        candidates.append(t2)
            for cand in candidates:
                fold = unicodedata_normalize(cand)
                if re.search(r"\b" + re.escape(cand) + r"\b", text, re.I) or re.search(
                        r"\b" + re.escape(fold) + r"\b", unicodedata_normalize(text), re.I):
                    ok = True
                    break
            if candidates and not ok:
                errors.append(
                    f"gates {eid}: cite Bk{bk} ch{sq} never mentions "
                    f"{candidates[0]!r} — open the chapter before writing the note")

    return errors, warnings


def unicodedata_normalize(s: str) -> str:
    """Fold accents for cite mention checks (Stéphane → Stephane)."""
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


HOLO = os.path.join(ROOT, "data", "holo.json")
HOLO_KINDS = {"vr", "vessel", "specimen", "portrait"}


def _check_holo() -> tuple[list[str], list[str]]:
    """The holotank, and the one rule that makes it safe to have at all.

    The console is allowed to open a rich picture because the books are not set
    in a green-screen terminal — Bob builds a VR that keeps improving and ends
    up inhabiting android bodies, so a registry that could only ever draw
    phosphor would be arguing with its own source. What a rich picture must
    never do is stand in for knowledge nobody has.

    So: **no plate without a citation.** Not a nicer citation than the record's,
    not a citation to the general idea — the chapter that describes the thing in
    the picture. A Bob whose parentage nobody recorded does not get a beautiful
    room to make up for it, and the failure this guards against is the pleasant
    one, where the page grows handsomer than it is informed.
    """
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(HOLO):
        return errors, warnings
    with open(HOLO) as fh:
        plates = json.load(fh)["plates"]

    seen: set[str] = set()
    art_dir = os.path.join(ROOT, "assets", "holo")
    for plate in plates:
        pid = plate.get("id") or "?"
        if pid in seen:
            errors.append(f"holo {pid}: duplicate id")
        seen.add(pid)
        if not plate.get("cite"):
            errors.append(f"holo {pid}: no citation — a plate without one is the page "
                          f"knowing less than it looks like it knows")
        elif not re.match(r"^Bk\d+ (ch\d+|·) ", plate["cite"]):
            errors.append(f"holo {pid}: cite {plate['cite']!r} is not in the usual form")
        if plate.get("kind") not in HOLO_KINDS:
            errors.append(f"holo {pid}: kind {plate.get('kind')!r} is not one of "
                          f"{sorted(HOLO_KINDS)}")
        if not plate.get("note"):
            errors.append(f"holo {pid}: needs a note saying what the citation actually says")
        spoil = plate.get("spoil")
        if not isinstance(spoil, int) or not 1 <= spoil <= BOOKS:
            errors.append(f"holo {pid}: spoil {spoil!r} must be a book number")
        elif plate.get("cite"):
            m = re.match(r"^Bk(\d+)", plate["cite"])
            if m and spoil < int(m.group(1)):
                errors.append(f"holo {pid}: spoil {spoil} is earlier than book {m.group(1)}, "
                              f"where it is cited")
        # the address it hangs on, resolved the same way a blog post's is
        a = plate.get("about") or ""
        view, _, ident = a.partition("/")
        if view not in ADDRESSABLE:
            errors.append(f"holo {pid}: about {a!r} names no register")
        else:
            pool = ADDRESSABLE[view]()
            if pool is not None and ident not in pool:
                errors.append(f"holo {pid}: about {a!r} points at nothing")
        if not os.path.exists(os.path.join(art_dir, pid + ".webp")):
            errors.append(f"holo {pid}: no image at assets/holo/{pid}.webp")
        mid = plate.get("model")
        if mid is not None:
            if not isinstance(mid, str) or not re.match(r"^[a-z0-9_-]+$", mid):
                errors.append(f"holo {pid}: model {mid!r} must be a simple id")
            else:
                mpath = os.path.join(ROOT, "assets", "holo-models", mid + ".glb")
                if not os.path.exists(mpath):
                    errors.append(f"holo {pid}: model {mid!r} missing at "
                                  f"assets/holo-models/{mid}.glb")

    # An image with no plate ships nothing and costs nothing, which is exactly
    # why it would sit there unnoticed.
    if os.path.isdir(art_dir):
        for name in sorted(os.listdir(art_dir)):
            if name.endswith(".webp") and name[:-5] not in seen:
                warnings.append(f"assets/holo/{name} has no plate and will not ship")
    model_dir = os.path.join(ROOT, "assets", "holo-models")
    if os.path.isdir(model_dir):
        used_models = {p.get("model") for p in plates if p.get("model")}
        for name in sorted(os.listdir(model_dir)):
            if name.endswith(".glb") and name[:-4] not in used_models:
                warnings.append(f"assets/holo-models/{name} has no plate and will not ship")
    return errors, warnings


def _check_blog() -> tuple[list[str], list[str]]:
    """The feed, and the one rule that keeps it honest.

    `voice` is not decoration. A post marked bobnet is Bill talking on his own
    network, and nothing inside the fiction knows the novels exist — so a post
    in that voice may not mention the books, the appendices, or Taylor. A post
    marked editor is this registry's own voice, the one the dossier labels on
    every annotation, and it may say all of that. Blending the two silently is
    the failure this checks for.
    """
    errors: list[str] = []
    warnings: list[str] = []
    if not os.path.exists(BLOG):
        return errors, warnings
    with open(BLOG) as fh:
        posts = json.load(fh)["posts"]

    # Things a Bob cannot know about. Deliberately blunt: a false positive here
    # costs one rewritten sentence, and a miss costs the frame.
    OUTSIDE = ("appendix", "appendices", "taylor", "the novel", "the novels",
               "the book 2", "chapter ", "the reader", "canon")
    ids: set[str] = set()
    for post in posts:
        pid = post.get("id", "?")
        if pid in ids:
            errors.append(f"blog {pid}: duplicate id — it is the address, so it has to be unique")
        ids.add(pid)
        voice = post.get("voice")
        if voice not in VOICES:
            errors.append(f"blog {pid}: voice {voice!r} is not one of {sorted(VOICES)}")
            continue
        spoil = post.get("spoil")
        if not isinstance(spoil, int) or not 1 <= spoil <= BOOKS:
            errors.append(f"blog {pid}: spoil {spoil!r} must be a book number — a post is "
                          f"prose all the way down, with no citation underneath to fall back on")
        if voice == "bobnet":
            text = " ".join(str(post.get(k, "")) for k in ("title", "dek", "body")).lower()
            for word in OUTSIDE:
                if word in text:
                    errors.append(f"blog {pid}: a bobnet post says {word!r} — Bill does not "
                                  f"know the books are books. Mark it voice 'editor' or "
                                  f"rewrite it in his.")
        # `about` is written as console addresses, so it can point at anything
        # that has one — and a dead address is a link that renders as nothing.
        for a in post.get("about") or []:
            view, _, ident = a.partition("/")
            if view not in ADDRESSABLE:
                errors.append(f"blog {pid}: about '{a}' names no register")
                continue
            if not ident:
                continue
            pool = ADDRESSABLE[view]()
            if pool is not None and ident not in pool:
                errors.append(f"blog {pid}: about '{a}' points at nothing")

        for i, (at, para) in enumerate(_paragraphs(post.get("body"), spoil)):
            if at is None:
                errors.append(f"blog {pid}: paragraph {i + 1} carries an unreadable @bk marker")
            elif _book_of(para) and _book_of(para) > at:
                errors.append(f"blog {pid}: paragraph {i + 1} is marked safe at book {at} "
                              f"but cites Bk{_book_of(para)}")
    return errors, warnings


# Claims whose scope is the corpus that was searched, and the number of books
# that corpus held when each was established. These are not counts — they are
# findings, and a finding does not survive a new book by having its number
# incremented. Each entry is (file, a substring that locates the sentence, the
# book count it was verified against); the day the series grows, every one of
# them fails with the sentence in hand, to be re-checked against the new book
# and then re-established, re-bounded or withdrawn.
#
# Pattern-matching English cannot do this job. "his fate runs across three
# books" and "nobody in five books ever goes back to it" are the same shape and
# opposite things — the first is a span inside the story and stays true forever,
# the second is an exhaustiveness claim about everything we have read. Only the
# author knows which was meant, so the author writes it down.
CORPUS_CLAIMS = [
    ("memorium.json", "nobody in five books ever goes back to it", 5),
    ("peoples.json", "the Bobs spend five books arguing about", 5),
    ("todo.json", "are each named exactly once in five books", 5),
    ("bestiary.schema.json", "How many times the name appears across the five books", 5),
    ("genealogy.html", "are each named once in five books", 5),
]


def _check_books() -> tuple[list[str], list[str]]:
    """The series file, and every sentence that counts it.

    Two different things say "five books" and they need opposite treatment. A
    *count* — "47 mentions across the five books" — is arithmetic and belongs to
    the data, so it is rendered from BOOK_MAX and cannot drift. A *claim* —
    "named exactly once in five books", "nobody in five books ever goes back to
    it" — is a research finding whose scope is the corpus that was searched, and
    it does not survive a new book merely by having its number incremented.

    So the counts are parameterised in the template and every literal that
    survives is, by construction, a claim. This fails on each one the day the
    series grows, which is the intent: the sentence has to be re-read against
    the new book and either re-established or withdrawn. An auto-updated
    exhaustiveness claim is the exact failure this project has already paid for
    once, when `priorClaim` boilerplate asserted the books were silent about
    eighteen parentages the appendix states outright.
    """
    errors: list[str] = []
    warnings: list[str] = []
    series = _series()

    if not series:
        return ["books.json: no books"], warnings
    seen = set()
    for b in series:
        n = b.get("n")
        if not isinstance(n, int) or n < 1:
            errors.append(f"books.json: {n!r} is not a book number")
            continue
        if n in seen:
            errors.append(f"books.json: book {n} listed twice")
        seen.add(n)
        if not b.get("title"):
            errors.append(f"books.json: book {n} has no title")
        if not isinstance(b.get("released"), bool):
            errors.append(f"books.json: book {n} must say whether it is released")
    if sorted(seen) != list(range(1, len(series) + 1)):
        errors.append(f"books.json: numbering has a gap — {sorted(seen)}")
    # Released books have to be a prefix. A gap would mean a reading position
    # nobody can occupy sitting between two they can.
    flags = [bool(b.get("released")) for b in sorted(series, key=lambda b: b.get("n", 0))]
    if flags != sorted(flags, reverse=True):
        errors.append("books.json: an unreleased book sits before a released one")

    # No citation may claim a book that is not out. The data can lag the series
    # — it will, for as long as it takes to read a new one — but it can never
    # lead it, and a stray Bk6 would silently become unreachable prose.
    for path in sorted(glob.glob(os.path.join(ROOT, "data", "*.json"))):
        with open(path) as fh:
            raw = fh.read()
        for m in re.finditer(r"\bBk(\d+)\b", raw):
            if int(m.group(1)) > BOOKS:
                errors.append(f"{os.path.basename(path)}: cites Bk{m.group(1)}, "
                              f"but only {BOOKS} books are released")
                break

    # Every corpus-bounded claim still says what it says, and still means what
    # it meant. A missing one is an error too: the sentence was reworded and the
    # registry was not, which is how this check quietly stops guarding anything.
    for name, phrase, verified in CORPUS_CLAIMS:
        for folder in ("data", "templates"):
            path = os.path.join(ROOT, folder, name)
            if os.path.exists(path):
                break
        else:
            errors.append(f"books.json: corpus claim registered against {name}, "
                          f"which does not exist")
            continue
        with open(path) as fh:
            text = fh.read()
        if phrase not in text:
            errors.append(
                f"{name}: the corpus-bounded claim \"{phrase}\" is no longer there. "
                f"If it was reworded, update CORPUS_CLAIMS; if it was withdrawn, "
                f"remove the entry.")
        elif verified < BOOKS:
            errors.append(
                f"{name}: \"{phrase}\" was established against {verified} books and "
                f"{BOOKS} are released. Re-check it against book {BOOKS} — then say "
                f"so by updating CORPUS_CLAIMS. Do not just change the number: an "
                f"exhaustiveness claim does not survive a new book by being "
                f"renumbered.")
        elif verified > BOOKS:
            errors.append(f"{name}: \"{phrase}\" claims a corpus of {verified} books "
                          f"and only {BOOKS} are released")
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

        if e.get("kind") not in ("people", "polity", "faction"):
            errors.append(f"peoples {eid}: kind {e.get('kind')!r} is not people, "
                          f"polity or faction")
        if not e.get("cite"):
            errors.append(f"peoples {eid}: needs a cite")
        if e.get("contact") and e.get("kind") != "people":
            errors.append(f"peoples {eid}: contact is about a species, not a polity")
        # A faction holds no ground and speaks for no population — that is the
        # whole reason it is not a polity, so it may not claim a world either.
        if e.get("kind") == "faction" and (e.get("system") or e.get("place")):
            errors.append(f"peoples {eid}: a faction has no territory; "
                          f"drop system/place or make it a polity")
        if e.get("kind") == "faction" and e.get("of"):
            errors.append(f"peoples {eid}: a faction speaks for itself, not for a people")
        if e.get("kind") == "faction" and e.get("factionTag") not in FACTIONS:
            errors.append(f"peoples {eid}: factionTag {e.get('factionTag')!r} is not "
                          f"one of the tags records carry ({', '.join(sorted(FACTIONS))})")
        if e.get("factionTag") and e.get("kind") != "faction":
            errors.append(f"peoples {eid}: factionTag belongs to a faction")

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
        if bob.get("faction") and bob["faction"] not in FACTIONS:
            errors.append(f"{where}: unknown faction {bob['faction']!r}")
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

    spoil_errors, spoil_warnings = _check_spoil(bobs)
    errors += spoil_errors
    warnings += spoil_warnings

    blog_errors, blog_warnings = _check_blog()
    errors += blog_errors
    warnings += blog_warnings

    ves_errors, ves_warnings = _check_vessels()
    errors += ves_errors
    warnings += ves_warnings

    per_errors, per_warnings = _check_persons()
    errors += per_errors
    warnings += per_warnings

    gate_errors, gate_warnings = _check_gates()
    errors += gate_errors
    warnings += gate_warnings

    holo_errors, holo_warnings = _check_holo()
    errors += holo_errors
    warnings += holo_warnings

    book_errors, book_warnings = _check_books()
    errors += book_errors
    warnings += book_warnings

    errors += _check_names(bobs)
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
