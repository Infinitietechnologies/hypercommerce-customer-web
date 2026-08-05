# SECURITY_INSTRUCTIONS.md — HyperCommerce Customer Web

> **Read this file in full at the start of EVERY security review session.**
> Companion records live in `QA/` — see §2. Sibling processes: `CODE_REVIEW_INSTRUCTIONS.md`,
> `DEFECTS_INSTRUCTIONS.md`, `TEST_CASES_INSTRUCTIONS.md`.

This repo is the **Next.js customer storefront**. It holds a Sanctum bearer token, renders
seller- and admin-supplied content, and drives four payment gateways — so its security surface is
client-side: token handling, injection sinks, authorization *as enforced by the client*, and what
is exposed to the browser.

**Scope boundary that matters here:** the panel enforces real authorization. The storefront cannot
grant privilege it does not have. So a storefront security finding is one of:
- something that **leaks** a credential or personal data (storage, logs, URLs, third parties),
- something that **injects** attacker-controlled content into the page (XSS sinks, redirects),
- something that **weakens a control the panel relies on** (unsent CSRF/market headers, tokens in
  query strings), or
- a **missing defence in depth** (no CSP, no sanitisation) that turns a panel mistake into an
  exploit.

If the vulnerability's root cause is in the panel, record it here only when it is reachable and
observable from the storefront, and say plainly in *Remediation* that the fix belongs to the
panel. **Never change an API contract unilaterally.**

---

## 1. Non-negotiable rules

1. Read this file before starting.
2. **Verify every finding.** Read the code, or demonstrate the behaviour. Never file a
   vulnerability inferred from a filename, a dependency name, or a pattern that "usually" means
   something.
3. **State what is verified and what is assumed, inside the row.** Client-side review frequently
   cannot prove exploitability because the server half is not in this repository. Say so in the
   row rather than implying a working exploit.
4. **No exploitation against systems you are not authorised to test.** Proof-of-concept steps are
   written to be run against a local or explicitly authorised environment only.
5. **Never record a real credential, token, OTP, session value, or customer PII in these files.**
   Redact to a shape (`Bearer <token>`), never a value.
6. Provide `file:line` in `Evidence`, and a concrete `Remediation`.
7. Deduplicate against `QA/security.csv` **and** `QA/code_review.csv` — several security findings
   already live in the code review register (see §3).
8. Assign `OWASP Top 10 (2021)`, `CWE`, `Attack Vector`, `Severity`, `Priority` on every row.
9. If nothing is found, say so explicitly and list what was examined. **Do not pad the register.**
10. Report chains. Two findings that are individually Medium can be Critical together; say which
    rows combine and record the chain in both.
11. **Never write a comma inside a CSV field — a comma separates columns, nothing else.** These
    files are appended directly into Google Sheets, so one stray comma in a title, description,
    PoC, or remediation shifts every following column and corrupts the row. Use `;` or ` - `
    instead, and do not rely on quoting to escape it. Full rules and the 20-comma row check: §5.

---

## 2. The QA record files

| File | Role | Write mode |
|---|---|---|
| `QA/security.csv` | **Master vulnerability register.** | **Append only.** Only `Status` / `Dev. Notes` / `Tester Status` / `Tetster Notes` may change on an existing row. |
| `QA/security_append.csv` | **Latest session only**, for Sheets import. | **Overwrite** each session. **No header row.** |
| `QA/security_history.md` | **Permanent chronological audit trail.** | **Append only.** |

**21 columns**, in this order — `QA/security.csv` carries this as line 1, permanently:

```
Date,ID,Module/Feature,Vulnerability Title,Description,OWASP Top 10 (2021),CWE,Attack Vector,Severity,Priority,Preconditions,Steps to Reproduce / PoC,Expected (Secure) Behavior,Actual Behavior,Impact,Remediation,Evidence (file:line),Status,Dev. Notes,Tester Status,Tetster Notes
```

`QA/security_append.csv` has **no header**.

> `Tetster Notes` is a typo carried deliberately from the panel repo's `QA/security.csv` so both
> repositories share an identical header. Fix it in both or neither.

---

## 3. Findings already recorded in the code review register

These are storefront security issues that predate this register. **Do not re-file them.** Reference
them, and file a new row only for a genuinely distinct vector.

| Code review # | Summary |
|---|---|
| 3 | Bearer token and full user record in JS-readable cookies; **no CSP** |
| 13 | **Passwords sent in the URL query string** on `/login`, `/register`, `/verify-user`, `/forget-password` |
| 14 | Token and user record persisted to `localStorage` by redux-persist |
| 38 | API-supplied HTML rendered with **no sanitisation** at 7 sites |
| 41 | 14 `localStorage` keys written, 2 cleared at logout |
| 48 | Service-worker cache never purged; no `no-store` on private routes |
| 49 | 5 cookies written, 2 cleared at logout — incl. precise location for a year |
| 2 | `withAuth` inert on checkout and payment (no server-side guard) |

The chain worth re-testing first: **38 (injection) + 3 (no CSP, readable token) + 14 (token in
localStorage)** — one successful injection yields session theft rather than defacement.

---

## 4. Review areas — every one, every session

Work every area. An area with nothing to report is still reported as examined. Sub-items are
written from what has already been found in this codebase, so they point at the live surface.

### 4.1 Credential storage & lifecycle
Where the bearer token is written (cookie flags `httpOnly`/`secure`/`sameSite`, `localStorage`,
`redux-persist`, IndexedDB, `CacheStorage`) · whether the full user record accompanies it · token
in a URL, a `Referer`, a log line, an analytics payload, an error report, or a third-party SDK
call · token lifetime and whether anything expires it client-side · **what survives logout in
every store** — enumerate what is written versus what is cleared, per medium · behaviour on a
shared device after sign-out · multi-tab and multi-account switching.

### 4.2 Authentication flows
OTP send/verify rate limiting as exercisable from the client · whether an OTP or reset token is
ever logged, put in a URL, or left in state after use · the password-reset chain end to end
(identifier → OTP → reset token → password) for a step that can be skipped or replayed · whether
a password change invalidates existing sessions · account-enumeration signal differences between
"user exists" and "user not found" on login, register, and the availability checks · social login
token handling (Firebase `idToken` provenance and where it is sent).

### 4.3 Authorization as the client enforces it
Every protected route present in `PROTECTED_ROUTES` **and** guarded in `getServerSideProps` — the
client HOC alone is not protection · a route whose guard is inert because the pathname never
matches · IDOR-shaped behaviour: an order, address, wallet transaction, or wishlist id taken from
the URL and rendered without the server scoping it · any client-side role/permission check that
gates UI over data the API would still return · guard behaviour under the static-export build mode
where `getServerSideProps` does not run.

### 4.4 Injection sinks
Every `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `eval`,
`new Function`, and dynamic `<script>` · for each sink, establish **data provenance**: admin
(trusted-ish), **seller** (semi-trusted — this is a multi-seller marketplace), or customer
(untrusted) · whether any sanitisation exists at all · markdown/HTML rendered in product
descriptions, store descriptions, promos, CMS pages, reviews and notifications · SVG upload and
rendering paths · `next/script` bodies composed from settings.

### 4.5 Redirects, deep links & window handling
`?next=` and any `returnUrl`-style parameter — absolute URLs, protocol-relative `//evil.tld`,
`javascript:` and `data:` schemes · gateway return and callback URLs · the share and deep-link
landing routes · `window.open` and `target="_blank"` without `rel="noopener noreferrer"`
(reverse tabnabbing) · `postMessage` senders and receivers with no origin check · anything reading
`document.referrer` or `window.name`.

### 4.6 Payments
Amount and currency provenance — must be server-authoritative, never computed or adjusted
client-side · what is passed into each gateway SDK · whether a client-side gateway callback is
treated as proof of payment without server confirmation · idempotency of order placement and
whether a retry can create a duplicate order or charge · a cancelled or failed session that can be
resurrected to paid · order id / slug guessability on the payment route.

### 4.7 Headers & platform configuration
**CSP** (present at all, and whether it is meaningful) · HSTS · `X-Frame-Options` /
`frame-ancestors` · `X-Content-Type-Options` · `Referrer-Policy` · `Permissions-Policy` ·
`Cross-Origin-*` policies · `images.remotePatterns` breadth and `dangerouslyAllowSVG` ·
`poweredByHeader` · whether any of these survive the **static-export build mode**, where
`headers()` is inert · `Cache-Control` on authenticated routes.

### 4.8 Secrets & information exposure
Everything under `NEXT_PUBLIC_*` is inlined into the browser bundle — audit each one · Firebase,
gateway, and map keys and whether their provenance is settings-driven or build-time · source maps
in production · hard-coded credentials, internal hostnames, or debug endpoints · verbose error
text, stack traces, or raw SDK messages reaching the UI · debug logging left on hot paths · what
`compiler.removeConsole` does and does not strip (`error` and `warn` survive).

### 4.9 Tenancy & market scoping
Any request that bypasses the shared axios instance and therefore loses the `X-Market` header ·
cached data that can be served across a market switch · any path that could render another
market's catalogue or pricing · anything keyed only by product/order id without a market or user
dimension · cross-user data in a shared cache.

### 4.10 Client-side abuse surface
Unlimited OTP sends, password attempts, or availability probes driven from the UI · an
authenticated endpoint usable as a mail relay to an attacker-chosen address · unbounded file
upload (size, type, count) on reviews, returns and cart attachments · anything that lets a client
enumerate ids or users through timing or response differences.

### 4.11 Dependencies & supply chain
`npm audit` — and for each flagged package, whether it actually ships in the **browser bundle** ·
unpinned, abandoned, or single-maintainer packages in the runtime dependency tree · any script
loaded from a third-party origin at runtime (fonts, icons, analytics, gateway SDKs) and what it
could do if compromised · integrity attributes where applicable · `postinstall` scripts.

### 4.12 PWA, offline & local persistence
What the service worker caches, and whether authenticated or market-scoped responses reach a
shared on-disk cache · whether the cache is purged on logout · what an installed PWA retains
between accounts on a shared device · offline fallbacks serving stale prices, stock, or personal
data · service-worker update and invalidation on a new deploy.

### 4.13 Privacy
Precise location, contact details, and order history in client-side stores and their retention ·
PII in analytics, ad-tracking, or error-reporting payloads · PII in URLs (which reach server logs
and `Referer`) · cookie consent behaviour and whether it actually gates anything · data left
behind for the next user of a shared device.

---

## 5. Fields, severity and formatting

**`ID`** — a stable module-prefixed identifier as the panel register uses (e.g. `CWEB-01`,
`CWEB-02`). Never reused, never renumbered.

**`OWASP Top 10 (2021)`** — e.g. `A01 Broken Access Control`, `A02 Cryptographic Failures`,
`A03 Injection`, `A05 Security Misconfiguration`, `A07 Identification and Authentication Failures`.

**`CWE`** — e.g. `CWE-79 Cross-site Scripting`, `CWE-598 Use of GET Request Method With Sensitive
Query Strings`, `CWE-922 Insecure Storage of Sensitive Information`.

**`Attack Vector`** — who must be in what position: `Any unauthenticated visitor`, `Any holder of a
customer token`, `A seller able to store product content`, `Local access to a shared device`.

| Severity | Meaning |
|---|---|
| **Critical** | Account takeover, credential disclosure, payment manipulation, or another customer's data readable — with no unusual precondition. |
| **High** | The same outcomes behind a realistic precondition, or a stored injection point on a customer-facing page. |
| **Medium** | Information disclosure of limited value, a missing defence in depth, or an issue needing local access. |
| **Low** | Hardening gaps with no direct path to impact. |

**`Priority`** — `P1` fix now / `P2` this cycle / `P3` scheduled / `P4` backlog.

**`Status`** — **leave empty when writing a row.** This column belongs to the team working the
register, not to the reviewer filing the finding. Do not pre-fill it with `Open` or anything else —
a row existing in `security.csv` already means the finding is outstanding. The team fills it in the
sheet as work progresses (`In Progress`, `Fixed`, `Verified`, `Won't Fix`, `Accepted Risk`,
`Duplicate`, `Not Exploitable`), and §2 permits updating it on an existing row.

The same applies to the last three columns — **`Dev. Notes`, `Tester Status` and `Tetster Notes`
are always left empty on a new row.** So every row you write ends with four empty fields, i.e.
four trailing commas.

### CSV formatting rules

> ### ⚠ THE ONE RULE THAT BREAKS THE SHEET
>
> **NEVER write a comma inside a field value. A comma means "next column" and nothing else.**
>
> These CSVs are appended straight into Google Sheets. A comma inside a Vulnerability Title, a
> Description, a PoC, an Impact, or a Remediation is read as a column break — it pushes the rest
> of that row one column to the right and corrupts every column after it. The row silently
> misaligns and the register becomes unreadable. Security rows are the longest in any register,
> so this is the easiest one to get wrong.
>
> - Use `;` for a list, ` - ` for an aside, and `.` to end a clause. Rewrite the sentence rather
>   than reaching for a comma.
> - **Do not solve this with quoting.** Quoted fields are not an accepted workaround here.
> - Watch the fields that invite commas: CWE and OWASP labels, attack-vector prose, and multi-step
>   PoCs. Write `CWE-204 Observable Response Discrepancy`, never `CWE-204, Observable …`.
> - No newlines, no tabs, no unescaped `"` either — each breaks the row the same way.
> - **Every row must contain exactly 20 commas (21 columns). Verify before committing.**
>
> ```
> BAD:  Token readable from JavaScript, no CSP, and stored in localStorage
> GOOD: Token readable from JavaScript - no CSP; also stored in localStorage
> ```

- One row per finding on one physical line.
- **`Date` once per day** — first row of the day only, empty on the rest; the column still exists
  on every row. Judged per file. Format `YYYY-MM-DD`, always the real current date.
- **Never write an actual secret into a row.** Redact to a shape (`Bearer <token>`).

---

## 6. Session workflow

**Before:** read this file → `QA/security.csv` (last ID) → `QA/security_history.md` →
`QA/code_review.csv` §3 table → `CLAUDE.md`. Fix the scope.

**During:** work every area in §4 · verify each finding · assign OWASP/CWE/vector/severity ·
dedupe · record chains.

**After:** append to `QA/security.csv` → overwrite `QA/security_append.csv` (no header, this
session only) → append to `QA/security_history.md` → produce the report (§8) → **commit and push
to `dev`**:

```bash
git add QA/security.csv QA/security_append.csv QA/security_history.md
git commit -m "docs(qa): security review <area> - <n> findings (<c> critical, <h> high)"
git push -u origin dev
```

Only the record files, never source. Rebase rather than force-push. Commit even when nothing is
found.

---

## 7. History entry template

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

## 8. Session report (in the response)

1. **What was reviewed** — areas, files, scans run.
2. **What was verified secure** — and *why* it holds, not just that it does.
3. **What was found** — ranked Critical → High → Medium → Low, each with OWASP/CWE and evidence.
4. **Chains** — findings that combine into something worse.
5. **What could not be verified here** — explicitly, with what the panel team must confirm.

If nothing was found: state that every area in §4 was examined and no verified vulnerability was
identified. That is a complete and acceptable result.
