

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 07:22 (24-hour format)
**Feature / Module:** F8 — Markets & currency (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: market scope control and entitlement, cache invalidation on switch, cache keys,
  revalidation cost, currency formatting, header plumbing, currency consistency across a page,
  switching success and failure, persistence across logout, default resolution, screen states,
  i18n.
- Source registers mined: `QA/security.csv` (CWEB-10), `QA/code_review.csv` (#1, #30, #31, #35,
  #52).
- Total cases written: 20 (TC-MKT-001 … TC-MKT-020)

## Coverage Summary
- Positive: 5 · Negative: 5 · Negative (security): 5 · Boundary: 2 · Regression: 10 carry a
  `Linked Bug ID` · i18n / Performance: 2 · Total Cases: 20

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-MKT-001 … TC-MKT-020

## Findings Given Regression Coverage
- SEC-CWEB-10 (001, 002, 003, 004) · CR-1 (005, 006) · CR-35 (007) · CR-52 (008) ·
  CR-30 (009) · CR-31 (010)

## Coverage Gaps Remaining
- **The market picker UI** does not exist yet — `CLAUDE.md` §7.4 records it as Phase 8 work, so
  there is nothing to specify beyond the switch mechanics already covered.
- **Multi-currency order history** — how a past order placed in another market renders today is
  unspecified.
- **Market-specific tax and delivery rules** are unspecified and need the panel's model first.
- **Market-scoped promo codes** are unspecified; carried from F2 and F3.

## Notes
- **TC-MKT-001 to TC-MKT-003 are the priority and are runnable against the API today.** They settle
  what CWEB-10 deliberately leaves open — whether the panel rejects an unknown market code, checks
  entitlement, and re-derives the market from the delivery address at order placement. The third is
  the one that matters financially: it is the difference between a broken page and cross-market
  arbitrage.
- TC-MKT-012 and TC-MKT-013 pin the header plumbing that was **verified correct** this session,
  and the mock-backend technique used to verify it is written into the steps so the case is
  runnable without a real panel.
- TC-MKT-006 and TC-MKT-018 similarly pin currently-correct behaviour: the header selector's global
  revalidation, and the absence of a market header when no cookie exists.

---
