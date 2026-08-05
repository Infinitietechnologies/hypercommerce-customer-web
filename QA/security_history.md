

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
