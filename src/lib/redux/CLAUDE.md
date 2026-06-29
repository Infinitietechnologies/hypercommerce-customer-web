# `src/lib/redux/` — Redux Toolkit + redux-persist

```
redux/
├── ReduxProvider.tsx     # wraps the app in <Provider store={store}> + PersistGate
├── store.ts              # configureStore + redux-persist allowlist
└── slices/
    ├── authSlice.ts          # user, token, login state
    ├── cartSlice.ts          # server cart (active, logged-in user)
    ├── offlineCartSlice.ts   # pre-login cart (persisted, syncs to server on auth)
    ├── checkoutSlice.ts      # checkout step state (selected address, payment method, promo)
    ├── recentlyViewedSlice.ts
    └── searchSlice.ts        # recent search terms
```

## When to use Redux vs other state

| Need | Use… |
|---|---|
| Logged-in user / token | `authSlice` |
| Cart that survives the session | `cartSlice` (logged-in) + `offlineCartSlice` (logged-out) |
| Checkout funnel state spanning steps | `checkoutSlice` |
| Recently viewed / search history | `recentlyViewedSlice` / `searchSlice` |
| Form state for a single page | Local `useState` |
| Server data with revalidation | SWR (`useInfiniteData` etc.) |
| In-memory flag (no persistence) | `src/stores/<name>Store.ts` (e.g. `maintenanceStore`) |

## Persisted vs ephemeral

`redux-persist` is configured in `store.ts`. The persisted slices are typically `auth`, `offlineCart`, `recentlyViewed`, `search`. **Don't persist `cart`** — it's a server mirror and we always re-fetch on login. **Don't persist `checkout`** — it's transient.

When adding a slice:
1. Create the slice file in `slices/`.
2. Import + register the reducer in `store.ts`.
3. If it should persist, add the key to the persist allowlist in `store.ts`.

## The two-cart pattern (the most common confusion)

There are **two** carts on the client:

- **`offlineCartSlice`** — pre-login. Persisted via redux-persist. Updated by add-to-cart UX when the user is not logged in.
- **`cartSlice`** — post-login. Mirror of the server cart. Refreshed by `getCartApi` calls.

On login (`helpers/auth.ts::syncOfflineCartToServer`), the offline cart is pushed to the server, then the offline cart is cleared, then `cartSlice` is refreshed from the server.

**Rule:** never write code that talks to both carts simultaneously. The sync helper is the single point of orchestration.

## Reading state

```ts
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';

const user = useSelector((s: RootState) => s.auth.user);
```

## Dispatching actions

```ts
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/lib/redux/store';
import { login, logout } from '@/lib/redux/slices/authSlice';

const dispatch = useDispatch<AppDispatch>();
dispatch(login(userData));
```

## Don'ts

- Don't import a slice directly into a deep component — let the **view** own the dispatch/select logic and pass values to the component.
- Don't persist `cart` or `checkout` — they have their own lifecycle.
- Don't `useDispatch()` without typing it as `AppDispatch` (thunk types depend on this).
- Don't read state inside `getServerSideProps` — Redux is client-only here. Pass server-fetched data as props.
