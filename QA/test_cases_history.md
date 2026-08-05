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

# Test Case Authoring Session

**Date:** 2026-08-05
**Time:** 06:03 (24-hour format)
**Feature / Module:** F7 — Catalog & search (test-case pass)
**Documentation File:** TEST_CASES_INSTRUCTIONS.md · CLAUDE.md
**Author:** Claude

## Scope
- Areas covered: failed-fetch behaviour, empty-state copy and interpolation, missing states,
  image optimizer, injection, market scoping, caching, product detail, search filters and
  ordering, infinite scroll, screen states, accessibility.
- Source registers mined: `QA/defects.csv` (4, 5, 6, 7), `QA/security.csv` (CWEB-09),
  `QA/code_review.csv` (#35, #36, #37, #38, #42).
- Total cases written: 25 (TC-CAT-001 … TC-CAT-025)

## Coverage Summary
- Positive: 5 · Negative: 7 · Negative (security): 4 · Boundary: 1 · Regression: 17 carry a
  `Linked Bug ID` · Accessibility / i18n / Performance: 4 · Total Cases: 25

## Files Modified
- QA/test_cases.csv
- QA/test_cases_append.csv

## New Cases Added
- Test Case ID range: TC-CAT-001 … TC-CAT-025

## Findings Given Regression Coverage
- DEF-7 (001, 002, 003) · DEF-4 (004, 005) · DEF-5 (006) · DEF-6 (007, 008) ·
  SEC-CWEB-09 (009, 010, 011) · CR-38 (012) · CR-35 (013) · CR-36 (014) · CR-37 (015) ·
  CR-42 (016, 017)

## Coverage Gaps Remaining
- **Home layout sections** — the builder and its section types are unspecified; it is the single
  largest unspecified surface left in the catalogue.
- **Store detail** beyond the injection case is unspecified.
- **Product reviews and FAQ** sections on the PDP are unspecified.
- **Recently viewed** behaviour is unspecified.
- **Product gallery and lightbox** interaction is unspecified.

## Notes
- **Seventeen of twenty-five are regressions**, the highest proportion of any feature so far,
  because this pass produced four fresh defects on top of five existing code-review findings for
  the same area.
- TC-CAT-003 exists specifically to stop defect 7's fix from over-correcting: after the fetcher
  starts throwing, a genuine zero-result search must still show the empty state rather than an
  error. A fix that turns every empty search into an error would pass TC-CAT-001 and fail here.
- TC-CAT-010 and TC-CAT-011 record the parts of the image configuration that are currently
  **correct** — http and loopback targets refused, and SVG forced to download — so a future
  loosening of `contentDispositionType` or the protocol restriction is caught.
- TC-CAT-005 checks the interpolation fix across all three locale bundles, since defect 4's root
  cause is a name mismatch that can easily be fixed in English only.

---

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
