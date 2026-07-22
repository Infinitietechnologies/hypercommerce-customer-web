# Web storefront — test report

Backend: `https://dev-hypercommerce.spa-point.in` (live, healthy).
Harness: `node scripts/audit-routes.mjs` — see *Running it* at the bottom.

Status legend: 🔴 broken · 🟠 wrong behaviour · 🟡 works but weak · ✅ verified good

---

## 1. Backend health — all green

| Endpoint | Result |
|---|---|
| `/settings` | ✅ 17 setting groups |
| `/categories` | ✅ 10 |
| `/brands` | ✅ 5 |
| `/stores` | ✅ 6 |
| `/markets/products` | ✅ 15 |
| `/faqs` | ✅ 200, **0 items** (no content seeded) |
| `/home-layout?platform=app` | ✅ **5 sections** |
| `/home-layout?platform=web` | ⚠️ **1 section** |

Authenticated as `user@gmail.com` (id 3):

| Endpoint | Result |
|---|---|
| `/user/profile` | ✅ |
| `/user/orders` | ✅ 15 |
| `/user/addresses` | ✅ 4 |
| `/user/wishlists` | ✅ 1 |
| `/user/wallet/transactions` | ✅ 15 |
| `/user/order-transactions` | ✅ 15 |
| `/user/promos/available` | ✅ 3 |
| `/user/notifications` | ✅ |
| `/user/cart` | 🟠 `success:false` — see 2.4 |

**The backend is not the blocker.** Every failure below is web-side.

---

## 2. Defects found

### 2.1 ✅ FIXED — Two account pages had no auth check at all

`src/pages/my-account/notifications/index.tsx` and `.../refer-and-earn/index.tsx` contain **zero `getServerSideProps`**. Signed out, they return **200** and render the account shell instead of redirecting; the other seven account pages redirect correctly.

```
/my-account/notifications/   200   ← expected 307 → /login
/my-account/refer-and-earn/  200   ← expected 307 → /login
```

No server data leaks (their fetches happen client-side and 401), but the auth boundary is inconsistent and a signed-out visitor lands on a broken-looking page rather than the login screen.

**Fixed.** Both now use the same guard as the other account pages. Verified:

```
/my-account/notifications/   307 → /login?next=%2Fmy-account%2Fnotifications%2F
/my-account/refer-and-earn/  307 → /login?next=%2Fmy-account%2Frefer-and-earn%2F
```

### 2.2 ✅ FIXED — `/feature-sections/` redirected to a 404

```
/feature-sections/  307 → /products/
/products/          404
```

A dead redirect chain: the stub pointed at `/products/`, which does not exist.

**Root cause: the featured-sections API was removed from the panel entirely** — `routes/api.php` now exposes only `/home-layout` and `/home-layout/sections/{section}`. The feature was replaced by the home-layout builder.

**Fixed by deleting the dead surface**, not by repointing the redirect:

- `pages/feature-sections/` (both routes)
- `views/homePage/HomeFeaturedSections.tsx`, `components/Cards/SectionCard.tsx`, `components/Skeletons/SectionCardSkeleton.tsx` — all orphaned
- `SectionType` and `FeaturedSection` types
- the sitemap entry, and the refetch branches in `helpers/events.ts` and `helpers/updators.ts`
- `feature-sections` breadcrumb labels in all three locales

Push notifications of type `featured_section` previously deep-linked to the dead route; they now land on the home page, in both `helpers/notificationUrl.ts` and `public/firebase-messaging-sw.js`.

`/feature-sections/` now returns a clean 404.

### 2.3 ✅ FIXED — Category detail rendered with `initialCategory: null`

`/categories/<slug>/` returned 200 with content, but the SSR payload carried `initialCategory: null` — on **every** category page.

**Root cause:** the page did `getCategories({ slug }).data.data.find(c => c.slug === slug)`. But passing `slug` to `/api/categories` makes the endpoint return that category's **children**, with the category itself in a separate `main_category_data` key (`CategoryApiController::index`). The `find` could therefore never match, and the page silently fell back to a slug-derived title on every category.

**Fixed** to read `main_category_data`. Verified — `/categories/accessories-1/` now ships `initialCategory: {"id":25,"title":"Accessories"}`.

⚠️ **Remaining API gap:** `main_category_data` carries only `id`, `title`, and `search_labels`. The page also wants `description`, `image`, and `metadata` for SEO, and the endpoint does not expose them for a category fetched by slug. Those still fall back. Worth raising with the API owner.

### 2.4 🟠 Empty cart is reported as a failure

`/user/cart` returns:

```json
{ "success": false, "message": "Your cart is empty", "data": [] }
```

An empty cart is a **normal state**, not an error. Any client branching on `success` will show an error state where an empty state belongs. Web must special-case it — or better, the panel should return `success: true` with an empty array.

Flag to the API owner: **the mobile app has the same problem**, so changing it is a cross-client contract change.

### 2.5 🟡 The web home layout has one section; the app has five

```
/home-layout?platform=app  → 5 sections
/home-layout?platform=web  → 1 section (banners)
```

Not a code defect — the web layout simply has not been composed in the admin builder. But it means **the web home page is nearly empty right now**, and any visual comparison against the app will mislead until someone builds the web layout in the back office.

### 2.6 🟡 Auth pages render almost nothing server-side

```
/login/         167 chars of text
/register/      260 chars
/verify-email/  117 chars
```

These render client-side, so the SSR HTML is effectively blank. Consequences: no content without JS, a visible flash before hydration, and nothing for crawlers. Acceptable for `/verify-email` (private), weak for `/login` and `/register`.

### 2.7 ✅ NOT A DEFECT — `/404/` returns 404

This was my harness being wrong, not the app. A 404 page returning HTTP 404 is correct; the audit now asserts that explicitly rather than flagging it.

### 2.8 🟡 `error: null` in SSR props

`/faqs/` and `/my-account/addresses/` ship `error: null` in `pageProps`. Harmless, but it means the pages have an error channel that is never surfaced to the user — worth checking those pages actually render an error state when the fetch fails.

### 2.9 ✅ FIXED — Unknown slugs returned 200 instead of 404

`/products/`, `/categories/`, `/brands/` and `/stores/` all answered **200** for
slugs that do not exist. The category and brand cases were the damaging ones:

```
/categories/accessories-1/       total=36    ← correct
/categories/this-does-not-exist/ total=325   ← the ENTIRE catalogue
/brands/this-does-not-exist/     total=325   ← same
```

The products endpoint ignores an unrecognised filter rather than rejecting it,
so a nonsense slug rendered every product as if it belonged to that category or
brand. Search engines would index unlimited such URLs.

**Shared root cause — worth remembering.** This API reports "not found" as
`success: false` with **`data: []`**, and an empty array is **truthy** in JS. So
`data ?? null` keeps the empty array and every `if (!product)` guard downstream
reads it as a real record. That is why the product page's existing `notFound`
branch never fired. It also broke the `main_category_data` fix in 2.3, which had
the same flaw.

All four now verify a real record before rendering. Verified: bad slugs 404,
real slugs unchanged.

### 2.10 ✅ NOT A DEFECT — order detail

An earlier run reported `order: null` on `/my-account/orders/129/`. That was my
error: the route keys off the order **slug** (`order-1784711027-3`), not the id.
With the correct slug the page renders fine. The audit now uses real slugs.

---

## 3. Verified working

| Area | Evidence |
|---|---|
| Home | 200, 2 498 chars, 60 links, 34 images — real brands, categories, stores |
| Category list / detail | 200 with product grids |
| Brand list / detail | 200, real brands |
| Store list / detail | 200, real stores |
| Search | 200, 89 links |
| PDP | 200 — multi-variant 3 251 chars, single-variant 3 176 chars |
| Order detail | 200 with real data (keyed by order slug) |
| Unknown slugs | 404 across product, category, brand, store |
| Cart (signed out) | 200 |
| All policy/static pages | 200 with real content |
| Seller register | 200 |
| Auth redirect chain | `/my-account/*` → `/login?next=<destination>`, destination preserved |
| Account area (signed in) | all 9 pages 200 with real data — orders 3 553 chars, wallet, transactions, addresses, wishlists |
| Theme tokens | `--heroui-primary` = `#ffb616`, dark elevation correct |
| Production build | compiles, 33 routes |

---

## 4. Not yet covered

The harness checks routes, status, and whether data rendered. It does **not** yet exercise:

- **Write flows** — add to cart, quantity change, promo code, place order, payment gateways (Stripe/Razorpay/Paystack/Flutterwave), cancel/return, review submission, address create/edit/delete, wishlist create/move, wallet top-up, profile update.
- **Auth flows end to end** — register, phone OTP (both Firebase and panel-SMS gateways), Google/Apple sign-in, forgot-password, email verification.
- **Client-side behaviour** — filters, sort, infinite scroll, variant/addon selection, market switching, language switching and RTL, cart sync from offline to server on login.
- **Visual correctness** — nothing here proves a page *looks* right, only that it rendered content.

Payments and order placement need care: they mutate real data on the dev backend. Worth agreeing what is safe to exercise before automating those.

---

## 5. Suggested order of work

1. Fix 2.1 (auth guard) — smallest change, clearest correctness win.
2. Fix 2.2 (dead redirect) — user-visible 404.
3. Investigate 2.3 (`initialCategory: null`) — silent partial failure.
4. Decide on 2.4 (empty-cart contract) with the API owner, since it affects the app too.
5. Compose the web home layout in the admin (2.5) so the home page is testable.
6. Then move to write-flow coverage from section 4.

---

## Running it

```bash
# signed out
node scripts/audit-routes.mjs

# including the account area
AUDIT_EMAIL=user@gmail.com AUDIT_PASSWORD=… node scripts/audit-routes.mjs

# against another environment
node scripts/audit-routes.mjs https://staging.example.com
```

The script reads `NEXT_PUBLIC_ADMIN_PANEL_URL` for the API base, so `set -a; . ./.env.local; set +a` first, or export it.

It flags a page as `THIN` when it renders under 400 characters of text, and reports any `null` SSR prop — that is how a page that returns a healthy 200 but rendered nothing gets caught.
