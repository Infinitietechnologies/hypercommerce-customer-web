

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
