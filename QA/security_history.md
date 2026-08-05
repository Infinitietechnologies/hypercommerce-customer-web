

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
