

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
