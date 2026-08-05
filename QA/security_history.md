

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
