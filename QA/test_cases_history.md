

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 03:34 (24-hour format)
**Feature / Module:** F5 — Orders & returns (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: return evidence upload, authorization across orders and items and return
  requests, return eligibility and quantity, i18n, error recovery, listing paging and filters,
  order detail per status, cancellation, reorder, screen states, accessibility, responsive.
- Source registers mined: `QA/security.csv` (CWEB-06), `QA/code_review.csv` (#28, #29).
- Total cases written: 24 (TC-ORD-001 … TC-ORD-024)

## Coverage Summary
- Positive: 8 · Negative: 4 · Negative (security): 7 · Boundary: 3 · Regression: 7 carry a
  `Linked Bug ID` · Accessibility / i18n / Responsive: 4 · Total Cases: 24

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-ORD-001 … TC-ORD-024

## Findings Given Regression Coverage
- SEC-CWEB-06 (001, 002, 003, 004) · CR-28 (011, 012) · CR-29 (013)

## Coverage Gaps Remaining
- **Refund settlement** — where a refund lands (wallet, original method, credit note) and its
  timing is unspecified; it needs the panel's refund model first.
- **Partial return of a multi-quantity item** is covered only by the quantity bound in TC-ORD-009;
  the full matrix is unspecified.
- **Return pickup and logistics status** transitions are unspecified.
- **Invoice or receipt download** is unspecified.

## Notes
- **TC-ORD-005 to TC-ORD-007 are the authorization matrix and are runnable against the API today**
  with two accounts and no storefront change. They cover the IDOR shape across three different
  endpoints — read an order, act on an order item, cancel a return request — which is where a
  multi-tenant marketplace is most likely to leak.
- TC-ORD-004 is deliberately separate from TC-ORD-001 and TC-ORD-002: the first two test the client
  and the third tests whether the panel enforces the same rules independently. CWEB-06's remediation
  is only complete when all three pass.
- TC-ORD-003 records that the extra files beyond five are **silently discarded** by `.slice(0, 5)`
  rather than reported — a small UX defect inside a security-shaped case, noted so it is not lost.
- Seven of twenty-four are regressions; the rest specify behaviour with no coverage at all.

---
