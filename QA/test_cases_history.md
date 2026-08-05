

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 04:41 (24-hour format)
**Feature / Module:** F6 — Account (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: notification redirect safety, profile image upload, profile fetch failure and
  refresh, mass assignment, email change, address authorization and lifecycle, wishlist
  authorization and optimistic rollback, notification read state, screen states, i18n,
  accessibility, responsive.
- Source registers mined: `QA/security.csv` (CWEB-07, CWEB-08), `QA/code_review.csv` (#27, #28,
  #50, #51).
- Total cases written: 24 (TC-ACC-001 … TC-ACC-024)

## Coverage Summary
- Positive: 5 · Negative: 6 · Negative (security): 10 · Boundary: 1 · Regression: 13 carry a
  `Linked Bug ID` · Accessibility / i18n / Responsive: 3 · Total Cases: 24

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-ACC-001 … TC-ACC-024

## Findings Given Regression Coverage
- SEC-CWEB-07 (001, 002, 003, 004) · SEC-CWEB-08 (005, 006, 007) · CR-27 (008, 009) ·
  CR-50 (010, 011) · CR-51 (016) · CR-28 (022)

## Coverage Gaps Remaining
- **Account deletion** (`deleteUser` exists in the service layer) has no cases and no reviewed UI —
  it is the highest-consequence account action and is currently unspecified.
- **Referral and refer-and-earn** mechanics are unspecified beyond the money display.
- **Notification preferences** (opt in and out per channel) are unspecified.
- **Session management across devices** is unspecified pending a panel decision on whether it is
  supported.

## Notes
- **TC-ACC-012 to TC-ACC-015 and TC-ACC-018 are runnable against the API today** with two accounts
  and no storefront change. They cover mass assignment on the profile update and the ownership
  matrix across addresses and wishlists — including the move-item endpoint where both source and
  target need scoping, which is a classic miss.
- TC-ACC-003, TC-ACC-004, TC-ACC-017 and TC-ACC-019 pin behaviour that is currently **correct** —
  the push-notification scheme check, the typed notification branches, address list refresh, and
  the wishlist optimistic rollback. Each is a small edit away from breaking.
- TC-ACC-009 is the sharpest regression in this set: it tests that saving a profile which failed to
  load cannot blank the stored record. Whether the write lands depends on panel validation, which
  is exactly why it needs a test rather than an assumption.

---
