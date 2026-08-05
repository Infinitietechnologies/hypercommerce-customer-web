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

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 23:58 (24-hour format)
**Feature / Module:** F2 — Cart & offline cart (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Method: the production offline-cart reducers were **compiled and executed directly** with
  realistic product configurations. The cart UI could not be driven end to end because the
  backend remains blocked by this environment's network policy.
- Flows exercised: quantity clamping across min / max / step / stock; the addon-merge path;
  subtotal recalculation.
- Breakpoints tested: none. Locales tested: none. See Notes.
- Total screens exercised: 0 — this session was reducer-level.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 2 · Low: 0 · Total Defects: 2

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 2 — Quantity stored below the product minimum (Medium)
- ID: 3 — Line merge sums past available stock (Medium)

## Existing Defects Confirmed
- None from `defects.csv`. Both new rows confirm code review issues 18 and 21 with executed
  evidence rather than static reasoning.

## Areas Verified Working
- **The min / max / stock ceiling works** — requesting 20 for a product with `maxQuantity 10` and
  `stock 4` stores 4. Only the *step* interaction is defective.
- **`addOfflineCartItem` re-clamps a repeat add** rather than duplicating the line, and takes the
  incoming price so a stale price does not survive.
- **`recalculateSummary` includes addon prices** in the line total and runs after every mutation —
  the subtotal tracked the (wrong) quantity exactly in defect 3, so the summary itself is correct.

## Notes
- **Method disclosure matters here and is stated inside both rows.** Executing the reducer is not
  the same as exercising the app, and the rows say so. The evidence is nonetheless stronger than
  the original static findings: issue 18 predicted "returns 2" and that is now measured, and issue
  21 now has a concrete number — two lines of 4 merging to 8 against stock of 5, with the subtotal
  following to 800.
- UI-level confirmation of both defects is still outstanding and is specified as TC-CART-001 to
  TC-CART-004 so it can be run once a backend is available.
- Responsive, locale, accessibility and market-switch behaviour for the cart were **not** exercised
  and are not claimed. They are specified as TC-CART-020 to TC-CART-025.
- The temporary compile directory used to run the reducers was removed; no source file was touched.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 01:12 (24-hour format)
**Feature / Module:** F3 — Checkout & payments (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Flows tested: none end to end. Checkout requires an authenticated session, a populated cart and
  a live gateway; the backend remains blocked by this environment's network policy.
- What was exercisable: `formatAmount` executed directly across its input range.
- Breakpoints tested: none. Locales tested: none.
- Total screens exercised: 0.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Defects: 0

## Files Modified
- QA/defects_append.csv (emptied — no defects this pass)

## New Defects Added
- None.

## Existing Defects Confirmed
- Defect 1 (F1) already covers `/cart/checkout/` and `/payment/<slug>/` being served to a
  logged-out visitor, which is the one checkout behaviour observable without a backend. Not
  re-filed.

## Areas Verified Working
- Nothing new could be exercised beyond what F1 already established.

## Notes
- **Zero defects this pass is an honest result, not an absence of effort.** Checkout is the
  feature least testable without a backend: every meaningful path needs a session, a cart, and a
  gateway sandbox. Rather than infer defects from source — which is code review's job and is
  already done for this area — the pass records nothing.
- One candidate was investigated and correctly dropped. `formatAmount`
  (`functionalHelpers.ts:570-573`) returns the string `NaN` for any non-numeric input, including a
  grouped value such as `1,234.50`. That would be a visible money defect — except the helper has
  **zero call sites** in the codebase, so the behaviour is unreachable. Filing it would have been a
  false finding. It is dead exported code and is worth deleting, but that is a code-review-grade
  observation, not a defect.
- Everything specified for this feature in TC-CHK-001 to TC-CHK-025 remains outstanding and needs a
  working environment: a reachable panel, a test account, and gateway sandbox keys for all four
  providers.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 02:26 (24-hour format)
**Feature / Module:** F4 — Wallet & transactions (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Flows tested: none end to end. Every wallet screen requires an authenticated session and a live
  balance; the backend remains blocked by this environment's network policy.
- Breakpoints tested: none. Locales tested: none.
- Total screens exercised: 0.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Defects: 0

## Files Modified
- QA/defects_append.csv (emptied — no defects this pass)

## New Defects Added
- None.

## Existing Defects Confirmed
- None.

## Areas Verified Working
- Nothing new could be exercised.

## Notes
- **Zero defects, and the reason is the same constraint as F3.** The wallet is entirely
  behind authentication, so no screen could be reached.
- The wallet's known defects are already recorded with executed evidence in the code review
  register — issues 30, 31, 32 and 33 were all measured in code review session 6, including the
  13.1% of paise values that fail the Razorpay round trip and the `decimal_separator` null case
  that prints the literal text `null`. Re-filing them here from the same evidence would duplicate
  the register rather than add anything, so they are referenced through the test cases instead.
- What remains genuinely unverified for this feature is UI-level: whether the balance and the
  transaction list behave correctly at the four states, whether the recharge form's decimal
  handling is visible to the customer as it types, and whether a wallet-funded checkout debits
  atomically. All are specified as TC-WAL-004 to TC-WAL-022.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 03:34 (24-hour format)
**Feature / Module:** F5 — Orders & returns (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Flows tested: none end to end. Every order screen sits behind the SSR auth guard — confirmed in
  F1 by request, where all four `/my-account/*` routes returned 307 — and the backend remains
  blocked by this environment's network policy.
- Breakpoints tested: none. Locales tested: none.
- Total screens exercised: 0.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Defects: 0

## Files Modified
- QA/defects_append.csv (emptied — no defects this pass)

## New Defects Added
- None.

## Existing Defects Confirmed
- None.

## Areas Verified Working
- Nothing new could be exercised. The guard behaviour itself was verified in F1 and covers the
  orders routes.

## Notes
- **Third consecutive pass with zero defects, and the cause is one fixable thing.** F3, F4 and F5
  are all wholly behind authentication, so the same blocker applies each time: the panel is
  unreachable through this environment's network policy and there is no test account. This is not
  a statement that these features are defect-free — it is a statement that they were not testable.
- The security pass for this same feature **did** produce a finding (CWEB-06), because reading
  source does not need a backend. The asymmetry between the two passes is itself the signal: the
  defects register will stay thin until the environment is fixed.
- To unblock: the panel host needs to be reachable from this environment, plus a `.env` with
  `NEXT_PUBLIC_ADMIN_PANEL_URL` and `NEXT_PUBLIC_SSR=true`, and a test account. `npm install` and
  the dev server already work — that was proven in F1 — so the remaining gap is network and
  credentials only.
- Everything outstanding for this feature is specified as TC-ORD-001 to TC-ORD-024.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 04:41 (24-hour format)
**Feature / Module:** F6 — Account (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Flows tested: none end to end. All ten account screens are behind the SSR auth guard, verified
  by request in F1, and the backend remains blocked by this environment's network policy.
- Breakpoints tested: none. Locales tested: none.
- Total screens exercised: 0.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Defects: 0

## Files Modified
- QA/defects_append.csv (emptied — no defects this pass)

## New Defects Added
- None.

## Existing Defects Confirmed
- None.

## Areas Verified Working
- Nothing new could be exercised.

## Notes
- Fourth consecutive pass with zero defects, for the same single reason recorded under F5: no
  reachable backend and no test account. The blocker is unchanged and so is the remedy — network
  access to the panel plus a `.env` and credentials. `npm install` and the dev server work.
- This feature has the largest gap between what is known and what is verified: the profile screen
  alone carries two open findings (#27 and #50) whose symptoms are entirely visual — a blank form
  on failure, and a verification badge that never updates — and neither can be demonstrated without
  a session. They are specified as TC-ACC-008 to TC-ACC-011 and should be the first cases run once
  the environment is available.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 06:03 (24-hour format)
**Feature / Module:** F7 — Catalog & search (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- **The first pass that could genuinely exercise the product.** Catalogue routes are public, so
  with the dev server running they render without a session. The backend was still unreachable,
  which made this an effective test of failure behaviour.
- Flows tested: categories listing, brands listing, stores listing, search results, and the
  rendered visible text of each with a dead catalogue backend.
- Breakpoints tested: none. Locales tested: English only.
- Total screens exercised: 4 rendered and inspected as visible text.

## Findings Summary
- Critical: 0 · High: 1 · Medium: 2 · Low: 1 · Total Defects: 4

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 4 — Search no-results message renders the literal `{{query}}` placeholder (Medium)
- ID: 5 — Categories subtitle is a truncated sentence (Low)
- ID: 6 — Brands listing renders no empty state and no error state (Medium)
- ID: 7 — A failed catalogue fetch is presented as "no results" (High)

## Existing Defects Confirmed
- None from `defects.csv`. Defect 7 is the observed symptom of code review issue 34, which
  described the mechanism; this pass shows what the customer actually sees.

## Areas Verified Working
- **Every catalogue route renders without a session** — categories, brands, stores and search all
  returned 200, so the public/private split established in F1 holds.
- **Categories and search both ship a real empty state** with a headline and an explanatory line.
  The defect is which state they choose, not that they lack one — which is precisely what
  distinguishes them from brands.
- **The page shell, header, footer, filter and sort controls all render** under a total backend
  failure, so the fallback constants keep the page usable rather than crashing it.

## Notes
- **This pass is the argument for fixing the environment.** Four defects in one feature, two of
  them found purely by reading the rendered text — against zero from the four preceding
  authenticated features. Nothing about catalogue code is worse; it is simply the only area that
  could be looked at.
- Defects 4 and 5 were both found by extracting the page's visible text rather than by reading
  source, then traced back to the exact source line. That order matters: neither is visible in a
  code review of the component, because both live in the locale bundle and the mismatch is between
  two files.
- Defect 4's cause is a variable-name mismatch — the template expects `{{query}}` and the call site
  passes `{ safeQuery }`. It is a one-word fix and it affects every unsuccessful search.
- Defect 6 was established by comparison: categories renders an empty state in the identical
  failure condition, so brands rendering nothing is specific to that page rather than a global
  behaviour.
- Not tested and carried forward: breakpoints, Hindi and Arabic, keyboard traversal, PDP variant
  behaviour, and infinite scroll — the last two need real catalogue data.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 07:22 (24-hour format)
**Feature / Module:** F8 — Markets & currency (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: dev server plus a mock backend on `127.0.0.1:9099` returning `{ success: true,
  data: [] }` and logging request headers.
- Flows tested: market header propagation on the server render path, with and without a market
  cookie, across the brands and categories listings.
- Breakpoints tested: none. Locales tested: none.
- Total screens exercised: 2, plus header-level observation of every backend call they made.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Defects: 0

## Files Modified
- QA/defects_append.csv (emptied — no defects this pass)

## New Defects Added
- None.

## Existing Defects Confirmed
- None.

## Areas Verified Working
- **Market propagation is consistent.** With a market cookie set, both backend calls from a single
  page load carried the header; with no cookie, neither did. There is no partial-scoping defect.
- **The mock backend returning empty data rendered the pages cleanly** — no crash, no error, the
  listings simply showed their empty states, which is consistent with what F7 observed against a
  dead backend.

## Notes
- **Zero defects here is a genuine result rather than a blocked one**, which distinguishes this
  pass from F3 to F6. The market plumbing was directly observable with a mock backend and it
  behaved correctly. What could not be tested is the part that needs *two real markets with
  different data* — currency symbols changing, catalogue contents differing, cached data surviving
  a switch. A mock returning empty arrays cannot exercise any of that.
- The currency-formatting defects for this feature (code review #30 and #31) were already measured
  by direct execution in code review session 6, so they are covered by TC-MKT-009 and TC-MKT-010
  rather than re-filed from the same evidence.
- The mock-backend technique used here is worth reusing: it made a header-level property
  observable without a real panel, and it is how TC-MKT-012 and TC-MKT-013 should be run.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 08:44 (24-hour format)
**Feature / Module:** F9 — Content & SEO (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: dev server with `NEXT_PUBLIC_SSR=true` and a dead API base URL. SEO output is
  produced from configuration and route structure, so most of it is observable without a backend.
- Flows tested: sandbox and design-system route indexability, sitemap route resolution, canonical
  URL form against the served URL.
- Breakpoints tested: none. Locales tested: English only.
- Total screens exercised: 7 routes requested and their HTML inspected.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 3 · Low: 0 · Total Defects: 3

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 8 — Redesign sandbox and design-system routes publicly served with no indexing restriction
- ID: 9 — Sitemap advertises two routes that return 404
- ID: 10 — Canonical URLs omit the trailing slash the site serves

## Existing Defects Confirmed
- None from `defects.csv`. Defects 8 and 9 are the observed symptoms of code review issues 39 and
  40, which described them from configuration; this pass confirms them by request.

## Areas Verified Working
- **Private routes are correctly disallowed** in `robots.txt` — checked directly.
- **Eleven of the thirteen static sitemap routes resolve**; only the two filed as defect 9 do not.
- **Content pages render and emit a canonical** — the defect is the canonical's *form*, not its
  absence.

## Notes
- **Defect 10 is a new finding, not a confirmation.** Code review §4.12.5 listed
  "canonical disagreeing with `trailingSlash: true`" as something to check but nothing had been
  measured. Requesting both forms settled it: the canonical target `/about-us` returns **308** and
  the served URL `/about-us/` returns **200**, so every canonical points one redirect away from the
  real page — and it disagrees with the sitemap, whose entries do carry trailing slashes. Two
  signals that should agree, conflicting.
- Defects 8 and 9 were both verifiable without a backend because they depend on route structure and
  build configuration rather than on data. That is why this feature yielded three defects while the
  authenticated features yielded none — the same environment constraint, different exposure.
- Not tested: the CMS pages' rendered content, which needs the content endpoint, and Open Graph
  image resolution, which needs real product data.

---

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 10:02 (24-hour format)
**Feature / Module:** F10 — Cross-cutting (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: dev server in SSR mode with a dead API base URL. Locale, typography and document
  attributes are produced without backend data, so this feature was largely testable.
- Flows tested: server-rendered output under each of the three locale cookies; the `<html>`
  element per locale; the font actually loaded; response headers.
- Locales tested: **en, hi, ar** — the first pass to cover all three.
- Total screens exercised: home and categories, each requested under three locales.

## Findings Summary
- Critical: 0 · High: 2 · Medium: 1 · Low: 0 · Total Defects: 3

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 11 — The server always renders the default language regardless of the locale cookie (High)
- ID: 12 — `<html lang="en">` with no `dir` for every visitor (Medium)
- ID: 13 — Figtree is served where Plus Jakarta Sans is specified (High)

## Existing Defects Confirmed
- None from `defects.csv`. Defects 12 and 13 are the observed symptoms of code review issues 47
  and 43; defect 11 is new.

## Areas Verified Working
- **All six configured security headers are served** and `X-Powered-By` is suppressed.
- **The client-side language correction works** — `_app.tsx:58-62` does set `lang` and `dir` once
  hydrated, which is why defects 11 and 12 are scoped to the server response rather than claiming
  the app has no RTL support at all.

## Notes
- **Defect 11 is the significant find of this pass and it is new, not a confirmation.** Requesting
  `/categories/` — a page that explicitly awaits `loadTranslations(context)` — with the cookie set
  to `ar` and then `en` returned **byte-comparable English output**, zero Arabic characters in
  either. The cause was then traced precisely: `i18n.ts:29` initialises the i18next singleton at
  module scope, and `loadTranslations` calls `init` again at `:62`. Calling `init` on an already
  initialised instance does not switch the active language — `changeLanguage` does, and the same
  file already uses it at `:45` for the client-side switch. So the `lng` passed on the server is
  silently ignored.
- The impact compounds with defect 12: the document declares `lang="en"` *and* the content is
  English, so the entire server response is English for every visitor. Search engines therefore
  index every localised page as English, and Hindi and Arabic customers get a full English first
  paint that swaps after hydration.
- The fix for defect 11 is one line — `await i18n.changeLanguage(lang)` inside `loadTranslations` —
  and it is verifiable by the same request comparison that found it.
- Not tested: RTL *layout* mirroring, keyboard traversal and screen-reader announcement, which need
  a rendered page with real content, and the PWA cache behaviour, which needs a production build
  since the service worker is disabled in development.

---
