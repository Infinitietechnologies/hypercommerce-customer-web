

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 10:02 (24-hour format)
**Feature / Module:** F10 — Cross-cutting (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: server-side localisation, document attributes, typography, RTL layout,
  accessibility of icon controls, error boundaries and error pages, security headers, PWA cache
  and updates, responsive breakpoints, bundle composition, offline behaviour.
- Source registers mined: `QA/defects.csv` (11, 12, 13), `QA/code_review.csv` (#3, #44, #45, #46,
  #48).
- Total cases written: 25 (TC-XC-001 … TC-XC-025)

## Coverage Summary
- Positive: 2 · Negative: 10 · Negative (security): 5 · Regression: 16 carry a `Linked Bug ID` ·
  Accessibility / i18n / Responsive / Performance: 8 · Total Cases: 25

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-XC-001 … TC-XC-025

## Findings Given Regression Coverage
- DEF-11 (001, 002, 003) · DEF-12 (004, 005, 006) · DEF-13 (007, 008, 009) · CR-44 (010, 011) ·
  CR-45 (012, 013) · CR-46 (014, 015, 016) · CR-3 (017) · CR-48 (020, 021)

## Coverage Gaps Remaining
- **Core Web Vitals budgets** are unspecified — TC-XC-024 covers bundle composition but no numeric
  budget exists to assert against, and that needs a product decision.
- **Cross-browser coverage** is unspecified; only Chromium is available in this environment.
- **Print styles and email-rendered content** are unspecified.
- **Reduced-motion behaviour** is not covered by a case; `CLAUDE.md` §6.5 requires it.

## Notes
- **This closes the ten-feature sweep.** The test-case register now holds 235 cases across all ten
  features, of which the large majority are regressions pinned to a specific finding.
- TC-XC-018 is a rare case written to record something **currently correct and verified by
  request** — all six security headers present. It exists because defect fixes to `next.config.ts`
  are exactly what would silently drop one.
- TC-XC-019 captures the open question the security pass could not settle: `headers()` is inert
  under static export, so a deployment using that mode has none of the six headers unless the host
  supplies them.
- TC-XC-002 is the sharpest of the localisation cases: it asserts that the three locales produce
  *different* server responses, which is the single check that would have caught defect 11 and
  which no amount of component review would surface.

---
