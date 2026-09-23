# Three-language release validation — QALA LAB 1.1.0

Date: 2026-09-23. Environment: Linux, Python 3.13, Node.js 22, Chromium.

## Automated Python tests

`python -m unittest discover -s tests -v`: **125 tests passed**. The original 105 tests continue to pass; `tests/test_localization.py` adds 20 tests. The log is in `i18n/unittest_log.txt`.

Coverage: English labels for all districts, indicators, categories and measures; Kazakh/Russian compatibility; multilingual evidence and headings; deterministic English explanations; explanation translation maps; language-independent fact IDs and scenario ID; English lag/synergy keyword routing; mocked English provider payload and timeout fallback; all ten validation error classes; supported language validation; English bootstrap and explanation over a real local HTTP server; multilingual HTTP errors.

`node --check web/app.js`: passed.

## Preservation checks

Removing only the added `en` keys from the updated dataset reproduces the original release's dataset exactly. No source numerical value, weight, effect, lag, cost or rule was changed. AST comparisons confirm `_compute`, `_clip`, `simulate`, `baseline`, `compare`, `sensitivity`, `canonical_decisions` and `jsonable` are unchanged. The engine version and translated validation messages changed, so passport hashes change without changing numerical results.

## UI renderer tests

**57 checks passed**, details in `i18n/ui_report.json`. All seven sections, English empty states, calculation modal, English evidence and quick questions, switching the same answer across three languages without an additional AI call, preserving decisions, timing experiment, print-report HTML, English validation errors, and toolbar visibility were covered. Widths: 320, 390, 1024 and 1440 px in all three languages. No document-wide horizontal overflow or JavaScript page errors were found in these checks.

Managed Chromium blocks normal URL navigation. The UI was therefore rendered entirely in memory from our own HTML/CSS/JS. The harness supplied engine data directly (no browser network access) and used a Map-backed storage stub. Restoration from stored language/scenario values was tested through that interface; actual browser storage persistence across browser restarts was **not** verified. These are renderer/integration checks, not full network end-to-end tests. The HTTP server was tested separately via unittest. Screenshots are local renderings, not evidence of a deployed website.

## Not verified

No live LLM/API key was used. English provider request structure and fallback paths were tested with mocks. Windows launch, Docker, real browser network navigation and public hosting were not exercised. The original Kazakh PDF/PowerPoint documents and historical screenshots are retained from release 1.0; they were not translated in this website update.
