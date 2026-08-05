

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 02:26 (24-hour format)
**Feature / Module:** F4 — Wallet & transactions (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: withdrawal authorization and bounds, recharge input and limits, Razorpay wallet
  amount, recharge confirmation, balance display, currency formatting, transactions, checkout
  integration, screen states, accessibility.
- Source registers mined: `QA/security.csv` (CWEB-05), `QA/code_review.csv` (#24, #25, #30, #31,
  #32, #33).
- Total cases written: 22 (TC-WAL-001 … TC-WAL-022)

## Coverage Summary
- Positive: 5 · Negative: 4 · Negative (security): 3 · Boundary: 7 · Regression: 13 carry a
  `Linked Bug ID` · Accessibility: 1 · Total Cases: 22

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-WAL-001 … TC-WAL-022

## Findings Given Regression Coverage
- SEC-CWEB-05 (001, 002, 003) · CR-32 (004, 005) · CR-33 (006, 007) · CR-24 (008, 009) ·
  CR-25 (010, 011) · CR-31 (012) · CR-30 (013, 014)

## Coverage Gaps Remaining
- **Refunds into the wallet** are unspecified — the flow was not examined in any pass.
- **Wallet expiry or promotional credit** rules are unspecified; it is not established whether the
  platform has them.
- **Statement export or receipts** are unspecified.
- **Concurrent debits** (wallet used on two devices at once) are unspecified and would need a
  panel-side decision on locking before a case can assert anything.

## Notes
- **TC-WAL-001 to TC-WAL-003 are the highest value cases in this set and can be run today.** They
  test the deduct-balance endpoint directly against the API, need no storefront change and no
  gateway sandbox, and they answer the question CWEB-05 leaves open: whether the panel bounds a
  withdrawal by the available balance. If it does not, that is a Critical finding on the panel's
  register rather than this one.
- TC-WAL-009 and TC-WAL-014 document behaviour that is currently **correct** — the order payment
  path passing the panel amount through untouched, and an omitted format field falling back to the
  default. Both are one small edit away from breaking, which is exactly what makes them worth
  pinning.
- Thirteen of twenty-two are regressions against currently-open findings and use the `FAIL while …`
  form.

---
