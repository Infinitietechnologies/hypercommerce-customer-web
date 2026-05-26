# `src/` — Customer Web source tree

Parent: `hypercommerce-customer-web/CLAUDE.md`. This file is a **navigation map**.

```
src/
├── SEO/                # JSON-LD generators (product, breadcrumb, organisation)
├── components/         # presentational components, grouped by domain (Cards, Cart, Footer, Modals, …)
├── config/             # constants, fonts, site, seo defaults
├── contexts/           # React contexts
├── guards/             # authGuard (SSR redirect for protected routes) + withAuth HOC
├── helpers/            # auth, events, getters, updaters, validator, notificationUrl, seo
├── hooks/              # custom hooks (useAdTracking, useDebouncedValue, useInfiniteData, useRecentSearches, useScreenType)
├── layouts/            # DefaultLayout (full-width), UserLayout (account sidebar)
├── lib/                # analytics, cookies, firebase, redux/
├── pages/              # FILE-BASED ROUTES (Pages Router)
├── routes/             # api.ts (all backend callers) + interceptor.ts
├── services/           # page-level data orchestration (homePage, PDP, ad-tracking)
├── stores/             # standalone in-memory singletons (e.g. maintenanceStore)
├── styles/             # tailwind + globals
├── types/              # ApiResponse, params, helper types
└── views/              # composed page views (CartPageView, OrderDetailView, homePage, Products, WishListPageView, empty)
```

## Where to put new code

| Adding… | Goes in… |
|---|---|
| A new URL/page | `pages/<route>.tsx` (shell) + `views/<View>` (composition) + endpoint in `routes/api.ts` |
| A reusable presentational component | `components/<Domain>/` (e.g. `components/Cards/`) |
| A backend endpoint caller | `routes/api.ts` (named export) |
| Cross-page state | `lib/redux/slices/` + register in `store.ts` |
| In-memory singleton (no persistence) | `stores/<feature>Store.ts` |
| A new hook | `hooks/useFoo.ts` |
| A SSR data orchestrator | `services/<page>Service.ts` |
| A pure utility (date / format / parse) | `helpers/<name>.ts` |
| A protected-route check | extend `PROTECTED_ROUTES` in `guards/authGuard.ts` |

## Critical files to know

- **`pages/_app.tsx`** — root: HeroUI + theme + Redux + ToastProvider + ProgressBar + page-view tracking.
- **`routes/api.ts`** — every backend call; axios instance; the only place `axios` is imported from `'axios'`.
- **`routes/interceptor.ts`** — request header injection (Bearer token from cookie or param), 401 → logout, 503 → maintenance store flip.
- **`lib/redux/store.ts`** — root reducer + redux-persist allowlist.
- **`guards/authGuard.ts`** — `PROTECTED_ROUTES` array + `serverSideAuthGuard()`.
- **`config/constants.ts`** — SSR-safe fallback payloads (`fallbackPaginateRes`, `fallbackApiRes`, etc.). Use when an SSR API call fails so pages never crash.
- **`stores/maintenanceStore.ts`** — flipped by interceptor on 503; layouts render a banner.
- **`helpers/auth.ts`** — canonical auth helpers (phoneLogin, googleSignIn, appleSignIn, handleLogout).

## Don'ts

- Don't introduce `app/` directory — Pages Router only.
- Don't `import axios from 'axios'` in a component or view.
- Don't write to `localStorage` directly outside redux-persist.
- Don't hard-code env values or the API base URL.
- Don't put data fetching inside `components/` — that's `views/` or `services/`.
- Don't depend on `window` outside `useEffect` — SSR will hydrate-mismatch.
