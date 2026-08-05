# DEFECTS_INSTRUCTIONS.md — HyperCommerce Customer Web

> **Read this file in full at the start of EVERY defect-testing session, before opening the app.**
> Companion records live in `QA/` — see §2. Sibling processes: `CODE_REVIEW_INSTRUCTIONS.md`,
> `SECURITY_INSTRUCTIONS.md`, `TEST_CASES_INSTRUCTIONS.md`.

This repo is the **Next.js customer storefront** (Pages Router, React 19, TypeScript strict,
HeroUI, Redux Toolkit, SWR, axios) consuming the Laravel panel API. Defects recorded here are
storefront defects. If the root cause is in the panel API, still record it here — the storefront
is where it surfaces — and say so in *Suggested Fix*. **Never propose changing an API response
shape unilaterally**; other production clients consume it.

---

## 1. What a defect is — and how this differs from code review

| | Code review | **Defects (this file)** |
|---|---|---|
| Method | Reading source | **Exercising the running application** |
| Evidence | `file:line` | **Reproduction steps a person can follow** |
| Register | `QA/code_review.csv` | `QA/defects.csv` |

A defect is a **behaviour** that is wrong when the app is used: a broken flow, a wrong value on
screen, a state that leaves the user stuck, a layout that breaks at a real breakpoint, an action
with no feedback. It is found by *using* the storefront, not by reading it.

**In scope:** anything observable by running the app — functional flows, UI/UX, responsive
behaviour at the real breakpoints, all four screen states (§6.3 of `CLAUDE.md`), i18n and RTL as
rendered, accessibility as experienced, performance as felt, and cross-browser behaviour.

**Out of scope:**
- Findings established only by reading code with no observable symptom — those are code review.
- Vulnerabilities — those go to `QA/security.csv` via `SECURITY_INSTRUCTIONS.md`.
- Writing test cases — that is `TEST_CASES_INSTRUCTIONS.md`.
- Fixing the code. Testing and repair are separate asks and separate commits.

A defect **may** duplicate a code-review issue when the static finding has a visible symptom.
That is expected and correct: record it here with reproduction steps and cross-reference the code
review number in *Suggested Fix*.

---

## 2. The QA record files

| File | Role | Write mode |
|---|---|---|
| `QA/defects.csv` | **Master defect register.** Every defect ever found, permanently. | **Append only.** Never edit or delete an existing row except to update `Status` / `Dev. Notes` / `Tester Status` / `Tetster Notes`. |
| `QA/defects_append.csv` | **Latest session only** — for direct import into Google Sheets. | **Overwrite** each session. **No header row.** |
| `QA/defects_history.md` | **Permanent chronological audit trail.** | **Append only.** Never rewrite a past entry. |

**19 columns**, in this order — `QA/defects.csv` carries this as line 1, permanently:

```
Date,ID,Module/Feature,Bug Title,Bug Description,Bug Type,Severity,Priority,Preconditions,Steps to Reproduce,Expected Result,Actual Result,Impact,Suggested Fix,Evidence (file:line),Status,Dev. Notes,Tester Status,Tetster Notes
```

`QA/defects_append.csv` has **no header** — it holds only the current session's rows so it pastes
straight under the existing rows in Google Sheets.

> ### ⚠ THE ONE RULE THAT BREAKS THE SHEET
>
> **NEVER write a comma inside a field value. A comma means "next column" and nothing else.**
>
> These CSVs are appended straight into Google Sheets. A comma inside a Bug Title, a Bug
> Description, Steps to Reproduce, or any other field is read as a column break — it pushes the
> rest of that row one column to the right and corrupts every column after it. The row silently
> misaligns and the register becomes unreadable.
>
> - Use `;` for a list, ` - ` for an aside, and `.` to end a clause. Rewrite the sentence rather
>   than reaching for a comma.
> - **Do not solve this with quoting.** Quoted fields are not an accepted workaround here.
> - No newlines, no tabs, no unescaped `"` either — each breaks the row the same way.
> - **Every row must contain exactly 18 commas (19 columns). Verify before committing.**
>
> ```
> BAD:  Cart total is wrong, tax is applied twice, and the discount is ignored
> GOOD: Cart total is wrong - tax is applied twice; the discount is ignored
> ```

> The final column is spelled `Tetster Notes`. That is a typo carried deliberately from the panel
> repo's `QA/defects.csv` so both repositories share an identical header. Fix it in both or
> neither.

---

## 3. Session workflow (mandatory, in order)

### 3.1 Before testing
1. Read this file.
2. Read `QA/defects.csv` — know what is already reported and find the **last ID**.
3. Read `QA/defects_history.md` — know what previous sessions covered and what they passed.
4. Read `QA/code_review.csv` — a known static finding often predicts where to look.
5. Read `CLAUDE.md` and the relevant `/redesign` counterpart (§6.1) — the redesign sandbox is the
   pixel target, so a mismatch against it is a legitimate defect.
6. Fix the scope: which flows, which breakpoints, which locales. Write it down.

### 3.2 During testing
7. Work the flows end to end, not just the happy path. For every screen check **all four states**
   — loading, empty, error, loaded (`CLAUDE.md` §6.3).
8. Test at the real breakpoints: **mobile 375 · tablet 769 · desktop 1280**, and both sides of the
   1024 header cutover.
9. Test in **all three locales** (`en`, `hi`, `ar`) — Arabic forces RTL.
10. **Assign IDs sequentially** from the last ID in `defects.csv`. Never reuse or renumber.
11. **Reproduce before recording.** A defect you saw once and cannot reproduce goes in *Notes* as
    an observation, not in the register.
12. If a defect is already in the master, do not duplicate it — record it under *Existing Defects
    Confirmed* in the history entry.

### 3.3 After testing
13. Append every newly confirmed defect to `QA/defects.csv`.
14. Replace `QA/defects_append.csv` with **only this session's rows — no header**.
15. Append a new entry to `QA/defects_history.md` (§6). Never alter previous entries.
16. Produce the session report (§7).
17. **Commit and push the three record files to `dev`:**
    ```bash
    git add QA/defects.csv QA/defects_append.csv QA/defects_history.md
    git commit -m "docs(qa): defect testing <module> - <n> defects (<c> critical, <h> high)"
    git push -u origin dev
    ```
    Push to `dev` (`CLAUDE.md` §8). Commit only the record files, never source. On a
    non-fast-forward, fetch and rebase — never force-push a shared branch. Commit even when
    nothing was found.

---

## 4. Coverage — every area in scope, every session

Work every applicable item. An item with nothing to report is still reported as exercised. The
sub-items are written from what the code review found, so they point at where defects are likely.

### 4.1 Auth & session
Phone OTP (send, resend, wrong code, expired code, too-many-attempts, invalid number) · Google
sign-in · Apple sign-in · email + password login · registration including the email/mobile
already-taken check · the complete-profile prompt for a new social account · forgot-password
across all three steps (identifier → OTP → new password) on both the email and the Firebase-SMS
gateway · logout from an account page and from elsewhere · session expiry mid-flow and the 401
behaviour · a protected route requested while logged out, and whether `?next=` returns you to the
intended page after signing in · signing in on one tab while another tab is open · the demo-mode
account restrictions.

### 4.2 Catalog & search
Home layout sections and their ordering · categories (listing, nested, empty category) · brands ·
stores (listing and detail) · search (no results, one result, many, special characters, very long
query, rapid typing) · filters and sort (single, multiple, combined with search, cleared) ·
whether filter state survives a page refresh and a shared URL · pagination and infinite scroll
(first page, last page, duplicates across pages, back-navigation returning to position) · PDP
(variant selection and price change, gallery and lightbox, out-of-stock variant, reviews, FAQ,
delivery estimate, similar products) · a deleted or invalid product slug · a share link to a
removed product.

### 4.3 Cart & offline cart
Add to cart from a card, from the PDP, and via buy-now · quantity increase/decrease against
**minimum, maximum, step and stock** boundaries · remove · save for later and restore · cart with
one item, many items, and items from multiple stores · **offline cart while logged out, then the
merge on login** — check nothing is lost, duplicated, or silently dropped when the server rejects
an item · promo code apply, remove, invalid, expired, and one that becomes invalid after a cart
change · attachments upload and removal · a product that goes out of stock or changes price while
sitting in the cart · cart totals against the line items.

### 4.4 Checkout & payments
Address selection, add-during-checkout, and editing the selected address · wallet full and
partial payment · COD · **all four gateways — Stripe, Razorpay, Paystack, Flutterwave** — each
through success, user-cancel, declined card, and gateway timeout · closing the gateway sheet
mid-payment · the browser back button after payment starts · refreshing on the payment page ·
double-submitting the place-order button · retrying after a failed or lost response (**check
whether a duplicate order appears**) · switching gateway after a failure · order note and
attachments carried through · the final amount shown matching the amount charged.

### 4.5 Orders, returns & account
Order list (empty, one page, many pages, filters by status and date) · order detail for every
status · cancel an order and a single item · return request including the reason codes that
require images · cancel a return · addresses (add, edit, delete, set default, delete the one
selected at checkout) · profile (save, email change and verification, mobile change and OTP,
avatar upload) · notifications (list, read state, deep links) · wishlists (add, remove, move
between lists, empty state) · refer-and-earn.

### 4.6 Wallet & transactions
Balance display · recharge through each enabled gateway · **a decimal recharge amount** · minimum
and maximum amounts · a failed or cancelled recharge · balance refresh timing after a successful
recharge · transaction list paging, filtering, and empty state · using the wallet at checkout for
partial and full payment.

### 4.7 Markets & currency
Switching market from the header location selector **and** by selecting a delivery address in a
different country · after each switch confirm currency symbol, price format, catalogue contents,
categories, brands, stores, home layout and search results all follow · confirm nothing from the
previous market survives without a hard reload · currency formatting for large amounts, zero, and
negative values · a market whose format rules differ (separator, decimal places, symbol position).

### 4.8 The four screen states
Per `CLAUDE.md` §6.3, every screen needs all four. For each screen: **loading** (skeleton mirrors
the final layout, not a bare spinner) · **empty** (illustration, headline, body, primary action) ·
**error** (human message *and* a working retry) · **loaded**. Force the error state by taking the
backend offline — a failed request must never render as an empty result.

### 4.9 Responsive & layout
Test at **375 (mobile) · 769 (tablet) · 1280 (desktop)**, and on both sides of the **1024 header
cutover**. Check: bottom nav on mobile and header nav on desktop · sheets on mobile vs modals on
desktop · no horizontal page scroll at any width · long product titles, long store names, and
long addresses · a 2-line vs 1-line price · sticky elements not covering content · the redesign
counterpart at `/redesign/*` as the pixel target (`CLAUDE.md` §6.1).

### 4.10 i18n & RTL
Exercise the app in **`en`, `hi`, and `ar`**. Check every visible string is translated (untranslated
English is a defect) · **Arabic mirrors correctly** — spacing, alignment, icon direction, carousels,
chevrons, and the back arrow · numbers, currency and dates render per locale · text does not
overflow or truncate in the longer language · switching language mid-flow keeps state.

### 4.11 Accessibility as experienced
Keyboard-only: reach and operate every control, including cards, steppers, sheets and gateway
dialogs · focus visible at all times · modals and sheets trap focus and restore it on close, and
`Esc` closes · screen reader announces icon-only buttons meaningfully · form errors are announced
and linked to their field · heading order is sensible · `prefers-reduced-motion` respected.

### 4.12 Feedback & recovery
Every async action disables its trigger and shows inline loading · **success and failure both
surface a toast** — silent success is a defect · destructive actions confirm first · optimistic
updates roll back visibly on failure · retry actions actually retry rather than reloading the
page · nothing leaves the user stuck with no route forward.

### 4.13 Navigation & lifecycle
Browser back and forward through each flow · refresh mid-flow (checkout, OTP, multi-step forms) ·
deep-linking directly into a mid-flow URL · opening a link in a new tab · the share and deep-link
landing routes · trailing-slash behaviour · a 404 for an unknown route.

### 4.14 Network & platform
Slow connection (throttled) · going offline mid-action and returning online · a backend 500 and a
503 maintenance response · the PWA installed and launched from the home screen · behaviour after
a new deploy while a tab is open · **on a shared device, what the previous account leaves behind
after logout** · at minimum Chrome and Safari, including iOS Safari.

### 4.15 Performance as felt
Time to first meaningful content on home, PDP and listings · scroll smoothness in long lists ·
layout shift as images load · input latency in search and the quantity stepper · repeated
identical requests visible in the network panel during ordinary navigation.

---

## 5. Fields, severity and formatting

**`ID`** — sequential per this register (`1`, `2`, `3`…) or a module-prefixed form if the team
adopts one. Never reused, never renumbered.

**`Bug Type`** — `Functional` · `UI/UX` · `Data Integrity` · `Performance` · `Accessibility` ·
`i18n/RTL` · `Compatibility` · `Usability` · `SEO`.

| Severity | Meaning |
|---|---|
| **Critical** | Money wrong, data loss, checkout or payment broken, wrong customer's or wrong market's data shown, app unusable. |
| **High** | A core flow (browse, cart, checkout, orders, account) broken for a common case, or a state the user cannot recover from. |
| **Medium** | Non-core flow broken, a missing state, a noticeable UI or accessibility defect. |
| **Low** | Cosmetic, copy, minor inconsistency. |

**`Priority`** — `P1` fix now / `P2` this cycle / `P3` scheduled / `P4` backlog.

**`Status`** — new rows are `Open`; later `In Progress`, `Fixed`, `Verified`, `Won't Fix`,
`Duplicate`, `Cannot Reproduce`.

**`Evidence (file:line)`** — the source location if known from code review, otherwise the URL,
endpoint, or screenshot reference. Never leave it blank; use `-` if genuinely nothing applies.

### CSV formatting rules — identical to the code review register
- **NEVER put a comma inside a field value. A comma means "next column" and nothing else.** These
  files are pasted into Google Sheets, where one stray comma shifts every following column and
  corrupts the row. Use `;` for lists, ` - ` for asides, `.` to end a clause. **Do not use quoting
  to work around this** — write the text without commas.
- No newlines, no tabs, no unescaped `"` inside a field.
- One row per defect on one physical line.
- Every row must contain **exactly 18 commas** (19 columns). Check before committing.
- **`Date` is written only once per day** — on the first row of that day, empty on the rest. The
  column still exists on every row (an empty `Date` is a leading comma). Judged per file: in
  `defects.csv` compare against the last row already present; in `defects_append.csv` the first
  row of the session carries it. A session spanning midnight starts the new date on the first row
  of the new day. Format `YYYY-MM-DD`, always the real current date.

---

## 6. History entry template

Append to `QA/defects_history.md`, newest last, each entry ending with `---`.

```markdown
# Defect Testing Session

**Date:** YYYY-MM-DD
**Time:** HH:MM (24-hour format)
**Feature / Module:**
**Documentation File:**
**Tester:** Claude

## Scope
- Flows tested
- Breakpoints tested
- Locales tested
- Total screens exercised

## Findings Summary
- Critical:
- High:
- Medium:
- Low:
- Total Defects:

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID:
- ID:

## Existing Defects Confirmed
- ID:

## Areas Verified Working
List what was exercised and behaved correctly.

## Notes
Assumptions, environment, unreproducible observations, limitations.

---
```

---

## 7. Session report (in the response, before finalizing)

1. **What was tested** — flows, breakpoints, locales, screen count.
2. **What worked** — exercised and correct.
3. **What failed** — ranked Critical → High → Medium → Low, each with reproduction steps.
4. **Which coverage areas were completed** — all of §4 in scope, with "no defects" stated where
   that is the outcome.

If nothing was found: say every in-scope area was exercised and no reproducible defect was found.
That is a complete and acceptable result — **do not pad the register.**
