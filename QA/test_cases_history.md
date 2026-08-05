

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 06:03 (24-hour format)
**Feature / Module:** F7 — Catalog & search (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: failed-fetch behaviour, empty-state copy and interpolation, missing states,
  image optimizer, injection, market scoping, caching, product detail, search filters and
  ordering, infinite scroll, screen states, accessibility.
- Source registers mined: `QA/defects.csv` (4, 5, 6, 7), `QA/security.csv` (CWEB-09),
  `QA/code_review.csv` (#35, #36, #37, #38, #42).
- Total cases written: 25 (TC-CAT-001 … TC-CAT-025)

## Coverage Summary
- Positive: 5 · Negative: 7 · Negative (security): 4 · Boundary: 1 · Regression: 17 carry a
  `Linked Bug ID` · Accessibility / i18n / Performance: 4 · Total Cases: 25

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-CAT-001 … TC-CAT-025

## Findings Given Regression Coverage
- DEF-7 (001, 002, 003) · DEF-4 (004, 005) · DEF-5 (006) · DEF-6 (007, 008) ·
  SEC-CWEB-09 (009, 010, 011) · CR-38 (012) · CR-35 (013) · CR-36 (014) · CR-37 (015) ·
  CR-42 (016, 017)

## Coverage Gaps Remaining
- **Home layout sections** — the builder and its section types are unspecified; it is the single
  largest unspecified surface left in the catalogue.
- **Store detail** beyond the injection case is unspecified.
- **Product reviews and FAQ** sections on the PDP are unspecified.
- **Recently viewed** behaviour is unspecified.
- **Product gallery and lightbox** interaction is unspecified.

## Notes
- **Seventeen of twenty-five are regressions**, the highest proportion of any feature so far,
  because this pass produced four fresh defects on top of five existing code-review findings for
  the same area.
- TC-CAT-003 exists specifically to stop defect 7's fix from over-correcting: after the fetcher
  starts throwing, a genuine zero-result search must still show the empty state rather than an
  error. A fix that turns every empty search into an error would pass TC-CAT-001 and fail here.
- TC-CAT-010 and TC-CAT-011 record the parts of the image configuration that are currently
  **correct** — http and loopback targets refused, and SVG forced to download — so a future
  loosening of `contentDispositionType` or the protocol restriction is caught.
- TC-CAT-005 checks the interpolation fix across all three locale bundles, since defect 4's root
  cause is a name mismatch that can easily be fixed in English only.

---
