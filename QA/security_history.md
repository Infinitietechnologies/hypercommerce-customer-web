

# Security Review Session

**Date:** 2026-08-05
**Time:** 08:44 (24-hour format)
**Feature / Module:** F9 — Content & SEO (security pass)
**Documentation File:** SECURITY_INSTRUCTIONS.md · CLAUDE.md
**Reviewer:** Claude

## Scope
- Files reviewed: `src/SEO/DynamicSEO.tsx`, `SEOHead.tsx`, `PageHead.tsx`,
  `src/components/Functional/HTMLRenderer.tsx`, `src/components/StoreProfile.tsx`,
  `src/components/Cards/PromoCard.tsx`, `src/pages/products/[slug]/index.tsx` (schema build),
  `src/pages/stores/[slug]/index.tsx`, `scripts/generate-sitemap.mjs`, `scripts/update-robots.mjs`
- Review areas covered: 4.4 injection sinks · 4.7 platform configuration · 4.8 information
  exposure · 4.13 privacy
- Total files inspected: 10
- **Live testing:** dev server run; `JSON.stringify` escaping behaviour executed directly.

## Findings Summary
- Critical: 0 · High: 1 · Medium: 0 · Low: 0 · Total Findings: 1

## Files Modified
- QA/security.csv
- QA/security_append.csv

## New Findings Added
- ID: CWEB-11 — Seller-supplied text injected raw into a JSON-LD script block (High, P1)

## Existing Findings Confirmed
- Code review #38 — no sanitisation of API-supplied HTML at seven sites. Distinct from CWEB-11 and
  the distinction matters: #38 is HTML-context injection into rendered descriptions, CWEB-11 is
  **script-context** breakout through a field (a product title) that no one would normally think to
  sanitise as HTML. A panel that strips markup from descriptions may well leave titles alone.
- Code review #3 — no CSP, and #14 — token in `localStorage`. Both named inside CWEB-11 because
  they are what turns a successful breakout into session theft.
- Code review #39 and #40 — sandbox indexing and broken sitemap entries. Both observed this session
  and filed as defects 8 and 9 rather than re-filed here.

## Chains Identified
- **CWEB-11 + #3 + #14** — the strongest chain found in this engagement. A stored injection point
  on the highest-traffic public pages, no CSP to contain execution, and a session token readable
  from JavaScript in two places. Each link is already recorded; CWEB-11 supplies the entry point.

## Areas Verified Secure
- **`SEOHead`'s header and footer script slots are an intended admin feature** — they inject
  `webSettings.headerScript`/`footerScript`, which is the platform's tag-manager equivalent. Judged
  as designed rather than filed as injection, consistent with session 8's assessment.
- **`robots.txt` is regenerated at build** from `NEXT_PUBLIC_SITE_URL`, so the committed dev URL is
  a build artefact. Re-confirmed; the unset-variable case is specified as TC-SEO-016.
- **Private routes remain disallowed** — `my-account`, `cart`, `api`, `shopping-list`,
  `forgot-password` are all present in `robots.txt`.
- **Search terms and other query values render through React**, so no reflected injection path
  exists in the SEO layer.

## Notes
- **CWEB-11 is the highest-severity finding of the engagement so far and was established in two
  steps.** First the mechanism: executing `JSON.stringify` on a value containing a closing script
  sequence shows it is emitted verbatim — `stringify` escapes quotes and backslashes but not `<`
  or `/`. Then the reachability: the product page builds its schema from `generateProductSchema`
  plus a breadcrumb carrying `product.title` and `product.category_name`, and the store page passes
  `store.name` — all seller-authored in a multi-seller marketplace.
- The row states its boundary: what is verified is that the injection is raw and that seller fields
  feed it; what is not verifiable here is whether the panel constrains characters in a title. That
  is TC-SEO-004.
- The fix is a single-point change — escape `<`, `>` and `&` at the one emission site in
  `DynamicSEO` — which covers every page type at once. That is why the row recommends fixing it
  there rather than per page.

---
