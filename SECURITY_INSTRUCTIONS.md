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

1. **Credential handling** — where the token lives, how it is read, whether it reaches a URL, a
   log, an analytics payload, a third-party SDK, or a `Referer` header; expiry and revocation
   behaviour; what survives logout across cookies, `localStorage`, `sessionStorage`, IndexedDB and
   `CacheStorage`.
2. **Injection sinks** — `dangerouslySetInnerHTML`, `innerHTML`, dynamic `<script>`, `eval`,
   template injection into `next/script`; every sink's data provenance (admin vs **seller** vs
   customer) since this is a multi-seller marketplace.
3. **Redirects and deep links** — `?next=`, `?returnUrl=`, share links, gateway callbacks;
   `javascript:` and absolute-URL handling; open-redirect and reverse-tabnabbing.
4. **Client-side authorization** — every protected route present in `PROTECTED_ROUTES` **and**
   guarded in `getServerSideProps`; IDOR-shaped behaviour where an id from the URL is rendered
   without server scoping.
5. **Payment flows** — amount and currency provenance (must be server-authoritative), gateway
   callback trust, idempotency, and what is handed to gateway SDKs.
6. **Headers and platform config** — CSP, HSTS, frame options, `nosniff`, `Referrer-Policy`,
   `Permissions-Policy`, `images.remotePatterns` breadth, `dangerouslyAllowSVG`, and whether they
   survive the static-export build mode.
7. **Secrets exposure** — anything under `NEXT_PUBLIC_*` is in the browser bundle; source maps;
   hard-coded keys; verbose error text reaching the UI.
8. **Market and tenancy scoping** — losing the `X-Market` header, or any path that could render
   another market's or another customer's data.
9. **Dependency and supply chain** — `npm audit`; note which flagged packages actually ship in the
   browser bundle; unpinned or abandoned packages; the `@iconify`/font/CDN fetches.
10. **Rate limiting and abuse** — client behaviour that enables unlimited OTP sends, password
    attempts, or mail relay through an authenticated endpoint.
11. **PWA and offline** — what the service worker persists, and whether authenticated responses
    are written to a shared on-disk cache.

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

**`Status`** — `Open`, then `In Progress`, `Fixed`, `Verified`, `Won't Fix`, `Accepted Risk`,
`Duplicate`, `Not Exploitable`.

### CSV formatting rules
- **NEVER put a comma inside a field value** — a comma means "next column" and nothing else. Use
  `;` or ` - ` instead. **Do not use quoting to work around it.**
- No newlines, tabs, or unescaped `"` inside a field. One row per finding on one physical line.
- Every row must contain **exactly 20 commas** (21 columns). Check before committing.
- **`Date` once per day** — first row of the day only, empty on the rest; the column still exists
  on every row. Judged per file. Format `YYYY-MM-DD`, always the real current date.
- **Never write an actual secret into a row.** Redact to a shape.

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
