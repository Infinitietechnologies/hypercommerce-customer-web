

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 08:44 (24-hour format)
**Feature / Module:** F9 — Content & SEO (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: dev server with `NEXT_PUBLIC_SSR=true` and a dead API base URL. SEO output is
  produced from configuration and route structure, so most of it is observable without a backend.
- Flows tested: sandbox and design-system route indexability, sitemap route resolution, canonical
  URL form against the served URL.
- Breakpoints tested: none. Locales tested: English only.
- Total screens exercised: 7 routes requested and their HTML inspected.

## Findings Summary
- Critical: 0 · High: 0 · Medium: 3 · Low: 0 · Total Defects: 3

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 8 — Redesign sandbox and design-system routes publicly served with no indexing restriction
- ID: 9 — Sitemap advertises two routes that return 404
- ID: 10 — Canonical URLs omit the trailing slash the site serves

## Existing Defects Confirmed
- None from `defects.csv`. Defects 8 and 9 are the observed symptoms of code review issues 39 and
  40, which described them from configuration; this pass confirms them by request.

## Areas Verified Working
- **Private routes are correctly disallowed** in `robots.txt` — checked directly.
- **Eleven of the thirteen static sitemap routes resolve**; only the two filed as defect 9 do not.
- **Content pages render and emit a canonical** — the defect is the canonical's *form*, not its
  absence.

## Notes
- **Defect 10 is a new finding, not a confirmation.** Code review §4.12.5 listed
  "canonical disagreeing with `trailingSlash: true`" as something to check but nothing had been
  measured. Requesting both forms settled it: the canonical target `/about-us` returns **308** and
  the served URL `/about-us/` returns **200**, so every canonical points one redirect away from the
  real page — and it disagrees with the sitemap, whose entries do carry trailing slashes. Two
  signals that should agree, conflicting.
- Defects 8 and 9 were both verifiable without a backend because they depend on route structure and
  build configuration rather than on data. That is why this feature yielded three defects while the
  authenticated features yielded none — the same environment constraint, different exposure.
- Not tested: the CMS pages' rendered content, which needs the content endpoint, and Open Graph
  image resolution, which needs real product data.

---
