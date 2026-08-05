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

# Code Review Session

**Date:** 2026-08-05
**Time:** 09:21 (24-hour format)
**Feature / Module:** Session 2 — Auth & session
**Documentation File:** CLAUDE.md · src/lib/redux/CLAUDE.md · src/pages/CLAUDE.md · src/features/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/services/auth.ts` (all 20 endpoint callers)
  - `src/lib/redux/slices/authSlice.ts`
  - `src/lib/redux/store.ts` (persist config + middleware)
  - `src/lib/firebase.ts`
  - `src/features/auth/useForgotPassword.ts`
  - `src/features/auth/components/AuthSheetHost.tsx` (route-param entry)
  - `src/stores/authSheetStore.ts`
  - `src/pages/forgot-password/index.tsx`
  - `src/components/Functional/FirebaseInitializer.tsx` (config source + fcm-token write)
  - `src/helpers/auth.ts` (re-read for the login/register/OTP call paths)
- Directories reviewed: `src/features/auth/`, `src/lib/redux/`, auth surface of `src/services/`
- Total files inspected: 10

## Findings Summary
- Critical: 1
- High: 1
- Medium: 2
- Low: 0
- Total Issues: 4

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 13 — Credentials sent in the URL query string (Critical)
- Issue No.: 14 — Token and user record persisted to localStorage by redux-persist (High)
- Issue No.: 15 — `cart` persisted against the documented rule (Medium)
- Issue No.: 16 — Firebase auth messages hard-coded English (Medium)

## Existing Issues Confirmed
- Issue No.: 11 — `any` usage. Additional location found: `services/auth.ts:302`,
  `resendVerificationEmail` returns `ApiResponse<any>`. Recorded here rather than as a new row.
- Issue No.: 3 — JS-readable token cookie. Issue 14 is the distinct localStorage vector, filed
  separately because the fix is different; the two together mean the token exists in two
  script-readable stores.
- Issue No.: 9 — `serverSideAuthGuard` unused. Corroborated by `src/pages/CLAUDE.md`, which
  already documents that nothing calls it and warns not to assume a route in `PROTECTED_ROUTES`
  is protected. The documentation is ahead of the code here.

## Safe Areas Verified
- **SSR token param pattern** — `getUserData` (`services/auth.ts:259-269`) passes `access_token`
  through `params`; the interceptor moves it into the Authorization header and deletes it from
  params, so it never reaches the query string. Correct, and the deliberate counter-example to
  issue 13.
- **`phoneLogin`** (`services/auth.ts:119-138`) destructures `access_token` out of the body and
  sends it as a header — the correct shape.
- **Firebase configuration source** — `FirebaseInitializer.tsx:123` builds the config from the
  settings API (`getFirebaseConfig` → `authSettings.fireBaseApiKey`), not from `NEXT_PUBLIC_*`
  env vars, so no Firebase keys are inlined into the bundle at build time.
- **`fcm-token`** is genuinely written at `FirebaseInitializer.tsx:107`, so the three reads in
  `helpers/auth.ts` (`:588`, `:671`, `:744`) are not dead — FCM registration works.
- **Password-reset flow** — `features/auth/useForgotPassword.ts` is well formed: four separate
  in-flight flags, every user-facing string via `t()`, both branches of the Firebase/custom
  gateway split handled, and the reset token held in React state only — never persisted, logged,
  or put in a URL.
- **Reset flow reachability** — `pages/forgot-password/index.tsx` is an intentional redirect stub
  to `/?auth=forgot`, and `AuthSheetHost.tsx:36-43` handles that parameter. The flow is reachable.
  (An initial `.tsx`-only search suggested the three reset services had no callers; widening the
  search to `.ts` found the hook. Verified before filing, so no issue was raised.)
- **`authSlice` reducers** — `login`, `logout`, and `setUserDataRedux` are correct; `logout`
  clears all three fields, and the partial-merge branch guards the null case.
- **`serializableCheck`** in `store.ts:31-35` correctly ignores the redux-persist action.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 (n/a — no market-scoped reads in the auth
  surface) · 4.5 · 4.6 (n/a — the auth sheet UI itself is a later session; the hook's states were
  checked) · 4.7 · 4.8 · 4.9 · 4.10 (no date handling in scope) · 4.11 (n/a to this layer) ·
  4.12 · 4.13.
- **Issue 13 is the most serious finding of both sessions so far.** Fixing it requires the panel
  to accept body parameters on those four routes, so it is not a storefront-only change — and
  per CLAUDE.md the API is shared with other production clients, so the change must be
  coordinated rather than made unilaterally.
- Issues 13 and 14 compound issue 3: with all three open, the session credential is exposed in
  the request URL, in a script-readable cookie, and in localStorage.
- `console.log` noise exists in `lib/firebase.ts` (`:52`, `:63`, `:114`, `:161`, `:209`, `:212`).
  Not filed as an issue — `compiler.removeConsole` strips `console.log` from production builds,
  so the impact is limited to development, and filing it would pad the register.
- `reset()` in `useForgotPassword.ts:195-199` does not clear `identifier` or `token` from state.
  Reviewed and judged not a defect: `verify` always overwrites both before step 3 can be reached,
  so there is no path that reuses a stale token. Recorded here so a later session does not
  re-derive it.
- Not reviewed and carried forward: the auth sheet components themselves (`LoginForm`,
  `RegisterForm`, OTP inputs) and their four screen states, and `syncOfflineCartToServer`, which
  belongs with the cart session.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 10:04 (24-hour format)
**Feature / Module:** Session 3 — Cart & offline cart
**Documentation File:** CLAUDE.md · src/lib/redux/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/lib/redux/slices/offlineCartSlice.ts` (all 7 reducers + `clampQuantity` + `recalculateSummary`)
  - `src/lib/redux/slices/cartSlice.ts`
  - `src/helpers/updators.ts` (`updateCartData`, `syncOfflineCartToServer`, `updateDataOnAuth`)
  - `src/services/cart.ts` (all 11 endpoint callers)
  - `src/components/Modals/FailedItemsModal.tsx` (window-global registration)
  - `src/components/Modals/RemovedItemsModal.tsx` (hidden-button trigger)
  - `src/types/cart.ts` (`failed_items` / `CartSyncData` shapes)
- Directories reviewed: cart surface of `src/lib/redux/slices/`, `src/services/`, `src/helpers/`
- Total files inspected: 7

## Findings Summary
- Critical: 0
- High: 1
- Medium: 4
- Low: 1
- Total Issues: 6

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 17 — Offline cart cleared even when the server rejected items (High)
- Issue No.: 18 — `clampQuantity` can return below the product minimum; dead branch (Medium)
- Issue No.: 19 — Empty-cart case decided by matching an English API message (Medium)
- Issue No.: 20 — Hard-coded English cart toasts, one with a typo (Medium)
- Issue No.: 21 — Offline line merge bypasses the quantity clamp (Medium)
- Issue No.: 22 — Modals driven by a hidden DOM click and a `window` global (Low)

## Existing Issues Confirmed
- Issue No.: 15 — `cart` persisted against the documented rule. Re-confirmed from the cart side:
  `cartSlice` holds the full `CartResponse` including prices, so the persisted copy is a stale
  priced cart, not just item ids. No new row.
- Issue No.: 11 — `any` usage. Two further locations: `updators.ts:117` and `:119`, both
  `(window as any)`. Folded into issue 22 rather than filed separately.

## Safe Areas Verified
- **`src/services/cart.ts`** — all 11 callers send their payload as a **request body**
  (`api.post(url, params)`), never as query params. This is the correct pattern and the direct
  contrast with issue 13 in the auth service; no credential or cart mutation leaks into a URL.
  Every caller also returns a fallback on error.
- **`recalculateSummary`** (`offlineCartSlice.ts:38-53`) — correctly includes addon prices in the
  line total and recomputes both `subtotal` and `totalQuantity` after every mutation; every
  reducer that changes items calls it, so the summary cannot drift out of sync with the items.
- **`addOfflineCartItem`** (`:114-138`) — merges by id, re-clamps the summed quantity, and takes
  the incoming price so a stale price does not survive a re-add. Correct.
- **`cartSlice` reducers** — minimal and correct; `clearCart` resets both `cartData` and `error`.
- **Login sync ordering** — in `helpers/auth.ts` the sequence is `await syncOfflineCartToServer()`
  then `updateCartData(...)`, so the server cart is fetched after the merge rather than racing it.
- **`updateCartData` guard** — returns early when logged out (`updators.ts:30-32`), so the offline
  path never issues an authenticated cart call.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 (n/a — the cart endpoints inherit market
  scope from the shared axios instance, verified in session 1) · 4.5 · 4.6 (cart *screens* are
  not in this session; the state layer feeding them was checked) · 4.7 · 4.8 · 4.9 · 4.10 (no
  date handling in scope) · 4.11 (n/a to this layer) · 4.12 · 4.13.
- **Issues 17, 18, and 21 chain together.** 18 and 21 both let an invalid quantity into the
  offline cart; the server then rejects those lines at login sync; and 17 deletes them in
  response. Fixing 17 alone stops the data loss, which is why it carries the highest severity of
  the three.
- **Float arithmetic on money** (`offlineCartSlice.ts:45`) was reviewed and deliberately not
  filed. `subtotal` is display-only pre-login and the server recomputes authoritative totals on
  sync, so the exposure is sub-cent drift on a provisional figure. Recorded here so a later
  session does not re-derive it — if the offline subtotal ever becomes an input to a real total,
  this should be revisited.
- The `setTimeout` toasts in `syncOfflineCartToServer` (`:124` at 3s and `:138` at 2s) fire after
  a delay with no cleanup, so they can surface after the user has navigated away. Judged minor
  and not filed; noted for the cart-screen session, where the component lifecycle is in scope.
- Not reviewed and carried forward: `CartPageView` and the cart/checkout screens with their four
  states, the quantity stepper component, save-for-later, and promo-code validation — all of
  which belong to the cart-screen and checkout sessions.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 11:12 (24-hour format)
**Feature / Module:** Session 4 — Checkout & payments
**Documentation File:** CLAUDE.md · src/lib/redux/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/helpers/functionalHelpers.ts` (`handleCheckout`, `resetCheckOutState`, `formatAmount`)
  - `src/views/CartPageView/CheckoutSection.tsx` (place-order path)
  - `src/components/Modals/PaymentModal.tsx` (submit path)
  - `src/lib/redux/slices/checkoutSlice.ts`
  - `src/components/PaymentGateway/RazorPay.tsx` (both wallet and order flows)
  - `src/components/PaymentGateway/Stripe.tsx`
  - `src/components/PaymentGateway/Paystack.tsx`
  - `src/components/PaymentGateway/FlutterwavePayment.tsx`
  - `src/components/PaymentGateway/BankTransfer.tsx`
  - `src/views/OrderPaymentView/index.tsx`
  - `src/views/CheckoutPageView/index.tsx`
  - `src/services/payments.ts` (empty re-export stub)
- Directories reviewed: `src/components/PaymentGateway/`, checkout surface of `src/views/`
- Total files inspected: 12

## Findings Summary
- Critical: 0
- High: 1
- Medium: 3
- Low: 0
- Total Issues: 4

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 23 — Idempotency key minted per submit cannot dedupe a retry (High)
- Issue No.: 24 — Razorpay wallet paise round-trip yields a non-integer amount (Medium)
- Issue No.: 25 — Wallet recharge success declared from the client callback (Medium)
- Issue No.: 26 — All five gateway components raise hard-coded English (Medium)

## Existing Issues Confirmed
- Issue No.: 22 — DOM-click and `window`-global control flow. Three further locations in the
  checkout path: `CheckoutSection.tsx:113` (`bank_transfer_modal_btn`),
  `functionalHelpers.ts:554` (`confetti-btn`), and `functionalHelpers.ts:480` / `:459`
  (`(window as any).__cartAttachments`, which carries uploaded order attachments). The
  attachments case is the most consequential instance of the pattern — a lost global means the
  order is submitted without the customer's files — but the defect and fix are the same as 22,
  so it is recorded here rather than duplicated.

## Safe Areas Verified
- **Order payment path is server-authoritative.** `RazorPay.tsx:180-204` calls `payOrder(orderSlug)`
  and takes `razorpay_order_id`, `key_id`, and `amount` from the panel's `payment_response`. The
  amount is never computed or adjusted client-side on this path, and no client value can raise or
  lower what is charged.
- **`handleCheckout` does not trust client totals** — it submits `promo_code`, `use_wallet`,
  `address_id`, and the item set, and lets the panel compute the payable amount. No price,
  subtotal, or discount figure is sent from the client.
- **Double-tap is guarded** — `CheckoutSection.tsx:526` and `:581` bind `isLoading` to the submit
  buttons and `PaymentModal` does the same, so a repeated click during flight is blocked. This is
  what issue 23 does *not* dispute; 23 is strictly about the retry-after-timeout path.
- **`checkoutSlice` is not persisted** — confirmed absent from the `store.ts` allowlist, so a
  stale address, promo code, or wallet flag cannot survive a browser restart into a new order.
  This is correct and matches `src/lib/redux/CLAUDE.md`.
- **`resetCheckOutState`** (`functionalHelpers.ts:453-462`) clears promo, wallet, address, and the
  idempotency key together, so a completed checkout does not leak state into the next one.
- **Gateway prefill** passes only name, email, and mobile — no token, address, or order internals
  are handed to the third-party SDKs.
- **COD and wallet-covered orders** route to the order detail page and skip the payment page
  entirely (`CheckoutSection.tsx:138-145`); the `walletCoversAll` branch at `:107-108` correctly
  requires `payable_amount === 0` *and* wallet selected.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 (no
  date handling in scope) · 4.11 · 4.12 · 4.13.
- **Issue 23 is deliberate behaviour with an unhandled edge, not an oversight.** The comment at
  `PaymentModal.tsx:43-45` explains the per-submit key: it lets a gateway switch create a fresh
  order, and a double-tap is blocked by the disabled button. Both points are correct. The gap is
  the third case — a lost response after the panel committed the order — where the re-enabled
  button plus a new key produces a duplicate. The suggested fix preserves the gateway-switch
  requirement rather than reverting their decision.
- **Issue 24 was measured, not estimated.** An initial spot-check of five large values suggested
  the round-trip only failed above ~1000000 paise, which was wrong. Enumerating every paise value
  between 1.00 and 10000.00 gives 131248 failures out of 999901 — 13.1% — with everyday amounts
  such as 1.10, 1.15, and 2.01 among them. The corrected figure is what is recorded in the row.
- **Client-side signature forwarding was deliberately not filed.** The Razorpay handlers at `:149`
  and `:205` discard `razorpay_payment_id` and the signature rather than posting them for
  verification. Whether that is a defect depends on the panel verifying the webhook signature
  server-side, which is out of scope for this repository and unverifiable from here. Flagged for
  the panel's own review rather than asserted as a storefront vulnerability. Issue 25 covers only
  the part that *is* verifiable here — the UI asserting success it has not confirmed.
- `src/services/payments.ts` is an empty stub (`export {}`) with a comment explaining that gateway
  intents are created order-first through `services/orders.ts`. Accurate and not dead code worth
  filing.
- Not reviewed and carried forward: `services/orders.ts` (`createOrder` / `payOrder`) and the
  order detail and returns screens, which belong to the orders session.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 12:05 (24-hour format)
**Feature / Module:** Session 5 — Orders & account
**Documentation File:** CLAUDE.md · src/pages/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/services/orders.ts` (all 9 callers, incl. `createOrder` / `payOrder` carried from session 4)
  - `src/pages/my-account/orders/index.tsx`
  - `src/pages/my-account/orders/[slug]/index.tsx`
  - `src/pages/my-account/addresses/index.tsx`
  - `src/pages/my-account/profile/index.tsx`
  - `src/pages/my-account/transactions/index.tsx`
  - `src/pages/my-account/wallet/index.tsx`
  - `src/pages/my-account/notifications/index.tsx`
  - `src/pages/my-account/wishlists/index.tsx`
  - `src/pages/my-account/refer-and-earn/index.tsx`
  - `src/components/Tables/TransactionTable.tsx`
- Directories reviewed: `src/pages/my-account/` (all 10 pages), orders surface of `src/services/`
- Total files inspected: 11

## Findings Summary
- Critical: 0
- High: 1
- Medium: 1
- Low: 1
- Total Issues: 3

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 27 — Profile renders an empty form on a failed fetch and saving submits blanks (High)
- Issue No.: 28 — Hard-coded English server-side error messages in account pages (Medium)
- Issue No.: 29 — Retry performs a full page reload instead of refetching (Low)

## Existing Issues Confirmed
- Issue No.: 23 — Idempotency key. Confirmed from the service side: `createOrder`
  (`services/orders.ts:154-186`) returns `fallbackApiRes` on any thrown error, so a timeout after
  the panel committed the order is indistinguishable from a genuine failure at the call site.
  This is precisely the input condition issue 23 describes, and it is what makes the retry path
  reachable rather than theoretical. No new row.

## Safe Areas Verified
- **Every account page is genuinely guarded server-side.** All 10 read
  `getAccessTokenFromContext` and redirect through `loginRedirect` before fetching. Re-verified
  page by page in this session rather than assumed from session 1.
- **Orders list** (`orders/index.tsx`) is the strongest screen reviewed so far: `OrderCardSkeleton`
  for loading, `ErrorState` with retry, translated headings, and pagination guarded by
  `orders.total > orders.per_page` at `:140` so the `Math.ceil` at `:143` can never divide by the
  zero `per_page` that `fallbackPaginateRes` carries.
- **Error-vs-empty distinction is correct everywhere except profile.** `addresses` uses
  `response.success ? response.data : null` (`:284`) and `orders/[slug]` passes an explicit error
  (`:184`), so a failed fetch renders `ErrorState` rather than an empty list. This is the pattern
  issue 27 says profile should adopt.
- **`TransactionTable`** handles all three states properly — `Skeleton` rows while loading
  (`:274-279`), a `no_transactions_found` empty message (`:280-282`), translated.
- **`wallet`** loads its card through `dynamic` with a `WalletCardLoading` fallback (`:40`), so the
  money figure never renders as a flash of zero.
- **`returnOrderItem`** (`services/orders.ts:70-117`) builds `FormData` correctly, deliberately
  omits `orderItemId` from the body (it is in the path), and the comment documents the panel's
  `CreateItemReturnRequest` contract. Images are appended as `images[]`.
- **`getOrders`** forwards the SSR bearer token as a header and returns `fallbackPaginateRes` with
  `success: false` on error, which the page distinguishes from an empty page of results.
- **SWR retry policy** is set explicitly per page (`errorRetryCount` 2-3, `errorRetryInterval`
  1-2s) rather than left at defaults.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 ·
  4.11 · 4.12 · 4.13.
- **Issue 27's data-loss half is conditional and is written that way.** The blank form with no
  error state is verified from the code. Whether pressing save actually wipes the stored profile
  depends on the panel's validation rules for `POST /user/profile`, which cannot be checked from
  this repository. The row states the certain part as the defect and the wipe as a risk, rather
  than asserting a data-loss vulnerability I have not proven.
- **Issue 28 is filed as the systemic version** of a pattern already recorded per-surface in
  issues 16, 20, and 26. Rather than open a fourth surface-specific row, it quantifies the whole
  pattern (21 files carry literal user-facing titles) and cross-references the earlier three. If
  these are fixed together, one locale pass closes all four.
- **Direct `@heroui/react` imports outside `src/components/ui/`: 103 files** (16 of them under
  `pages/my-account` and `views`). Deliberately **not** filed. `CLAUDE.md` §4.1 states this is
  migrated opportunistically and forbids a standalone migrate-imports commit, so it is tracked
  debt with a stated policy, not a defect. Worth recording that the count is down from the 162
  documented in `CLAUDE.md`, so the migration is progressing.
- `dangerouslySetInnerHTML` appears in 8 places — `PromoCard.tsx:83`, `StoreProfile.tsx:154`,
  `HTMLRenderer.tsx:14`, `GoogleMapsScriptLoader.tsx:62`, `SEOHead.tsx:87`/`:95`, and
  `DynamicSEO.tsx:215`/`:226`. All are outside this session's scope (catalog, content, and SEO).
  Listed here so session 8 starts with the sites already located; the settings-driven
  header/footer script injections are an intended admin feature and should be judged as such.
- Not reviewed and carried forward: the order return and cancel *screens* (the services were
  reviewed here, the UI was not), `UserLayout`, and the notifications detail flow.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 12:58 (24-hour format)
**Feature / Module:** Session 6 — Wallet & transactions
**Documentation File:** CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/helpers/currency.ts` (`formatCurrency` — executed against edge cases, not read only)
  - `src/services/wallet.ts` (all 5 callers)
  - `src/components/Modals/DepositModal.tsx` (recharge input + validation)
  - `src/components/Cart/WalletCard.tsx`
  - `src/components/Tables/TransactionTable.tsx` (amount rendering)
  - `src/pages/my-account/wallet/index.tsx`
  - `src/pages/my-account/transactions/index.tsx`
  - `src/pages/my-account/refer-and-earn/index.tsx`
  - `src/types/market.ts` (`MarketFormat` nullability)
- Directories reviewed: wallet surface of `src/services/`, `src/components/Modals/`, `src/helpers/`
- Total files inspected: 9

## Findings Summary
- Critical: 0
- High: 0
- Medium: 4
- Low: 0
- Total Issues: 4

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 30 — `decimal_separator` has no fallback and can print the literal `null` (Medium)
- Issue No.: 31 — An unparseable amount renders as a genuine zero (Medium)
- Issue No.: 32 — Recharge input strips the decimal point, multiplying by 100 (Medium)
- Issue No.: 33 — Hard-coded 1000000 recharge ceiling ignores the market currency (Medium)

## Existing Issues Confirmed
- Issue No.: 24 — Razorpay wallet paise round-trip. Confirmed reachable from this session's side:
  `DepositModal` is the only entry point to `prepareWalletRecharge`, and its output feeds the
  Razorpay wallet branch where the lossy round-trip happens. No new row.
- Issue No.: 25 — Wallet recharge success asserted client-side. Re-confirmed against
  `WalletCard.tsx:60`, which reads `wallet?.formatted_balance` — so the balance the customer
  checks immediately after that success toast comes from a separate fetch that may not yet
  reflect the recharge.

## Safe Areas Verified
- **Transaction amounts are server-formatted.** `TransactionTable.tsx:150` renders
  `tx.formatted_amount` directly — no client-side arithmetic, sign derivation, or currency
  assembly on transaction rows, so credit/debit presentation cannot drift from the ledger.
- **`WalletCard` prefers the server figure** — `wallet?.formatted_balance ?? formatPrice(...)`
  (`:60`) uses `??` rather than `||`, so a legitimately empty-string server value is not silently
  replaced. The client fallback is the only exposed path (issue 31).
- **`formatCurrency` core logic is correct** for well-formed input: thousands grouping, decimal
  places, symbol position and spacing, and the `negative_format` template all behave as
  documented. Verified by execution across positive, negative, and large values — the two issues
  filed are both about absent or malformed input, not the formatting maths.
- **`refer-and-earn`** guards its money display properly — `bonusCap != null && bonusCap !== ""`
  before formatting (`:51`), which is exactly the guard issue 31 says the wallet path is missing.
- **Wallet services** send bodies rather than query params, forward the SSR bearer token as a
  header, and return the correct fallback shape (`fallbackApiRes` / `fallbackPaginateRes`) per
  endpoint.
- **`DepositModal` validation** does reject zero, negative, and non-numeric amounts (`:73`) and
  its error messages are translated — the input defects filed are about the sanitiser and the
  ceiling, not about missing validation.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 ·
  4.11 · 4.12 · 4.13.
- **Issues 30 and 31 were verified by executing the real function**, not by reading it. A copy of
  `formatCurrency` was run against null, undefined, omitted, already-grouped, and non-finite
  inputs. That is what distinguishes 30 from a theoretical nullability concern: an omitted key
  correctly yields `$1,234.50`, but a key *present* with `null` yields `$1,234null50`, because a
  spread copies present-but-null keys over the defaults. The distinction matters for the fix.
- **Issue 30 is the widest-blast-radius finding of this session** despite being Medium: it is one
  misconfigured market field away from corrupting every price on the storefront simultaneously.
  It is rated Medium rather than High because it requires that misconfiguration to occur — but if
  it does, the impact is site-wide and immediate.
- Issue 33 borders on a product decision rather than a defect. It is filed because the constant
  is invisible to operators and behaves differently per market, which `CLAUDE.md` §7.4 explicitly
  warns against — but if the panel has no recharge-limit setting, the right first step is to
  request one rather than to invent a client-side scaling rule.
- The absence of a *minimum* recharge amount was noted while reviewing issue 33 and folded into
  that row rather than filed separately, since both stem from the same missing settings source.
- Not reviewed and carried forward: the Stripe, Paystack, and Flutterwave wallet branches were
  read for i18n in session 4 but their amount handling was not re-verified here — only the
  Razorpay branch was traced end to end. If issue 24's fix is applied, check whether the other
  three gateways share the round-trip pattern.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 14:11 (24-hour format)
**Feature / Module:** Session 7 — Catalog (PDP, search, categories, brands, stores)
**Documentation File:** CLAUDE.md · src/pages/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/hooks/useInfiniteData.ts` (the hook backing every catalog listing)
  - `src/services/catalog.ts` (all 10 callers)
  - `src/pages/products/[slug]/index.tsx` (PDP + its `getServerSideProps`)
  - `src/pages/products/search/index.tsx`
  - `src/pages/categories/index.tsx` and `categories/[slug]/index.tsx`
  - `src/pages/brands/index.tsx` and `brands/[slug]/index.tsx`
  - `src/pages/stores/` (listing + detail)
  - `src/services/ProductDetailPageService.ts` (`fetchProductDetailPageData`)
- Directories reviewed: `src/pages/products/`, `src/pages/categories/`, `src/pages/brands/`,
  `src/pages/stores/`, catalog surface of `src/services/` and `src/hooks/`
- Total files inspected: 12
- Repo-wide scans: all 29 `useSWR` call sites (key composition + cache configuration)

## Findings Summary
- Critical: 0
- High: 1
- Medium: 2
- Low: 1
- Total Issues: 4

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 34 — Failed catalog fetch renders as an empty list (High)
- Issue No.: 35 — Catalog SWR keys omit the market (Medium)
- Issue No.: 36 — Documented per-volatility stale times unimplemented for catalog (Medium)
- Issue No.: 37 — Debug logging left in the PDP server render path (Low)

## Existing Issues Confirmed
- Issue No.: 1 — Market switch invalidates only `/settings`. Issue 35 is the other half of the
  same failure and is filed separately because the root cause and the fix differ: 1 is that the
  switch handler does not invalidate, 35 is that the keys are not market-scoped so there is
  nothing distinguishing the two markets' cache entries. Fixing 35 makes 1 largely moot; fixing 1
  alone leaves the trap for the next switch site. Cross-referenced in both rows.
- Issue No.: 11 — `any` usage. Two further locations: `useInfiniteData.ts:9` and `:16`, both
  `[key: string]: any` on the fetcher and `extraParams` signatures, which is why `extraParams`
  can silently omit the market dimension without a type error. Noted rather than re-filed.
- Issue No.: 12 — SSR console noise. Issue 37 is the same class on the PDP path; filed separately
  because it is debug scaffolding with a misleading label rather than a single status line, and
  it sits on the highest-traffic server route.

## Safe Areas Verified
- **PDP threads the market correctly on SSR.** `[slug]/index.tsx:293` reads
  `getMarketFromContext(context)` and passes it into `fetchProductDetailPageData` alongside
  `country_iso2` (`:299-307`), so the server render is market-scoped. The SSR half of market
  handling is sound — issue 35 is strictly about the client cache.
- **PDP returns `notFound: true`** for a missing product (`:334`) rather than rendering an empty
  shell, which is the correct Pages Router behaviour and the pattern issue 27 wanted from profile.
- **`catalog.ts`** — all 10 callers go through the shared axios instance, so every catalog request
  carries the `X-Market` header; each returns the correct fallback shape on failure.
- **`loadMore`** (`useInfiniteData.ts:102-143`) is properly guarded: `isLoadingRef` blocks
  re-entry, `currentPageRef` blocks a duplicate page fetch, and `setData` uses the functional
  updater so concurrent appends cannot clobber each other.
- **`revalidateOnFocus` is set in 25 of 29 SWR call sites**, so the focus-revalidation half of the
  §7.3 policy is genuinely implemented. Issue 36 is narrowed to the stale windows only, rather
  than claiming the whole caching policy is ignored.
- **Search filters live in the URL** via `selectedFilters` feeding `extraParams`, matching the
  §7.1 rule that the URL owns shareable filter state.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 ·
  4.11 · 4.12 · 4.13.
- **Issue 34 is the most consequential finding of this session** and was verified from both ends:
  the hook converts a failure into `[]` rather than throwing (`:74-78`), *and* the search page
  never destructures `error` (`:150-156`), so there are two independent reasons a failed catalog
  request cannot surface. Either fix alone is insufficient.
- **Issue 36 was deliberately narrowed after measuring.** The first reading suggested the whole
  §7.3 policy was ignored; counting showed 25 of 29 files do set `revalidateOnFocus` and only
  `dedupingInterval` is absent (3 of 29, all account screens). The row reflects the measured
  position and credits the part that is done.
- `dangerouslySetInnerHTML` at `PromoCard.tsx:83` and `StoreProfile.tsx:154` renders API-supplied
  HTML (`promo.description`, `store.description`). These sit in the catalog surface but the
  sanitisation question depends on whether the panel sanitises seller-supplied HTML on write,
  which is not verifiable from this repository. Carried to session 8 with the CSP gap (issue 3)
  as the mitigating context, rather than asserted as an XSS vulnerability here.
- The `hasMore` computation at `useInfiniteData.ts:131` uses the closure `data.length` rather than
  a functional updater, unlike the `setData` call immediately above it. Reviewed and judged not a
  defect: `data.length` is in the callback's dependency array and `isLoadingRef` serialises calls,
  so no interleaving reaches it. Recorded so a later session does not re-derive it.
- Not reviewed and carried forward: product card and gallery components, the filter sidebar UI,
  reviews and FAQ sections on the PDP, and the recently-viewed slice — all of which belong to the
  remaining feature session.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 15:24 (24-hour format)
**Feature / Module:** Session 8 — Home, content & SEO
**Documentation File:** CLAUDE.md · src/components/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/components/Functional/HTMLRenderer.tsx` + all 5 consumers
  - `src/components/Cards/PromoCard.tsx`, `src/components/StoreProfile.tsx` (inline HTML injection)
  - `src/components/Location/GoogleMapsScriptLoader.tsx`
  - `src/SEO/SEOHead.tsx`, `src/SEO/DynamicSEO.tsx`, `src/SEO/PageHead.tsx`
  - `src/layouts/default.tsx` (SEO wiring)
  - `scripts/generate-sitemap.mjs`, `scripts/update-robots.mjs`, `public/robots.txt`
  - `src/pages/index.tsx`, `src/pages/home/sections/[id].tsx`
  - `src/services/home.ts`, `src/services/content.ts`, `src/services/ads.ts`
- Directories reviewed: `src/SEO/`, `scripts/`, content surface of `src/pages/` and `src/services/`
- Total files inspected: 18
- Repo-wide scans: all 8 `dangerouslySetInnerHTML` sites; sitemap static routes verified against
  the filesystem; sanitisation-library search across `src/` and `package.json`

## Findings Summary
- Critical: 0
- High: 1
- Medium: 2
- Low: 0
- Total Issues: 3

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 38 — API-supplied HTML rendered with no sanitisation (High)
- Issue No.: 39 — 22 redesign routes and `/design-system` are indexable (Medium)
- Issue No.: 40 — Sitemap advertises two non-existent routes (Medium)

## Existing Issues Confirmed
- Issue No.: 3 — No CSP and a JS-readable token. This session establishes the delivery mechanism
  that makes it exploitable: issue 38's unsanitised HTML on the highest-traffic pages. The three
  compound — injection point (38), no CSP to contain it (3), and a readable session token in two
  stores (3 and 14). Recorded as the reason 38 carries High rather than Medium.
- Issue No.: 14 — Token in localStorage. Same compounding chain as above.

## Safe Areas Verified
- **`robots.txt` is regenerated at build.** `scripts/update-robots.mjs:23-33` substitutes
  `{{SITE_URL}}` and rewrites the `Sitemap:` directive from `NEXT_PUBLIC_SITE_URL`, so the
  `dev-hypercommerce.vercel.app` URL sitting in the committed `public/robots.txt` is a build
  artefact, not a shipped defect. It was checked specifically because a hard-coded dev URL in
  production robots.txt would have been a significant finding — it is not one.
- **Private routes are correctly disallowed** — `/api/`, `/my-account/`, `/cart/`,
  `/shopping-list/`, `/forgot-password/`, `/admin/` are all present in `robots.txt`, and
  `/cart/checkout/` is covered by the `/cart/` prefix.
- **Eleven of the thirteen sitemap static routes resolve** to a real page; each was checked
  against the filesystem rather than assumed. Only the two in issue 40 are broken.
- **`DynamicSEO` accepts a `robots` prop** (`:40`, `:79`) defaulting to `index, follow`, so pages
  using it *can* opt out of indexing. The rigidity is confined to `SEOHead`.
- **`GoogleMapsScriptLoader.tsx:62`** injects a script body the component composes itself from a
  settings-supplied API key rather than rendering arbitrary API HTML — a different and acceptable
  use of `dangerouslySetInnerHTML`.
- **`SEOHead` header/footer script injection** (`:87`, `:95`) renders `webSettings.headerScript`
  and `footerScript`. These are admin-configured analytics/tag slots — an intended feature of the
  platform, equivalent to a tag manager, and judged as such rather than filed as injection.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 ·
  4.11 · 4.12 (esp. 4.12.5 Head/SEO) · 4.13.
- **Issue 38 is written to separate what is verified from what is not.** Verified here: no
  sanitisation at any of the seven render sites, no sanitisation library in the project, and
  seller-authored content among the inputs. *Not* verifiable from this repository: whether the
  panel strips active content on write. The row states the storefront-side defect — a total
  dependency on unverified upstream behaviour with no defence in depth — rather than asserting a
  working stored-XSS chain that I have not demonstrated. The panel team should confirm what it
  strips so both layers are documented instead of assumed.
- **A mid-session correction worth recording.** An initial search for `SEOHead` across
  `src/pages` and `src/views` returned zero usages, which would have made its hard-coded
  `index, follow` dead code. Widening the search to all of `src/` found it at
  `src/layouts/default.tsx:236` — the default layout, so it applies to every page that does not
  override `getLayout`. The finding was rewritten accordingly; the narrow grep would have
  produced a wrong conclusion in both directions.
- Issue 39's severity was held at Medium rather than High because the sandbox pages carry mock
  data and placeholder copy rather than customer data — the harm is SEO competition, duplicate
  content, and premature exposure of unreleased design, not a data leak.
- The `Disallow: /checkout/` entry in `robots.txt` matches no route (the real path is
  `/cart/checkout/`, already covered by `/cart/`). Harmless and not filed, but noted so a later
  reader does not mistake it for coverage of the checkout route.
- Not reviewed and carried forward: the home layout section components and the ad-tracking hook
  behaviour (`useAdTracking`), which belong with the remaining feature session, and the
  `/share/` deep-link landing page.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 16:33 (24-hour format)
**Feature / Module:** Session 9 — Remaining features (wishlist, reviews, share, shopping list, seller register)
**Documentation File:** CLAUDE.md · src/pages/CLAUDE.md · src/lib/redux/CLAUDE.md · src/components/CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed
  - `src/services/wishlist.ts` (all 9 callers), `src/services/reviews.ts` (all 6 callers)
  - `src/components/Cards/ProductCard.tsx` (favourite / add-to-cart / share handlers)
  - `src/pages/share/products/[slug].tsx`
  - `src/pages/shopping-list/index.tsx`
  - `src/pages/seller-register/index.tsx`
  - `src/pages/my-account/wishlists/index.tsx`
  - `src/lib/redux/slices/recentlyViewedSlice.ts`, `src/lib/redux/slices/searchSlice.ts`
  - `src/hooks/useRecentSearches.ts`
  - `src/services/adTrackingService.ts`
  - `src/components/Modals/DeepLinkModal.tsx`, `src/components/Functional/CookieConsent.tsx`
- Directories reviewed: remaining surface of `src/services/`, `src/lib/redux/slices/`, `src/hooks/`
- Total files inspected: 14
- Repo-wide scans: all direct `localStorage` write sites (6 files, 14 writes)

## Findings Summary
- Critical: 0
- High: 0
- Medium: 2
- Low: 0
- Total Issues: 2

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 41 — Direct `localStorage` writes with incomplete logout cleanup (Medium)
- Issue No.: 42 — Share route duplicates PDP server logic and has drifted (Medium)

## Existing Issues Confirmed
- Issue No.: 22 — DOM-click control flow. Another instance at `ProductCard.tsx:108`
  (`document.getElementById("login-btn")?.click()`), on the most-used component in the catalogue.
  Same defect and fix as 22, so recorded here rather than duplicated.
- Issue No.: 11 — `any` usage. Further location: `share/products/[slug].tsx:43`
  (`undefined as any`). Folded into issue 42's row since the fix is the same edit.

## Safe Areas Verified
- **`ProductCard` action handlers are correct** — this was the main thing this session set out to
  check and it passed. `handleToggleFavorite` (`:87-105`) and `handleAddToCart` (`:113-137`) both
  disable their trigger while in flight, toast on an unsuccessful response *and* on a thrown
  error, use `t()` for every string, and reset state in `finally`. No swallowed failures.
- **`handleShare`'s empty catch is legitimate** — it carries a comment explaining that a dismissed
  share sheet is the expected path, which is exactly when an empty catch is correct.
- **Favourite toggling is not optimistic** — `setIsFavorited` waits for the server response
  (`:96`), so §6.4's rollback requirement does not apply. `CLAUDE.md` §7.1 describes the wishlist
  as client-owned and optimistic, so the implementation deviates from the documented intent, but
  in the safer direction. Noted rather than filed.
- **`recentlyViewedSlice` is properly bounded** — dedupes by id, `unshift`es, and truncates to
  `MAX_PRODUCTS` (20) at `:22-30`, so the persisted slice cannot grow without limit.
- **`searchSlice` and `useRecentSearches` are not duplicates.** The slice holds
  `currentSearchLabels` for the active filter UI; the hook holds the typed-query history. They
  address different concerns, so the apparent overlap with `CLAUDE.md` §7.1 is not a defect —
  checked specifically because it looked like one.
- **`seller-register`** is a correct thin page shell — `PageHead`, breadcrumbs, `PageHeader`, all
  strings translated, presentation delegated to the form component.
- **Wishlist and review services** send bodies rather than query params and return the correct
  fallback shapes; `giveProductReview` builds `FormData` for its image uploads.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 ·
  4.11 · 4.12 · 4.13.
- **Only two issues this session, and that is the honest result.** The remaining feature surface
  is in better shape than the foundational and checkout layers. Two candidate findings were
  investigated and dropped after reading the code rather than filed to pad the count: the
  `ProductCard` handlers (suspected swallowed catches from a grep — they toast correctly) and the
  `searchSlice` / `useRecentSearches` overlap (suspected duplicate stores — different concerns).
- **Issue 41's severity rests on the logout gap, not on the rule violation.** Direct
  `localStorage` use alone would be a code smell; what makes it Medium and a `Security` type is
  that `handleLogout` clears 2 of the 14 keys, so the previous account's search history stays
  visible to the next user on a shared device.
- **Issue 42 is written to claim only what is verified.** The soft-404 is certain — the canonical
  route returns `notFound: true` and the share route does not. What the component *renders* with
  an undefined product was not traced through all 362 lines, and since `initialProduct` is an
  optional prop the render may degrade rather than crash. The row therefore describes the status
  code and the missing delivery estimate, not a crash.
- The cookie-consent key is the one legitimate long-lived `localStorage` value in issue 41's list;
  the suggested fix explicitly keeps it rather than sweeping it into the purge.
- Not reviewed and carried forward to session 10: `useAdTracking` hook behaviour (the service was
  read for its storage writes, not its tracking logic), the PDP reviews and FAQ sections, and the
  filter sidebar UI.

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 17:46 (24-hour format)
**Feature / Module:** Session 10 — Cross-cutting sweeps (i18n/RTL, accessibility, standards baseline, typography, test coverage)
**Documentation File:** CLAUDE.md · CODE_REVIEW_INSTRUCTIONS.md
**Reviewer:** Claude

## Scope
Whole-codebase sweeps rather than a feature area.
- Files reviewed
  - `public/locales/{en,hi,ar}.json` (all 1635 keys, parity and translation coverage)
  - `src/pages/_document.tsx`, `src/pages/_app.tsx` (lang/dir, font loading)
  - `src/config/fonts.ts`, `src/styles/globals.css`, `tailwind.config.ts` (typography chain)
  - `eslint.config.mjs`, `package.json` (a11y tooling, RTL plugin, test tooling)
- Repo-wide scans
  - Direction-sensitive Tailwind classes: physical vs logical, all `.tsx`
  - All 41 `isIconOnly` occurrences checked for an accessible name within ±8 lines
  - `<div onClick>` and `<img>` without `alt`
  - `ErrorBoundary` / `componentDidCatch` presence; `_error.tsx` / `500.tsx` presence
  - Plus Jakarta Sans vs Figtree across `src/` and `tailwind.config.ts`
- Total files inspected: 9 directly, plus 6 repo-wide scans over ~364 source files

## Findings Summary
- Critical: 0
- High: 1
- Medium: 3
- Low: 1
- Total Issues: 5

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 43 — Storefront ships Figtree; Plus Jakarta Sans is never loaded (High)
- Issue No.: 44 — Physical direction classes break the Arabic layout (Medium)
- Issue No.: 45 — 22 of 41 icon-only buttons have no accessible name (Medium)
- Issue No.: 46 — No error boundary and no custom error page (Medium)
- Issue No.: 47 — Server-rendered `lang` hard-coded to English (Low)

## Existing Issues Confirmed
- Issue No.: 3 — No CSP. Re-confirmed during the standards sweep; it remains covered by issue 3
  rather than re-filed under §4.12.11.

## Safe Areas Verified
- **i18n coverage is excellent and was measured, not assumed.** 1635 keys in `en`; `hi` and `ar`
  each differ by exactly one missing key (`sponsored`). Translation coverage is ~99%: only 13
  values in `hi` and 9 in `ar` are still identical to their English source. This is a
  well-maintained locale set and the strongest area found across all ten sessions.
- **`dir` is handled correctly on the client** — `_app.tsx:58-61` sets it from the active
  language, which is why issue 44 (unmirrored spacing) is visible at all, and why issue 47 is
  scoped to the server response rather than claiming direction is unsupported.
- **`<div onClick>` count is 2** across the entire codebase, and **zero `<img>` elements lack an
  `alt` attribute**. Both are strong results against §6.5 and better than the icon-button figure
  suggested.
- **19 of 41 icon-only buttons are labelled correctly**, so the convention is understood and
  applied inconsistently rather than absent — which is why issue 45's fix is mechanical.
- **`eslint-config-next/core-web-vitals` carries the `jsx-a11y` ruleset** and no rule is disabled
  inline anywhere, so the tooling to prevent issue 45 recurring is already installed.
- **Figtree as `--font-mono`** is correct per `CLAUDE.md` §9.13 — only the *sans* mapping is wrong
  (issue 43). The self-hosted `localFont` for mono is properly configured.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 · 4.7 · 4.8 · 4.9 · 4.10 ·
  4.11 · 4.12 (incl. 4.12.11 standards baseline) · 4.13.
- **Issue 43 is the finding that justifies running a cross-cutting session at all.** Reviewing
  screens one at a time cannot surface it: every screen is internally consistent, and each simply
  inherits `font-sans`. Only tracing the chain — `tailwind.config.ts:20` → `globals.css:304` →
  `_document.tsx:16-27` → `config/fonts.ts` — shows that the family named in three places in
  `CLAUDE.md` is not loaded anywhere in the project. `CLAUDE.md` also names Figtree explicitly
  among the stale values that must not be reintroduced, and §6.7 lists the typeface as a visual
  regression check, so documentation and shipped code are in direct conflict.
- **Two measurements were corrected mid-session.** An initial RTL scan returned zero for every
  physical *and* logical class, which was a broken shell pattern rather than a clean result;
  re-running it properly gave 57 physical margin/padding uses plus 23 `text-left`/`text-right`
  against 13 logical uses. Similarly, a first pass suggested only 1 of 41 icon buttons had an
  `aria-label`; widening the window to ±8 lines to account for multi-line JSX props gave the
  accurate 19 labelled / 22 unlabelled split. Both corrected figures are what the rows carry.
- **The single missing locale key and the ~22 untranslated values were deliberately not filed.**
  At 1 key in 1635 and ~99% translation coverage, filing them would pad the register against
  rule 12. They are recorded here so the next session has the exact figures.
- **Test coverage (§4.13) remains the standing gap** and is deliberately not a row: no test
  runner, no test files, no `test` or `typecheck` script, and no CI (`.github/` does not exist).
  Of the 47 issues in the register, the ones a unit test would most directly have caught are
  18, 21, 30, 31, and 32 — all pure-function defects in quantity clamping, currency formatting,
  and input sanitising.
- `npm run lint` remains `eslint --fix`, so it rewrites rather than failing; with no CI, nothing
  gates a merge. Recorded in the instructions §4.12.11 baseline rather than as an issue row.

## Register status after ten sessions
- Total issues recorded: **47** — Critical 2, High 10, Medium 28, Low 7.
- All ten planned sessions are complete. Areas never covered by any session and available for
  future review: the auth sheet form components, the PDP reviews and FAQ sections, the filter
  sidebar UI, `useAdTracking` behaviour, `UserLayout`, the home layout section components, and
  the Stripe/Paystack/Flutterwave amount handling (only Razorpay was traced end to end).

---

# Code Review Session

**Date:** 2026-08-05
**Time:** 18:52 (24-hour format)
**Feature / Module:** Session 11 — Critical data stored locally (requested theme)
**Documentation File:** CLAUDE.md · CODE_REVIEW_INSTRUCTIONS.md
**Reviewer:** Claude

## Scope
Theme-based sweep across every client-side storage medium, rather than a feature area.
- Storage media examined: `localStorage`, `sessionStorage`, cookies, `redux-persist`,
  `CacheStorage` (PWA service worker), and in-memory `window` globals
- Files reviewed
  - `next.config.ts` (PWA options, `headers()` cache directives)
  - `src/lib/cookies.ts`, `src/helpers/auth.ts` (`handleLogout` cleanup)
  - `src/components/PaymentGateway/` (all 5 components — persistence check)
  - `src/services/adTrackingService.ts`, `src/lib/analytics.ts`
  - `src/components/Location/LocationSelector.tsx`, `src/helpers/events.ts`
  - `src/types/cart.ts` (`CartResponse` / `PaymentSummary` — what the persisted cart holds)
  - `src/layouts/default.tsx` (only `sessionStorage` use in the codebase)
- Repo-wide scans: card-field names; all `setCookie` vs `deleteCookie` call sites;
  `caches.*` / service-worker unregister; `sessionStorage`

## Findings Summary
- Critical: 0
- High: 1
- Medium: 1
- Low: 0
- Total Issues: 2

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.: 48 — Service-worker cache never purged; no cache directives on private routes (High)
- Issue No.: 49 — Three cookies including precise location survive logout (Medium)

## Existing Issues Confirmed
- Issue No.: 41 — Incomplete logout cleanup for `localStorage`. Issue 49 is the same failure for
  cookies and 48 for `CacheStorage`; all three are filed separately because the storage medium
  and the remediation differ, and 41's row explicitly enumerated `localStorage` only. Together
  they show one root cause: logout cleans up by hand and the hand-written list is incomplete.
- Issue No.: 15 — `cart` persisted. Re-confirmed with its contents: `CartResponse` carries
  `user_id` and a `PaymentSummary` including `wallet_balance` and `wallet_amount_used`, so the
  persisted copy is financial rather than just a list of items. Exposure is bounded because
  `handleLogout` does dispatch `clearCart()`.
- Issue No.: 3 — Token and user object in JS-readable cookies. Unchanged.

## Safe Areas Verified
- **No payment data is stored anywhere, which was the headline question of this session.** A
  repo-wide search for `card_number`, `cvv`, `cvc`, `expiry`, `exp_month`, `exp_year`, and
  `card_holder` returns nothing. None of the five gateway components writes to `localStorage`,
  `sessionStorage`, or a cookie. All four gateways hand off to their own SDK or a redirect, so
  card data never enters the storefront's control. This is the correct architecture and it holds.
- **`sessionStorage` is used exactly once** in the entire codebase — `layouts/default.tsx:67`/`:72`
  for a soft-update dismissal flag. No personal data.
- **Analytics carries no PII.** `lib/analytics.ts` sends product, store, and category names plus
  the numeric user id and `login_method` / `user_type` properties. No email, mobile, or address is
  passed to any analytics call.
- **Ad-tracking storage holds no personal data** — `adTrackingService.ts:38-52` persists only
  impression and click queues of ad identifiers.
- **`checkoutSlice` is not persisted**, so the selected delivery address never reaches
  `localStorage`. Re-verified from the storage side this session.
- **`__cartAttachments`** holds uploaded files in a `window` global only — never serialised to any
  persistent store, and cleared by `resetCheckOutState`. The control-flow objection to it stays
  with issue 22; there is no storage defect.
- **`handleLogout` does clear the Redux slices** — `logout()`, `clearCart()`, and
  `clearRecentlyViewed()` — so the persisted auth, cart, and recently-viewed data is emptied at
  sign-out even though `persistor.purge()` is never called.

## Notes
- Review categories completed: 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 4.6 (n/a to this theme) · 4.7 ·
  4.8 · 4.9 (n/a) · 4.10 (n/a) · 4.11 (n/a) · 4.12 · 4.13.
- **The predicted clean result on payment data held.** Session 11 was proposed with the
  expectation that no card handling would be found because every gateway delegates to its own
  SDK, and that is exactly what the scan showed. It is recorded as a verified-safe result rather
  than converted into a speculative finding.
- **Issue 48 states its own evidentiary limit inside the row.** The generated `sw.js` is
  gitignored and `node_modules` is not installed in this checkout, so the library's default
  `runtimeCaching` rules could not be inspected and it is *not* claimed that a specific
  authenticated response is definitely on disk. What is verified and sufficient on its own:
  aggressive front-end nav caching is explicitly enabled, no `runtimeCaching`/`exclude` narrows
  it, no private route carries `no-store`, and nothing in the codebase ever purges `CacheStorage`.
  The missing purge is a defect regardless of which entries the defaults write.
- **The cookie audit is the cleaner half of this session**: 5 cookies written, 2 deleted at
  logout. `userLocation` carries precise `lat`/`lng` plus a human-readable place description at a
  365-day expiry, which is the most personally identifying value found in any client store during
  the whole review — more so than the ad-tracking or recently-viewed data.
- A pattern worth naming across 41, 48, and 49: logout is implemented as a hand-maintained list of
  things to clear. Every new client-side store added since has been missed. The durable fix is to
  invert it — enumerate what may survive a session and clear everything else.
- Not covered and carried to the remaining requested sessions: stale-state-after-write behaviour
  (session 12) and redundant request patterns (session 13).

---
