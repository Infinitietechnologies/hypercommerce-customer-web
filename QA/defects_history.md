# Defect Testing History — HyperCommerce Customer Web

Permanent chronological audit trail of every defect-testing session in this repository.

**Rules**

- Append a new entry for every session. Newest entries go at the **end**.
- **Never overwrite, edit, or delete a previous entry.**
- Process, coverage areas, severity scale, and CSV format: `DEFECTS_INSTRUCTIONS.md`.
- Companion records: `QA/defects.csv` (master register, append-only, 19 columns) and
  `QA/defects_append.csv` (latest session only, overwritten each time, **no header row**).
- Defects are found by **exercising the running application**. Findings established only by
  reading source belong in `QA/code_review.csv`; vulnerabilities belong in `QA/security.csv`.

---

## Entry template

Copy this block for each new session and fill it in.

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

# Session Log


# Defect Testing Session

**Date:** 2026-08-05
**Time:** 22:41 (24-hour format)
**Feature / Module:** F1 — Auth & session (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: `npm install` run successfully in this checkout (569 packages); dev server started
  on `localhost:3000` with `NEXT_PUBLIC_SSR=true` and a deliberately dead API base URL.
- Flows tested: server-side route protection for all authenticated routes; page render under a
  dead backend.
- Breakpoints tested: none — see Notes.
- Locales tested: none — see Notes.
- Total screens exercised: 7 routes requested; 2 pages rendered and inspected.

## Findings Summary
- Critical: 0
- High: 1
- Medium: 0
- Low: 0
- Total Defects: 1

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 1 — Checkout and payment served 200 to a logged-out visitor (High)

## Existing Defects Confirmed
- None — this is the first defect-testing session.

## Areas Verified Working
- **All four `/my-account/*` routes redirect (307) with no session cookie** — `/my-account/`,
  `/orders/`, `/wallet/`, `/addresses/`. The inline SSR guard works exactly as code review
  session 5 concluded, now confirmed by request rather than by reading.
- **The storefront renders with a completely dead backend** — `/` returned 200 with ~62 KB of
  HTML. The `fallbackApiRes` / `fallbackPaginateRes` constants do their job; a failed SSR fetch
  does not crash the page.
- **The auth entry point responds** — `/?auth=required` returns 200, so the deep link that
  `loginRedirect` produces resolves.

## Notes
- **Scope was constrained by the environment and the constraint is real.** `npm install` succeeded
  and the dev server ran, but the backend (`dev-hypercommerce.spa-point.in`) is blocked by this
  environment's network policy — `curl` returns `CONNECT tunnel failed, response 403` — and there
  is no `.env` and no test account. So no authenticated flow could be exercised: no login, no OTP,
  no session, no logout. Route protection was testable precisely because it is the one auth
  behaviour that is observable *without* a session.
- Breakpoints, locales, and keyboard traversal were **not** tested. They need a browser session
  against a working backend for anything beyond the shell, and reporting them as covered on the
  basis of an unpopulated page would be misleading. They remain specified as TC-AUTH-021 to
  TC-AUTH-024 and are carried forward.
- Three findings from other features were incidentally confirmed while the server was up and are
  recorded here rather than filed under F1: the served HTML carries `<html lang="en">` with no
  `dir` (code review #47); the page loads **Figtree** from Google Fonts with zero occurrences of
  Plus Jakarta Sans (#43); and `/redesign/home/` answers 200 with no robots meta (#39). These
  belong to F9 and F10 and will be filed as defects in those features' passes.
- `package-lock.json` was modified by `npm install` and has been reverted — no source file is
  touched by this session.

---
