# Phase 1 Migration — Hyperlocal → Hypercommerce (boot + home + catalogue browse)

**Goal of Phase 1:** site boots, home page renders, and the catalogue (categories,
brands, products list + product detail, stores) is browsable. No cart/checkout/auth
rework yet — only what's needed to *see* the storefront.

**Root cause of the breakage:** the storefront was built for the old **hyperlocal /
delivery-zone** model. The backend replaced that with **markets**:

- Old model: user must pick a location (lat/lng) → app stores a `userLocation` cookie →
  every catalogue call is gated on lat/lng and hits `/delivery-zone/*` endpoints.
- New model: market is auto-detected server-side by `DetectMarket` middleware
  (priority: `X-Market` header → `?market=` → user pivot → `market` cookie →
  CDN country header → default market). **No location, no zone, no picker.**
  lat/lng params are accepted but **ignored**; `/delivery-zone/*` endpoints are **gone**.

So Phase 1 = repoint endpoints + remove the location gate + fix the data shapes.

---

## 1. Endpoint repointing (`src/routes/api.ts`)

This is the change that makes data load at all. Map old → new:

| Function | Old path (broken) | New path | Notes |
|---|---|---|---|
| `getProducts` | `GET /delivery-zone/products` | `GET /products/search` | keeps `categories`, `brands`, `store`, `search`, `sort`, `include_child_categories`, `attribute_values`, pagination. Drop `latitude`/`longitude`. |
| `getStores` | `GET /delivery-zone/stores` | `GET /stores` | params: `search`, `recommended`, pagination. Drop lat/lng. |
| `getSections` | `GET /featured-sections` | `GET /home-layout` | now a **section/widget builder** (see §3). |
| `getSectionBySlug` | `GET /featured-sections/{slug}/products` | `GET /home-layout/sections/{id}` | paginated items for one section; keyed by section **id**, not slug. |
| `getBannerImages` | `GET /banners` | (none) | banners now come back **inside** `/home-layout` as `hero`/`banners` sections. Remove the standalone call. |
| `checkDeliveryZone` | `GET /delivery-zone/check` | (delete) | replaced by market auto-detect. |
| `getDeliveryZones` | `GET /delivery-zone` | (delete) | — |
| `getDeliveryZoneBySlug` | `GET /delivery-zone/{slug}` | (delete) | — |
| `getStoresByMap` | `POST /stores/map` | (delete) | no geo/bounding-box browse in market model. |

**Still work as-is (just remove lat/lng params):**
`getSettings` → `/settings`, `getCategories` → `/categories`,
`getSubCategories` → `/categories/sub-categories`, `getBrands` → `/brands`,
`getProductBySlug` → `/products/{slug}`, `getSidebarFilters` → `/products/sidebar-filters`,
`getProductsByKeyword` → `/products/search-by-keywords`,
`getProductReviews` → `/products/{slug}/reviews`, `getProductFAQs` → `/products/{slug}/faqs`.

**New functions to add:**
- `getCurrentMarket()` → `GET /markets/current`
- `getMarkets()` → `GET /markets` (list for the switcher)
- `switchMarket(code)` → `POST /markets/switch` body `{ code }` (sets 1-yr `market` cookie)
- `geoDetect()` → `GET /geo-detect` (suggested market on first visit — optional for Phase 1)

---

## 2. Remove the location gate (the actual blocker)

Even after repointing, nothing renders until this is gone, because the app refuses to
fetch products without a `userLocation` cookie.

- **`src/hooks/useInfiniteData.ts`** — remove the `passLocation` branch that returns
  `{ data: [], total: 0 }` when lat/lng are missing. Stop reading `userLocation`.
- **`src/services/homePageService.ts`** — currently only fetches categories/banners/
  brands/products/stores/sections *if* `lat && lng`. Remove that conditional so the
  home data always loads (see §3 for the new fan-out).
- **`src/helpers/getters.ts`** — `getUserLocationFromContext()` no longer needed for
  gating; keep only if used cosmetically, else drop.
- **`src/components/Location/*`** (LocationSelector, GoogleMap, LocationAutoComplete,
  OpenStreetMapTracking) and the navbar "select location" button — **hide for Phase 1**.
  Replace later with a **market/currency switcher** (calls `switchMarket`). Leaflet /
  Google Maps deps can stay installed; just stop rendering the picker.
- **`src/pages/delivery-zones/[slug].tsx`** — remove route (or stub a redirect to home).
- **`onLocationChange()` SWR revalidation** — repurpose to fire on **market change** instead.
- **Default lat/lng fallback** (`staticLat: 23.242, staticLng: 69.6669` in DefaultLayout)
  — delete; no longer meaningful.

---

## 3. Home page model change (`homePageService.ts` + `src/views/homePage/*`)

Old home = many parallel calls (banners, categories, brands, products, stores, sections).
New backend offers a single **`GET /home-layout`** that returns an ordered `sections[]`
array; each section has a `type` (`hero | banners | products | categories | brands`),
a `style` (`carousel | grid`), and a `content` object holding the already-resolved
items. Load-more per section via `GET /home-layout/sections/{id}`.

Two options:

- **Option A (recommended, matches backend):** drive the home page from `/home-layout`.
  Map each section `type` to the existing view component (HomeTopSlider ← `hero`/`banners`,
  HomeCategories ← `categories`, HomeBrands ← `brands`, product rails ← `products`).
- **Option B (fastest to boot):** skip `/home-layout`, keep fanning out to the
  still-existing `/categories`, `/brands`, `/products/search`, `/stores`, and temporarily
  disable the banner slider + featured sections. Good enough to verify the site renders;
  revisit with Option A.

Pick A if you want banners/sections working in Phase 1; pick B to get on screen fastest.

---

## 4. Data-shape / type changes (`src/types/ApiResponse/index.ts`)

Response envelope `{ success, message, data }` and pagination
(`data.data[]` + `current_page/last_page/per_page/total`) are unchanged — those should
still deserialize. The breaking shape changes are:

**Product pricing moved onto variants + became market-aware.** Old `Product` had
top-level `price` / `special_price` / `discount_percentage`. New: pricing lives on each
**variant** with `price`, `price_base`, `special_price`, `currency_code`,
`currency_symbol`, `fx_rate`, `formatted`, `formatted_special_price`, and a `format`
object. Stock/seller also on the variant (`store_id`, `store_name`, `stock`, `is_in_stock`).
→ Update `Product`/`ProductVariant` types and **read price from the default variant**.
→ For display, prefer the backend-provided `formatted` / `currency_symbol` strings rather
   than client-side currency math.

**Product images renamed.** List resource uses `main_image` + `additional_images[]`
(not `images`). Update the type and the image components (ProductImgSection, cards).

**Settings gained a `markets` entry.** `/settings` now returns an extra item
`{ variable: "markets", value: { current, default, available[] } }`. The `Settings`
type is a fixed 8-tuple — **extend it to 9** (or loosen to a lookup) so it doesn't break
typing, and read `markets.current` for the active currency/format.

**Store shape changed.** New `Store` is market-based: has `markets[]`,
`verification_status`, `visibility_status`, `avg_store_rating`, `total_store_feedback`,
`currency_code`. It **no longer** has `distance`, `lat/lng`, `status.is_open`, `timing`.
Remove those usages (store cards, "open/closed" badges, distance sorting).

**New types to add:** `Market`, `Currency`, `MarketFormat`, `HomeLayout` + `HomeSection`
(+ per-type `content`).

---

## 5. Suggested order of work

1. `routes/api.ts` — repoint/add/delete functions per §1.
2. `useInfiniteData` + `homePageService` — strip the location gate (§2).
3. Types — Product/variant pricing, images, Settings `markets`, Store (§4).
4. Home — Option A or B (§3).
5. Navbar — hide LocationSelector; (optional) add market switcher calling `switchMarket`.
6. Smoke test: home renders, `/categories/[slug]`, `/brands/[slug]`, `/products` list,
   `/products/[slug]` detail, `/stores/[slug]` — all load without a location cookie and
   show prices in the detected market's currency.

## Explicitly deferred to later phases
Cart/checkout (two-cart sync), wallet, orders, addresses, reviews/FAQ write,
referrals, payment gateways, seller-register, PWA/offline, and the full market
**switcher UX**. Phase 1 relies on **auto-detected** market only.
