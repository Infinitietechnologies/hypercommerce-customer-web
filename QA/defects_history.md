

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 07:22 (24-hour format)
**Feature / Module:** F8 — Markets & currency (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: dev server plus a mock backend on `127.0.0.1:9099` returning `{ success: true,
  data: [] }` and logging request headers.
- Flows tested: market header propagation on the server render path, with and without a market
  cookie, across the brands and categories listings.
- Breakpoints tested: none. Locales tested: none.
- Total screens exercised: 2, plus header-level observation of every backend call they made.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Defects: 0

## Files Modified
- QA/defects_append.csv (emptied — no defects this pass)

## New Defects Added
- None.

## Existing Defects Confirmed
- None.

## Areas Verified Working
- **Market propagation is consistent.** With a market cookie set, both backend calls from a single
  page load carried the header; with no cookie, neither did. There is no partial-scoping defect.
- **The mock backend returning empty data rendered the pages cleanly** — no crash, no error, the
  listings simply showed their empty states, which is consistent with what F7 observed against a
  dead backend.

## Notes
- **Zero defects here is a genuine result rather than a blocked one**, which distinguishes this
  pass from F3 to F6. The market plumbing was directly observable with a mock backend and it
  behaved correctly. What could not be tested is the part that needs *two real markets with
  different data* — currency symbols changing, catalogue contents differing, cached data surviving
  a switch. A mock returning empty arrays cannot exercise any of that.
- The currency-formatting defects for this feature (code review #30 and #31) were already measured
  by direct execution in code review session 6, so they are covered by TC-MKT-009 and TC-MKT-010
  rather than re-filed from the same evidence.
- The mock-backend technique used here is worth reusing: it made a header-level property
  observable without a real panel, and it is how TC-MKT-012 and TC-MKT-013 should be run.

---
