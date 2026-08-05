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
