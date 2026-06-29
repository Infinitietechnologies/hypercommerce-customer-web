# `src/routes/` — Axios setup + every backend endpoint

```
routes/
├── api.ts          # ALL backend endpoint functions + axios instance
└── interceptor.ts  # request/response interceptors (auth header, 401, 503/maintenance)
```

This directory is the **only place** that imports `axios` from `'axios'`. Components, views, services, and helpers must import their callers from `@/routes/api.ts`.

## `api.ts` — the contract

- One axios instance, configured at module load.
- Base URL via `constructApiBaseUrl(process.env.NEXT_PUBLIC_ADMIN_PANEL_URL)`. The function handles trailing slashes, validates the URL, and appends `/api`. It falls back to relative `/api` on misconfiguration so module load doesn't crash.
- `setupInterceptors(instance)` is called once at module load.
- Each endpoint is a **named export** that:
  - Builds the URL.
  - Calls `axios.<verb>` with typed body/params.
  - Returns `response.data` typed to `ApiResponse<T>` or `PaginatedResponse<T>`.
  - Provides a sensible fallback on failure (`fallbackApiRes`, `fallbackPaginateRes`, etc. from `@/config/constants`).
- Types live in `src/types/ApiResponse/` and `src/types/params.ts`.

**Convention for adding an endpoint:**
```ts
import { ApiResponse, Foo } from '@/types/ApiResponse';
import { fallbackApiRes } from '@/config/constants';

export const getFoo = async (
  params?: { lat?: string; lng?: string }
): Promise<ApiResponse<Foo>> => {
  try {
    const { data } = await axios.get<ApiResponse<Foo>>(`${baseUrl}/foo`, { params });
    return data;
  } catch (err) {
    return fallbackApiRes as ApiResponse<Foo>;
  }
};
```

## `interceptor.ts` — what it does

**Request interceptor:**
- Reads `access_token` from `config.params.access_token` (SSR path) OR from the cookie (client path). Strips wrapping quotes (`cleanToken`) and injects `Authorization: Bearer <token>`.
- Strips `scope_category_slug=all` because the panel treats absent param as "all".

**Response interceptor:**
- On success: clears maintenance store (panel is back up).
- On 401: calls `handleLogout(false)` from `@/helpers/auth` (client side only).
- On 503 with `{ maintenance: true, message }`: sets `maintenanceStore.setMaintenance(true, message)` — layouts react to it.
- On other errors: logs to console; toast at the call site if needed.

## Rules

- **Don't** call `axios.<verb>` outside this directory.
- **Don't** hand-tune headers per-call — go through the interceptor / `Security`-equivalent flow.
- **Don't** swallow errors silently in the caller — return a fallback so SSR doesn't blow up.
- **Always** type the response. Untyped `any` here ripples through every consumer.
- **Always** strip the token from `config.params` after copying it into the header (SSR pattern; otherwise the token leaks into the URL).

## When the panel changes the response shape

1. Update the matching type in `src/types/ApiResponse/`.
2. Confirm the fallback constant in `src/config/constants.ts` still matches the shape.
3. Update every consumer in `views/`, `pages/`, `components/`.

This is a frequent source of regressions — write a TODO in the PR description listing the affected pages.
