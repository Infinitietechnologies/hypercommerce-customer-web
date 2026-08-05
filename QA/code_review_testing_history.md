# Code Review Testing History — HyperCommerce Customer Web

Permanent chronological audit trail of every code review session in this repository.

**Rules**

- Append a new entry for every review session. Newest entries go at the **end**.
- **Never overwrite, edit, or delete a previous entry.**
- Process, review categories, severity scale, and CSV format: `CODE_REVIEW_INSTRUCTIONS.md`.
- Companion records: `QA/code_review.csv` (master defect register, append-only) and
  `QA/code_review_append.csv` (latest session only, overwritten each time).

---

## Entry template

Copy this block for each new session and fill it in.

```markdown
# Code Review Session

**Date:** YYYY-MM-DD
**Time:** HH:MM (24-hour format)
**Feature / Module:**
**Documentation File:**
**Reviewer:** Claude

## Scope
- Files reviewed
- Directories reviewed
- Total files inspected

## Findings Summary
- Critical:
- High:
- Medium:
- Low:
- Total Issues:

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.:
- Issue No.:
- ...

## Existing Issues Confirmed
- Issue No.:
- ...

## Safe Areas Verified
List the areas that were explicitly checked and verified as correct.

## Notes
Any assumptions, limitations, or observations made during the review.

---
```

---

# Session Log

# Code Review Session

**Date:** 2026-08-05
**Time:** 08:42 (24-hour format)
**Feature / Module:** Session 1 — Foundations & data layer
**Documentation File:** CLAUDE.md · src/CLAUDE.md · src/routes/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/services/client.ts`
  - `src/routes/interceptor.ts`
  - `src/guards/authGuard.ts`
  - `src/guards/withAuth.tsx`
  - `src/lib/cookies.ts`
  - `src/helpers/auth.ts`
  - `src/helpers/market.ts`
  - `src/helpers/getters.ts` (`isSSR`, `getWebSettings`, `getSpecificSettings`)
  - `src/helpers/functionalHelpers.ts` (`getMarketFromContext`, `getCountryIso2FromContext`)
  - `src/contexts/SettingsContext.tsx`
  - `src/stores/maintenanceStore.ts`
  - `src/services/market.ts`
  - `src/services/auth.ts` (`verifyUser`, `logout`)
  - `src/config/constants.ts` (fallback payloads)
  - `src/types/settings.ts` (`Settings` shape)
  - `next.config.ts` (headers, build mode, image config)
  - Guard call sites: `src/pages/cart/index.tsx`, `src/pages/cart/checkout/index.tsx`,
    `src/pages/payment/[slug].tsx`, `src/pages/my-account/**` (10 pages, SSR guard blocks)
- Directories reviewed: `src/services/` (entry layer), `src/routes/`, `src/guards/`,
  `src/stores/`, `src/contexts/`, `src/lib/`
- Total files inspected: 21

## Findings Summary
- Critical: 1
- High: 3
- Medium: 5
- Low: 3
- Total Issues: 12

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 1 — Market switch revalidates only the settings key (Critical)
- Issue No.: 2 — `withAuth` inert on checkout and payment (High)
- Issue No.: 3 — Bearer token and user record in JS-readable cookies with no CSP (High)
- Issue No.: 4 — `process.exit(1)` in `handleLogout` catch (High)
- Issue No.: 5 — `verifyUser` fails open and its caller's catch is dead code (Medium)
- Issue No.: 6 — `SettingsProvider` context value not memoised (Medium)
- Issue No.: 7 — Maintenance store notified on every successful response (Medium)
- Issue No.: 8 — `getCookie` truncates values containing `=` (Medium)
- Issue No.: 9 — `serverSideAuthGuard` dead while 10 pages duplicate it inline (Medium)
- Issue No.: 10 — Unreachable wildcard branch in `isProtectedRoute` (Low)
- Issue No.: 11 — `any` in the 503 handler and across the market service (Low)
- Issue No.: 12 — Anonymous SSR logs a token message per render (Low)

## Existing Issues Confirmed
- None. This is the first session and the master register was empty.

## Safe Areas Verified
- **`constructApiBaseUrl`** (`services/client.ts:6-34`) — handles undefined, empty, trailing
  slash, and invalid URL without throwing at module load; falls back to `/api` rather than
  crashing. Correct.
- **Single axios instance** — `axios` is imported only in `services/client.ts:1`; interceptors
  attached once at `:44`. No component or view imports axios directly.
- **SSR token handling** — `interceptor.ts:18-26` copies `params.access_token` into the
  Authorization header and then deletes it from params, so the token never reaches the query
  string. `getAccessTokenFromContext` (`helpers/auth.ts:701-729`) reads it from the request
  cookie header and strips wrapping quotes correctly.
- **`X-Market` header injection** — `interceptor.ts:40-52` covers both the SSR param path and
  the client cookie path, matching the panel's `DetectMarket` order. Header plumbing is right;
  the defect found (issue 1) is in cache invalidation, not in header construction.
- **My-account SSR protection** — all 10 account pages check `getAccessTokenFromContext` and
  redirect via `loginRedirect` before fetching (verified on `orders/index.tsx:345-356`). The
  guard behaviour is correct even though it is duplicated (issue 9).
- **`SettingsContext` array handling** — `Array.isArray(settings)` at `:113` is correct:
  `Settings` is declared as a tuple type in `types/settings.ts:11`, and `getWebSettings` /
  `getSpecificSettings` guard the same way. Market currency resolution is sound.
- **Fallback constants** — `fallbackApiRes` and `fallbackPaginateRes`
  (`config/constants.ts:1-37`) match the response shapes their consumers destructure.
- **`isSSR()`** (`helpers/getters.ts:30-33`) — trims and lower-cases before comparing, so
  `NEXT_PUBLIC_SSR` is parsed leniently and never throws.
- **Security headers** — `next.config.ts` sets HSTS, `X-Frame-Options`, `nosniff`,
  `Referrer-Policy`, and `Permissions-Policy`. Present and correct; the CSP gap is folded into
  issue 3 rather than filed twice.
- **`poweredByHeader: false`** and `compiler.removeConsole` (production, keeping `error`/`warn`)
  are both set correctly.

## Notes
- Review categories completed: 4.1 performance · 4.2 correctness & business logic · 4.3 state
  and races · 4.4 market scoping · 4.5 error handling & null-safety · 4.6 frontend states
  (n/a to this layer — no screens in scope) · 4.7 security · 4.8 code smells & project-rule
  violations · 4.9 i18n/RTL (n/a — no user-facing strings in this layer beyond toast keys,
  which already use `i18n.t`) · 4.10 timezone (no date handling in scope) · 4.11 accessibility
  (n/a to this layer) · 4.12 Next.js correctness · 4.13 test coverage.
- **Standing gap (4.13):** no automated test coverage of any kind, and no CI — recorded once
  here rather than as an issue row. Every finding in this session is unit-testable; issues 5,
  8, and 10 are pure-function defects that a single test each would have caught.
- **Build mode (4.12.1):** every `getServerSideProps` in scope is gated behind `isSSR()`, so
  the pages degrade to static export cleanly. This is consistent, but it means issue 2's
  missing SSR guard cannot be fixed with `getServerSideProps` alone in export mode — the fix
  must hold in both modes.
- Issue 3 is partly a design decision rather than an oversight; it is recorded because an
  httpOnly cookie would still satisfy SSR reads, so the tradeoff is avoidable.
- Issue 12's impact is limited by `compiler.removeConsole` stripping `console.log` in
  production builds; noted in the row itself.
- Not reviewed in this session and carried to later ones: the cart and offline-cart slices,
  checkout and payment flows beyond their guards, catalog services, and the Redux store
  configuration and persist allowlist.

---
