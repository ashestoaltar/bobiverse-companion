.PHONY: help corpus verify-books validate build test snapshots serve clean

help:
	@echo "corpus       parse ebooks in books/ into .cache/corpus.json"
	@echo "verify-books check books/ against books/MANIFEST.sha256"
	@echo "validate     check data/bobs.json for schema and integrity errors"
	@echo "build        render data/bobs.json into dist/index.html"
	@echo "test         build, then run the console's test suites"
	@echo "snapshots    re-record the golden-master snapshots (review the diff!)"
	@echo "serve        build, then serve dist/ on :8000"
	@echo "clean        remove dist/ and .cache/ (never books/)"

corpus:
	@python3 src/corpus.py

verify-books:
	@python3 src/verify_books.py

validate:
	@python3 src/validate.py

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

clean:
	@rm -rf dist .cache
	@echo "cleaned"
