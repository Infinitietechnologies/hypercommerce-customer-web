# CLAUDE.md — HyperCommerce Customer Web

> **Read this file at the start of every session, before touching anything under `hypercommerce-customer-web/`.**
> Also read `/CLAUDE.md` at the repo root for system-wide context, and `../GAP_ANALYSIS.md` for the current modernization backlog.

---

## 1. Project context

**HyperCommerce** is a multi-seller marketplace. Three codebases live in this repo:

| Folder | What it is |
|---|---|
| `hypercommerce-customer-app/` | Flutter customer app — **design and feature source of truth** |
| `hypercommerce-customer-web/` | This project — Next.js customer storefront |
| `hypercommerce-panel/` | Laravel admin panel + the API both clients consume |

The web storefront is **being modernized to match the Flutter app**. The Flutter app defines the visual language, the screen inventory, and the interaction patterns. When the two disagree, **Flutter wins** unless the divergence is a documented web-only concern (SEO, desktop layout, keyboard input).

**Before building or changing any screen, open the matching Flutter screen** under `hypercommerce-customer-app/lib/screens/<feature>/view/`. If you cannot find a counterpart, say so in your summary rather than inventing a design.

The gap between the two is tracked in `../GAP_ANALYSIS.md` — read it before starting a phase, update it when a gap closes.

### Backend

Talks to the Laravel panel at `process.env.NEXT_PUBLIC_ADMIN_PANEL_URL + '/api/...'`. See `constructApiBaseUrl()` in `src/routes/api.ts`. Customer endpoints live in the panel's `routes/api.php` → `app/Http/Controllers/Api/User/*`. **API contract changes break the mobile app silently — always flag them.**

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
| HTTP | **axios** `^1.13.2` — one instance in `src/routes/api.ts`, interceptors in `src/routes/interceptor.ts` |
| Forms / validation | **No form library.** Controlled React state + `src/helpers/validator.ts`; `libphonenumber-js` for phone |
| i18n | `i18next` + `react-i18next`, bundles in `public/locales/{en,hi,ar}.json`, init in `i18n.ts`, scanner `npm run scan:i18n`. Arabic forces RTL |
| Icons | **`lucide-react` `^0.562.0` — the standard** (118 files). `react-icons` `^5.5.0` lingers in 4 files and is being retired. Do not add a third set |
| Auth | Firebase Auth (phone OTP, Google, Apple) + Sanctum bearer token in cookies |
| Payments | Stripe (`@stripe/react-stripe-js`), Razorpay (inline SDK), Paystack, Flutterwave (redirect) |
| Maps | `leaflet` + `react-leaflet`, `@types/google.maps` |
| Carousel / media | `swiper` `^12`, `yet-another-react-lightbox` |
| PWA | `@ducanh2912/next-pwa` |
| Analytics | `@vercel/speed-insights`, `src/lib/analytics.ts`, `src/services/adTrackingService.ts` |
| Utility | `lodash`, `clsx`, `cookie`, `nprogress`, `react-confetti` |
| Lint / format | ESLint 9 flat config (`eslint.config.mjs`) + Prettier 3, `eslint-plugin-jsx-a11y`, `eslint-plugin-unused-imports` |

### Component library policy — HeroUI, themed with Flutter tokens

HeroUI is **already the incumbent** and stays. There is no competing component library, so no migration is needed.

It is now themed with the Flutter tokens (Phase 0, done). The token pipeline is:

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

### Flutter design tokens (source: `hypercommerce-customer-app/lib/config/theme.dart`)

These are the values HeroUI must be themed with. Full derivation in `../GAP_ANALYSIS.md` §1.

```
primary            #FFB616   (foreground on primary: #000000)
primary-light      #FACC66
rating-star        #EEAB18
error / success / warning   #F44336 / #4CAF50 / #FFAB40
discount-card      #256533     order-track        #338518
delivery-badge     #C2FBFF

light  bg #FFFFFF · bg2 #F5F5F5 · container #F7FAFC · card #F5F5F5
       text #0D1117 · muted #616161 · outline #EEEEEE · divider #E0E0E0

dark   L0 page  #0D0D0D
       L1 card  #1A1A1A
       L2 elev  #242424
       L3 chip/input #2E2E2E
       text #F0F0F0 · muted #9E9E9E
       outline rgba(255,255,255,.12) · divider rgba(255,255,255,.06)
       bottom-nav #111111 · nav-inactive #6B6B6B

font   Figtree 300/400/500/600/700/800 — standard weight semantics, no remap
       (sizes used: 10 11 12 13 14 15 16 18)
radius 4 · 6 · 8 (buttons) · 10 · 12 (cards + inputs + sheets — dominant) · 16 (large)
space  6 · 8 · 10 · 12 · 14 · 16 (dominant) · 20
shadow sm  0 2px 10px rgba(0,0,0,.10)
       md  0 3px 10px rgba(0,0,0,.12)
       lg  0 6px 12px rgba(0,0,0,.15)
       overlay 0 2px 10px rgba(0,0,0,.20)
```

Cards in Flutter are **flat**: `elevation 0` + a 0.5px hairline border. Shadows are for floating/overlay surfaces only.

**Font weights — Tailwind's standard scale, no remap.** Figtree is self-hosted as a variable font (`src/assets/fonts/Figtree-VariableFont_wght.ttf`, `weight: "300 900"`), so `font-light`→300, `font-normal`→400, `font-medium`→500, `font-semibold`→600, `font-bold`→700, `font-extrabold`→800 all resolve to real weights. The old downward remap (`bold`→600) has been deleted. **Do not reintroduce it** and do not add a custom weight scale.

**Inputs use radius 12**, matching the app's themed `inputDecorationTheme`. The `borderRadius = 8.0` default inside `CustomTextFormField` is stale and overridden in practice — ignore it.

---

## 3. File and folder structure

### 3.1 Current structure (as it exists today)

```
hypercommerce-customer-web/
├── i18n.ts                     # i18next init + changeLanguage()
├── i18next-scanner.config.cjs
├── next.config.ts              # next + PWA
├── tailwind.config.ts          # HeroUI plugin + theme  ← retheme target
├── eslint.config.mjs
├── tsconfig.json               # strict; alias "@/*" → "./src/*"
├── create-htaccess.js / ftp.js # deploy helpers
├── public/
│   ├── locales/{en,hi,ar}.json
│   └── images/
├── scripts/                    # update-manifest, update-robots, generate-sitemap
└── src/
    ├── SEO/                    # JSON-LD generators
    ├── components/             # ~137 components grouped by domain
    │   ├── Cards/ Cart/ Empty/ Footer/ Functional/ Location/
    │   ├── Modals/ PaymentGateway/ Products/ Seller/ Skeletons/ Tables/
    │   └── custom/             # MyButton, PageHeader, TabButton, banners
    ├── config/                 # constants.ts, fonts.ts, seo.ts, site.ts
    ├── contexts/               # SettingsContext.tsx
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
    │   ├── api.ts              # 1591 lines — EVERY endpoint
    │   ├── interceptor.ts
    │   └── CLAUDE.md
    ├── services/               # homePageService, ProductDetailPageService, adTrackingService
    ├── stores/                 # maintenanceStore.ts (in-memory singleton)
    ├── styles/                 # globals.css, index.css, custom/
    ├── types/                  # ApiResponse/index.ts (1718 lines), params.ts, index.ts
    └── views/                  # composed page bodies (CartPageView, OrderDetailView,
                                #   homePage, Products, WishListPageView, empty)
```

### 3.2 Target structure (modernization)

`NEW` = create · `KEEP` = unchanged · `SPLIT` = decompose in place · `MIGRATE` = move gradually, don't big-bang

```
src/
├── components/
│   ├── ui/                     # NEW ★ HeroUI wrapper layer — the ONLY place
│   │                           #   @heroui/react may be imported
│   │   ├── Button.tsx Input.tsx Card.tsx Chip.tsx Modal.tsx Sheet.tsx
│   │   ├── Skeleton.tsx EmptyState.tsx ErrorState.tsx Toast.tsx
│   │   └── Select.tsx Checkbox.tsx Radio.tsx Switch.tsx Tabs.tsx
│   │       Accordion.tsx Pagination.tsx Tooltip.tsx Badge.tsx
│   │       Avatar.tsx Divider.tsx Spinner.tsx
│   ├── shared/                 # NEW  cross-feature composites ported from Flutter
│   │                           #   QuantityStepper, DeliveryTimeBadge, SponsoredBadge,
│   │                           #   RecommendBadge, DottedDivider, PullToRefresh
│   ├── Cards/ Cart/ Modals/ …  # KEEP (Skeletons/ and Empty/ rebuild on ui/)
│   └── custom/                 # MIGRATE → MyButton folds into ui/Button
├── features/                   # NEW  feature-first modules for all new work
│   └── <feature>/              #   mirrors Flutter's screens/<feature>/
│       ├── components/         #   feature-only UI
│       ├── hooks/              #   feature data hooks (SWR)
│       └── types.ts
├── theme/                      # ✅ DONE (Phase 0)  single source for design tokens
│   ├── tokens.ts               #   Flutter tokens as TS constants
│   └── heroui.ts               #   HeroUI theme object consumed by tailwind.config.ts
├── assets/fonts/               # ✅ DONE (Phase 0)  self-hosted Figtree variable font
├── services/                   # SPLIT  per-domain API modules (products.ts, cart.ts,
│                               #   orders.ts, auth.ts, wallet.ts, …) on the shared instance
├── stores/                     # MIGRATE  redux slices consolidate here conceptually;
│                               #   maintenanceStore stays in-memory
├── types/                      # SPLIT  ApiResponse/index.ts → product.ts, cart.ts,
│                               #   order.ts, user.ts, address.ts, store.ts, wallet.ts, …
├── lib/redux/                  # KEEP  store + slices
├── pages/ views/ layouts/      # KEEP  Pages Router structure is not changing
├── guards/ helpers/ hooks/ config/ contexts/ SEO/ styles/   # KEEP
└── routes/api.ts               # MIGRATE  shrinks to the axios instance + interceptor
                                #   wiring as endpoints move into services/
```

Sequencing and exit criteria for each move are in `../GAP_ANALYSIS.md` §9.

---

## 4. HeroUI usage rules

### 4.1 Wrap everything in `src/components/ui/`

The layer exists (Phase 1). Import from `@/components/ui`.

- **No *new or edited* file outside `src/components/ui/` may `import … from "@heroui/react"`.** One wrapper per primitive means behavior, a11y defaults, and Flutter parity get fixed once.
- **Legacy files are migrated opportunistically**, not in a sweep — 162 still import HeroUI directly. Convert a file when you touch it for another reason; never open a standalone "migrate imports" commit across unrelated screens.
- `ui/index.ts` exports two kinds of thing: **wrapped** primitives that carry Flutter parity (`Button`, `Input`, `Textarea`, `Card`, `Chip`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorState`, `toast*`) and **pass-through** re-exports that need no behavior change. Both come from the same import.
- When extending a HeroUI prop type, `Omit` any key you redeclare — `size` on Button, and `title` / `placement` / `scrollBehavior` on Modal — or `tsc` fails with TS2430.
- Wrappers re-export HeroUI's prop types and add only what Flutter needs. Do not invent props with no Flutter counterpart.
- Use `extendVariants` (as `components/custom/MyButton.tsx` already does) or `tailwind-variants` for variant maps — not conditional class soup at call sites.

### 4.2 Theme through Tailwind config only

- All tokens live in `src/theme/tokens.ts`, are shaped into a HeroUI theme in `src/theme/heroui.ts`, and are consumed by the `heroui()` plugin in `tailwind.config.ts`.
- Never restyle a HeroUI component by overriding its colors at the call site. If a color is wrong, the theme is wrong.
- Both `light` and `dark` themes must be defined. Dark mode uses the **4-level elevation system** — never flat `#000000`.

### 4.3 Match Flutter exactly

| Element | Flutter reference | Required behavior |
|---|---|---|
| **Button** | `lib/utils/widgets/custom_button.dart` | radius **8**, `shadow-none`, height **48** mobile / **40** tablet+, bg `#FFB616`, fg `#000000`, disabled = primary @ 50%, loading = inline 20px spinner replacing the label (never a separate overlay) |
| **Input** | `theme.dart` `inputDecorationTheme` | radius **12**, **filled**, border `0.5px` outline → focused `1px` `#FFB616`, hint color `#6B6B6B` dark. Fill = L1 dark / `#F7FAFC` light |
| **Card** | `theme.dart` `cardTheme` | radius **12**, `elevation 0` → `shadow-none`, hairline `0.5px` border, **zero margin** (parent owns spacing) |
| **Chip** | Flutter chip usages | pill radius, L3 surface (`#2E2E2E` dark), no shadow |
| **Modal / Sheet** ✅ | `lib/utils/widgets/*_bottom_sheet.dart` | **Desktop → centered HeroUI `Modal`. Mobile → bottom `Drawer`** with top radius **16**, drag handle, and backdrop dismiss. `ui/Sheet` picks the presentation off `useScreenType()`. **Use it instead of `Modal`** for anything the app shows as a sheet |
| **Divider** | `theme.dart` `dividerTheme` | `0.5px`, `rgba(255,255,255,.06)` dark / `#E0E0E0` light, zero space |
| **Bottom nav** | `theme.dart` `bottomNavigationBarTheme` | bg `#111111`, active `#FFB616`, inactive `#6B6B6B`, no elevation |

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
- **No arbitrary values** (`[14px]`, `[#FFB616]`) unless the token genuinely doesn't exist — in which case **add the token** to `tailwind.config.ts` and use it. ~100 arbitrary values exist today; treat them as debt.
- No hard-coded hex anywhere in `src/` outside `src/theme/`. This includes `globals.css`.
- Use `clsx` for conditional classes.
- `globals.css` is for resets and third-party overrides only — not component styling.

### Do not
- `import axios from "axios"` in a component — go through `src/services/` (or `src/routes/api.ts` until it's split).
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

### 6.1 Always reference Flutter
Before building or updating any screen, open `hypercommerce-customer-app/lib/screens/<feature>/view/` and the widgets it uses in `lib/utils/widgets/`. Match layout order, spacing rhythm, copy, and interaction. Note any deliberate deviation in your summary.

### 6.2 Responsive behavior

Breakpoints (already in `tailwind.config.ts`): `xxs 320 · xs 375 · sm 431 · md 769 · lg 1440 · xl 1800 · xxl 2550`. Use `useScreenType()` for behavior that can't be expressed in CSS.

| Range | Requirement |
|---|---|
| Mobile (`< md`) | **1:1 with Flutter** — same layout, same order, same component shapes. Sheets not modals. Bottom nav visible |
| Tablet (`md`–`lg`) | 2-column: content + secondary panel (filters, summary, related) |
| Desktop (`≥ lg`) | Multi-column with persistent sidebars — category/filter sidebar left, cart/summary right where relevant. Header nav replaces bottom nav |

Never let desktop layout logic degrade the mobile experience. Mobile-first classes, desktop as the override.

### 6.3 Every screen ships four states

No screen is complete without all four:

1. **Loading** — a `ui/Skeleton` composition that mirrors the final layout (matching Flutter's `custom_shimmer.dart`). Never a bare spinner for full-page loads.
2. **Empty** — `ui/EmptyState` with illustration, headline, body, and a primary action. Mirrors `lib/utils/widgets/empty_states_page.dart`.
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

- **No direct fetches inside components.** Components receive props or call a hook. Hooks call `src/services/*`. Services use the shared axios instance.
- One axios instance, created in `src/routes/api.ts`, interceptors from `src/routes/interceptor.ts` (auth header injection, 401 → logout, 503 → maintenance).
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

Web already sends the header — `src/routes/interceptor.ts:37-50` and `src/routes/api.ts:102`. `src/contexts/SettingsContext.tsx` exposes market-scoped settings and currency; `src/hooks/useInfiniteData.ts` is market-aware.

Rules:
- Never fetch catalog data outside the shared axios instance — you would lose the `X-Market` header and silently get default-market data.
- Never hard-code a currency symbol or format; read it from `SettingsContext`.
- **Switching market invalidates all catalog caches** — products, categories, brands, stores, home layout, search. Flutter does this via a broadcast stream in `market_service.dart`; web must mirror it by clearing the corresponding SWR keys.
- **Market ≠ store.** A market is a country/region storefront scope. A store is a seller location. There is no store picker in the app; do not build one.

The picker UI (`MarketPickerSheet`) does not exist yet — Phase 8. Reference: `hypercommerce-customer-app/lib/screens/market_picker/market_picker_bottom_sheet.dart`.

### 7.5 Protected routes
Add the path to `PROTECTED_ROUTES` in `src/guards/authGuard.ts` **and** call `serverSideAuthGuard(context)` in that page's `getServerSideProps`. The SSR guard is primary; the `withAuth` HOC is a client-side fallback.

---

## 8. Git and workflow

- **One branch per feature phase**, named after the phase in `../GAP_ANALYSIS.md` §9 (e.g. `feat/ui-primitives`, `feat/auth-screens`).
- **Commit after each screen** is complete — building, themed, and with all four states (§6.3). Not at the end of the phase.
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
| `src/components/CLAUDE.md` | component contract | ⚠️ **partly stale** |

`src/components/CLAUDE.md` lists `components/Pages/` and `components/product/` (neither exists) and `Functional/ClientOnly.tsx` / `IfAuthenticated` (neither exists). It also says "HeroUI first — use it," which is superseded once the `ui/` layer lands: **import HeroUI only inside `src/components/ui/`, and consume `ui/` everywhere else.** Refresh that file during Phase 1.

### Before every task
1. Read this file, `/CLAUDE.md`, `../GAP_ANALYSIS.md`, and the nearest subfolder `CLAUDE.md`.
2. Open the Flutter counterpart screen.
3. Find the closest existing web page and mirror its SSR + view + component split. `src/pages/products/[slug]/` is the canonical pattern; `src/pages/my-account/orders/` is the protected paginated-list pattern.

### After every task
1. `npm run lint`
2. `npm run scan:i18n` if translation keys changed
3. Confirm `store.ts` + persist allowlist if a slice changed
4. Add any new env var to `.env.example`
5. Flag any API contract change — **the Flutter app breaks silently**

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
2. **No HeroUI default theme colors.** Amber `#FFB616` is the brand. Blue `#3b82f6` anywhere in the codebase is a bug.
3. **No new dependency without recording it in §2 of this file** — in the same commit that adds it. Justify it; prefer what's already installed.
4. **No scope creep.** Do exactly the screen or fix that was asked. Note anything else you spot and move on.
5. **No skipping the Flutter reference.** If you did not open the Flutter screen, you are guessing.
6. **No App Router.** Pages Router only.
7. **No direct `@heroui/react` imports outside `src/components/ui/`** (once that layer exists).
8. **No bypassing the data layer** — no axios in components, no `localStorage` outside redux-persist, no hard-coded API URLs.
9. **No screen without loading, empty, and error states.**
10. **No structural change** (folder moves, state-management swaps, router changes, major version bumps) without explicit approval.
11. **No delivery zones.** The feature is being removed from the Flutter app too. Do not port `/delivery-zones` or `/delivery-zone-detail`, and do not flag their absence as a gap.
12. **No store picker.** The app has a *market* picker, not a store picker. Do not conflate the two (§7.4).
13. **No custom font-weight scale.** Tailwind defaults map 1:1 to Figtree's six faces.

---

_Rewritten 2026-07-21 from a full audit of this codebase and `hypercommerce-customer-app/`. Update when the router model, HeroUI theme, state layout, folder structure, or i18n approach changes._
