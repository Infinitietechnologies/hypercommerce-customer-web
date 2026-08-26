# `src/` — Customer Web source tree

Parent: `hypercommerce-customer-web/AGENTS.md`. This file is a **navigation map**.

```
src/
├── SEO/                # JSON-LD generators (product, breadcrumb, organisation)
├── assets/fonts/       # self-hosted Figtree variable font
├── components/
│   ├── ui/             # ★ the HeroUI wrapper layer — ONLY place @heroui/react is imported
│   └── …               # presentational components by domain (Cards, Cart, Modals, …)
├── config/             # constants, fonts, site, seo defaults
├── contexts/           # React contexts
├── features/           # feature modules for NEW work — mirrors Flutter lib/screens/
├── guards/             # authGuard (SSR redirect for protected routes) + withAuth HOC
├── helpers/            # auth, events, getters, updaters, validator, notificationUrl, seo
├── hooks/              # custom hooks (useAdTracking, useDebouncedValue, useInfiniteData, useRecentSearches, useScreenType)
├── layouts/            # DefaultLayout (full-width), UserLayout (account sidebar)
├── lib/                # analytics, cookies, firebase, redux/
├── pages/              # FILE-BASED ROUTES (Pages Router)
├── routes/             # interceptor.ts + api.ts (now a re-export barrel)
├── services/           # client.ts (the axios instance) + per-domain endpoint modules
├── stores/             # standalone in-memory singletons (e.g. maintenanceStore)
├── styles/             # tailwind + globals
├── theme/              # tokens.ts + heroui.ts — the design tokens
├── types/              # per-domain type modules (ApiResponse/ is now a barrel)
└── views/              # composed page views (CartPageView, OrderDetailView, homePage, …)
```

## Where to put new code

| Adding… | Goes in… |
|---|---|
| A new URL/page | `pages/<route>.tsx` (shell) + `views/<View>` (composition) + endpoint in `services/<domain>.ts` |
| A HeroUI primitive | `components/ui/` — the only place `@heroui/react` may be imported |
| A component for one feature | `features/<feature>/components/` |
| A reusable presentational component | `components/<Domain>/` (e.g. `components/Cards/`) |
| A backend endpoint caller | `services/<domain>.ts` (named export) |
| An API response type | `types/<domain>.ts` |
| A design token | `theme/tokens.ts` — the only place raw hex belongs |
| Cross-page state | `lib/redux/slices/` + register in `store.ts` |
| In-memory singleton (no persistence) | `stores/<feature>Store.ts` |
| A new hook | `hooks/useFoo.ts` |
| A SSR data orchestrator | `services/<page>Service.ts` |
| A pure utility (date / format / parse) | `helpers/<name>.ts` |
| A protected-route check | extend `PROTECTED_ROUTES` in `guards/authGuard.ts` |

## Critical files to know

- **`pages/_app.tsx`** — root: HeroUI + theme + Redux + ToastProvider + ProgressBar + page-view tracking.
- **`services/client.ts`** — the single axios instance; the only place `axios` is imported from `'axios'`.
- **`services/<domain>.ts`** — the endpoint callers, grouped by domain (auth, catalog, cart, orders, wishlist, address, wallet, reviews, notifications, payments, market, home, settings, seller, content, ads).
- **`routes/api.ts`** — a re-export barrel kept so existing imports keep working. Import from the specific service module in new code.
- **`components/ui/index.ts`** — the UI layer; import primitives from here, not `@heroui/react`.
- **`theme/tokens.ts`** — design tokens extracted from the Flutter app.
- **`routes/interceptor.ts`** — request header injection (Bearer token from cookie or param), 401 → logout, 503 → maintenance store flip.
- **`lib/redux/store.ts`** — root reducer + redux-persist allowlist.
- **`guards/authGuard.ts`** — `PROTECTED_ROUTES` array + `serverSideAuthGuard()`.
- **`config/constants.ts`** — SSR-safe fallback payloads (`fallbackPaginateRes`, `fallbackApiRes`, etc.). Use when an SSR API call fails so pages never crash.
- **`stores/maintenanceStore.ts`** — flipped by interceptor on 503; layouts render a banner.
- **`helpers/auth.ts`** — canonical auth helpers (phoneLogin, googleSignIn, appleSignIn, handleLogout).

## Don'ts

- Don't introduce `app/` directory — Pages Router only.
- Don't `import axios from 'axios'` anywhere but `services/client.ts`.
- Don't `import … from '@heroui/react'` outside `components/ui/`.
- Don't add new endpoint callers or types to the `routes/api.ts` / `types/ApiResponse` barrels — they only re-export now.
- Don't write to `localStorage` directly outside redux-persist.
- Don't hard-code env values or the API base URL.
- Don't put data fetching inside `components/` — that's `views/` or `services/`.
- Don't depend on `window` outside `useEffect` — SSR will hydrate-mismatch.
