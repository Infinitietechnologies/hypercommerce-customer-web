# CAVEMAN.md — customer web (Next.js)

Pages Router. NO `src/app/`. SSR-first via `getServerSideProps`.

```
src/pages/<route>.tsx       thin shell. getServerSideProps → fallback on fail → render view.
src/views/<View>            composed UI.
src/components/             props in, jsx out. no fetching.
src/routes/api.ts           ONLY place that imports 'axios'. every endpoint = named export.
src/routes/interceptor.ts   401 logout. 503+maintenance flip. token from cookie/param.
src/lib/redux/slices/       authSlice / cartSlice / offlineCartSlice / checkoutSlice / recentlyViewedSlice / searchSlice
src/lib/redux/store.ts      configureStore + redux-persist allowlist.
src/guards/authGuard.ts     PROTECTED_ROUTES + serverSideAuthGuard(context)
src/config/constants.ts     fallback* shapes — return on SSR fail, never crash.
src/helpers/auth.ts         phoneLogin / googleSignIn / appleSignIn / handleLogout / syncOfflineCartToServer
src/stores/maintenanceStore.ts   in-memory. flipped by interceptor.
public/locales/{en,hi,ar}.json   every key in every locale. ar forces RTL.
```

Page template:
```tsx
export const getServerSideProps = async (ctx) => {
  const guard = await serverSideAuthGuard(ctx);   // protected only
  if (guard) return guard;
  let data; try { data = await getX(); } catch { data = fallbackApiRes; }
  return { props: { data } };
};
```

Two carts: `offlineCart` (logged-out, persisted) + `cart` (logged-in, server mirror). Sync via `helpers/auth.ts`. Never write to both.

UI: HeroUI components first. Tailwind v4. next-themes. No localStorage outside redux-persist.

Don'ts:
- App Router files
- `import axios from 'axios'` outside `src/routes/`
- hardcode API base URL (use NEXT_PUBLIC_ADMIN_PANEL_URL)
- `window.*` outside `useEffect` (SSR mismatch)
- raw English strings (use `t('key')` + scan:i18n)
