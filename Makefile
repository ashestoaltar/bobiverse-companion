.PHONY: help corpus verify-books validate scan-history build test snapshots serve workbench clean

help:
	@echo "corpus       parse ebooks in books/ into .cache/corpus.json"
	@echo "verify-books check books/ against books/MANIFEST.sha256"
	@echo "validate     check data/bobs.json for schema and integrity errors"
	@echo "scan-history check every commit ever made for book text"
	@echo "build        render console into dist/index.html + dist/assets/"
	@echo "test         build, then run the console's test suites"
	@echo "snapshots    re-record the golden-master snapshots (review the diff!)"
	@echo "serve        build, then serve dist/ on :8000 (preferred over file://)"
	@echo "workbench    the console at four phone sizes at once, on :8000"
	@echo "clean        remove dist/ and .cache/ (never books/)"

corpus:
	@python3 src/corpus.py

verify-books:
	@python3 src/verify_books.py

validate:
	@python3 src/validate.py

# validate checks the working tree. Publishing publishes the history, and a
# passage pasted once and paraphrased away later is still in the repository for
# anyone who clones it. Run before making this public, not after.
scan-history:
	@python3 src/scan_history.py

build: validate
	@python3 src/build.py

test: build
	@node tests/run.js

# Re-records the golden master. Only run this when output changed on purpose,
# and commit the snapshot with the change that caused it — a snapshot updated
# in its own commit tells you nothing.
snapshots: build
	@node tests/run.js --update-snapshots

serve: build
	@cd dist && python3 -m http.server 8000

# Copied next to the page rather than served from tools/, because it reads
# index.html with fetch() and the two have to be the same origin. It reads the
# real built page, so there is no second copy of the console to drift.
workbench: build
	@cp tools/workbench.html dist/workbench.html
	@echo "workbench at http://127.0.0.1:8000/workbench.html"
	@cd dist && python3 -m http.server 8000

clean:
	@rm -rf dist .cache
	@echo "cleaned"
