# TEST_CASES_INSTRUCTIONS.md — HyperCommerce Customer Web

> **Read this file in full at the start of EVERY test-case authoring session.**
> Companion records live in `QA/` — see §2. Sibling processes: `CODE_REVIEW_INSTRUCTIONS.md`,
> `DEFECTS_INSTRUCTIONS.md`, `SECURITY_INSTRUCTIONS.md`.

This repo is the **Next.js customer storefront**. It currently has **no automated test coverage of
any kind** — no runner, no test files, no `test` script, and no CI. That gap is recorded once as a
standing observation; this register is where the missing coverage is specified so it can be
written, whether by hand or as automation.

---

## 1. What this register is

A **test case** is a specification: given these preconditions, perform these steps, expect this
result. It is written **before or independently of** execution, and it stands whether or not
anyone has run it yet.

| | Defects | **Test cases (this file)** |
|---|---|---|
| Answers | "What is broken?" | **"What should be verified, and how?"** |
| Trigger | Something failed | A behaviour exists and is unverified |
| Register | `QA/defects.csv` | `QA/test_cases.csv` |

**In scope:** specifying cases — happy path, negative, boundary, security-negative, regression
cases pinned to a known defect, and state/permission matrices.

**Out of scope:** filing defects (that is `DEFECTS_INSTRUCTIONS.md`), reviewing source for bugs
(`CODE_REVIEW_INSTRUCTIONS.md`), and writing the automation code itself unless separately asked.

**Every confirmed defect and security finding should acquire a regression test case** whose
`Linked Bug ID` points at it. That is the main way this register earns its keep: the 54 code-review
issues and everything in `QA/defects.csv` and `QA/security.csv` are a ready-made backlog of cases
that would have caught them.

---

## 2. The QA record files

| File | Role | Write mode |
|---|---|---|
| `QA/test_cases.csv` | **Master test-case register.** | **Append only.** Only `Status` / `Dev. Notes` / `Tester Status` / `Tetster Notes` may change on an existing row. |
| `QA/test_cases_append.csv` | **Latest session only**, for Sheets import. | **Overwrite** each session. **No header row.** |
| `QA/test_cases_history.md` | **Permanent chronological audit trail.** | **Append only.** |

**16 columns**, in this order — `QA/test_cases.csv` carries this as line 1, permanently:

```
Date,Test Case ID,Linked Bug ID,Module/Feature,Test Case Title,Test Type,Priority,Preconditions & Test Data,Test Steps,Expected Result,Pass/Fail Criteria,Endpoint/Evidence,Status,Dev. Notes,Tester Status,Tetster Notes
```

`QA/test_cases_append.csv` has **no header**.

> `Tetster Notes` is a typo carried deliberately from the panel repo's `QA/test_cases.csv` so both
> repositories share an identical header. Fix it in both or neither.

---

## 3. Fields

**`Test Case ID`** — `TC-<AREA>-<NNN>`, matching the panel convention (e.g. `TC-CART-001`,
`TC-CHK-014`). Sequential within the area, never reused, never renumbered.

**`Linked Bug ID`** — the defect, security, or code-review ID this case regresses. Leave empty for
a case that is not tied to a known finding; prefix cross-register links so they are unambiguous
(`CR-18` for code review, `SEC-CWEB-01` for security, a bare number for `defects.csv`).

**`Test Type`** — `Positive` · `Negative` · `Negative (security)` · `Boundary` ·
`Boundary (negative)` · `Regression` · `Integration` · `Accessibility` · `i18n/RTL` ·
`Responsive` · `Performance`.

**`Priority`** — `Critical` · `High` · `Medium` · `Low`, reflecting the risk if the behaviour
breaks. A case pinned to a Critical defect inherits Critical.

**`Preconditions & Test Data`** — the state and data needed: account type, cart contents, market,
locale, breakpoint. Concrete values, not "valid data".

**`Test Steps`** — numbered, in one field: `1. … 2. … 3. …`. Precise enough that someone who has
never seen the feature can follow them.

**`Expected Result`** — the single observable outcome.

**`Pass/Fail Criteria`** — what distinguishes a pass from a fail, including the *current* expected
outcome when the case is written against a known-open defect. The panel register uses forms like
`FAIL while the write happens before verification` and `PASS only if the user_id scope holds` —
follow that: it makes a case that documents present behaviour as well as intended behaviour.

**`Endpoint/Evidence`** — the route, endpoint, or `file:line` the case exercises.

**`Status`** — `Draft`, `Ready`, `Automated`, `Deprecated`.
**`Tester Status`** — left for the tester: `Not Run`, `Pass`, `Fail`, `Blocked`.

---

## 4. Coverage model — what a complete area looks like

Every area gets cases across all nine dimensions below. An area is not "covered" until each
dimension has been considered and either specified or explicitly recorded as not applicable.

1. **Happy path** — the intended flow end to end, one case per meaningful variation.
2. **Negative** — invalid input, refused states, wrong ownership, missing preconditions.
3. **Boundary** — min/max/step/stock, empty and single-item lists, first and last page, longest
   permitted string, zero, negative and maximum amounts, decimal and precision limits.
4. **The four screen states** — loading, empty, error, loaded (`CLAUDE.md` §6.3), one case each.
5. **Responsive** — mobile 375, tablet 769, desktop 1280, and both sides of the 1024 cutover.
6. **i18n/RTL** — `en`, `hi`, and `ar` with mirroring, plus locale number/currency/date formatting.
7. **Accessibility** — keyboard reachability and operation, focus trap and restore, `Esc`,
   accessible names, announced errors.
8. **Regression** — one case per confirmed defect, security finding, and code-review issue in the
   area, with `Linked Bug ID` set.
9. **Market scoping** — behaviour after a market switch, per `CLAUDE.md` §7.4.

---

## 4A. Per-area case checklists

### Auth & session
Each login method (phone OTP, Google, Apple, email+password) · OTP resend, wrong code, expired
code, attempt limit · registration with an email or mobile already in use · social sign-in that
requires completing a profile · the three-step password reset on both the email and Firebase-SMS
gateways · logout · session expiry and the 401 path · protected route while logged out and the
`?next=` return · **each of the four screen states on the auth sheet** · demo-mode restrictions.

### Catalog & search
Category, brand and store listings including empty · search with zero, one and many results ·
special characters and a very long query · filters singly, combined, and cleared · filter state
surviving refresh and a shared URL · sort orders · pagination first/last page and no duplicates
across pages · infinite scroll and back-navigation position · PDP variant selection changing
price and stock · out-of-stock variant · gallery and lightbox · reviews and FAQ sections ·
delivery estimate present and absent · invalid or deleted slug returning 404 · share link to a
removed product.

### Cart & offline cart
Add from card, PDP and buy-now · quantity at **minimum, maximum, step and stock boundaries**,
including a minimum that is not a multiple of the step · remove · save for later and restore ·
multi-store cart · **offline cart merged on login**, including the case where the server rejects
one item — nothing may be silently lost · promo apply, remove, invalid, expired, and invalidated
by a cart change · attachments · a price or stock change while the item sits in the cart · totals
reconciling to line items.

### Checkout & payments
Address selection, add-during-checkout, and editing or deleting the selected address · wallet
full and partial · COD · **each of the four gateways** through success, user-cancel, decline and
timeout · closing the gateway sheet mid-payment · browser back after payment starts · refresh on
the payment page · **double-submit** and **retry after a lost response — a duplicate order must
not appear** · switching gateway after a failure · the amount shown matching the amount charged.

### Orders, returns & account
Order list empty, single page, many pages, filtered by status and date · order detail per status ·
cancel order and cancel single item · return with and without the reason codes that require
images · cancel a return · addresses: add, edit, delete, set default, and **delete the address
currently selected at checkout** · profile save, email change and verification, mobile change and
OTP, avatar upload including an oversized and a non-image file · **profile page when its fetch
fails** · notifications list, read state and deep links · wishlists add, remove, move, empty.

### Wallet & transactions
Balance display including when the payload is missing · recharge per enabled gateway · **a decimal
amount** · minimum, maximum and zero · failed and cancelled recharge · balance freshness
immediately after success · transaction list paging, filtering and empty · wallet at checkout for
partial and full payment.

### Markets & currency
Switching market from the header selector **and** by choosing a delivery address in another
country · after each switch: currency symbol, number format, catalogue, categories, brands,
stores, home layout and search all follow · nothing from the previous market survives without a
reload · formatting for large, zero and negative amounts · a market whose format rules differ in
separator, decimal places or symbol position · a market format field that is absent or null.

### Content & SEO
CMS pages render their HTML · sandbox and design-system routes are not indexable · canonical URLs
agree with the trailing-slash convention · sitemap entries all resolve · title, description and
JSON-LD present on the pages that need them.

### Cross-cutting
One case per screen for each of the four states · responsive at all four widths · all three
locales including RTL mirroring · keyboard-only traversal of each flow · toast on success **and**
failure for every async action · optimistic updates rolling back · retry actually retrying ·
browser back/forward and refresh mid-flow · offline and maintenance responses · behaviour on a
shared device after logout · PWA installed and after a new deploy.

---

## 4B. Priority order for a new register

With no automated coverage today, write cases in this order so the register is useful early:

1. **Regression cases for every Critical and High** already recorded in `QA/code_review.csv`,
   `QA/defects.csv` and `QA/security.csv` — these are known-real and pin behaviour that has
   already broken once.
2. **Money paths** — cart totals, promo, wallet, checkout, the four gateways, currency formatting.
3. **Auth and authorization** — the flows whose failure is a security event.
4. **Pure-function boundaries** that a unit test can cover cheaply — quantity clamping, currency
   formatting, input sanitising, pagination arithmetic.
5. Everything else by traffic: PDP, listings, search, home.

---

## 5. Quality bar

- **One assertion per case.** If the expected result needs "and", split it.
- **Reproducible without the author.** No implied setup, no "obviously".
- **Concrete data.** `minQuantity 3 and stepSize 2 with quantity 3`, not "an invalid quantity".
- **Independent.** A case must not depend on another case having run first; state what it needs in
  `Preconditions & Test Data`.
- **Written against behaviour, not implementation.** A case should survive a refactor.
- **No secrets.** Never put a real credential, token, or customer PII in a case. Use a shape.
- **Do not duplicate.** Check `QA/test_cases.csv` before adding; extend the coverage rather than
  restating a case that exists.

---

## 6. Session workflow

**Before:** read this file → `QA/test_cases.csv` (last ID per area) → `QA/test_cases_history.md` →
the source registers you are writing regressions for (`QA/defects.csv`, `QA/security.csv`,
`QA/code_review.csv`) → `CLAUDE.md` and the relevant `/redesign` counterpart. Fix the scope.

**During:** work the §4 coverage model for the area · assign IDs sequentially · link every
regression case to its finding · keep one assertion per case.

**After:** append to `QA/test_cases.csv` → overwrite `QA/test_cases_append.csv` (no header, this
session only) → append to `QA/test_cases_history.md` → produce the report (§8) → **commit and push
to `dev`**:

```bash
git add QA/test_cases.csv QA/test_cases_append.csv QA/test_cases_history.md
git commit -m "docs(qa): test cases <area> - <n> cases (<r> regression)"
git push -u origin dev
```

Only the record files, never source. Rebase rather than force-push.

---

## 7. History entry template

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

## 8. Session report (in the response)

1. **What was covered** — areas, and the case count by type.
2. **Which findings now have regression coverage** — by ID.
3. **What remains uncovered** in the areas touched, and why.
4. **What the cases need to run** — test data, accounts, environment, and whether a runner exists.

State plainly that no test runner is configured if that is still true — a register of cases nobody
can execute is a specification, not coverage, and the report should not imply otherwise.

### CSV formatting rules
- **NEVER put a comma inside a field value** — a comma means "next column". Use `;` or ` - `.
  **Do not use quoting to work around it.** Numbered steps run `1. … 2. …` with no commas.
- No newlines, tabs, or unescaped `"`. One case per physical line.
- Every row must contain **exactly 15 commas** (16 columns). Check before committing.
- **`Date` once per day** — first row of the day only, empty on the rest; the column still exists
  on every row. Judged per file. Format `YYYY-MM-DD`, always the real current date.
