

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 06:03 (24-hour format)
**Feature / Module:** F7 — Catalog & search (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- **The first pass that could genuinely exercise the product.** Catalogue routes are public, so
  with the dev server running they render without a session. The backend was still unreachable,
  which made this an effective test of failure behaviour.
- Flows tested: categories listing, brands listing, stores listing, search results, and the
  rendered visible text of each with a dead catalogue backend.
- Breakpoints tested: none. Locales tested: English only.
- Total screens exercised: 4 rendered and inspected as visible text.

## Findings Summary
- Critical: 0 · High: 1 · Medium: 2 · Low: 1 · Total Defects: 4

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 4 — Search no-results message renders the literal `{{query}}` placeholder (Medium)
- ID: 5 — Categories subtitle is a truncated sentence (Low)
- ID: 6 — Brands listing renders no empty state and no error state (Medium)
- ID: 7 — A failed catalogue fetch is presented as "no results" (High)

## Existing Defects Confirmed
- None from `defects.csv`. Defect 7 is the observed symptom of code review issue 34, which
  described the mechanism; this pass shows what the customer actually sees.

## Areas Verified Working
- **Every catalogue route renders without a session** — categories, brands, stores and search all
  returned 200, so the public/private split established in F1 holds.
- **Categories and search both ship a real empty state** with a headline and an explanatory line.
  The defect is which state they choose, not that they lack one — which is precisely what
  distinguishes them from brands.
- **The page shell, header, footer, filter and sort controls all render** under a total backend
  failure, so the fallback constants keep the page usable rather than crashing it.

## Notes
- **This pass is the argument for fixing the environment.** Four defects in one feature, two of
  them found purely by reading the rendered text — against zero from the four preceding
  authenticated features. Nothing about catalogue code is worse; it is simply the only area that
  could be looked at.
- Defects 4 and 5 were both found by extracting the page's visible text rather than by reading
  source, then traced back to the exact source line. That order matters: neither is visible in a
  code review of the component, because both live in the locale bundle and the mismatch is between
  two files.
- Defect 4's cause is a variable-name mismatch — the template expects `{{query}}` and the call site
  passes `{ safeQuery }`. It is a one-word fix and it affects every unsuccessful search.
- Defect 6 was established by comparison: categories renders an empty state in the identical
  failure condition, so brands rendering nothing is specific to that page rather than a global
  behaviour.
- Not tested and carried forward: breakpoints, Hindi and Arabic, keyboard traversal, PDP variant
  behaviour, and infinite scroll — the last two need real catalogue data.

---
