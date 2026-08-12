# Licensing

Three different things live in this repository and they are not under the same
terms. The short version:

| what | licence |
|---|---|
| Code — `src/`, `tests/`, `templates/`, `Makefile` | MIT |
| Our data and prose — `data/bobs.json`, `bestiary.json`, `peoples.json`, `memorium.json`, `todo.json`, `systems.json`, and the documentation | CC BY 4.0 |
| `data/skyfield.json` — the star backdrop | **CC BY-SA 4.0**, from the HYG Database |
| `books/`, `.cache/` | Not ours, never distributed, gitignored |

---

## Code — MIT

Copyright (c) 2026 the contributors to this repository.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Data and prose — CC BY 4.0

The registers are two things mixed together. The bulk of them is **facts about a
published work** — who was cloned from whom, in which system, in what year, and
which chapter says so. Facts are not copyrightable and we make no claim over
them. The rest is **our own writing**: the annotations, the fate notes, the
editorial voice throughout. That part is ours, and it is offered under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — use it, change it,
build on it, commercially or not, with attribution.

If you take the data, take the citations with it. They are the only part that
makes it worth having.

## The star backdrop — CC BY-SA 4.0, and this one is sticky

`data/skyfield.json` is derived from the
[HYG Database v4.4](https://codeberg.org/astronexus/hyg) by David Nash, which is
licensed **CC BY-SA 4.0**.

ShareAlike propagates. `dist/index.html` embeds that data, so **the built page
is a ShareAlike work** — if you distribute it, or anything else containing that
star field, it has to go out under CC BY-SA 4.0 as well, with attribution to
the HYG Database. This is not a technicality we are being cautious about; it is
how ShareAlike works, and it is why the licence is called out on the chart
itself rather than buried here.

If you want the console without that obligation, remove `skyfield.json` and the
backdrop with it. Everything else here is MIT or CC BY.

System positions, spectral types and magnitudes for the Bobiverse systems come
from [SIMBAD](https://simbad.u-strasbg.fr/), operated at CDS, Strasbourg
— acknowledgement requested, no licence obligation.

## The books

**Not ours, and not here.** The Bobiverse novels are Dennis E. Taylor's, and
nothing in this repository distributes them or any part of them.

`books/` and `.cache/` are gitignored and have never been committed. The
pipeline requires you to supply your own DRM-free copies; the parsed text that
`make corpus` produces is a derivative work and stays on the machine that made
it. What gets published is citations — book and chapter numbers pointing into a
work you are expected to own — and paraphrase in our own words. No passage of
the books appears in the data, the documentation, or the commit history, and
that is checked rather than assumed.

This is an unofficial fan project. It is not endorsed by or affiliated with
Dennis E. Taylor or his publishers.
