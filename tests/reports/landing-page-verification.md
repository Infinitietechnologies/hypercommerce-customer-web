# Landing page integration verification

Date: 2026-10-31 (Asia/Kolkata). Changes are local in both repositories. Remote landing page 3 was inspected without saving or replacing its content.

## Findings

### LP-1 — CDN script execution

| Field | Result |
| --- | --- |
| Module/Feature | Landing Page Builder / Customer Web |
| Bug Title | Inert CDN tags stall script loading |
| Bug Description | Confirmed (code-verified). Previous `src/views/LandingPageView.tsx` inserted HTML using `dangerouslySetInnerHTML`. Its `loadScript` then found the inert source tag and waited for a load event that would never fire. Inline script replay also discarded native document lifecycle and resource semantics. |
| Bug Type | Functional |
| Severity | Medium |
| Priority | P2 |
| Preconditions | Imported HTML with an external script followed by dependent inline JS. |
| Steps to Reproduce | 1. Import and save a CDN-dependent template. 2. Open its `/go/:slug/` URL. 3. Exercise its interactive component. |
| Expected Result | Browser loads declared dependencies and executes component initialization in native document order. |
| Actual Result | Confirmed: loader can hang on an inert script; dependent initialization never runs. |
| Impact | CDN-based galleries and interactive landing pages fail for visitors. |
| Suggested Fix | Implemented in `src/components/LandingPageDocument.tsx:20` and `src/helpers/landingDocument.ts:7`: parse inertly, serialize a complete document, then let a sandboxed iframe perform native parsing and script execution. No synthetic DOMContentLoaded/load dispatch, guessed Swiper initialization, forced Tailwind version, or global script replay. |

### LP-2 — Design and document preservation

| Field | Result |
| --- | --- |
| Module/Feature | Landing Page Builder / Customer Web |
| Bug Title | Import/export and CSS rewriting change template design |
| Bug Description | Confirmed (code-verified and runtime-verified). Existing importer flattened full documents; CSS import/export and selector rewriting changed document semantics. Export injected Tailwind into every template with classes. Original HYPRLUV source contains `.topbar` padding and `.btn.fill` background declarations absent from the published CSS. |
| Bug Type | UI/UX |
| Severity | Medium |
| Priority | P2 |
| Preconditions | Full HTML template with body/html rules, custom properties, shorthand declarations, and JS-controlled classes. |
| Steps to Reproduce | 1. Import HYPRLUV source. 2. Save and open customer URL. 3. Compare header spacing, CTA, and slide navigation with source. |
| Expected Result | Imported attributes, styles, component JS, and dynamic state rules survive export and reload. |
| Actual Result | Confirmed: published template differs from its source; topbar/CTA declarations have been lost. |
| Impact | Imported templates lose spacing, color, and interaction states. |
| Suggested Fix | Implemented in sibling `hypercommerce-panel/public/assets/js/grapesjs-editor.js:34` and `:117`: complete-document import/export, `keepUnusedStyles`, official PostCSS parser, and no unsolicited framework runtime. Customer iframe preserves CSS unchanged and isolates storefront styles. Backend `resources/views/landing-pages/show.blade.php:1` supports complete documents and legacy fragments. Reimport original source after deployment to recover declarations already missing from saved data; merely resaving cannot recreate them. |

### LP-3 — Countdown registration

| Field | Result |
| --- | --- |
| Module/Feature | Landing Page Builder |
| Bug Title | Countdown plugin alias does not match loaded bundle |
| Bug Description | Confirmed (code-verified and runtime-verified). Pinned countdown bundle exposes `grapesjs-component-countdown`; editor requested `gjs-component-countdown`. Component type was unavailable, producing empty output. |
| Bug Type | Configuration |
| Severity | Medium |
| Priority | P2 |
| Preconditions | Countdown plugin loaded from CDN and countdown block/component used. |
| Steps to Reproduce | 1. Initialize editor. 2. Add countdown component. 3. Export and render it. |
| Expected Result | Countdown component registers and exports its markup and script. |
| Actual Result | Confirmed: wrong alias leaves countdown type unregistered. |
| Impact | Countdown editor component and exported JS do not work. |
| Suggested Fix | Implemented in sibling `hypercommerce-panel/public/assets/js/grapesjs-editor.js`: canonical plugin name and matching options. Countdown 1.0.2 and tabs 1.0.6 pinned and exercised in Chrome. |

## Verification

- Node service tests: 4 passed. Endpoint encoding, market/token arguments, 404, network failure, and backend asset base resolution.
- Laravel rendering tests: 2 passed / 11 assertions. Complete documents retain one document wrapper; legacy fragments remain supported; title escaping and script/CSS retention verified.
- Browser harness: 33 checks passed (29 without optional original template; 4 additional source-template checks). Native dependency ordering; defer/module execution; DOMContentLoaded exactly once; events; language/RTL attributes; CSS and script isolation; relative assets; inert JSON scripts; repeated script URLs; failed resource continuation; empty documents; full-document import/export; dynamic CSS; shorthand custom properties; keyframes; actual tabs and countdown components; exactly-once component scripts; JSON project reload; parser failure feedback and rollback; original HYPRLUV nine-slide round trip, navigation, padding, and CTA background.
- Chrome inspected both supplied remote pages and local Next.js route against the live dev API. Mobile slide navigation checked at 375px; frame sizing checked at 769px and around 1024px. Existing saved content still requires source reimport for full visual recovery.
- `npm run lint`: passed with 47 existing warnings and no errors. Targeted lint clean.
- `npx tsc --noEmit --incremental false`: passed after removing a stale generated `.next/types/validator.ts` that conflicted with `.next/dev/types/validator.ts`; no TypeScript source configuration changed.
- Broad `php artisan test --filter=LandingPageBuilderRenderingTest` discovery is blocked by pre-existing duplicate global `makeStore()` declarations in unrelated tests. Running the new file directly passes.
- Full production build, remote deployment, actual remote save/upload lifecycle, all third-party CDN policies, payment forms, and exhaustive browser/device coverage were not claimed or performed.

## Reproduce

From customer web:

```sh
node --test tests/landing-page-service.test.mjs
node tests/landing-document-browser.mjs
```

Open `http://127.0.0.1:3015/` in Chrome. Harness needs internet access for pinned GrapesJS plugins and sibling panel repository. Optional second argument supplies original template HTML for four additional source-template checks:

```sh
node tests/landing-document-browser.mjs /absolute/path/to/original.html
```

From panel:

```sh
php artisan test tests/Feature/LandingPageBuilderRenderingTest.php --compact
```

## Integration limits and rollout

Deploy both repositories. Reimport original template HTML, upload its referenced assets or retain valid absolute asset URLs, then save. Existing API fields and database schema are unchanged. Saved project JSON remains editor source of truth.

Template executes in an isolated iframe with its own viewport and scrolling. Storefront header/footer still follow saved setting. Next.js retains page title and canonical metadata; template body is iframe content and is not server-rendered into parent document. Scripts that require storefront cookies/localStorage or same-origin parent access are intentionally isolated. CDN modules/fonts still require the asset host's normal CORS support. Missing relative assets cannot be recreated by renderer; default asset base is configured backend installation, while authored `<base>` is retained.

## Primary references

- [GrapesJS component scripts](https://grapesjs.com/docs/modules/Components-js.html)
- [GrapesJS project data persistence](https://grapesjs.com/docs/modules/Storage.html)
- [GrapesJS CSS import guidance](https://grapesjs.com/docs/guides/Custom-CSS-parser.html)
- [Official PostCSS parser plugin](https://github.com/GrapesJS/parser-postcss)
- [Original HYPRLUV template](https://templatemo.com/tm-627-hyperluv-slideshow)
