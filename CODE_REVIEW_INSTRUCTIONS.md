# CODE_REVIEW_INSTRUCTIONS.md — HyperCommerce Customer Web

> **Read this file in full at the start of EVERY code review session, before reading any source file.**
> It is the authoritative process document for code review in this repository.
> Companion records live in `QA/` — see §2.

This repo is the **Next.js customer storefront** (Pages Router, React 19, TypeScript strict,
HeroUI, Redux Toolkit, SWR, axios). It consumes the Laravel panel API, which lives in a
separate repository (`hypercommerce-panel`) and has its own QA folder and review history.
**Findings recorded here are storefront findings.** If a defect's root cause is in the panel
API, still record it here (the storefront is where it surfaces), state clearly in
*Suggested Fix* that the fix belongs to the panel, and never propose changing an API response
shape unilaterally — other production clients consume it.

---

## 1. Non-negotiable rules

1. **Read `CODE_REVIEW_INSTRUCTIONS.md` before beginning any review.**
2. **Follow every rule in this document.**
3. **Never skip any review category** (§4). Every category is checked every session, even if
   the outcome is "checked, nothing found".
4. **Verify every finding from actual source code.** Read the file. Never report a defect
   inferred from a filename, a memory of the framework, a grep hit alone, or another
   agent's summary.
5. **Provide exact file paths and line numbers** — `src/services/cart.ts:88` form.
   A finding with no `file:line` is not a finding.
6. **Deduplicate** against `QA/code_review.csv` before adding anything.
7. **Assign Severity and Priority** to every finding (§6).
8. **Generate the review report** (§8) in the session response.
9. **Append every newly confirmed issue** to `QA/code_review.csv`.
10. **Overwrite `QA/code_review_append.csv`** so it holds only the current session's issues.
11. **Never modify or remove previous records** in the master CSV.
12. **If no issues are found, say so explicitly** — list the review categories checked and
    state that no verified issues were identified. Do not pad a review with speculative or
    cosmetic findings to look productive.
13. **Never report an unverified finding.** A plausible-but-unconfirmed suspicion either gets
    verified or gets left out. Uncertainty goes in *Notes*, not in the defect register.
14. **State what was reviewed and found safe** (§8) — a review is a coverage claim, not just
    a defect list.
15. **Quantify systemic issues.** "17 of 34 pages lack an error state — list attached" beats
    "error states are inconsistent".
16. **Rank findings** Critical → High → Medium → Low in the report.
17. **Check conformance to standard Next.js practice, and treat a missing standard as a
    finding.** A review covers not just whether the existing code is wrong, but whether the
    conventions a production Next.js site is expected to have are actually in place — error
    boundaries, custom error pages, per-locale `lang`/`dir`, CSP, `next/link` / `next/image` /
    `next/font` / `next/script` / `next/dynamic` used instead of hand-rolled equivalents,
    correct data-fetching and hydration patterns. If the codebase hand-rolls something the
    framework already provides, or simply omits a baseline practice, report it — cite the
    convention being bypassed and the concrete cost. The grounded checklist is §4.12.11;
    the same rule applies to any standard not yet listed there.

---

## 2. The QA record files

| File | Role | Write mode |
|---|---|---|
| `QA/code_review.csv` | **Master defect register.** Every code review issue ever found, permanently. | **Append only.** Never edit or delete an existing row except to update its Status / Dev. Notes / Tester columns. |
| `QA/code_review_append.csv` | **Latest session only** — for direct import into Google Sheets. | **Overwrite** each session (header + this session's rows). |
| `QA/code_review_testing_history.md` | **Permanent chronological audit trail** of every session. | **Append only.** Never rewrite or delete a past entry. |

Both CSVs use this header, **exactly**, as line 1:

```
Date,NO,Module/Feature,Documentation File,Bug Title,Bug Description,Bug Type,Severity,Priority,Preconditions,Steps to Reproduce,Expected Result,Actual Result,Impact,Suggested Fix,Status,Dev. Notes,Tester Status,Tester Notes
```

---

## 3. Session workflow (mandatory, in order)

### 3.1 Before the review

1. Read this file.
2. Read `QA/code_review.csv` — know what has already been reported so you do not duplicate it,
   and find the **last issue number**.
3. Read `QA/code_review_testing_history.md` — know what previous sessions covered, what they
   verified safe, and what they flagged as not-yet-reviewed.
4. Read `CLAUDE.md` (root) and the nearest subfolder `CLAUDE.md` for the area under review.
   A violation of a documented project rule is a legitimate finding (Bug Type `Code Smell`).
5. Fix the scope: which module/feature, which files and directories. Write it down — it becomes
   the *Scope* section of the history entry.

### 3.2 During the review

6. Work through **every** category in §4. Do not stop early because the count looks high.
7. **Assign issue numbers sequentially** from the last `NO` in `code_review.csv`. Never reuse,
   never renumber, never reorder existing IDs.
8. If a defect you find is **already in the master CSV**, do not create a duplicate row — record
   it under *Existing Issues Confirmed* in the history entry, referencing its issue number.
9. For each new finding, confirm all four before writing a row:
   - the exact `file:line` is read and correct,
   - a **reproducible failure scenario** exists (concrete inputs/state → wrong result),
   - the **impact** is real for a customer or the business,
   - a **concrete fix** can be named.
10. Track what you verified as **safe** as you go — you must report it (§8).

### 3.3 After the review

11. Append every new confirmed issue to `QA/code_review.csv`.
12. Replace the contents of `QA/code_review_append.csv` with the header + only this session's issues.
13. Append a new entry to `QA/code_review_testing_history.md` using the template in §7 — with the
    real current date and time, scope, categories completed, issue counts, safe areas, and notes.
14. Never delete or alter previous history entries.
15. Produce the review report (§8) in the response.
16. **Do not fix the code in a review session** unless the user asked for fixes. Review and repair
    are separate commits and separate asks.

---

## 4. Review categories — every one, every time

Adapted to this stack. A category with no findings is still reported as checked.

### 4.1 Performance & optimization
Unnecessary or duplicate API requests (the same endpoint fetched by both `getServerSideProps`
and a client hook on first paint); waterfalled `await`s that could be `Promise.all`; requests
fired inside a render or an unkeyed `useEffect`; missing/incorrect SWR `dedupingInterval` and
`revalidateOnFocus` against the volatility table in `CLAUDE.md` §7.3; over-fetching (a list
endpoint called for a single record); unbounded lists with no pagination or `useInfiniteData`;
O(n²) work over product/order collections; `find`/`includes` inside a loop that should be a
`Map`/`Set`; sorting or filtering a large array on every render without `useMemo`; unnecessary
re-renders (unmemoized props/callbacks into memoized children, whole-list recompute on one
item's change, context value rebuilt every render); bundle size (heavy libs — `leaflet`,
`swiper`, lightbox, Stripe, firebase — imported eagerly into shared chunks instead of
`dynamic(..., { ssr: false })`); dead imports, unused exports, dead files; memory leaks
(uncleared `setInterval`/`setTimeout`, unremoved listeners/observers, un-aborted fetches, missing
`useEffect` cleanup); images not using `next/image` or missing `sizes`/`priority` where it matters.

### 4.2 Correctness & business logic
Money and rounding (float arithmetic on prices/totals, inconsistent rounding, cart total
recomputed client-side and disagreeing with the server); discount/coupon/tax display math;
quantity and stock rules (min/max/step, out-of-stock still addable); variant selection and price
resolution; cart merge on login (offline cart → server cart: duplicates, lost items, quantity
overwrite instead of merge); order state and status mapping; date/relative-time formatting;
pagination arithmetic (page vs offset, last-page off-by-one, duplicate items across pages);
edge, boundary, and off-by-one conditions; `0`/`""`/`false` treated as absent by a `||` fallback
where `??` was meant.

### 4.3 State, data flow & races
Double-submit (add-to-cart, place-order, apply-coupon) not disabled while in flight;
optimistic updates (cart quantity, wishlist toggle) not rolled back on failure; stale-closure
bugs in `useEffect`/callbacks; out-of-order async responses overwriting newer state (search,
filters) with no request-sequence or abort guard; Redux slice ownership violations against
`CLAUDE.md` §7.1 (server data cached in Redux, cart state duplicated); `redux-persist` allowlist
drift; state derived into Redux that should be derived at render; URL query params and Redux
filter state disagreeing about which is the source of truth.

### 4.4 Market scoping (storefront-critical)
Every catalog read must go through the shared axios instance so the `X-Market` header is sent —
a direct `fetch`/`axios.create` silently returns default-market data. Check: market change
invalidates **all** catalog SWR caches (products, categories, brands, stores, home layout,
search); no hard-coded currency symbol or format (must come from `SettingsContext`); no
market/store conflation; SSR fetches carry the market from the request, not from a client default.

### 4.5 Error handling & null-safety
Swallowed or empty `catch`; `catch` that logs and continues into code assuming success;
`success: false` responses rendered as an empty/loaded state instead of an error state; missing
fallbacks (`fallbackApiRes`/`fallbackPaginateRes`) on SSR-critical calls so a failed fetch crashes
a page; array/object fields read without a shape guard (`data.items.map` when `items` can be
absent); non-null assertions (`!`) and unchecked `[0]`/destructuring on possibly-empty results;
`any`, `@ts-ignore`, or a cast used to silence a real shape mismatch; missing timeout on
outbound requests; unhandled promise rejections.

### 4.6 Frontend states (all four, every screen)
Per `CLAUDE.md` §6.3, a screen is incomplete without **Loading / Empty / Error / Loaded**.
Check: skeleton mirrors the final layout (not a bare spinner for a full page); empty state has
illustration + headline + body + primary action; error state has a human message **and a retry**;
a failed request never renders as an empty result; async triggers disable and show inline
loading; success **and** failure both surface a toast; destructive actions confirm via `ui/Sheet`.

### 4.7 Security
XSS via `dangerouslySetInnerHTML` on API/user content (CMS pages, product descriptions, reviews)
with no sanitization; unvalidated `href`/redirect targets (`javascript:` URLs, open redirect from
a `?returnUrl=`); tokens, OTPs, passwords, or PII in logs, error messages, analytics payloads, or
URL query strings; auth token storage and cookie flags (`httpOnly`/`secure`/`sameSite`) and any
token written outside the documented cookie path; `localStorage` written directly (redux-persist
owns it); protected routes missing from `PROTECTED_ROUTES` **or** missing
`serverSideAuthGuard(context)` in `getServerSideProps` — the client-side `withAuth` HOC alone is
not protection; IDOR-shaped client behaviour (an order/address/wallet id taken from the URL and
rendered without the server scoping it to the user); secrets or private keys in
`NEXT_PUBLIC_*` env vars; payment flows (amount/currency taken from client state rather than the
server-confirmed order, redirect/callback params trusted without server verification); CSP,
`next.config.ts` headers, and `images.remotePatterns` breadth; dependency CVEs (`npm audit`) —
note which flagged packages actually ship in the browser bundle.

### 4.8 Code smells & project-rule violations
Duplicate business logic copy-pasted across views/components/services that should be one shared
helper or hook — **name every location**; dead code and unreachable branches; unnecessary
complexity; wrong altitude (page-level logic inside a leaf component, or a component reaching
past its props); violations of `CLAUDE.md`: `@heroui/react` imported outside `src/components/ui/`
in a new or edited file, `axios` imported outside `src/services/client.ts`, hard-coded hex colours
outside `src/theme/`, inline `style={{}}`, arbitrary Tailwind values where a token exists,
callers added to the `src/routes/api.ts` barrel, retired palette values (`#eba513`, `#FFB616`,
Figtree as `sans`) or HeroUI default blue `#3b82f6` reintroduced, `"use client"` added, App Router
files, a second component library, an undocumented new dependency.

### 4.9 i18n / RTL
Hard-coded user-facing English instead of `t('namespace.key')`; keys added to `en` but missing
from `hi` and `ar`; interpolation and pluralization misuse; concatenated sentence fragments that
cannot translate; physical direction classes (`ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`/`text-left`)
where logical properties (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`) are required;
icons/chevrons/carousels that do not mirror in RTL; number, currency, and date formatting that
ignores locale.

### 4.10 Timezone & dates
Server-provided UTC timestamps rendered with a local-time constructor or vice versa;
`new Date(string)` on a non-ISO format; date-only values shifted by timezone conversion;
countdowns/expiry (offers, OTP validity, delivery slots) computed against the wrong clock;
SSR-vs-client date rendering producing a hydration mismatch.

### 4.11 Accessibility (WCAG 2.1 AA)
`<div onClick>` where a `<button>` belongs; icon-only controls without `aria-label`; images
without `alt` (or decorative images missing `alt=""`); form fields without an associated
`<label>`, errors not linked via `aria-describedby` or not announced; heading order; keyboard
reachability and operability of every interactive element; modal/sheet focus trap, focus restore
on close, and `Esc` to close; `outline-none` with no visible replacement focus ring; colour
contrast against the theme tokens; `prefers-reduced-motion` respected by framer-motion;
any `eslint-plugin-jsx-a11y` rule disabled inline.

### 4.12 Next.js correctness

This is a **Next.js 16 Pages Router** app. Every sub-section below is checked on any page,
view, or config touched by the review. Values quoted here are the ones actually in
`next.config.ts` — re-read that file if a review touches build behaviour, because several
checks depend on it.

#### 4.12.1 Build mode — the dual-mode trap (check first)
`next.config.ts` sets `output: isExport ? "export" : undefined`, where
`isExport = process.env.NEXT_PUBLIC_SSR !== "true"`. **The app builds as a static export
unless `NEXT_PUBLIC_SSR` is exactly the string `"true"`.** Meanwhile 33 pages export
`getServerSideProps`, which a static export cannot run. So:
- Any change that adds or removes `getServerSideProps` must be assessed **in both modes**.
- Treat a missing, misspelled, or non-`"true"` `NEXT_PUBLIC_SSR` in any deploy target as a
  release-blocking finding — the build silently switches contract (SSR pages, `notFound`,
  `redirect`, auth guards, market detection from request headers, and `images` optimization
  all change behaviour or stop working).
- `output: "export"` also forces `images.unoptimized: true` and makes `headers()` inert
  (a static host serves no Next.js headers) — so the security headers below only apply in
  SSR mode. Do not assert a header is enforced without confirming the deploy mode.
- Never add an API route or middleware without flagging it: neither exists today, and
  neither survives a static export.

#### 4.12.2 Data fetching (`getServerSideProps`)
Non-serializable props (`undefined`, `Date`, `Map`, class instances, functions) — return
`null` and ISO strings; missing `notFound: true` / `redirect` for absent or moved records
(a deleted product must 404, not render an empty shell); `serverSideAuthGuard(context)`
missing on a protected page, or the path missing from `PROTECTED_ROUTES` — **both are
required**, and the client `withAuth` HOC is not a substitute; the incoming request's
cookies/headers (auth token, market, locale) not forwarded to the API call, so SSR renders
default-market or logged-out content that then flips on hydration; fetching this app's own
origin from `getServerSideProps` instead of calling the service layer; unbounded work in
`getServerSideProps` (N sequential awaits that should be `Promise.all`); no fallback
(`fallbackApiRes` / `fallbackPaginateRes`) so an API failure throws a 500 instead of
rendering an error state; `getStaticProps`/`getStaticPaths` used for personalized,
auth-dependent, or market-scoped data (this repo currently has zero — adding one needs
justification and a revalidation story).

#### 4.12.3 Routing & navigation
`<a href>` for internal navigation instead of `next/link` (full page reload, loses client
state); `router.push` where a `Link` belongs (breaks middle-click/open-in-new-tab and
keyboard affordances); **`trailingSlash: true` is set** — internal links, canonical URLs,
sitemap entries, and redirect targets must agree with it or every hit costs a redirect hop;
`router.query` read on first render without guarding `router.isReady` (undefined params on
the initial client render of a dynamic route); dynamic-segment values used without decoding
or validation; navigation state (filters, pagination, search) kept only in component state
when the URL should own it — per `CLAUDE.md` §7.1 the URL is the source of truth for
shareable filter state; `shallow` routing used where data actually must refetch.

#### 4.12.4 Images & static assets
Raw `<img>` where `next/image` belongs (3 raw `<img>` remain against 6 `next/image` files —
new code should not add to that); missing `sizes` on a `fill` image (ships the largest
candidate to every viewport); missing `priority` on the LCP image (hero/banner/PDP gallery)
or `priority` sprayed onto below-the-fold images; missing `width`/`height` causing layout
shift; **`dangerouslyAllowSVG: true` combined with `remotePatterns: [{ hostname: "**" }]`** —
the optimizer will fetch and serve an SVG from *any* https host, so treat any new
user-controlled or seller-controlled image URL flowing into `next/image` as a stored-XSS /
SSRF surface and say so in the finding (`contentDispositionType: "attachment"` mitigates but
does not eliminate it); unoptimized remote images in export mode assumed to be resized.

#### 4.12.5 Head, SEO & metadata
This is Pages Router — metadata comes from `next/head`, **not** the App Router `metadata`
export. `next/head` is centralized in `src/SEO/` (`SEOHead`, `DynamicSEO`, `PageHead`) and
pages consume those components, so a page should almost never import `next/head` directly —
one that does is a finding. Coverage is 31 of 35 non-sandbox pages; the four without any SEO
component are `design-system.tsx`, `forgot-password/index.tsx`, `home/sections/[id].tsx`, and
`share/products/[slug].tsx` — verify that gap is still real and still intended before filing
it. Also check: duplicated or conflicting
`<title>`/`<meta name="description">` between `_app.tsx` and a page; canonical URL missing,
hard-coded, or disagreeing with `trailingSlash: true`; `NEXT_PUBLIC_SITE_URL` missing so
canonical/OG URLs render relative or `undefined`; OG/Twitter tags absent on shareable pages
(PDP, category, store, share); JSON-LD in `src/SEO/` malformed, emitted twice, or describing
fields the page does not show; `noindex` missing on thin/private routes — notably the
`/redesign/*` sandbox and `/design-system`, which should not be indexed in production;
sitemap/robots generated by `scripts/` drifting from the real route list.

#### 4.12.6 Hydration & client-only code
`window`, `document`, `localStorage`, `navigator`, or `matchMedia` touched during render or
at module scope instead of inside `useEffect` or behind `dynamic(..., { ssr: false })`;
`typeof window !== "undefined"` branching **inside render** (server and client HTML differ →
hydration error); `Date.now()`/`new Date()`/`Math.random()` rendered directly; locale- or
timezone-dependent formatting computed server-side and re-computed client-side to a different
string; persisted Redux state (`redux-persist`) read during first render before rehydration
completes; `useScreenType()` driving markup that differs from the server render without a
mounted guard; **`reactStrictMode: true`** means effects double-invoke in dev — an effect that
breaks on second invocation (duplicate fetch, double increment, non-idempotent setup) is a
real bug, not a dev artifact.

#### 4.12.7 Bundle & code splitting
Heavy client-only libraries (`leaflet`/`react-leaflet`, `swiper`, `yet-another-react-lightbox`,
Stripe, `firebase`, `react-confetti`) imported statically into a shared chunk instead of via
`next/dynamic` (20 dynamic imports exist — follow that pattern); a barrel import pulling a
whole library where a named import suffices (`optimizePackageImports` covers `@heroui/react`,
`lucide-react`, `react-icons` — anything else is on you); `lodash` imported whole rather than
per-method; a server-only or Node-only module (`fs`, `path`) reaching a client component;
`transpilePackages` additions that are not justified; a polyfill or dev-only dependency
shipped to production.

#### 4.12.8 `_app.tsx` / `_document.tsx` discipline
Data fetching or blocking work added to `_app.tsx` (deoptimizes every page); `getInitialProps`
introduced anywhere (disables static optimization app-wide); `_document.tsx` containing
event handlers, hooks, or client logic — it renders once on the server only; fonts loaded
outside `next/font` (`src/config/fonts.ts` owns this, and `next/font/local` requires a static
object literal per `CLAUDE.md` §2); provider order changes in `_app.tsx` that silently
reorder theme/i18n/Redux/toast initialization; a global CSS import added outside `_app.tsx`
(Pages Router forbids it elsewhere).

#### 4.12.9 Environment variables & config
**Anything named `NEXT_PUBLIC_*` is inlined into the browser bundle at build time** — a
secret, API key, or private URL under that prefix is a Critical finding. The four legitimate
ones are `NEXT_PUBLIC_ADMIN_PANEL_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_VERSION`,
`NEXT_PUBLIC_SSR`; any new one must be justified and added to `.env.example` (`CLAUDE.md` §8).
Also check: a server-only secret read in code that also runs client-side (it will be
`undefined`, not secret — but the resulting silent failure is the bug); env var read at
module scope and therefore frozen at build time when runtime behaviour was intended;
hard-coded API base URL bypassing `constructApiBaseUrl()`.

#### 4.12.10 Security headers, PWA & caching
`next.config.ts` `headers()` sets HSTS, `X-Frame-Options: SAMEORIGIN`, `nosniff`,
`Referrer-Policy`, and `Permissions-Policy` — verify a change does not weaken them, and note
that **no `Content-Security-Policy` is set**, which is the standing gap to cite whenever a
review touches `dangerouslySetInnerHTML` or third-party script injection. `headers()` does
not apply in export mode (4.12.1). PWA (`@ducanh2912/next-pwa`) runs with
`cacheOnFrontEndNav` and `aggressiveFrontEndNavCaching` — check that authenticated or
market-scoped responses are not being cached into the service worker where another user or
market could read them, that a released build actually invalidates the old service worker,
and that offline fallbacks do not serve stale prices or stock. `compiler.removeConsole`
strips `console.*` except `error`/`warn` in production — do not rely on a stripped log for
diagnostics, and never log tokens/PII to `console.error`, which survives.

#### 4.12.11 Standard practices baseline — **a missing standard is a finding**
Do not only review the code that exists; check that the conventions a production Next.js site
is expected to have are actually **present**. If a standard practice is absent, that absence
is a reportable issue in its own right (Bug Type `Code Smell`, or the category it protects —
a missing error boundary is `Functional`, a missing CSP is `Security`).

Re-verify each of these against the current tree before filing — they are true as of this
writing, and some may since have been fixed:

- **No React error boundary exists anywhere in `src/`.** A render-time throw in any component
  blanks the whole page with no recovery. Standard practice is an error boundary in
  `_app.tsx` plus one around independently-failing regions (home sections, PDP blocks).
- **No custom `500` / `_error.tsx` page.** Server and client runtime errors fall back to the
  default Next.js error screen, unstyled and untranslated.
- **Custom 404 lives at `pages/404/index.tsx`, not the conventional `pages/404.tsx`.**
  Verify it actually serves unknown routes rather than merely being a reachable `/404` URL —
  and check it under `trailingSlash: true`.
- **`_document.tsx` hard-codes `<Html lang="en">`** while the app ships `en`/`hi`/`ar` and
  Arabic forces RTL. `lang` and `dir` must follow the active locale — as written, every
  Arabic page is served as LTR English to screen readers and translation tooling.
- **No `Content-Security-Policy`** among the `next.config.ts` security headers (see 4.12.10).
- **No test runner or `test` script** in `package.json` — nothing to regress against (4.13).
- **`@typescript-eslint/no-floating-promises` is switched off** in `eslint.config.mjs`, so an
  un-awaited async call that swallows a rejection will not be caught by lint. Weigh this
  whenever you review async code.

ESLint does extend `eslint-config-next/core-web-vitals` (which carries the `jsx-a11y` and
Core Web Vitals rules) and `tsconfig.json` has `strict: true` — both are correct and should be
reported as verified-safe, not re-flagged.

Beyond this list, apply the general standard: **if the framework or ecosystem has an
established convention for something the code does by hand, say so.** Notably `next/script`
for third-party scripts with an explicit `strategy` (3 usages today — check the strategy is
right and that no raw `<script>` tag was hand-injected), `next/font` for every font face,
`next/link` for every internal href, `next/image` for every raster asset, and `next/dynamic`
for every client-only heavy module. Cite the convention being bypassed and the cost of
bypassing it.

#### 4.12.12 Pages Router discipline
No `app/` directory, no App Router files, no `"use client"` / `"use server"` directives
(meaningless here — `/src/app/` is gitignored and must stay unused); no React Server
Components or `async` page components; no `next/navigation` imports (`useRouter` comes from
`next/router` in Pages Router — mixing them is a runtime error); no `metadata` export;
no Suspense-based streaming assumptions. Any of these appearing is a Critical structural
finding under `CLAUDE.md` §9.6, not a style nit.

### 4.13 Test coverage assessment
State what automated coverage exists for the reviewed area and what a defect found here would
have needed to be caught. This repo has no test runner configured — that gap is a standing
observation for the *Notes* section, not a new issue row every session.

---

## 5. How to review (quality bar)

- Read the actual code. Every claim traces to a line you opened.
- Cite exact `file:line`.
- Give a reproducible failure scenario: concrete inputs/state → wrong output.
- Give a concrete fix, not "add validation".
- Prefer one well-verified Critical over ten speculative Mediums.
- Deduplicate before writing.
- Report the safe areas alongside the defects.
- For a large feature, fan out by domain (services / views / components / state / i18n / a11y)
  before consolidating — then verify each finding yourself before it reaches the CSV.

---

## 6. Severity & priority

| Severity | Meaning |
|---|---|
| **Critical** | Data loss/corruption, money wrong, auth bypass, PII/token exposure, wrong-market or wrong-customer data shown, checkout or payment broken, page crashes for all users. |
| **High** | A core flow (browse, cart, checkout, orders, account) is broken or wrong for a common case; a security weakness needing preconditions; a state that leaves the user stuck with no recovery. |
| **Medium** | Non-core flow broken; missing loading/empty/error state; noticeable performance or accessibility defect; systemic rule violation with a real user-facing effect. |
| **Low** | Cosmetic, minor inconsistency, dead code, isolated code smell, low-impact polish. |

| Priority | Meaning |
|---|---|
| **P1** | Fix now — blocks release. All Critical. |
| **P2** | Fix this cycle. Most High. |
| **P3** | Scheduled. Medium. |
| **P4** | Backlog. Low. |

**Bug Type** — one of: `Security`, `Functional`, `Performance`, `UI/UX`, `Accessibility`,
`i18n/RTL`, `Data Integrity`, `Code Smell`, `Compatibility`, `SEO`.

**Status** — new rows are `Open`. Later transitions: `In Progress`, `Fixed`, `Verified`,
`Won't Fix`, `Duplicate`, `Cannot Reproduce`.

### CSV formatting rules
- One row per issue, on **one physical line**. Never embed a newline in a field.
- Keep the column count at **19**, always. Trailing empty columns
  (`Status`, `Dev. Notes`, `Tester Status`, `Tester Notes`) are left blank, not dropped —
  `Status` is filled with `Open`.
- **Avoid commas inside field text** — use `;` or ` - ` instead. If a comma is genuinely
  unavoidable, wrap that field in double quotes (RFC 4180) and double any inner quote.
- `Date` is `YYYY-MM-DD`. `NO` is a bare integer, sequential, never reused.
- `Module/Feature` names the storefront area (e.g. `Cart`, `Checkout - Payment`, `PDP`,
  `My Account - Orders`, `Search & Filters`, `Theme/Design System`).
- `Documentation File` is the doc the review was performed against
  (`CLAUDE.md`, `THEME_REDESIGN.md`, `REDESIGN_QUESTIONS.md`, `TEST_REPORT.md`) or `-` if none.
- `Bug Description` carries the `file:line` evidence and the mechanism.

---

## 7. History entry template

Append to `QA/code_review_testing_history.md`, newest at the end, each entry ending with `---`.

```markdown
# Code Review Session

**Date:** YYYY-MM-DD
**Time:** HH:MM (24-hour format)
**Feature / Module:**
**Documentation File:**
**Reviewer:** Claude

## Scope
- Files reviewed
- Directories reviewed
- Total files inspected

## Findings Summary
- Critical:
- High:
- Medium:
- Low:
- Total Issues:

## Files Modified
- QA/code_review.csv
- QA/code_review_append.csv

## New Issues Added
- Issue No.:
- Issue No.:
- ...

## Existing Issues Confirmed
- Issue No.:
- ...

## Safe Areas Verified
List the areas that were explicitly checked and verified as correct.

## Notes
Any assumptions, limitations, or observations made during the review.

---
```

---

## 8. Session report (in the response, before finalizing)

Every review ends with a summary covering:

1. **What was reviewed** — modules, directories, file count.
2. **What was verified as safe** — explicitly checked and found correct.
3. **What issues were found** — ranked Critical → High → Medium → Low, each with `file:line`.
4. **Which review categories were completed** — all of §4, each marked checked, with
   "no findings" stated where that is the outcome.

If nothing was found: state that every category in §4 was checked and no verified issues were
identified. That is a complete and acceptable review result.
