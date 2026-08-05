# Test Case Authoring History — HyperCommerce Customer Web

Permanent chronological audit trail of every test-case authoring session in this repository.

**Rules**

- Append a new entry for every session. Newest entries go at the **end**.
- **Never overwrite, edit, or delete a previous entry.**
- Process, coverage model, field definitions, and CSV format: `TEST_CASES_INSTRUCTIONS.md`.
- Companion records: `QA/test_cases.csv` (master register, append-only, 16 columns) and
  `QA/test_cases_append.csv` (latest session only, overwritten each time, **no header row**).
- A test case is a **specification**, not a result. Execution outcomes belong in the
  `Tester Status` column; failures found while exercising the app belong in `QA/defects.csv`.
- **The repository has no test runner, no test files, no `test` script, and no CI.** Cases written
  here are a specification until that changes — say so in any report rather than implying coverage.

---

## Entry template

Copy this block for each new session and fill it in.

```markdown
# Test Case Authoring Session

**Date:** YYYY-MM-DD
**Time:** HH:MM (24-hour format)
**Feature / Module:**
**Documentation File:**
**Author:** Claude

## Scope
- Areas covered
- Source registers mined for regression cases
- Total cases written

## Coverage Summary
- Positive:
- Negative:
- Boundary:
- Regression:
- Accessibility / i18n / Responsive:
- Total Cases:

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range:

## Findings Given Regression Coverage
- Linked Bug ID:

## Coverage Gaps Remaining
What in this area is still unspecified and why.

## Notes
Assumptions, test-data requirements, environment needs.

---
```

---

# Session Log


# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 22:41 (24-hour format)
**Feature / Module:** F1 — Auth & session (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: Auth & session — route protection, account enumeration, OTP abuse, credential
  transport, session storage, logout cleanup, redirect safety, i18n, screen states,
  accessibility, RTL, session expiry.
- Source registers mined for regression cases: `QA/defects.csv` (defect 1),
  `QA/security.csv` (CWEB-01, CWEB-02), `QA/code_review.csv` (#2, #3, #4, #5, #13, #14, #16,
  #41, #49).
- Total cases written: 25 (TC-AUTH-001 … TC-AUTH-025)

## Coverage Summary
- Positive: 3
- Negative: 5
- Negative (security): 12
- Boundary: 0 — auth has no numeric boundary surface; boundaries live in cart, wallet and pagination
- Regression: 14 carry a `Linked Bug ID`
- Accessibility / i18n / Responsive: 3
- Total Cases: 25

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-AUTH-001 … TC-AUTH-025

## Findings Given Regression Coverage
- Linked Bug ID: DEF-1 (TC-AUTH-001 to 004)
- Linked Bug ID: SEC-CWEB-01 (TC-AUTH-006, 007)
- Linked Bug ID: SEC-CWEB-02 (TC-AUTH-008, 009)
- Linked Bug ID: CR-2 (TC-AUTH-005) · CR-3 (012) · CR-4 (016) · CR-5 (017) · CR-13 (010, 011) ·
  CR-14 (013) · CR-16 (020) · CR-41 (014) · CR-49 (015)

## Coverage Gaps Remaining
- **Social sign-in** (Google, Apple) has no cases — the flows depend on provider popups and need a
  decision on whether they are mocked or driven against real provider sandboxes.
- **Registration field validation** beyond the availability check is unspecified — it needs the
  panel's validation rules to assert against rather than guesses.
- **Multi-tab and cross-device session behaviour** is unspecified pending a decision on whether it
  is a supported scenario.
- **Token revocation on password change** is specified only as TC-AUTH-025; the fuller matrix
  belongs with the panel's own register.

## Notes
- Fourteen of twenty-five cases are regressions against findings that are **currently open**, so
  their `Pass/Fail Criteria` are written in the panel register's style — `FAIL while …` — which
  documents present behaviour as well as intended behaviour. They will flip to passing as the
  underlying issues are fixed, which makes them a usable fix-verification checklist.
- TC-AUTH-018 pins the `safeNext` behaviour that was verified secure this session, including the
  backslash variant that was considered and not filed — so a future change to the redirect
  consumer cannot silently regress it.
- **No test runner exists in this repository** — no runner, no test files, no `test` script, no CI.
  These 25 cases are a specification, not coverage, until that changes.

---

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 23:58 (24-hour format)
**Feature / Module:** F2 — Cart & offline cart (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: quantity rules and boundaries, offline-cart lifecycle, offline sync, persistence,
  empty state, i18n, notifications, pricing, attachments, screen states, feedback, market scoping,
  responsive, accessibility, concurrency.
- Source registers mined: `QA/defects.csv` (2, 3), `QA/security.csv` (CWEB-03),
  `QA/code_review.csv` (#15, #17, #19, #20, #22).
- Total cases written: 25 (TC-CART-001 … TC-CART-025)

## Coverage Summary
- Positive: 3 · Negative: 5 · Negative (security): 5 · Boundary: 4 · Regression: 14 carry a
  `Linked Bug ID` · Accessibility / i18n / Responsive: 3 · Total Cases: 25

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-CART-001 … TC-CART-025

## Findings Given Regression Coverage
- DEF-2 (001, 002) · DEF-3 (003, 004) · SEC-CWEB-03 (005, 006, 007)
- CR-17 (008, 009) · CR-15 (010) · CR-19 (011, 012) · CR-20 (013) · CR-22 (014)

## Coverage Gaps Remaining
- **Save for later** has no cases — the flow was not reviewed in depth in any pass yet.
- **Promo code validation** is covered only indirectly through TC-CART-012; the full matrix
  (invalid, expired, minimum-spend, market-scoped) belongs with F3 checkout.
- **Multi-store cart behaviour** (items from several sellers, per-store delivery) is unspecified.
- **Buy-now** as distinct from add-to-cart is unspecified.

## Notes
- TC-CART-018 is the case worth writing first: it pins the fact that **no client-supplied price is
  sent on sync**, which the security pass verified as correct today. It is a guard against a
  regression that would be a Critical rather than a defect.
- Fourteen of twenty-five are regressions against currently-open findings, so their criteria use
  the `FAIL while …` form and double as a fix-verification checklist.
- TC-CART-015 to TC-CART-017 document behaviour that is currently **correct** — the stock ceiling,
  the repeat-add merge, and addon pricing. Per §1 they are still missing coverage, because nothing
  automated protects them.

---
