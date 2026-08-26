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
├── delivery-zones/           # DEPRECATED — redirect stubs only (hyperlocal removed)
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
import { getAccessTokenFromContext } from '@/helpers/auth';      // for protected routes
import { loginRedirect } from '@/guards/authGuard';
import { getFooData } from '@/services/foo';
import { fallbackApiRes } from '@/config/constants';
import UserLayout from '@/layouts/UserLayout';                   // for my-account/*

const FooBarPage = ({ data }) => <FooBarView data={data} />;

FooBarPage.getLayout = (page) => <UserLayout>{page}</UserLayout>; // optional

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // 1) Auth guard for protected routes
  const access_token = (await getAccessTokenFromContext(context)) || '';
  if (!access_token) {
    return { redirect: { destination: loginRedirect(context), permanent: false } };
  }

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
2. Protected routes check the token first and redirect to `loginRedirect(context)`, which preserves the destination as `?next=`.
3. `getServerSideProps` always returns valid `{ props }` even on API failure — use the fallback constants from `src/config/constants.ts`.
4. Use **`getLayout`** (static method on the component) for non-default layouts (`UserLayout` for account pages).

## Adding a new page

1. Create `src/pages/<route>.tsx` shell.
2. Create matching `src/views/<View>/index.tsx` (or `*.tsx`) with the composed UI.
3. Add the endpoint(s) to `src/services/<domain>.ts`.
4. Add types to `src/types/<domain>.ts`.
5. If protected: guard it in `getServerSideProps` — read the token with `getAccessTokenFromContext(context)` and redirect to `loginRedirect(context)` when it is missing, as `src/pages/my-account/*` do. (`serverSideAuthGuard` and `PROTECTED_ROUTES` exist in `src/guards/authGuard.ts` but nothing calls them — do not assume a route is protected because it appears in that list.)
6. Add translation keys to all three locale JSONs.
7. Run `npm run scan:i18n` to confirm scanner finds your keys.

## Don'ts

- Don't put rendering logic in the page shell — push it to a view.
- Don't put data fetching in components.
- Don't `import axios from 'axios'` — use `src/services/<domain>.ts`.
- Don't `useRouter().push('/protected')` to enforce auth — guard in `getServerSideProps`.
- Don't send an unauthenticated visitor to `/` — redirect to `loginRedirect(context)` so `/login` can return them to where they were going.
- Don't read `process.env.NEXT_PUBLIC_*` in a component — read in `_app.tsx` or in `services/client.ts`.
