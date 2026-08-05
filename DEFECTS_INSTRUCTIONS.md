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

## 4. Coverage — every area, every session it is in scope

1. **Auth** — phone OTP, Google, Apple, email/password, register, forgot-password, logout, session
   expiry, protected-route redirects and the `?next=` return.
2. **Catalog** — home, categories, brands, stores, search, filters, sort, pagination and infinite
   scroll, PDP (variants, gallery, reviews, FAQ, delivery estimate).
3. **Cart** — add, update quantity (min/max/step/stock), remove, save for later, offline cart
   before login and the merge on login, promo codes, attachments.
4. **Checkout & payments** — address selection, wallet, COD, and all four gateways (Stripe,
   Razorpay, Paystack, Flutterwave) including cancel, failure, and back-button paths.
5. **Orders & account** — order list and detail, cancel, return, addresses, profile, wallet,
   transactions, notifications, wishlists, refer-and-earn.
6. **Markets** — switching market changes currency, catalogue, and pricing consistently; no stale
   data survives the switch (`CLAUDE.md` §7.4).
7. **Cross-cutting** — the four states, responsive behaviour, RTL, keyboard navigation, toasts on
   success *and* failure, back/forward navigation, refresh mid-flow, offline and maintenance.

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
