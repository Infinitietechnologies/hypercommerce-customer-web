# Project Instructions for Claude AI — Customer Web (Next.js)

> **Purpose:** Single source of truth for the **customer-facing storefront** (Next.js). Read **`/CLAUDE.md`** at the repo root first for system-wide context and vocabulary, then read this file before touching anything under `hypercommerce-customer-web/`.

---

## 1. App overview

**Name:** `hyper-local` (web storefront)
**Type:** Customer storefront for the hypercommerce marketplace — browse, cart, checkout, orders, wallet, wishlist, account, referrals. SSR-first with `getServerSideProps`. (Migrated off the old hyperlocal delivery-zone model.)
**Stack:**
- **Framework:** Next.js 16 (**Pages Router** — NOT App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) + HeroUI (`@heroui/react`, `@heroui/system`, `@heroui/theme`).
- **State:** Redux Toolkit + redux-persist (`src/lib/redux/`); SWR for some live data; localStorage avoided by convention except where needed.
- **Routing:** File-based via `src/pages/*.tsx`.
- **HTTP:** Axios via `src/routes/api.ts` (one Axios instance, with interceptor).
- **i18n:** `i18next` + `react-i18next`, JSON bundles in `public/locales/{en,hi,ar}.json`. Arabic forces RTL.
- **Auth:** Firebase Auth (phone OTP + Google + Apple) + Sanctum bearer token in cookies.
- **Payments:** Stripe (`@stripe/stripe-js` + `@stripe/react-stripe-js`), Razorpay (`razorpay_flutter`-equivalent via inline SDK in script tag — see `PaymentGateway/`), Paystack, Flutterwave (via redirect).
- **PWA:** `@ducanh2912/next-pwa`.
- **Analytics:** `@vercel/speed-insights` + custom `src/lib/analytics.ts` + `src/services/adTrackingService.ts`.

### Backend
Talks to the Laravel panel at `process.env.NEXT_PUBLIC_ADMIN_PANEL_URL + '/api/...'`. See `src/routes/api.ts` `constructApiBaseUrl()`. Customer endpoints live in panel's `routes/api.php` → `app/Http/Controllers/Api/User/*` + shared API controllers.

---

## 2. Directory map

```
hypercommerce-customer-web/
├── i18n.ts                    # i18next init + changeLanguage(); loaded at app root
├── i18next-scanner.config.cjs # config for npm run scan:i18n
├── next.config.ts             # next + PWA config
├── tailwind.config.ts
├── public/
│   ├── locales/               # en.json / hi.json / ar.json
│   ├── images/
│   └── ...
├── scripts/                   # update-manifest, update-robots, generate-sitemap (run in `npm run build`)
└── src/
    ├── SEO/                   # JSON-LD helpers
    ├── components/            # presentation components, grouped by domain (Cards, Cart, Footer, Modals, …)
    ├── config/                # constants, fonts, site, seo defaults
    ├── contexts/              # React contexts
    ├── guards/                # authGuard (SSR) + withAuth (HOC)
    ├── helpers/               # auth, events, getters, updaters, validator, notificationUrl, seo
    ├── hooks/                 # custom hooks (useAdTracking, useDebouncedValue, useInfiniteData, useRecentSearches, useScreenType)
    ├── layouts/               # DefaultLayout, UserLayout (account sidebar)
    ├── lib/
    │   ├── analytics.ts       # GA + custom event tracking
    │   ├── cookies.ts         # SSR + client cookie helpers
    │   ├── firebase.ts        # Firebase Auth init + recaptcha helpers
    │   └── redux/             # ReduxProvider, store, slices
    ├── pages/                 # FILE-BASED ROUTES — every page is here
    │   ├── _app.tsx           # root: HeroUI, Theme, Redux, ToastProvider, ProgressBar, page-view tracking
    │   ├── _document.tsx
    │   ├── index.tsx          # home page
    │   ├── products/[slug]/   # PDP via dynamic route
    │   ├── my-account/        # account hub + sub-pages (orders, addresses, wallet, transactions, refer-and-earn, wishlists, notifications)
    │   └── ...
    ├── routes/
    │   ├── api.ts             # ALL API CALLERS — axios instance + every endpoint function
    │   └── interceptor.ts     # axios interceptors (auth header injection, 401 → logout, 503 → maintenance)
    ├── services/              # higher-level orchestration (homePage data aggregation, ad-tracking, PDP)
    ├── stores/                # standalone Zustand-shaped singletons (e.g. maintenanceStore)
    ├── styles/                # tailwind + globals
    ├── types/                 # ApiResponse types + helper types
    └── views/                 # composed views per page (CartPageView, OrderDetailView, homePage, Products, WishListPageView, empty)
```

---

## 3. Architecture & coding rules

### 3.1 Pages Router, not App Router
This repo uses the **Pages Router** (`src/pages/*.tsx`). Do NOT introduce App Router files (`app/`, `route.ts`, `layout.tsx`). All data fetching is server-side via `getServerSideProps` (preferred for personalised, location-aware pages) or static via `getStaticProps` where allowed.

### 3.2 Pages → Views → Components (presentational separation)
- **`pages/<route>.tsx`** is a thin shell. It:
  - Implements `getServerSideProps` (fetches data, runs `serverSideAuthGuard` if protected).
  - Renders the matching view component from `src/views/`.
  - Sets the layout via the `getLayout` static method.
- **`views/`** holds the page's composed UI — fetches client-side via SWR or props, manages component composition.
- **`components/`** are the building blocks (Cards, Modals, Cart pieces, Skeletons, …). No data-fetching logic; props in, JSX out.

This separation keeps SSR concerns isolated and components reusable.

### 3.3 HTTP — one axios instance, all in `src/routes/api.ts`
- **Every** backend call goes through `src/routes/api.ts`. Don't `import axios from 'axios'` in a component.
- The axios instance is created in `api.ts` and has interceptors attached via `setupInterceptors` (`src/routes/interceptor.ts`).
- The base URL is built from `process.env.NEXT_PUBLIC_ADMIN_PANEL_URL` via `constructApiBaseUrl()`.
- Each endpoint is a named export (e.g. `getProducts(params)`, `addToCart(payload)`, `getMyOrders(params)`). Return shape uses the typed response (`ApiResponse<T>`, `PaginatedResponse<T>`).
- Use **fallback constants** from `src/config/constants.ts` (e.g. `fallbackPaginateRes`, `fallbackApiRes`) when a network call fails server-side — that way SSR never crashes a page.

### 3.4 Auth flow
- Login methods: email/password, phone OTP (Firebase), Google, Apple.
- `src/helpers/auth.ts` contains the canonical helpers: `phoneLogin`, `googleSignIn`, `appleSignIn`, `loginHelper`, `registerHelper`, `verifyUserHelper`, `handleLogout`.
- After a successful login: token goes into a cookie (`access_token`), Redux `authSlice` updates with user data, offline cart syncs to server.
- **Protected routes**: `src/guards/authGuard.ts::PROTECTED_ROUTES` lists them. `serverSideAuthGuard(context)` redirects to `/?auth=required` when the cookie is missing — call it inside `getServerSideProps` for protected pages.
- `withAuth` HOC handles client-side redirects (less preferred; SSR guard is the primary).

### 3.5 Redux Toolkit
- Store: `src/lib/redux/store.ts`.
- Provider: `src/lib/redux/ReduxProvider.tsx` (wrapping `_app.tsx`).
- Slices in `src/lib/redux/slices/`:
  - `authSlice` — user/token state.
  - `cartSlice` — server cart mirror.
  - `offlineCartSlice` — pre-login cart, persisted via redux-persist.
  - `checkoutSlice` — checkout-step state.
  - `recentlyViewedSlice` — recently viewed products.
  - `searchSlice` — search history.
- **redux-persist** stores `auth`, `offlineCart`, `recentlyViewed`, `search` in `localStorage`.

**When you add new global state:**
1. Create a new slice in `src/lib/redux/slices/`.
2. Add it to the root reducer in `store.ts`.
3. If it should persist, add the key to the persist allowlist.

### 3.6 i18n
- Init in `i18n.ts` (top-level). Loaded at the top of `_app.tsx`.
- JSON bundles in `public/locales/{en,hi,ar}.json`.
- `changeLanguage(lng)` persists choice in cookie and flips `document.dir` to `rtl` for `ar`.
- **Every** user-facing string MUST be `t('namespace.key')` — never inline English. Run `npm run scan:i18n` to surface missing keys.
- When adding a new key: add it in **all** locale JSON files (even if value is placeholder).

### 3.7 Theme (HeroUI + next-themes)
- `next-themes` `ThemeProvider` wraps the app in `_app.tsx`. Default theme: `system`.
- HeroUI provides components — use HeroUI components over hand-rolled UI when one exists (Button, Input, Modal, Card, Toast).
- Tailwind v4 + HeroUI tokens — don't introduce a parallel design system.

### 3.8 SEO
- `src/SEO/` holds JSON-LD generators (product, breadcrumb, organisation).
- `src/config/seo.ts` + `src/helpers/seo.ts` build the default head tags.
- `scripts/generate-sitemap.mjs` runs during `npm run build` to produce `public/sitemap.xml`.
- Every public page MUST set `<title>` and `<meta name="description">` via the SEO helper.

### 3.9 PWA / offline
- `@ducanh2912/next-pwa` builds the service worker.
- `src/components/OfflinePage.tsx` handles the offline UX.
- `scripts/update-manifest.mjs` keeps the manifest in sync at build time.

### 3.10 Analytics & ad tracking
- `src/lib/analytics.ts` exposes `trackPageView`, `trackLogin`, `trackSignUp`, `setAnalyticsUserId`, `setAnalyticsUserProperties`. Wired in `_app.tsx`.
- `src/services/adTrackingService.ts` batches ad impressions/clicks and posts them to the panel's `AdEventService`.
- **Never** log tokens, passwords, OTPs, PII.

### 3.11 Maintenance mode
- `src/stores/maintenanceStore.ts` holds `{ isMaintenance, message }`.
- `src/routes/interceptor.ts` flips it when the panel returns 503 with `{ maintenance: true, message }`.
- A maintenance banner / page renders globally.

### 3.12 Payments
- Stripe: `@stripe/react-stripe-js` Elements + create-intent endpoint.
- Razorpay: inline checkout via window-level SDK loaded in `_document.tsx` or on-demand.
- Paystack/Flutterwave: hosted redirect.
- All payment flows start with the panel creating a session — **never** call gateway create-order endpoints client-side.

### 3.13 Cookies vs Redux vs localStorage
- **Cookies**: auth token (`access_token`), language preference (`i18nextLng`). Cookies are readable both SSR and client.
- **Redux + redux-persist**: cart, recent products, search history, auth user object.
- **localStorage**: only via redux-persist (which uses it under the hood). Don't write to `localStorage` directly except in marked exceptions.
- **maintenanceStore**: in-memory only.

### 3.14 Forbidden patterns
- Don't `import axios from 'axios'` in a component — import from `src/routes/api.ts`.
- Don't open new routes in `app/` (Pages Router only).
- Don't write to `localStorage` directly outside redux-persist.
- Don't hard-code the API base URL — read from env via `constructApiBaseUrl`.
- Don't return `success: false` data and let it silently break the page — wrap with the fallback constants in `src/config/constants.ts`.
- Don't render UI that depends on `window` outside `useEffect` — SSR will hydrate-mismatch.

---

## 4. Workflow rules for Claude

Before writing code:
1. Read `/CLAUDE.md` (root) + this file + subfolder CLAUDE.md.
2. Find the existing analogous page (e.g. `pages/products/[slug]/`) and mirror its SSR + view + component split.
3. Confirm the panel endpoint shape — `hypercommerce-panel/app/Http/Controllers/Api/User/*` or shared API controllers.

While coding:
4. Endpoint function → `src/routes/api.ts`. Page shell → `src/pages/*`. Composed UI → `src/views/*`. Reusable bits → `src/components/*`.
5. Use `t('...')` for every user-facing string; add the key to all locale JSON files.
6. Use Redux for global state; SWR for revalidated server data; component-local state for ephemeral UI.
7. Wrap protected pages with `serverSideAuthGuard` in `getServerSideProps`.
8. Keep comments minimal and short. **Never mention Claude, AI, assistants, or prompts.**

After coding:
9. `npm run lint` (auto-fixes some issues).
10. `npm run scan:i18n` if you added translation keys — confirm the scanner found them.
11. If a slice changed: confirm `store.ts` and the persist allowlist were updated.
12. If you added env vars: add them to `.env.example`.
13. Flag any change to the API response contract in the task summary — mobile clients break silently.

Must NOT:
- Switch to App Router.
- Hard-code env values, currency, status strings.
- Bypass `src/routes/api.ts`.
- Use `localStorage` directly outside redux-persist.

---

## 5. Naming conventions

- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities, `kebab-case` only inside `pages/` URL segments.
- Components: function components, default export.
- Types: explicit interfaces in `src/types/ApiResponse/` matched 1:1 with panel `app/Http/Resources/` shapes.
- Slices: `camelCaseSlice` files; exported `actions` are `camelCase` verbs.
- Hooks: `useFoo` (camelCase prefix `use`).

---

## 6. Common tasks playbook

| Task | Steps |
|---|---|
| Add a new page | (1) Create `src/pages/<route>.tsx` shell with `getServerSideProps` (2) Create matching `src/views/<view>.tsx` (3) Add endpoint to `src/routes/api.ts` (4) Add translation keys to all locale JSONs |
| Add a new API endpoint | (1) Add function in `src/routes/api.ts` with typed response (2) Add type to `src/types/ApiResponse/` matching the panel resource (3) Add fallback in `src/config/constants.ts` if SSR-critical |
| Add a protected route | (1) Append the path to `PROTECTED_ROUTES` in `src/guards/authGuard.ts` (2) Call `serverSideAuthGuard(context)` in `getServerSideProps` |
| Add a Redux slice | (1) Create slice in `src/lib/redux/slices/` (2) Add reducer to `store.ts` (3) If persist needed, add key to allowlist |
| Add a translation key | Add to `public/locales/en.json` AND `public/locales/hi.json` AND `public/locales/ar.json`; use `t('key')` in component |
| Wire a new push deep link | Add to `src/helpers/notificationUrl.ts` and ensure FCM payload routes to it |

---

## 7. When in doubt

- Mirror an existing page. `src/pages/products/[slug]/` is the canonical SSR + PDP pattern.
- Account pages? `src/pages/my-account/orders/` shows the protected-route + paginated-list pattern.
- Cart/checkout? `src/views/CartPageView/` + `src/lib/redux/slices/cartSlice.ts` + `src/lib/redux/slices/offlineCartSlice.ts`.

_Last updated: 2026-05-26. Update when the Pages-vs-App router, axios setup, Redux/slice layout, or i18n approach changes._
