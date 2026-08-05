

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 01:12 (24-hour format)
**Feature / Module:** F3 — Checkout & payments (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: gateway callback verification, idempotency and double submit, address state and
  market resolution, control flow, i18n, amount integrity, authorization, promo codes, wallet
  split, recovery paths, attachments, screen states, accessibility, responsive.
- Source registers mined: `QA/security.csv` (CWEB-04), `QA/code_review.csv` (#22, #23, #26, #51).
- Total cases written: 25 (TC-CHK-001 … TC-CHK-025)

## Coverage Summary
- Positive: 5 · Negative: 8 · Negative (security): 6 · Boundary: 0 · Regression: 12 carry a
  `Linked Bug ID` · Accessibility / i18n / Responsive: 3 · Total Cases: 25

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-CHK-001 … TC-CHK-025

## Findings Given Regression Coverage
- SEC-CWEB-04 (001, 002, 003, 004) · CR-23 (005, 006, 007) · CR-51 (008, 009, 010) ·
  CR-22 (011) · CR-26 (012)

## Coverage Gaps Remaining
- **Flutterwave** has the thinnest coverage of the four gateways — its redirect-based flow was the
  least examined in any pass and deserves its own cases once a sandbox exists.
- **Bank transfer** end to end (proof upload, manual confirmation) is unspecified.
- **Order note and multi-store delivery** at checkout are unspecified.
- **The promo matrix** is now partly covered (TC-CHK-016, 017) but minimum-spend, market-scoped and
  stacked-promo behaviour still needs cases — carried from F2.

## Notes
- **TC-CHK-013 and TC-CHK-014 are the two to write first.** They pin the property the security
  pass verified as correct today — that no client-supplied amount reaches the panel and the gateway
  is charged the panel's figure. A regression there would be Critical, and nothing currently
  protects it.
- TC-CHK-003 is deliberately written to be runnable without a gateway sandbox: invoking the
  registered success handler from the console and then re-reading the order from the panel tests
  the one thing that matters most about CWEB-04 — whether the panel is the sole authority on
  payment state.
- TC-CHK-022 captures the `__cartAttachments` risk the security pass investigated and chose not to
  file, so an unproven concern is recorded as something to verify rather than asserted as a defect.
- Twelve of twenty-five are regressions against currently-open findings and use the `FAIL while …`
  form, so they double as a fix-verification checklist.

---
