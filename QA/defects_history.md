

# Defect Testing Session

**Date:** 2026-08-05
**Time:** 10:02 (24-hour format)
**Feature / Module:** F10 — Cross-cutting (defects pass)
**Documentation File:** DEFECTS_INSTRUCTIONS.md · CLAUDE.md
**Tester:** Claude

## Scope
- Environment: dev server in SSR mode with a dead API base URL. Locale, typography and document
  attributes are produced without backend data, so this feature was largely testable.
- Flows tested: server-rendered output under each of the three locale cookies; the `<html>`
  element per locale; the font actually loaded; response headers.
- Locales tested: **en, hi, ar** — the first pass to cover all three.
- Total screens exercised: home and categories, each requested under three locales.

## Findings Summary
- Critical: 0 · High: 2 · Medium: 1 · Low: 0 · Total Defects: 3

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID: 11 — The server always renders the default language regardless of the locale cookie (High)
- ID: 12 — `<html lang="en">` with no `dir` for every visitor (Medium)
- ID: 13 — Figtree is served where Plus Jakarta Sans is specified (High)

## Existing Defects Confirmed
- None from `defects.csv`. Defects 12 and 13 are the observed symptoms of code review issues 47
  and 43; defect 11 is new.

## Areas Verified Working
- **All six configured security headers are served** and `X-Powered-By` is suppressed.
- **The client-side language correction works** — `_app.tsx:58-62` does set `lang` and `dir` once
  hydrated, which is why defects 11 and 12 are scoped to the server response rather than claiming
  the app has no RTL support at all.

## Notes
- **Defect 11 is the significant find of this pass and it is new, not a confirmation.** Requesting
  `/categories/` — a page that explicitly awaits `loadTranslations(context)` — with the cookie set
  to `ar` and then `en` returned **byte-comparable English output**, zero Arabic characters in
  either. The cause was then traced precisely: `i18n.ts:29` initialises the i18next singleton at
  module scope, and `loadTranslations` calls `init` again at `:62`. Calling `init` on an already
  initialised instance does not switch the active language — `changeLanguage` does, and the same
  file already uses it at `:45` for the client-side switch. So the `lng` passed on the server is
  silently ignored.
- The impact compounds with defect 12: the document declares `lang="en"` *and* the content is
  English, so the entire server response is English for every visitor. Search engines therefore
  index every localised page as English, and Hindi and Arabic customers get a full English first
  paint that swaps after hydration.
- The fix for defect 11 is one line — `await i18n.changeLanguage(lang)` inside `loadTranslations` —
  and it is verifiable by the same request comparison that found it.
- Not tested: RTL *layout* mirroring, keyboard traversal and screen-reader announcement, which need
  a rendered page with real content, and the PWA cache behaviour, which needs a production build
  since the service worker is disabled in development.

---
