# CLAUDE.md — HyperCommerce Customer Web

> **Read this file at the start of every session, before touching anything under `hypercommerce-customer-web/`.**
> Also read `GAP_ANALYSIS.md` in this folder for the current modernization backlog.
>
> The Laravel panel — the backend API this storefront and other production clients consume — lives in a sibling repo (`hypercommerce-panel/`). Reference it for the API contract when wiring data. It is **not** part of this repository.

---

## 1. Project context

**HyperCommerce** is a multi-seller marketplace. The two codebases you work with:

| Folder | What it is |
|---|---|
| `hypercommerce-customer-web/` | This project — Next.js customer storefront |
| `hypercommerce-panel/` | Laravel admin panel + the backend API this storefront consumes |

The web storefront is **being reskinned to the new amber redesign** (see the redesign note below). Two sources of truth, kept strictly separate:

- **Everything about how a screen looks and what it contains** — layout, colour, type, spacing, radii, shadows, component shapes, which fields/sections appear: the **`src/redesign/` sandbox is the single source of truth**, backed by its `ecommerce-website-design/*.dc.html` exports. The static redesign components are complete — build to them, do not re-derive a design from anywhere else.
- **The real data behind those screens** — endpoints, request/response shapes, field names: the **live backend API** (the Laravel panel + the existing `src/services/` layer). The sandbox ships mock data (`src/redesign/data/mock.ts`); porting a screen means keeping its real API wiring and applying the redesign look.

**Before building or changing any screen:** open its `/redesign` counterpart (the pixel target — screen map is in `THEME_REDESIGN.md`) and match it. Wire data from the live API, not the sandbox mock. If a screen has no `/redesign` counterpart (e.g. auth, seller-register), design it to the redesign foundations (`src/redesign/tokens.ts` + primitives) and log the rationale in `REDESIGN_QUESTIONS.md`.

Open redesign items and data gaps are tracked in `THEME_REDESIGN.md` and `REDESIGN_QUESTIONS.md` — read them before starting a phase, update them as items close. (`GAP_ANALYSIS.md` holds the older modernization backlog.)

> **Redesign (2026-07 →) — the amber reskin.** The pixel target is the
> **`src/redesign/` sandbox** (rendered at the `/redesign/*` routes), built from the
> `ecommerce-website-design/*.dc.html` exports. It is the single visual source of
> truth — match it, do not re-derive the look from memory or anywhere else.
>
> **The foundations have already LANDED in the live theme** — the token pipeline is
> done and correct, so build on it, don't reinvent it:
> - Amber `#f5a623` (brand 500), dark `#c9790a` (600), tint `#fdf1dc` (100), label-on-amber `#1a1200`.
> - Warm neutrals: page `#faf8f5`, card `#ffffff`, ink `#1c1a17`, ink-soft `#7a7570`, line `#ece8e2`. Violet secondary `#6d5ae0`. Danger `#d1453b`.
> - Radii 12 (small/buttons) · 14 (medium/inputs) · 18 (large/cards) · 20 (xlarge). Soft warm shadow ramp (`shadow-sm/md/lg`) + amber CTA glow (`shadow-primary`).
> - **Plus Jakarta Sans** (weights 400–800), `@iconify/react` solar set, `max-w-site` **1280px**, header cutover **1024px**, **light-only** (dark aliased to light, theme switch hidden).
> - All of the above live in `src/theme/{tokens,heroui}.ts` + `tailwind.config.ts`, mirroring `src/redesign/tokens.ts`. Gallery at **`/design-system`** (the regression target).
>
> What remains is **porting each live screen** to this design one at a time
> (`THEME_REDESIGN.md` Phase D + screen map), rewiring the sandbox's mock data to
> the real API shape. Any old value — amber `#eba513`/`#FFB616`, Figtree, radius-8
> buttons, flat cards, `1360px` — is **stale; do not reintroduce it.**

### Backend

Talks to the Laravel panel at `process.env.NEXT_PUBLIC_ADMIN_PANEL_URL + '/api/...'`. See `constructApiBaseUrl()` in `src/services/client.ts`. Customer endpoints live in the panel's `routes/api.php` → `app/Http/Controllers/Api/User/*`. **The API is shared with other production clients — never change a response shape to suit the web; if a screen needs a contract change, flag it, don't just make it.**

---

## 2. Tech stack

Everything below is what the project **actually uses today**. Do not add to this list without recording the addition here (§9).

| Concern | Choice |
|---|---|
| Framework | **Next.js 16** (`^16.2.2`), **Pages Router** — NOT App Router |
| Runtime | React 19.2.3, React DOM 19.2.3 |
| Language | TypeScript `^5`, `strict: true`, target ES2017, `moduleResolution: bundler` |
| Router | File-based, `src/pages/**` |
| Styling | **Tailwind CSS v4** via `@tailwindcss/postcss`, config in `tailwind.config.ts`, entry `src/styles/globals.css` |
| Component library | **HeroUI** (`@heroui/react ^2.8.7`, `@heroui/system 2.4.25`, `@heroui/theme 2.4.25`) + `tailwind-variants` |
| Theme mode | `next-themes` (`darkMode: "class"`), default `system` |
| Animation | `framer-motion` 12.26.0 |
| Global state | **Redux Toolkit** `^2.11.2` + `react-redux` + `redux-persist` |
| Server-data cache | **SWR** `^2.3.8` |
| SSR data | `getServerSideProps` (primary), `getStaticProps` where allowed |
| HTTP | **axios** `^1.13.2` — one instance in `src/services/client.ts`, endpoint callers in `src/services/<domain>.ts`, interceptors in `src/routes/interceptor.ts` |
| Forms / validation | **No form library.** Controlled React state + `src/helpers/validator.ts`; `libphonenumber-js` for phone |
| i18n | `i18next` + `react-i18next`, bundles in `public/locales/{en,hi,ar}.json`, init in `i18n.ts`, scanner `npm run scan:i18n`. Arabic forces RTL |
| Icons | **`@iconify/react` (solar set) — the redesign standard**, matches the Hero UI handoff 1:1; use `<Icon icon="solar:…" />` for new redesign screens. `lucide-react` `^0.562.0` remains for pre-redesign screens (118 files); `react-icons` `^5.5.0` lingers in 4 files and is being retired. Do not add a fourth set |
| Auth | Firebase Auth (phone OTP, Google, Apple) + Sanctum bearer token in cookies |
| Payments | Stripe (`@stripe/react-stripe-js`), Razorpay (inline SDK), Paystack, Flutterwave (redirect) |
| Maps | `leaflet` + `react-leaflet`, `@types/google.maps` |
| Carousel / media | `swiper` `^12`, `yet-another-react-lightbox` |
| PWA | `@ducanh2912/next-pwa` |
| Analytics | `@vercel/speed-insights`, `src/lib/analytics.ts`, `src/services/adTrackingService.ts` |
| Utility | `lodash`, `clsx`, `cookie`, `nprogress`, `react-confetti` |
| Lint / format | ESLint 9 flat config (`eslint.config.mjs`) + Prettier 3, `eslint-plugin-jsx-a11y`, `eslint-plugin-unused-imports` |

### Component library policy — HeroUI, themed with the redesign tokens

HeroUI is **already the incumbent** and stays. There is no competing component library, so no migration is needed.

It is themed with the **redesign tokens** (done — the values below already ship). The token pipeline is:

```
src/theme/tokens.ts   ← the ONLY place raw hex values belong
        ↓
src/theme/heroui.ts   ← shapes them into a HeroUI ConfigThemes object
        ↓
tailwind.config.ts    ← heroui({ layout: heroLayout, themes: heroThemes })
```

To change a colour, edit `tokens.ts`. Never override a HeroUI colour at a call site, and **never use HeroUI's default theme colours** — the old blue `#3b82f6` appearing anywhere is a regression.

Two constraints worth knowing before editing the theme:
- **`next/font/local` needs a static object literal** — no spreads, no shared config const. `tsc` won't catch a violation; the build will.
- **HeroUI drops alpha** — it stores colours as HSL channels, so `rgba(…, 0.06)` becomes fully opaque. Supply opaque equivalents (see `dividerSolid` / `outlineSolid` in `tokens.ts`).

### Redesign design tokens (source: `src/redesign/tokens.ts` ↔ `ecommerce-website-design/`)

These are the values HeroUI **is** themed with — they already ship in
`src/theme/tokens.ts`. Match the `src/redesign/` sandbox; this table is the
quick reference. **The old Material/handoff palette is retired —
do not reintroduce `#FFB616`, `#eba513`, `#F5F5F5` greys, or Figtree.**

```
brand      #f5a623 (500, primary) · #c9790a (600, dark) · #fdf1dc (100, tint)
           foreground-on-amber #1a1200
rating-star #EEAB18   secondary/violet #6d5ae0
error / success / warning   #d1453b / #178a4e / #f5a623
discount-card #256533   order-track #338518   delivery-time #C2FBFF

surfaces   page #faf8f5 · card/surface #ffffff · subtle fill #f4f1ec
           deeper wells #efeae2 / #e6e0d5
text       ink #1c1a17 · ink-soft/muted #7a7570
line/outline/divider  #ece8e2 (warm hairline)

dark       ALIASED TO LIGHT — light-only ship (theme switch hidden in _app.tsx).
           Restore a real dark ramp only when dark mode is revived.

font   Plus Jakarta Sans 400/500/600/700/800 — Tailwind standard weights, no remap
       (Figtree remains only as the `--font-mono` fallback face)
radius 12 (buttons/small) · 14 (inputs/medium) · 18 (cards/large) · 20 (xlarge)
       chips are pill (999). badges 8.
space  6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 (page gutter)
shadow sm  0 2px 10px -6px rgba(28,26,23,.08)      (cards rest here)
       md  0 12px 26px -14px rgba(28,26,23,.18)    (card hover lift)
       lg  0 14px 30px -18px rgba(28,26,23,.28)    (banners)
       overlay 0 8px 24px -12px rgba(28,26,23,.30)
       primary 0 8px 20px -10px rgba(245,166,35,.5) (amber CTA glow)
```

Redesign cards **rest on a soft `shadow-sm`** with an `#ece8e2` hairline and
lift to `shadow-md` + amber border on hover (see `redesign.css`). This is the
warm-elevated look of the sandbox — **not** a flat card. The signature
primary button carries the amber glow (`shadow-primary`), radius 12.

**Font weights — Tailwind's standard scale, no remap.** Plus Jakarta Sans is
loaded via `next/font/google` (`src/config/fonts.ts`, weights 400–800), so
`font-normal`→400 … `font-extrabold`→800 all resolve to real faces. Do not add a
custom weight scale or a downward remap.

**Inputs use radius 14** (`radius.medium`), matching the sandbox `radius.input`.

---

## 3. File and folder structure

### 3.1 Current structure (as it exists today)

```
hypercommerce-customer-web/
├── i18n.ts                     # i18next init + changeLanguage()
├── i18next-scanner.config.cjs
├── next.config.ts              # next + PWA
├── tailwind.config.ts          # HeroUI plugin, consuming src/theme/
├── eslint.config.mjs
├── tsconfig.json               # strict; alias "@/*" → "./src/*"
├── create-htaccess.js / ftp.js # deploy helpers
├── public/
│   ├── locales/{en,hi,ar}.json
│   └── images/
├── scripts/                    # update-manifest, update-robots, generate-sitemap
└── src/
    ├── SEO/                    # JSON-LD generators
    ├── assets/fonts/           # ★ self-hosted Figtree variable font
    ├── components/             # ~137 components grouped by domain
    │   ├── ui/                 # ★ HeroUI wrapper layer — the ONLY place
    │   │                       #   @heroui/react may be imported
    │   ├── Cards/ Cart/ Empty/ Footer/ Functional/ Location/
    │   ├── Modals/ PaymentGateway/ Products/ Seller/ Skeletons/ Tables/
    │   └── custom/             # PageHeader, TabButton, banners
    ├── config/                 # constants.ts, fonts.ts, seo.ts, site.ts
    ├── contexts/               # SettingsContext.tsx
    ├── features/               # ★ feature modules for NEW work — see its CLAUDE.md
    ├── guards/                 # authGuard (SSR) + withAuth (HOC)
    ├── helpers/                # auth, events, getters, updaters, validator, seo, notificationUrl
    ├── hooks/                  # useAdTracking, useDebouncedValue, useInfiniteData,
    │                           #   useRecentSearches, useScreenType
    ├── layouts/                # default.tsx, UserLayout.tsx
    ├── lib/
    │   ├── analytics.ts  cookies.ts  firebase.ts
    │   └── redux/              # ReduxProvider, store, slices/
    ├── pages/                  # file-based routes (34 pages)
    ├── routes/
    │   ├── api.ts              # re-export barrel (29 lines) — do NOT add to it
    │   ├── interceptor.ts
    │   └── CLAUDE.md
    ├── services/               # ★ client.ts (the axios instance) + 16 domain modules:
    │                           #   auth, catalog, cart, orders, wishlist, address, wallet,
    │                           #   reviews, notifications, payments, market, home, settings,
    │                           #   seller, content, ads — plus the older *Service.ts orchestrators
    ├── stores/                 # maintenanceStore.ts (in-memory singleton)
    ├── styles/                 # globals.css, index.css, custom/
    ├── theme/                  # ★ tokens.ts + heroui.ts — the design tokens
    ├── types/                  # ★ 15 domain modules; ApiResponse/index.ts is now a barrel
    └── views/                  # composed page bodies (CartPageView, OrderDetailView,
                                #   homePage, Products, WishListPageView, empty)
```

★ = added or restructured during modernization (Phases 0–2).

### 3.2 Still to come

```
src/
├── components/shared/          # NEW  cross-feature composites from the redesign:
│                               #   QuantityStepper, DeliveryTimeBadge, SponsoredBadge,
│                               #   RecommendBadge, DottedDivider, PullToRefresh,
│                               #   MarketPickerSheet
├── components/Skeletons/       # REBUILD on ui/Skeleton; add the missing screens
├── components/Empty/           # FOLD into ui/EmptyState
└── features/<feature>/         # POPULATE as Phases 3-9 build each screen
```

`pages/`, `views/`, `layouts/`, `lib/redux/`, `guards/`, `helpers/`, `hooks/`,
`config/`, `contexts/`, `SEO/` and `styles/` stay as they are — the Pages Router
structure is not changing.

Sequencing and exit criteria for each move are in `GAP_ANALYSIS.md` §9.

---

## 4. HeroUI usage rules

### 4.1 Wrap everything in `src/components/ui/`

The layer exists (Phase 1). Import from `@/components/ui`.

- **No *new or edited* file outside `src/components/ui/` may `import … from "@heroui/react"`.** One wrapper per primitive means behavior, a11y defaults, and redesign parity get fixed once.
- **Legacy files are migrated opportunistically**, not in a sweep — 162 still import HeroUI directly. Convert a file when you touch it for another reason; never open a standalone "migrate imports" commit across unrelated screens.
- `ui/index.ts` exports two kinds of thing: **wrapped** primitives that carry redesign parity (`Button`, `Input`, `Textarea`, `Card`, `Chip`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorState`, `toast*`) and **pass-through** re-exports that need no behavior change. Both come from the same import.
- When extending a HeroUI prop type, `Omit` any key you redeclare — `size` on Button, and `title` / `placement` / `scrollBehavior` on Modal — or `tsc` fails with TS2430.
- Wrappers re-export HeroUI's prop types and add only what the redesign needs. Do not invent props the redesign has no use for.
- Use `extendVariants` (as `components/custom/MyButton.tsx` already does) or `tailwind-variants` for variant maps — not conditional class soup at call sites.

### 4.2 Theme through Tailwind config only

- All tokens live in `src/theme/tokens.ts`, are shaped into a HeroUI theme in `src/theme/heroui.ts`, and are consumed by the `heroui()` plugin in `tailwind.config.ts`.
- Never restyle a HeroUI component by overriding its colors at the call site. If a color is wrong, the theme is wrong.
- Both `light` and `dark` themes must be defined. Dark mode uses the **4-level elevation system** — never flat `#000000`.

### 4.3 Match the redesign exactly

Full spec — look **and** behaviour — is the `src/redesign/` sandbox
(`primitives/index.tsx` + `redesign.css`). This table is the quick reference.

| Element | Spec (look + behaviour) |
|---|---|
| **Button** | radius **12**, primary = amber `#f5a623` fill, fg `#1a1200`, `shadow-primary` glow; secondary = white + `#ece8e2` border; tinted = `#fdf1dc` fill + `#c9790a` text; ghost = amber text. Height **48** mobile / **40** tablet+. Disabled = primary @ 50%. Loading = inline 20px spinner replacing the label (never a separate overlay) |
| **Input** | radius **14**, filled white, `1px` `#ece8e2` border → focused `1px` amber `#f5a623`, hint `#7a7570` |
| **Card** | radius **18**, white surface, `shadow-sm` at rest + `#ece8e2` hairline, hover → `shadow-md` + amber border, **zero margin** (parent owns spacing) |
| **Chip** | pill radius (999), `#fdf1dc` tint or white surface, amber text where selected, no shadow |
| **Modal / Sheet** ✅ | **Desktop → centered HeroUI `Modal`. Mobile → bottom `Drawer`** with top radius **18**, drag handle, backdrop dismiss. `ui/Sheet` picks presentation off `useScreenType()`. **Use it instead of `Modal`** for anything shown as a sheet |
| **Divider** | `1px`, `#ece8e2`, zero space |
| **Bottom nav** | reskinned to redesign tokens: white surface, active amber `#f5a623`, inactive `#7a7570` |

### 4.4 Which HeroUI component for what

| Use case | Component |
|---|---|
| Any action | `Button` (`ui/Button`) — never a styled `<div onClick>` |
| Navigation that changes URL | `Link` wrapping `next/link` |
| Text / number / password / search entry | `Input`; `Textarea` for multiline |
| Choice from a known list | `Select` (≤ ~8 options → `Radio` group) |
| Boolean setting | `Switch`; boolean in a form → `Checkbox` |
| Product / order / address container | `Card` |
| Filter tags, attribute values, order status | `Chip` |
| Confirm, form-in-overlay, variant picker, filters, sort | `ui/Sheet` (see 4.3) |
| Transient feedback after an action | `Toast` (HeroUI `ToastProvider`, already in `_app.tsx`) |
| Loading placeholder | `Skeleton` — must mirror the final layout |
| Category / account section switching | `Tabs` |
| FAQ, product details, collapsible sections | `Accordion` |
| Paginated lists | `Pagination`, or `useInfiniteData` for infinite scroll |
| Icon-only affordance | `Tooltip` + `aria-label` (both, always) |
| Counts, badges, "new" markers | `Badge` |
| User / seller / store imagery | `Avatar`, `Image` |
| Star ratings | keep `components/RatingStars.tsx`, themed with `#EEAB18` |
| Progress / busy | `Spinner`, `Progress`, `CircularProgress` |

Do not hand-roll a component HeroUI already ships.

---

## 5. Coding standards

Derived from the existing codebase; gaps filled with modern defaults.

### TypeScript
- `strict: true` — do not weaken it, do not add `// @ts-ignore`. Use `@ts-expect-error` with a reason if truly unavoidable.
- No `any`. Unknown API shapes get a type in `src/types/` first.
- **All API responses typed against `src/types/`**, matched 1:1 with the panel's `app/Http/Resources/` shapes.
- Import alias `@/*` → `./src/*`. No deep relative chains (`../../../`).

### Components and exports
- **One component per file.** Filename matches the component name.
- Components: `PascalCase.tsx`, **default export** (existing convention — 137 files).
- Utilities / hooks / services: `camelCase.ts`, **named exports**.
- Types and interfaces: named exports, `PascalCase`.
- Hooks: `useFoo`. Redux slices: `camelCaseSlice.ts`, actions are `camelCase` verbs.
- `pages/` URL segments: `kebab-case`.

### Server vs Client
- **Pages Router — there are no React Server Components.** Do not add `"use client"`; it is meaningless here.
- Server work happens in `getServerSideProps` (default for personalized/location-aware pages) or `getStaticProps` for static content.
- `pages/<route>.tsx` is a **thin shell**: `getServerSideProps` + `serverSideAuthGuard` for protected routes + render the matching `views/` component + set `getLayout`.
- `views/` composes the page body. `components/` are props-in, JSX-out.
- Anything touching `window`/`document` goes inside `useEffect` or a `dynamic(..., { ssr: false })` import — SSR hydration mismatches otherwise.

### Styling
- **Tailwind only.** No inline `style={{ }}` — the 14 existing occurrences are legacy and should be removed when touched. The sole exception is a genuinely dynamic value (map pixel offsets, carousel transforms) that cannot be a class.
- **No arbitrary values** (`[15px]`, `[#f5a623]`) unless the token genuinely doesn't exist — in which case **add the token** to `tailwind.config.ts` and use it. ~100 arbitrary values exist today; treat them as debt.
- No hard-coded hex anywhere in `src/` outside `src/theme/`. This includes `globals.css`.
- Use `clsx` for conditional classes.
- `globals.css` is for resets and third-party overrides only — not component styling.

### Do not
- `import axios from "axios"` anywhere but `src/services/client.ts` — components call a hook, hooks call `src/services/<domain>.ts`.
- Add an `app/` directory or App Router files.
- Write to `localStorage` directly — redux-persist owns it.
- Hard-code the API base URL, currency symbols, or status strings.
- Let `success: false` silently break a page — use the fallback constants in `src/config/constants.ts`.
- Log or display tokens, passwords, OTPs, or PII.
- Mention Claude, AI, assistants, or prompts in code, comments, or commits.

### Comments
Minimal. Add one only when intent isn't readable from the code. Hard cap: **one short line**. Never restate what the code does.

---

## 6. Design and UX rules

### 6.1 Reference the redesign — it is the whole spec
Before building or updating any screen, open its **`/redesign` counterpart**
(`src/pages/redesign/*` + `src/redesign/`) and match it: layout, spacing rhythm,
component shapes, colour, radius, shadow, and the field/section list it shows.
The static redesign components are complete — the design questions are already
answered there, so read them off the sandbox rather than inventing or guessing.

Then wire the **real data** from the live API (`src/services/` + the panel
contract), replacing the sandbox's mock data. Log any data delta — a field the
redesign shows that the API doesn't return, or vice versa — in
`REDESIGN_QUESTIONS.md`, and ship a sensible default meanwhile.

### 6.2 Responsive behavior

Breakpoints (already in `tailwind.config.ts`): `xxs 320 · xs 375 · sm 431 · md 769 · lg 1440 · xl 1800 · xxl 2550`. Use `useScreenType()` for behavior that can't be expressed in CSS.

| Range | Requirement |
|---|---|
| Mobile (`< md`) | **1:1 with the `/redesign` mobile layout** — same layout, same order, same component shapes. Sheets not modals. Bottom nav visible |
| Tablet (`md`–`lg`) | 2-column: content + secondary panel (filters, summary, related) |
| Desktop (`≥ lg`) | Multi-column with persistent sidebars — category/filter sidebar left, cart/summary right where relevant. Header nav replaces bottom nav |

Never let desktop layout logic degrade the mobile experience. Mobile-first classes, desktop as the override.

### 6.3 Every screen ships four states

No screen is complete without all four:

1. **Loading** — a `ui/Skeleton` composition that mirrors the final layout. Never a bare spinner for full-page loads.
2. **Empty** — `ui/EmptyState` with illustration, headline, body, and a primary action, styled to the redesign foundations.
3. **Error** — `ui/ErrorState` with a human message and a retry action. Never a raw error string or a blank page.
4. **Loaded** — the real thing.

### 6.4 Every action gives feedback
- Async actions disable their trigger and show the inline loading state.
- Success and failure both surface a `Toast`. Silent success is a bug.
- Destructive actions confirm first via `ui/Sheet`.
- Optimistic UI (cart quantity, wishlist toggle) must roll back visibly on failure.

### 6.5 Accessibility baseline
- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<ul>`, real headings in order. No `<div onClick>`.
- Full keyboard navigation: every interactive element reachable and operable by keyboard; modals and sheets trap focus and restore it on close; `Esc` closes.
- Visible focus rings on all focusable elements, using the **amber** focus token — never `outline-none` without a replacement.
- `aria-label` on every icon-only control. `alt` on every meaningful image, `alt=""` on decorative ones.
- Form fields have associated `<label>`s; errors are linked via `aria-describedby` and announced.
- Respect `prefers-reduced-motion` for framer-motion animations.
- `eslint-plugin-jsx-a11y` is installed — do not disable its rules.
- RTL (Arabic) must work: use logical properties (`ms-`/`me-`/`ps-`/`pe-`), not `ml-`/`mr-`.

### 6.6 i18n
Every user-facing string is `t('namespace.key')`. Never inline English. New keys go into **all three** locale files (`en`, `hi`, `ar`) even as placeholders. Run `npm run scan:i18n` after adding keys.

### 6.7 Verify the reskin visually — never from code alone
A reskin is only "done" when it *looks* like its `/redesign` twin. Code review
cannot catch spacing, colour, or radius drift — you must see it rendered.

1. Run `npm run dev`. Open the ported route **and** its `/redesign` counterpart side by side.
2. Compare at the real breakpoints — **mobile (375px), tablet (769px), desktop (1280px)** — the redesign header/layout changes at the 1024px cutover, so check both sides of it.
3. Check all four states (loading / empty / error / loaded), not just the happy path.
4. Diff specifically: page background (`#faf8f5`, not white), card radius (18) + soft shadow + hairline, button radius (12) + amber glow, amber is `#f5a623` (not `#eba513`/`#FFB616`), font is Plus Jakarta Sans, gutter/`max-w-site` 1280.
5. Only after it matches: `npm run lint`, then commit. If a mismatch traces to a missing token, add the token first (§4.2) — never patch it with an arbitrary value at the call site.

`/design-system` is the atoms/components regression target — if a primitive looks
wrong there, fix the theme, not the screen.

---

## 7. State and data

### 7.1 Ownership

| State | Owner | Notes |
|---|---|---|
| Cart (server mirror) | Redux `cartSlice` | |
| Offline cart (pre-login) | Redux `offlineCartSlice` | persisted; syncs to server on login |
| Wishlist | Redux slice | add one if not present; client-owned, optimistic |
| Filters / sort / search UI | Redux `searchSlice` + URL query params | URL is the source of truth for shareable filter state |
| Session / auth user | Redux `authSlice` + `access_token` cookie | cookie readable SSR + client |
| Checkout step state | Redux `checkoutSlice` | |
| Recently viewed | Redux `recentlyViewedSlice` | persisted |
| Active market | market cookie + `X-Market` header | see §7.4 |
| Language | cookie `i18nextLng` | |
| Theme mode | `next-themes` | |
| Maintenance flag | `src/stores/maintenanceStore.ts` | in-memory; set by the 503 interceptor |
| Product lists, PDP, orders, seller/store data, wallet, transactions, notifications | **data-fetching layer** — `getServerSideProps` for first paint, SWR for revalidation | never Redux |

`redux-persist` allowlist: `auth`, `offlineCart`, `recentlyViewed`, `search`. Adding a slice = create it in `src/lib/redux/slices/`, register in `store.ts`, and update the allowlist if it should persist.

### 7.2 Fetching rules

- **No direct fetches inside components.** Components receive props or call a hook. Hooks call `src/services/<domain>.ts`. Services use the shared axios instance from `src/services/client.ts`.
- **Add new endpoints to the matching domain module**, never to the `src/routes/api.ts` barrel.
- One axios instance, created in `src/services/client.ts`, interceptors from `src/routes/interceptor.ts` (auth header injection, 401 → logout, 503 → maintenance). `src/routes/api.ts` is a re-export barrel only — do not add callers to it.
- Every endpoint is a named export returning a typed `ApiResponse<T>` / `PaginatedResponse<T>`.
- SSR-critical calls use the fallback constants in `src/config/constants.ts` (`fallbackApiRes`, `fallbackPaginateRes`) so a failed fetch never crashes a page.

### 7.3 SWR stale times

Set `dedupingInterval` / `revalidateOnFocus` per data volatility — don't accept defaults blindly:

| Data | Stale time | Focus revalidate |
|---|---|---|
| Cart, wallet balance | 0 (always fresh) | yes |
| Orders, notifications | ~30s | yes |
| Product detail, reviews | ~5min | no |
| Product lists, search results | ~2min | no |
| Categories, brands, stores, settings, policies | ~30min | no |

### 7.4 Markets

**Every catalog response is scoped to the active market.** Get this wrong and the customer sees another market's inventory, currency, and pricing.

The panel's `DetectMarket` middleware resolves in this order:

```
X-Market header → ?market= query → user_market pivot → market cookie
→ country header → Setting('default_market_id')
```

Web already sends the header — `src/routes/interceptor.ts:37-50` and `src/services/catalog.ts`. `src/contexts/SettingsContext.tsx` exposes market-scoped settings and currency; `src/hooks/useInfiniteData.ts` is market-aware.

Rules:
- Never fetch catalog data outside the shared axios instance — you would lose the `X-Market` header and silently get default-market data.
- Never hard-code a currency symbol or format; read it from `SettingsContext`.
- **Switching market invalidates all catalog caches** — products, categories, brands, stores, home layout, search. On market change, clear the corresponding SWR keys so none of them serve the previous market's data.
- **Market ≠ store.** A market is a country/region storefront scope. A store is a seller location. There is no store picker; do not build one.

The picker UI (`MarketPickerSheet`) does not exist yet — Phase 8. Design it to the redesign foundations (`ui/Sheet` on mobile) and log the layout in `REDESIGN_QUESTIONS.md` before building.

### 7.5 Protected routes
Add the path to `PROTECTED_ROUTES` in `src/guards/authGuard.ts` **and** call `serverSideAuthGuard(context)` in that page's `getServerSideProps`. The SSR guard is primary; the `withAuth` HOC is a client-side fallback.

---

## 8. Git and workflow

- **Work on `dev`.** Do not create per-phase or per-feature branches; commit directly to `dev`.
- **Commit after each screen** is complete — building, themed, and with all four states (§6.3). Not at the end of the phase. Small, self-contained commits are what makes a single shared branch workable.
- **No unrelated changes in a commit.** Drive-by refactors, formatting sweeps, and dependency bumps get their own commits.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `style:`.
- Never mention Claude, AI, or prompts in commit messages.

### Nested CLAUDE.md files — precedence

Six exist. **This file wins on conflict**, then the nearest subfolder file:

| File | Scope | Status |
|---|---|---|
| `CLAUDE.md` (this file) | whole app | **authoritative** |
| `src/CLAUDE.md` | navigation map, where-to-put-code | accurate |
| `src/pages/CLAUDE.md` | Pages Router patterns | accurate |
| `src/routes/CLAUDE.md` | api.ts / interceptor | accurate |
| `src/lib/redux/CLAUDE.md` | slices, store, persist | accurate |
| `src/components/CLAUDE.md` | component contract + the `ui/` layer | accurate |
| `src/features/CLAUDE.md` | feature module shape for new work | accurate |

All six are current as of Phase 2.

### Before every task
1. Read this file, `GAP_ANALYSIS.md`, `THEME_REDESIGN.md`, `REDESIGN_QUESTIONS.md`, and the nearest subfolder `CLAUDE.md`.
2. Open the **`/redesign` counterpart** (the pixel target + field list) and match it. Get the data shape from the existing `src/services/` + the panel API contract.
3. Find the closest existing web page and mirror its SSR + view + component split. `src/pages/products/[slug]/` is the canonical pattern; `src/pages/my-account/orders/` is the protected paginated-list pattern.
4. **After building, render it and compare against the `/redesign` twin** (see §6.7) before calling it done — do not verify a reskin from code alone.

### After every task
1. `npm run lint`
2. `npm run scan:i18n` if translation keys changed
3. Confirm `store.ts` + persist allowlist if a slice changed
4. Add any new env var to `.env.example`
5. Flag any API contract change — **other production clients break silently**

### Commands
```bash
npm run dev          # next dev --turbopack
npm run build        # lint + manifest + robots + sitemap + next build
npm run start
npm run lint         # eslint --fix
npm run scan:i18n
```

---

## 9. Do NOT

1. **No second component library.** HeroUI is it. No MUI, no shadcn, no Chakra, no Radix-direct, no Ant.
2. **No HeroUI default theme colors.** Amber `#f5a623` is the brand (redesign — supersedes the retired `#eba513` and `#FFB616`; see Redesign note in §1). Blue `#3b82f6` anywhere in the codebase is a bug, and so is any lingering `#eba513`/`#FFB616`.
3. **No new dependency without recording it in §2 of this file** — in the same commit that adds it. Justify it; prefer what's already installed.
4. **No scope creep.** Do exactly the screen or fix that was asked. Note anything else you spot and move on.
5. **No skipping the redesign reference.** If you did not open the `/redesign` counterpart, you are guessing at the design. Match it, don't invent.
6. **No App Router.** Pages Router only.
7. **No direct `@heroui/react` imports outside `src/components/ui/`** (once that layer exists).
8. **No bypassing the data layer** — no axios in components, no `localStorage` outside redux-persist, no hard-coded API URLs.
9. **No screen without loading, empty, and error states.**
10. **No structural change** (folder moves, state-management swaps, router changes, major version bumps) without explicit approval.
11. **No delivery zones.** The feature is deprecated product-wide. Do not port `/delivery-zones` or `/delivery-zone-detail`, and do not flag their absence as a gap.
12. **No store picker.** There is a *market* picker, not a store picker. Do not conflate the two (§7.4).
13. **No custom font-weight scale.** Tailwind defaults map 1:1 to the font's faces. Storefront `sans` is **Plus Jakarta Sans** (redesign, weights 400–800, via `next/font/google` in `src/config/fonts.ts`); Figtree remains only as the `--font-mono` fallback.

---

_Rewritten 2026-07-21 from a full audit of this codebase. Realigned to the shipped amber redesign 2026-07-27: **`src/redesign/` is the single source of truth for design (look + layout + field list); real data comes from the live backend API. The Flutter app is no longer a reference** — it was dropped from the design/feature workflow entirely. Update when the router model, HeroUI theme, state layout, folder structure, or i18n approach changes._
