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
