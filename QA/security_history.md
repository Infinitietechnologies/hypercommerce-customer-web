

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
