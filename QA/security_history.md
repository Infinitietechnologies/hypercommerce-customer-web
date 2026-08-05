# Security Review History — HyperCommerce Customer Web

Permanent chronological audit trail of every security review session in this repository.

**Rules**

- Append a new entry for every session. Newest entries go at the **end**.
- **Never overwrite, edit, or delete a previous entry.**
- Process, review areas, severity scale, and CSV format: `SECURITY_INSTRUCTIONS.md`.
- Companion records: `QA/security.csv` (master vulnerability register, append-only, 21 columns)
  and `QA/security_append.csv` (latest session only, overwritten each time, **no header row**).
- **Never record a real credential, token, OTP, session value, or customer PII** in these files —
  redact to a shape (`Bearer <token>`), never a value.
- Several storefront security issues are already recorded in `QA/code_review.csv` — see the table
  in `SECURITY_INSTRUCTIONS.md` §3. Reference them rather than re-filing them.

---

## Entry template

Copy this block for each new session and fill it in.

```markdown
# Security Review Session

**Date:** YYYY-MM-DD
**Time:** HH:MM (24-hour format)
**Feature / Module:**
**Documentation File:**
**Reviewer:** Claude

## Scope
- Files and directories reviewed
- Review areas covered
- Total files inspected

## Findings Summary
- Critical:
- High:
- Medium:
- Low:
- Total Findings:

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID:

## Existing Findings Confirmed
- ID:

## Chains Identified
Which findings combine, and what the combined outcome is.

## Areas Verified Secure
What was examined and found sound — with the reason it holds.

## Notes
What could not be verified from this repository and why; assumptions; limitations.

---
```

---

# Session Log


# Security Review Session

**Date:** 2026-08-05
**Time:** 22:41 (24-hour format)
**Feature / Module:** F1 — Auth & session (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/services/auth.ts`, `src/helpers/auth.ts`, `src/lib/cookies.ts`,
  `src/lib/firebase.ts`, `src/features/auth/useForgotPassword.ts`,
  `src/features/auth/components/{LoginForm,ForgotPasswordForm,AuthSheetHost}.tsx`,
  `src/features/auth/safeNext.ts`, `src/guards/authGuard.ts`, `src/guards/withAuth.tsx`,
  `src/lib/redux/slices/authSlice.ts`, `src/lib/redux/store.ts`
- Review areas covered: 4.1 credential storage & lifecycle · 4.2 authentication flows ·
  4.3 authorization as the client enforces it · 4.5 redirects (auth-scoped) ·
  4.10 client-side abuse surface (auth-scoped) · 4.13 privacy (auth-scoped)
- Total files inspected: 12

## Findings Summary
- Critical: 0
- High: 0
- Medium: 2
- Low: 0
- Total Findings: 2

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-01 — Unauthenticated account-existence oracle via `/verify-user` (Medium)
- ID: CWEB-02 — No cooldown on OTP resend (Medium)

## Existing Findings Confirmed
- Code review #2 — inert guards on checkout and payment. **Confirmed by observation** this
  session against a running dev server; recorded as defect 1 rather than re-filed here.
- Code review #13 — credentials in URL query strings. Compounds CWEB-01: every enumeration probe
  is also written into access and proxy logs.
- Code review #3, #14, #41, #49 — token and PII storage and incomplete logout cleanup. Unchanged;
  referenced rather than re-filed per §3 of the instructions.

## Chains Identified
- **CWEB-01 + #13** — the enumeration oracle plus query-string transport means a probe campaign is
  both unlimited and permanently recorded in logs, giving a second party the same membership list.
- **CWEB-02 + CWEB-01** — enumeration identifies live mobile numbers; the uncapped resend then
  allows SMS flooding of a confirmed-real number.

## Areas Verified Secure
- **`safeNext` is a correct open-redirect guard.** `src/features/auth/safeNext.ts:8-11` requires a
  leading `/` and rejects `//`, so absolute (`https://evil.tld`) and protocol-relative
  (`//evil.tld`) targets both fall back to `/`. This was the highest-value negative result of the
  session — a `?next=` parameter feeding `router.push` is exactly where an open redirect usually
  lives, and here it is properly defended.
- **The reset token never leaves memory.** `useForgotPassword` holds it in React state only; it is
  not written to a URL, a cookie, `localStorage`, or a log.
- **`phoneLogin` sends the Firebase `idToken` in the body** and the bearer token as a header, not
  as query params — the correct shape, and the counter-example to #13 inside the same file.
- **All four `/my-account/*` routes are genuinely guarded server-side** — verified by request, not
  by reading: each returns 307 to the login redirect with no session cookie.
- **Auth strings use `i18n.t` throughout the sheet and hook**; only the Firebase SDK error map is
  hard-coded (already code review #16).

## Notes
- A backslash variant of the `next` parameter (`/\evil.tld`) was considered and deliberately not
  filed. Browsers normalise `/\` toward `//` for location assignment, but `next` is consumed by
  `router.push`, which performs client-side routing to a path rather than a location assign — so
  the vector does not carry here. It is written into TC-AUTH-018 so the behaviour is pinned if the
  consumer ever changes.
- Token revocation on password change could not be verified from this repository — it is enforced,
  or not, by the panel. TC-AUTH-025 specifies the behaviour so it can be checked against the API.
- CWEB-01 and CWEB-02 both need panel-side enforcement to be genuinely fixed. The client-side
  cooldown in CWEB-02's remediation is a usability control, not a security boundary, and the row
  says so.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 23:58 (24-hour format)
**Feature / Module:** F2 — Cart & offline cart (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/lib/redux/slices/offlineCartSlice.ts`, `cartSlice.ts`, `store.ts`,
  `src/helpers/updators.ts`, `src/helpers/auth.ts` (logout path), `src/services/cart.ts`,
  `src/components/Cart/AttachmentUploader.tsx`, `src/components/Modals/FailedItemsModal.tsx`
- Review areas covered: 4.1 credential storage (cart-scoped) · 4.3 authorization · 4.4 injection
  sinks · 4.9 tenancy and market scoping · 4.10 client abuse surface · 4.12 local persistence
- Total files inspected: 8

## Findings Summary
- Critical: 0 · High: 0 · Medium: 1 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-03 — Offline cart survives logout and merges into the next account (Medium)

## Existing Findings Confirmed
- Code review #15 — `cart` persisted. Re-confirmed from the security side: the persisted copy
  carries `user_id` and a `PaymentSummary` with `wallet_balance`, so it is account-linked data at
  rest. Bounded because `handleLogout` does dispatch `clearCart()` — which is precisely what makes
  the *offline* cart's omission (CWEB-03) stand out.
- Code review #17 — offline cart cleared despite rejections. CWEB-03 is the mirror image: #17 is
  about clearing too eagerly on success, CWEB-03 about never clearing at logout.

## Chains Identified
- **CWEB-03 + #17** — a failed sync leaves items behind (no clear on the failure branch) and
  logout does not clear them either, so the window where a leftover cart can cross accounts is
  wider than either issue alone implies.

## Areas Verified Secure
- **No client price reaches the server.** `syncOfflineCartToServer` maps each item to
  `store_id`, `product_variant_id`, `quantity` and `addons` only (`updators.ts:87-96`) — `price`
  is deliberately absent, so tampering with the persisted price cannot alter what is charged.
  This is the single most important negative result for a cart register.
- **Attachment upload is properly constrained** — `AttachmentUploader.tsx:41-60` enforces a size
  ceiling and a type allowlist via `getFileType`, with a matching `accept` attribute on the input.
- **All 11 cart endpoints send request bodies**, never query params, and inherit the `X-Market`
  header from the shared axios instance.
- **`cartSlice` holds no credential** — `CartResponse` carries `user_id` but no token or contact
  detail.

## Notes
- Review categories 4.5 (redirects) and 4.6 (payments) were not applicable to this feature; 4.6 is
  covered in full by F3.
- CWEB-03 is rated Medium rather than High because it needs local access to a shared device. The
  reason it is not Low: the merge is **silent** — there is no prompt and no notice — and it writes
  to the *server* cart of the incoming account rather than merely leaving data on disk.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 01:12 (24-hour format)
**Feature / Module:** F3 — Checkout & payments (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: all five `src/components/PaymentGateway/*` components,
  `src/helpers/functionalHelpers.ts` (`handleCheckout`, `resetCheckOutState`),
  `src/views/CartPageView/CheckoutSection.tsx`, `src/views/OrderPaymentView/index.tsx`,
  `src/components/Modals/PaymentModal.tsx`, `src/services/orders.ts`,
  `src/lib/redux/slices/checkoutSlice.ts`, `src/views/CartPageView/CartItems.tsx`
- Review areas covered: 4.3 authorization · 4.5 redirects and return URLs · 4.6 payments ·
  4.8 secrets exposure · 4.9 tenancy · 4.13 privacy
- Total files inspected: 11

## Findings Summary
- Critical: 0 · High: 0 · Medium: 1 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-04 — Razorpay and Paystack declare success from a bare callback and discard the
  gateway payment reference (Medium)

## Existing Findings Confirmed
- Code review #23 — idempotency key minted per submit. The financial consequence (duplicate
  order and duplicate charge on retry) is a payment-security concern, but the row already exists
  with the right severity and remediation, so it is referenced rather than re-filed.
- Code review #22 — `window`-global control flow. New detail found this session:
  `CartItems.tsx:82-85` writes `__cartAttachments` **during render** rather than in an effect,
  so the global reflects the last render of a mounted component and is never cleared on unmount.
- Code review #25 — wallet success asserted client-side. CWEB-04 is the order-path analogue and
  is filed separately because the gateways differ and the remediation is to forward the reference.

## Chains Identified
- **CWEB-04 + #23** — if a retry creates a second order (#23) and payment state is settled only by
  an unverified callback (CWEB-04), reconciling which order was actually paid becomes materially
  harder because no gateway reference was ever captured on this side.

## Areas Verified Secure
- **No price or total is ever sent from the client.** `handleCheckout`
  (`functionalHelpers.ts:463-520`) submits `payment_type`, `promo_code`, `use_wallet`,
  `address_id`, `order_note`, attachments and the idempotency key — no amount, no subtotal, no
  discount. The panel computes what is charged. This is the single most important property of a
  checkout integration and it holds.
- **The gateway amount comes from the panel.** `RazorPay.tsx:200-204` takes `amount`, `key_id` and
  `razorpay_order_id` from the `payOrder` response rather than computing them locally.
- **Stripe is implemented correctly** — `confirmPayment` with `redirect: "if_required"` and both
  the `error` and missing-`paymentIntent` branches handled before success (`Stripe.tsx:77-106`).
  It is the in-repo counter-example that makes CWEB-04 a defect rather than a design constraint.
- **Gateway prefill leaks nothing sensitive** — name, email and mobile only; no token, no address,
  no order internals.
- **`checkoutSlice` is not persisted**, so a stale address, promo or wallet flag cannot survive a
  browser restart into a new order.
- **`redirect_url`** is built from `window.location.origin`, which a third party cannot influence
  for a victim's browser; no attacker-supplied return URL is accepted.

## Notes
- **CWEB-04 states its evidentiary boundary inside the row.** Verified: both callbacks discard the
  reference and issue no verification request. Not verifiable here: whether the panel verifies
  webhook signatures — the control that actually settles payment. The finding is the storefront's
  total dependence on an unconfirmed control, plus the loss of the reference that would allow a
  cross-check. The panel team's answer should be recorded in the row's notes so it stops being an
  assumption.
- A candidate finding around `__cartAttachments` surviving a gateway order was investigated and
  **not filed as a vulnerability**. `resetCheckOutState` is deliberately skipped for the four SDK
  gateways, so the global does retain files — but `CartItems` overwrites it from component state
  whenever the cart is rendered again, so the exploit path self-heals. It is specified as
  TC-CHK-022 instead, which is the right home for an unproven risk.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 02:26 (24-hour format)
**Feature / Module:** F4 — Wallet & transactions (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/services/wallet.ts` (all 5 callers), `src/components/Modals/WithdrawModal.tsx`,
  `src/components/Modals/DepositModal.tsx`, `src/components/Cart/WalletCard.tsx`,
  `src/components/Tables/TransactionTable.tsx`, `src/helpers/currency.ts`,
  `src/types/params.ts` (`DeductBalanceParams`, `AddBalanceParams`),
  `src/components/PaymentGateway/RazorPay.tsx` (wallet branch)
- Review areas covered: 4.3 authorization · 4.6 payments (wallet paths) · 4.9 tenancy ·
  4.10 client abuse surface · 4.13 privacy
- Total files inspected: 9

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 1 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-05 — Unmounted withdrawal component would post a balance-unchecked money-out amount (Low)

## Existing Findings Confirmed
- Code review #25 — wallet success asserted from the client callback. Same root as CWEB-04 filed
  under F3; the wallet branch is the more exposed of the two because the balance the customer
  checks afterwards comes from a separate fetch.
- Code review #33 — hard-coded `1000000` ceiling. Found a **second occurrence** this session:
  `WithdrawModal.tsx:63` carries the identical constant on the money-out path, so the same
  market-blind limit governs both directions.
- Code review #3 / #14 — a tampered wallet balance in the cookie or `localStorage` changes only
  what is displayed; the panel remains the authority. No new vector.

## Chains Identified
- None new this session. CWEB-05 does not chain today because it is unreachable.

## Areas Verified Secure
- **Transaction amounts are server-formatted.** `TransactionTable.tsx:150` renders
  `tx.formatted_amount` — no client arithmetic, no sign derivation — so ledger presentation cannot
  drift from the ledger itself.
- **`WalletCard` prefers the server figure** with `??` rather than `||`, so a legitimately empty
  server value is not silently replaced by a client computation.
- **Wallet services send bodies, not query params**, forward the SSR bearer token as a header, and
  return the correct fallback shape per endpoint.
- **No wallet endpoint accepts an owner identifier from the client** — `getWallet` and
  `getWalletTransactions` carry no user parameter, so the wallet is resolved from the session.
- **`prepareWalletRecharge` sending a client-chosen amount is correct by design** — the customer
  chooses what to top up and then pays that amount through the gateway; the risk sits on the
  credit side, which is panel-controlled.

## Notes
- **CWEB-05 is deliberately rated Low and its title says why.** `WithdrawModal` has **no render
  site anywhere in `src`** — it is dead code, so there is no customer-facing path to it today and
  filing it as an exploitable vulnerability would overstate the evidence. It is recorded because
  the flaw ships in the repository and goes live the moment anyone mounts the component: the file
  never references the balance at all (`grep` for `balance` returns zero hits), so the only bounds
  are `> 0` and the hard-coded million.
- The `/user/wallet/deduct-balance` endpoint remains callable by any authenticated client
  regardless of this component, so its real protection is panel-side. TC-WAL-001 to TC-WAL-003
  specify exactly what to verify there, and those cases are runnable against the API without any
  storefront change.
- The wallet's client-side money surface is genuinely thin — display and input only. Everything
  that moves money is a panel decision, which is the correct division and is why this pass
  produced one Low rather than more.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 03:34 (24-hour format)
**Feature / Module:** F5 — Orders & returns (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/services/orders.ts` (all 9 callers),
  `src/views/OrderDetailView/index.tsx`, `src/views/OrderDetailView/ReturnSheet.tsx`,
  `src/components/Modals/ReturnOrderItemModal.tsx`,
  `src/pages/my-account/orders/index.tsx`, `src/pages/my-account/orders/[slug]/index.tsx`
- Review areas covered: 4.3 authorization · 4.4 injection sinks · 4.9 tenancy ·
  4.10 client abuse surface (upload) · 4.13 privacy
- Total files inspected: 6

## Findings Summary
- Critical: 0 · High: 0 · Medium: 1 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-06 — Return evidence upload accepts any file type and any size (Medium)

## Existing Findings Confirmed
- Code review #38 — no sanitisation of API-supplied HTML, and #3 — no CSP. Both are named inside
  CWEB-06 because they are what turns an unrestricted upload from a storage problem into a
  potential injection one, if the panel serves the stored file inline.
- Code review #28 and #29 — hard-coded English SSR errors and reload-as-retry on the orders
  screens. Unchanged; specified as TC-ORD-011 to TC-ORD-013.

## Chains Identified
- **CWEB-06 + #38 + #3** — an unvalidated upload (no mime check) into a platform that sanitises no
  API-supplied HTML and sets no CSP. Each is individually bounded; together they describe a
  plausible stored-injection path. Whether it completes depends on how the panel stores and serves
  return evidence, which is not verifiable here and is written into TC-ORD-004.

## Areas Verified Secure
- **`returnOrderItem` builds a correct multipart request** and deliberately omits `orderItemId`
  from the body because it belongs in the path — the comment at `services/orders.ts:70-80`
  documents the panel's `CreateItemReturnRequest` contract, which is the right way to record a
  contract dependency.
- **No order endpoint accepts an owner identifier from the client.** Every call is scoped by the
  session token; `getOrders` forwards the SSR bearer token as a header.
- **All ten account routes remain server-side guarded** — re-confirmed by request in F1 and not
  weakened by anything in this feature.
- **Order data is rendered as text**, not through `dangerouslySetInnerHTML`, so the order screens
  add no injection sink of their own.
- **The evidence requirement is enforced before submit** — `ReturnSheet.tsx:81` blocks a reason
  that needs a photo when none is attached.

## Notes
- **CWEB-06 is a regression, and that is what makes it worth filing rather than a standing gap.**
  The component it replaced — `ReturnOrderItemModal` — enforces a five-image cap, an
  `image/*` mime check and a 5MB size ceiling (`:42`, `:309`, `:320`, `:329`). That modal is no
  longer rendered anywhere in `src`, so the validated path is dead code and the redesign's
  `ReturnSheet` is what customers use. The redesign kept the count cap and dropped the other two.
- `accept="image/*"` was explicitly not treated as validation. It is a file-picker hint: a user can
  change the dialog filter, and a scripted submit ignores it entirely.
- The strongest remediation is also the cheapest: the exact checks needed already exist in the dead
  modal and can be lifted across, after which that file should be deleted.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 04:41 (24-hour format)
**Feature / Module:** F6 — Account: profile, addresses, notifications, wishlists (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/helpers/notificationUrl.ts`, `src/pages/my-account/notifications/index.tsx`,
  `src/components/Functional/FirebaseInitializer.tsx`, `src/pages/my-account/profile/index.tsx`,
  `src/pages/my-account/addresses/index.tsx`, `src/pages/my-account/wishlists/index.tsx`,
  `src/services/auth.ts` (profile/email endpoints), `src/services/address.ts`,
  `src/services/wishlist.ts`, `src/components/Cart/AttachmentUploader.tsx` (comparison)
- Review areas covered: 4.3 authorization · 4.4 injection sinks · 4.5 redirects and window
  handling · 4.10 client abuse surface · 4.13 privacy
- Total files inspected: 10

## Findings Summary
- Critical: 0 · High: 0 · Medium: 2 · Low: 0 · Total Findings: 2

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-07 — Notification list navigates to an unvalidated URL from the payload (Medium)
- ID: CWEB-08 — Profile avatar accepts any file of any size (Medium)

## Existing Findings Confirmed
- Code review #27 and #50 — the profile page's `initialData` handling. Both are reachable from the
  security angle too (a blank form that can overwrite a stored record), but they are already filed
  with the right severity and are specified here as TC-ACC-008 to TC-ACC-011 rather than re-filed.
- CWEB-06 (F5) — return evidence upload. CWEB-08 is the same class and the row says so; together
  they establish the systemic position recorded below.

## Chains Identified
- **CWEB-08 + CWEB-06 + #38 + #3** — two unvalidated upload paths feeding a platform that
  sanitises no API-supplied HTML and sets no CSP. The upload rows carry the cross-reference so the
  combined picture is visible from either end.

## Areas Verified Secure
- **Every typed branch of `getNotificationRedirectUrl` builds a relative path** — orders, wallet,
  product, brand, category, store and the entity fallback all produce `/…` routes. Only the
  `quickLink` shortcut is unvalidated, which is why CWEB-07 is scoped to that branch rather than
  the whole helper.
- **The push-notification consumer is correct** — `FirebaseInitializer.tsx:76-80` tests
  `/^https?:\/\//i` and routes external URLs through `window.open(url, "_blank",
  "noopener,noreferrer")`, so no reverse-tabnabbing and no in-place navigation. It is the in-repo
  counter-example that makes the notifications-page behaviour a defect rather than a design choice.
- **Wishlist removal is a correct optimistic update** with revalidation on both the unsuccessful
  response and the thrown error — re-verified this session.
- **Address CRUD refreshes its list** after every mutation.
- **No account endpoint accepts an owner identifier from the client**; all are session-scoped.

## Notes
- **The upload picture is now systemic and worth stating once.** The storefront has three live
  upload paths: cart attachments (`AttachmentUploader`) validates mime and size correctly; return
  evidence (`ReturnSheet`) validates neither (CWEB-06); profile avatar validates neither (CWEB-08).
  A fourth, `ReturnOrderItemModal`, validated correctly but is dead code. The right fix is one
  shared validator that all paths route through, which is what both rows recommend.
- `accept="image/*"` is treated consistently across both upload findings as a picker hint and not
  as validation.
- An observation not filed: `profile/index.tsx:566` and `:581` call `URL.createObjectURL` **during
  render** without ever revoking, so a new object URL leaks on every render while an avatar preview
  is showing. That is a performance and lifecycle defect rather than a security one, and it belongs
  to a code-review pass on this file — recorded here so it is not lost.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 06:03 (24-hour format)
**Feature / Module:** F7 — Catalog & search (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `next.config.ts` (image configuration), `src/components/StoreProfile.tsx`,
  `src/components/Cards/PromoCard.tsx`, `src/hooks/useInfiniteData.ts`,
  `src/pages/products/[slug]/index.tsx`, `src/pages/products/search/index.tsx`,
  `src/services/catalog.ts`
- Review areas covered: 4.3 authorization · 4.4 injection sinks · 4.7 platform configuration ·
  4.9 tenancy and market scoping · 4.11 supply chain (remote image hosts) · 4.12 caching
- Total files inspected: 7
- **Live testing:** the dev server was run and the image optimizer endpoint probed directly.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 1 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-09 — Image optimizer accepts any https host (Medium)

## Existing Findings Confirmed
- Code review #38 — no sanitisation of API-supplied HTML. The two catalogue sinks were re-read
  this session: `StoreProfile.tsx:154` renders `store.description` and `PromoCard.tsx:83` renders
  `promo.description`, both **seller-authored** in a multi-seller marketplace. Already enumerated
  in #38, so specified as TC-CAT-012 rather than re-filed.
- Code review #35 and #36 — market-blind SWR keys and missing stale windows. Unchanged.

## Chains Identified
- **CWEB-09 + #38 + #3** — a wildcard image host allowlist, no HTML sanitisation, and no CSP all
  sit on the same public catalogue pages. `contentDispositionType: attachment` breaks the specific
  SVG-execution path, which is why CWEB-09 is Medium rather than High.

## Areas Verified Secure
- **The SVG execution path is mitigated.** `dangerouslyAllowSVG: true` is paired with
  `contentDispositionType: "attachment"`, so an SVG served through the optimizer downloads rather
  than rendering inline. The mitigation is deliberate and it holds — CWEB-09 is scoped to the
  fetch-side risk, not to script execution.
- **The optimizer rejects non-https targets** — an `http://127.0.0.1:9/…` probe returned Next's
  400 "not allowed", so loopback and plain-http internal hosts are out of reach. This is what
  bounds the SSRF to https-reachable hosts and was established by test, not assumption.
- **PDP threads the market on SSR** and returns `notFound: true` for a missing product.
- **All catalogue calls go through the shared axios instance**, so none loses the `X-Market` header.
- **Search terms are rendered through React**, not `dangerouslySetInnerHTML`, so a reflected XSS
  through the query string is not available.

## Notes
- **CWEB-09 was proven by probe rather than inferred from config.** Requesting `/_next/image` with
  an arbitrary external https URL returned 403 — this environment's egress proxy refusing the
  outbound call — whereas a disallowed target returns Next's own 400, which is exactly what the
  http probe produced. The difference between those two responses is the evidence that the host was
  accepted and the fetch attempted.
- The practical exposure is an SSRF primitive plus an open image proxy. It is bounded: https only,
  and only a successfully decoded image is returned to the caller. The fix is a one-line change to
  `remotePatterns` listing the real media hosts.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 07:22 (24-hour format)
**Feature / Module:** F8 — Markets & currency (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/routes/interceptor.ts`, `src/helpers/market.ts`,
  `src/helpers/functionalHelpers.ts` (`getMarketFromContext`), `src/lib/cookies.ts`,
  `src/services/market.ts`, `src/contexts/SettingsContext.tsx`, `src/helpers/currency.ts`,
  `src/helpers/events.ts` (`onLocationChange`)
- Review areas covered: 4.3 authorization · 4.7 configuration · 4.9 tenancy and market scoping ·
  4.13 privacy
- Total files inspected: 8
- **Live testing:** a mock backend that logs request headers was run alongside the dev server to
  observe what the storefront actually sends.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 1 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-10 — The active market is set by a client-writable cookie forwarded verbatim as the
  highest-precedence backend input (Medium)

## Existing Findings Confirmed
- Code review #1 — market switch invalidating only `/settings`. Still accurate for the checkout
  address path; the correction recorded in code review session 13 (the header selector *does*
  globally revalidate) stands and is specified as TC-MKT-005 and TC-MKT-006.
- Code review #35 — market-blind SWR keys. Unchanged and directly relevant: with CWEB-10 the
  market can change without any key changing.
- Code review #49 — cookies surviving logout. The `market` cookie is one of the three that
  persist, which on a shared device silently scopes the next person's session; specified as
  TC-MKT-017.

## Chains Identified
- **CWEB-10 + #35** — the client controls the market and the cache is blind to it, so a market
  value can change while cached catalogue data does not. Each makes the other harder to reason
  about.

## Areas Verified Secure
- **The header plumbing is correct and complete.** Running a mock backend that logs headers, a
  single `/brands/` page load issued exactly two backend calls and **both** carried the market
  header. No request bypassed the shared axios instance, so there is no mixed-market page where
  part of the data is scoped and part is not — which was the specific risk worth testing.
- **No market header is sent when no cookie is present** — the baseline request produced two calls
  with no `X-Market`, so the panel is left to resolve the default rather than receiving an empty
  or malformed value.
- **`getMarketFromContext` strips wrapping quotes and trims** before use, and returns `undefined`
  rather than an empty string when absent.
- **`formatCurrency` never trusts a client price** — it formats only what it is given; all
  monetary values originate from the panel.

## Notes
- **CWEB-10 was proven by observation, not inferred from the config.** A hand-written cookie of
  `market=ZZ-ARBITRARY` — not a real market code — was forwarded unchanged as `X-Market` on every
  backend call from that page. That single test establishes both halves of the finding: the client
  fully controls the value, and nothing on the storefront validates it.
- The row is explicit that the impact is conditional. If the panel rejects unknown codes and checks
  entitlement, the practical effect is a broken page. If it prices from the asserted market without
  checking, it is cross-market arbitrage and a direct financial loss. The storefront cannot tell
  which, and TC-MKT-001 to TC-MKT-003 are written to settle it against the API.
- Severity was held at Medium rather than High for that reason — the exploitability depends
  entirely on a control that is out of this repository's scope. The `P2` priority reflects that the
  question should be answered quickly even though the finding itself is bounded.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 08:44 (24-hour format)
**Feature / Module:** F9 — Content & SEO (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/SEO/DynamicSEO.tsx`, `SEOHead.tsx`, `PageHead.tsx`,
  `src/components/Functional/HTMLRenderer.tsx`, `src/components/StoreProfile.tsx`,
  `src/components/Cards/PromoCard.tsx`, `src/pages/products/[slug]/index.tsx` (schema build),
  `src/pages/stores/[slug]/index.tsx`, `scripts/generate-sitemap.mjs`, `scripts/update-robots.mjs`
- Review areas covered: 4.4 injection sinks · 4.7 platform configuration · 4.8 information
  exposure · 4.13 privacy
- Total files inspected: 10
- **Live testing:** dev server run; `JSON.stringify` escaping behaviour executed directly.

## Findings Summary
- Critical: 0 · High: 1 · Medium: 0 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-11 — Seller-supplied text injected raw into a JSON-LD script block (High, P1)

## Existing Findings Confirmed
- Code review #38 — no sanitisation of API-supplied HTML at seven sites. Distinct from CWEB-11 and
  the distinction matters: #38 is HTML-context injection into rendered descriptions, CWEB-11 is
  **script-context** breakout through a field (a product title) that no one would normally think to
  sanitise as HTML. A panel that strips markup from descriptions may well leave titles alone.
- Code review #3 — no CSP, and #14 — token in `localStorage`. Both named inside CWEB-11 because
  they are what turns a successful breakout into session theft.
- Code review #39 and #40 — sandbox indexing and broken sitemap entries. Both observed this session
  and filed as defects 8 and 9 rather than re-filed here.

## Chains Identified
- **CWEB-11 + #3 + #14** — the strongest chain found in this engagement. A stored injection point
  on the highest-traffic public pages, no CSP to contain execution, and a session token readable
  from JavaScript in two places. Each link is already recorded; CWEB-11 supplies the entry point.

## Areas Verified Secure
- **`SEOHead`'s header and footer script slots are an intended admin feature** — they inject
  `webSettings.headerScript`/`footerScript`, which is the platform's tag-manager equivalent. Judged
  as designed rather than filed as injection, consistent with session 8's assessment.
- **`robots.txt` is regenerated at build** from `NEXT_PUBLIC_SITE_URL`, so the committed dev URL is
  a build artefact. Re-confirmed; the unset-variable case is specified as TC-SEO-016.
- **Private routes remain disallowed** — `my-account`, `cart`, `api`, `shopping-list`,
  `forgot-password` are all present in `robots.txt`.
- **Search terms and other query values render through React**, so no reflected injection path
  exists in the SEO layer.

## Notes
- **CWEB-11 is the highest-severity finding of the engagement so far and was established in two
  steps.** First the mechanism: executing `JSON.stringify` on a value containing a closing script
  sequence shows it is emitted verbatim — `stringify` escapes quotes and backslashes but not `<`
  or `/`. Then the reachability: the product page builds its schema from `generateProductSchema`
  plus a breadcrumb carrying `product.title` and `product.category_name`, and the store page passes
  `store.name` — all seller-authored in a multi-seller marketplace.
- The row states its boundary: what is verified is that the injection is raw and that seller fields
  feed it; what is not verifiable here is whether the panel constrains characters in a title. That
  is TC-SEO-004.
- The fix is a single-point change — escape `<`, `>` and `&` at the one emission site in
  `DynamicSEO` — which covers every page type at once. That is why the row recommends fixing it
  there rather than per page.

---

# Security Review Session

**Date:** 2026-08-05
**Time:** 10:02 (24-hour format)
**Feature / Module:** F10 — Cross-cutting (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `next.config.ts` (headers, PWA, build mode), `src/pages/_document.tsx`,
  `src/pages/_app.tsx`, `eslint.config.mjs`, `src/helpers/auth.ts` (logout cleanup)
- Review areas covered: 4.7 headers and platform configuration · 4.8 secrets exposure ·
  4.12 PWA and local persistence · 4.13 privacy
- Total files inspected: 5
- **Live testing:** response headers read directly from a running server.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 0 · Low: 0 · Total Findings: 0

## Files Modified
- QA/security_append.csv (emptied — no new findings this pass)

## New Findings Added
- None.

## Existing Findings Confirmed
- Code review #3 — **no Content-Security-Policy, now confirmed by request.** Reading the response
  headers from a running server returns HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Resource-Policy` — and a CSP header
  count of **zero**. This matters beyond its own row: CSP is the containment named in CWEB-11's
  chain, so its absence is now measured rather than read from config.
- Code review #48 — service-worker cache never purged. Unchanged; specified as TC-XC-020 and 021.
- Code review #45 and #46 — unlabelled icon controls and no error boundary. Both are reliability
  and accessibility rather than security; specified as TC-XC-012 to TC-XC-016.

## Chains Identified
- No new chains. The confirmation that no CSP is served strengthens the existing **CWEB-11 + #3 +
  #14** chain recorded under F9, which remains the most serious in the register.

## Areas Verified Secure
- **All six configured security headers are actually served**, which was worth testing rather than
  assuming — a `headers()` block can be silently inert. HSTS carries `includeSubDomains; preload`,
  frame options are `SAMEORIGIN`, and `Permissions-Policy` denies camera and microphone while
  allowing geolocation to self only.
- **`X-Powered-By` is absent**, so `poweredByHeader: false` is taking effect.
- **`Referrer-Policy: strict-origin-when-cross-origin`** limits what leaks to third parties, which
  partially mitigates the referrer exposure noted in CWEB-07's off-site navigation.

## Notes
- **Zero new findings is the correct result for this pass.** The cross-cutting security surface —
  headers, CSP, service-worker caching, logout purging — was already covered by code review issues
  3, 41, 48 and 49 and by CWEB-03, CWEB-05 and CWEB-10 in earlier features. Re-filing any of them
  here would duplicate the register rather than add to it.
- The one genuinely new piece of information is a **negative** one: the configured headers are
  served correctly. That removes a whole class of "configured but inert" doubt, and it is recorded
  as verified-safe with the specific values.
- **TC-XC-019 records the one header question that remains open**: `headers()` is inert under the
  static-export build mode, so if any deployment target uses export, none of the six headers
  applies and the host must supply them. That could not be tested here because the dev server runs
  in SSR mode.

---
