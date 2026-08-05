

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
