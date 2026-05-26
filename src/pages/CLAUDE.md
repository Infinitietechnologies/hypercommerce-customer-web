# `src/pages/` — File-based routes (Pages Router)

> **Pages Router only.** Do NOT introduce `src/app/`.

```
pages/
├── _app.tsx                  # root: HeroUI + ThemeProvider + Redux + Toast + ProgressBar + analytics
├── _document.tsx
├── index.tsx                 # home page (SSR — banners, brands, categories, sections)
├── 404/                      # custom 404
├── about-us/
├── brands/                   # listing + [slug] PLP
├── cart/                     # PROTECTED — cart, checkout
├── categories/               # category browsing
├── delivery-zones/
├── faqs/
├── feature-sections/         # featured-section detail page
├── forgot-password/
├── my-account/               # PROTECTED hub + sub-pages
│   ├── index.tsx
│   ├── addresses/
│   ├── notifications/
│   ├── orders/               # list, [id]/, returns
│   ├── refer-and-earn/
│   ├── transactions/
│   ├── wallet/
│   └── wishlists/
├── privacy-policy/
├── products/
│   ├── [slug]/               # PDP
│   └── search/               # search results
├── return-refund-policy/
├── seller-register/          # seller onboarding form
├── share/                    # share-back-to-app deep link landing
├── shipping-policy/
├── shopping-list/            # shopping list builder
├── static-products/
├── stores/                   # stores listing + detail
└── terms-and-conditions/
```

## Page anatomy (the rule)

Every page file (`pages/foo/bar.tsx`) is a **thin shell**:

```tsx
import { GetServerSidePropsContext } from 'next';
import { FooBarView } from '@/views/FooBarView';
import { serverSideAuthGuard } from '@/guards/authGuard';        // for protected routes
import { getFooData } from '@/routes/api';
import { fallbackApiRes } from '@/config/constants';
import UserLayout from '@/layouts/UserLayout';                   // for my-account/*

const FooBarPage = ({ data }) => <FooBarView data={data} />;

FooBarPage.getLayout = (page) => <UserLayout>{page}</UserLayout>; // optional

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // 1) Auth guard for protected routes
  const guard = await serverSideAuthGuard(context);
  if (guard) return guard;

  // 2) Server-side data fetch (with fallback so SSR never crashes)
  let data;
  try {
    data = await getFooData({ ... });
  } catch {
    data = fallbackApiRes;
  }

  return { props: { data } };
}

export default FooBarPage;
```

**Rules:**
1. Page shell calls the data helper, hands it to the view, sets the layout. No JSX trees here beyond `<XxxView data={data} />`.
2. Protected routes call `serverSideAuthGuard(context)` first and return the redirect result if non-null.
3. `getServerSideProps` always returns valid `{ props }` even on API failure — use the fallback constants from `src/config/constants.ts`.
4. Use **`getLayout`** (static method on the component) for non-default layouts (`UserLayout` for account pages).

## Adding a new page

1. Create `src/pages/<route>.tsx` shell.
2. Create matching `src/views/<View>/index.tsx` (or `*.tsx`) with the composed UI.
3. Add the endpoint(s) to `src/routes/api.ts`.
4. Add types to `src/types/ApiResponse/`.
5. If protected: add the path to `PROTECTED_ROUTES` in `src/guards/authGuard.ts`.
6. Add translation keys to all three locale JSONs.
7. Run `npm run scan:i18n` to confirm scanner finds your keys.

## Don'ts

- Don't put rendering logic in the page shell — push it to a view.
- Don't put data fetching in components.
- Don't `import axios from 'axios'` — use `src/routes/api.ts`.
- Don't `useRouter().push('/protected')` to enforce auth — use SSR guard.
- Don't read `process.env.NEXT_PUBLIC_*` in a component — read in `_app.tsx` or in `routes/api.ts`.
