

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 08:44 (24-hour format)
**Feature / Module:** F9 — Content & SEO (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: structured data escaping, sandbox indexing, sitemap integrity, canonical form,
  CMS content injection, metadata completeness, Open Graph, site URL configuration, CMS rendering,
  schema validity, soft 404s.
- Source registers mined: `QA/security.csv` (CWEB-11), `QA/defects.csv` (8, 9, 10),
  `QA/code_review.csv` (#38, #42).
- Total cases written: 20 (TC-SEO-001 … TC-SEO-020)

## Coverage Summary
- Positive: 5 · Negative: 6 · Negative (security): 6 · Regression: 13 carry a `Linked Bug ID` ·
  Total Cases: 20

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-SEO-001 … TC-SEO-020

## Findings Given Regression Coverage
- SEC-CWEB-11 (001, 002, 003, 004) · DEF-8 (005, 006, 007) · DEF-9 (008, 009) ·
  DEF-10 (010, 011) · CR-38 (012, 013) · CR-42 (020)

## Coverage Gaps Remaining
- **Open Graph image generation** — whether a product image resolves to an absolute, crawlable URL
  is unspecified and needs real data.
- **Hreflang and multi-locale SEO** — the storefront serves three languages with no locale routing;
  whether that is intended is a product decision before a case can assert anything.
- **Structured data beyond product and breadcrumb** — organisation, FAQ and collection schemas are
  only partly covered by TC-SEO-019.
- **Page speed and Core Web Vitals** budgets are unspecified; carried to F10.

## Notes
- **TC-SEO-003 is deliberately written to test where the fix lives, not just that it works.**
  CWEB-11's remediation must sit at the single emission point in `DynamicSEO` so every page type is
  covered; a per-page fix would pass TC-SEO-001 while leaving category and brand pages exposed.
- TC-SEO-004 is the panel-side half of CWEB-11 and is runnable against the API today with a seller
  account — it asks whether a product title may contain a script terminator at all.
- TC-SEO-007 pins behaviour that is currently **correct** — private routes disallowed in
  `robots.txt` — because defect 8's fix edits that same file and could regress it.
- Thirteen of twenty are regressions, and four of those are against defects found in this session's
  own defects pass.

---
