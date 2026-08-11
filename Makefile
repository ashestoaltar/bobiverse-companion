.PHONY: help corpus verify-books validate build serve clean

help:
	@echo "corpus       parse ebooks in books/ into .cache/corpus.json"
	@echo "verify-books check books/ against books/MANIFEST.sha256"
	@echo "validate     check data/bobs.json for schema and integrity errors"
	@echo "build        render data/bobs.json into dist/index.html"
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

serve: build
	@cd dist && python3 -m http.server 8000

clean:
	@rm -rf dist .cache
	@echo "cleaned"
