"""Turn DRM-free MOBI/EPUB files into a list of chapter records.

Every Bobiverse chapter opens with the same three or four fields: an optional
title, the POV Bob, an in-world date, and usually a location. The date is the
only one that is unambiguously identifiable by shape, so it is the anchor:
find the date paragraph, and the POV is the paragraph before it.

Editions disagree about how that header is marked up, so there are three
detectors, tried in order: header-as-paragraph, header-as-list-item, and a flat
regex over untagged text. A book that yields zero chapters is usually a fourth
markup shape rather than a bad file.

Refuses DRM'd files rather than trying to work around them.
"""

from __future__ import annotations

import html
import os
import re
import struct
import sys
import zipfile

# NB: keep the non-capturing group. Without it the alternation binds loosely
# when interpolated below and the pattern degrades to "any bare month name".
# Abbreviations are optional but necessary: book 2 ch18 is dated "Sept 2172",
# and requiring full month names dropped the chapter and knocked every later
# chapter number in that book one out of step with the printed book.
MONTHS = (
    "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    "Jul(?:y)?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|"
    "Dec(?:ember)?)"
)
# Three shapes in the wild: "July 15, 2133", "July 2133", and "September, 2182"
# — that last one, month-comma-year with no day, silently cost us two chapters
# of book 2 and shifted every chapter number after them.
# Book 4 ch30 dates itself "Same Day" instead of giving a date. It's the only
# relative header in the five books, but dropping it lost a chapter and put
# every later book 4 number out of step.
RELATIVE = r"Same Day|Next Day|Later That (?:Day|Evening|Night)"
DATE = re.compile(
    rf"^(?:{MONTHS}\s+\d{{1,2}},\s*\d{{4}}|{MONTHS},?\s+\d{{4}}|\d{{4}}|{RELATIVE})$"
)
POV_NAME = re.compile(r"^[A-Z][A-Za-z0-9'\-]{1,18}(?: [A-Z][A-Za-z'\-]+)?$")

MIN_BODY_CHARS = 800


class DRMError(RuntimeError):
    """Raised when a file is encrypted and cannot be read."""


# --------------------------------------------------------------------------
# shared helpers
# --------------------------------------------------------------------------

def _paragraphs(markup: str) -> list[str]:
    body = re.search(r"<body[^>]*>(.*)</body>", markup, re.S)
    if not body:
        return []
    out = []
    for m in re.finditer(r"<p\b[^>]*>(.*?)</p>", body.group(1), re.S):
        text = re.sub(r"<br[^>]*>", " ", m.group(1))
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"\s+", " ", html.unescape(text)).strip()
        if text:
            out.append(text)
    return out


def _chapter_from_paragraphs(ps: list[str]) -> dict | None:
    """Date-anchored header detection. Returns None if this isn't a chapter."""
    if len(ps) < 5:
        return None
    date_idx = next((i for i in range(1, min(7, len(ps))) if DATE.match(ps[i])), None)
    if date_idx is None:
        return None

    pov = ps[date_idx - 1]
    if not POV_NAME.match(pov):
        return None

    title = ps[date_idx - 2] if date_idx >= 2 else None
    where, body_start = None, date_idx + 1
    nxt = ps[date_idx + 1] if date_idx + 1 < len(ps) else ""
    if nxt and len(nxt) < 48 and not nxt.endswith((".", "!", "?", "\u201d")):
        where, body_start = nxt, date_idx + 2

    body = " ".join(ps[body_start:])
    if len(body) < MIN_BODY_CHARS:
        return None

    return {
        "title": title,
        "pov": pov,
        "when": ps[date_idx],
        "where": where,
        "text": body,
    }


# --------------------------------------------------------------------------
# EPUB
# --------------------------------------------------------------------------

def _epub_spine(path: str):
    zf = zipfile.ZipFile(path)
    names = zf.namelist()
    if any("encryption" in n.lower() or "rights" in n.lower() for n in names):
        raise DRMError(f"{os.path.basename(path)} appears to be DRM-protected")

    opf_name = next(n for n in names if n.endswith(".opf"))
    opf = zf.read(opf_name).decode("utf-8", "ignore")
    base = os.path.dirname(opf_name)

    hrefs = {}
    for tag in re.findall(r"<item\b[^>]*>", opf):
        href = re.search(r'href="([^"]+)"', tag)
        ident = re.search(r'id="([^"]+)"', tag)
        if href and ident:
            hrefs[ident.group(1)] = href.group(1)

    for ref in re.findall(r'<itemref[^>]*idref="([^"]+)"', opf):
        href = hrefs.get(ref)
        if not href:
            continue
        full = os.path.normpath(os.path.join(base, href)).replace("\\", "/")
        if full in names:
            yield zf.read(full).decode("utf-8", "ignore")


# --------------------------------------------------------------------------
# MOBI
# --------------------------------------------------------------------------

def _palmdoc_decompress(data: bytes) -> bytes:
    out = bytearray()
    i, n = 0, len(data)
    while i < n:
        c = data[i]
        i += 1
        if c == 0:
            out.append(0)
        elif c <= 8:
            out += data[i:i + c]
            i += c
        elif c <= 0x7F:
            out.append(c)
        elif c <= 0xBF:
            if i >= n:
                break
            lz = (c << 8) | data[i]
            i += 1
            dist, length = (lz >> 3) & 0x7FF, (lz & 7) + 3
            if dist == 0 or dist > len(out):
                break
            start = len(out) - dist
            for j in range(length):
                out.append(out[start + j])
        else:
            out.append(32)
            out.append(c ^ 0x80)
    return bytes(out)


def _trim_trailing(record: bytes, flags: int) -> bytes:
    for bit in range(15, 0, -1):
        if flags & (1 << bit):
            size = 0
            for i in range(1, 5):
                byte = record[len(record) - i]
                size |= (byte & 0x7F) << ((i - 1) * 7)
                if byte & 0x80:
                    break
            record = record[: len(record) - size]
    if flags & 1:
        record = record[: len(record) - ((record[-1] & 3) + 1)]
    return record


def _mobi_markup(path: str) -> str:
    data = open(path, "rb").read()
    count = struct.unpack(">H", data[76:78])[0]
    offsets = [struct.unpack(">I", data[78 + i * 8: 82 + i * 8])[0] for i in range(count)]
    offsets.append(len(data))

    header = data[offsets[0]:offsets[1]]
    if struct.unpack(">H", header[12:14])[0] != 0:
        raise DRMError(f"{os.path.basename(path)} is DRM-protected (encryption flag set)")

    compression = struct.unpack(">H", header[0:2])[0]
    text_len = struct.unpack(">I", header[4:8])[0]
    text_recs = struct.unpack(">H", header[8:10])[0]
    extra = struct.unpack(">H", header[0xF2:0xF4])[0] if len(header) > 0xF4 else 0

    raw = bytearray()
    for i in range(1, text_recs + 1):
        rec = _trim_trailing(data[offsets[i]:offsets[i + 1]], extra)
        raw += _palmdoc_decompress(rec) if compression == 2 else rec
    return raw[:text_len].decode("utf-8", "ignore")


def _mobi_sections(path: str):
    markup = _mobi_markup(path)
    for part in re.split(r"<mbp:pagebreak[^>]*/?>", markup):
        yield "<body>" + part + "</body>"


# --------------------------------------------------------------------------
# public API
# --------------------------------------------------------------------------

def parse(path: str, book: int) -> list[dict]:
    """Parse one ebook into chapter records tagged with the book number."""
    ext = os.path.splitext(path)[1].lower()
    if ext == ".epub":
        docs = _epub_spine(path)
    elif ext in (".mobi", ".azw", ".azw3", ".prc"):
        docs = _mobi_sections(path)
    else:
        raise ValueError(f"unsupported format: {ext}")

    chapters = []
    for markup in docs:
        chapter = _chapter_from_paragraphs(_paragraphs(markup))
        if chapter is None:
            # Some editions set the header as a list item rather than a paragraph.
            chapter = _chapter_from_listhead(markup)
        if chapter is None:
            # Book 1's MOBI has no <p> tags; fall back to a flat text split.
            chapter = _chapter_from_flat(markup)
        if chapter is None:
            continue
        chapter["book"] = book
        chapter["seq"] = len(chapters) + 1
        chapters.append(chapter)

    # Where the edition prints its own chapter numbers, hold our positional
    # count to them. Every numbering bug we've had was silent — a header shape
    # we didn't match, dropping a chapter and shifting every number after it.
    # This is the one book that can tell us, so let it.
    for chapter in chapters:
        printed = chapter.pop("printed", None)
        if printed is not None and printed != chapter["seq"]:
            print(f"  book {book}: chapter {chapter['seq']} is printed as {printed} "
                  f"— a chapter was probably missed before it", file=sys.stderr)
    return chapters


# Book 1's dated chapters read "Bob \u2013 July 15, 2133", but its first two are
# "Bob Version 1.0" and "Bob Version 2.0" with no dash at all. Requiring the
# separator silently dropped both, which pushed every book 1 chapter number two
# out of step with the printed book. Allow bare whitespace before "Version".
FLAT_HEAD = re.compile(
    rf"^([A-Z][A-Za-z0-9'\-]{{1,18}})(?:\s*[\u2013\u2014-]\s*|\s+(?=Version\b))"
    rf"((?:{MONTHS}\s+\d{{1,2}},\s*\d{{4}})|(?:{MONTHS}\s+\d{{4}})|(?:Version \d\.\d))"
    r"(?:\s*[\u2013\u2014-]\s*([A-Za-z0-9 \u00b2']{3,28}?))?(?=\s+[A-Z\u201c\[])"
)


# The 2016 ebook edition of book 1 sets each chapter header as a single-item
# ordered list — "<li value="13">Bob – August 17, 2133 – En Route</li>" — with
# the body as ordinary paragraphs after it. The date is no longer a paragraph,
# so the date-anchored detector never sees it and the whole book parses to
# nothing. The li's `value` is the printed chapter number, which parse() then
# holds our positional count to.
LIST_ITEM = re.compile(r'<li\b[^>]*\bvalue="(\d+)"[^>]*>(.*?)</li>', re.S)

# Same shape as FLAT_HEAD, but anchored to a standalone header rather than
# reaching into the body for its right-hand boundary. Book 1 ch56 uses ASCII
# hyphens where every other chapter uses en dashes, hence the character class.
HEAD_PARTS = re.compile(
    rf"^([A-Z][A-Za-z0-9'\-]{{1,18}})(?:\s*[–—-]\s*|\s+(?=Version\b))"
    rf"((?:{MONTHS}\s+\d{{1,2}},\s*\d{{4}})|(?:{MONTHS},?\s+\d{{4}})|(?:Version \d\.\d))"
    r"(?:\s*[–—-]\s*(.+?))?$"
)


def _chapter_from_listhead(markup: str) -> dict | None:
    items = LIST_ITEM.findall(markup)
    if len(items) != 1:
        return None
    value, inner = items[0]
    header = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", inner))).strip()
    m = HEAD_PARTS.match(header)
    if not m:
        return None

    body = " ".join(_paragraphs(markup))
    if len(body) < MIN_BODY_CHARS:
        return None

    return {
        "title": None,
        "pov": m.group(1),
        "when": m.group(2),
        "where": (m.group(3) or "").strip() or None,
        "text": body,
        "printed": int(value),
    }


def _chapter_from_flat(markup: str) -> dict | None:
    text = re.sub(r"<[^>]+>", " ", markup)
    text = re.sub(r"\s+", " ", html.unescape(text)).strip()
    if len(text) < 1200:
        return None
    m = FLAT_HEAD.match(text)
    if not m:
        return None
    body = text[m.end():].strip()
    if len(body) < MIN_BODY_CHARS:
        return None
    return {
        "title": None,
        "pov": m.group(1),
        "when": m.group(2),
        "where": (m.group(3) or "").strip() or None,
        "text": body,
    }
