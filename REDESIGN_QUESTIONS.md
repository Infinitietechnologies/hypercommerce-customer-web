# Redesign — open questions & data gaps

Running log of decisions needed while porting the live app to the new design.
Each screen's data deltas (fields the redesign shows but the API doesn't, or the
API returns but the redesign drops) land here for **batch confirmation**. Until
you answer, I ship the **Default** and mark the row 🟡.

Status: 🟡 awaiting answer · 🟢 confirmed · ⚪️ not started

---

## 0. Cross-cutting

| # | Topic | Decision | Status |
|---|---|---|---|
| 0.1 | Checkout route | **Build it.** Checkout flow also changes — follow the **latest backend contract**: panel `CartApiController` + `OrderApiController` (confirmed present). I read those before building, not the redesign's mock flow. | 🟢 |
| 0.2 | Dark mode | **Light-only.** Force light (done in `_app.tsx`) and **hide the theme switch**. | 🟢 |
| 0.3 | Location pill | Show the **saved address**; if the user has selected a location, show that **selected location's address**. | 🟢 |
| 0.4 | Bottom tab bar | **Keep** the mobile bottom tab bar, reskinned to new tokens. | 🟢 |
| 0.5 | Mobile header shape | **Match the sandbox two-row mobile header** (location pill + Account/Cart on top; full-width search + Wishlist below) **and keep a ☰ menu affordance** that reaches Brands / FAQs / About so that nav isn't buried (sandbox mock relies on footer only). Desktop is the sandbox single row. Confirmed 2026-07-27. | 🟢 |
| 0.6 | Header desktop/mobile cutover | **1024px**, matching the sandbox (`min-[1024px]:` variants), **not** Tailwind's `lg` (1440). Fixed the 1024–1440 dead zone where the live app previously showed the mobile header on a desktop-width screen. `LocationSelector` breakpoint aligned to the same 1024px. Confirmed 2026-07-27. | 🟢 |
| 0.7 | Page width | Header / content / footer share **1280px** (`max-w-site`), matching the sandbox `layout.maxWidth`. Was 1360px. Confirmed 2026-07-27. | 🟢 |
| 0.8 | Language switcher placement | Kept **out of the header** (no visible chip) to preserve the clean sandbox look; tucked into the **☰ menu sheet** so it's reachable in every auth state. Logged-in users additionally reach account actions via the avatar dropdown. Confirmed 2026-07-27. *If you'd rather it live only inside the logged-in avatar dropdown, say so and I'll move it (logged-out users would then have no in-UI language switch).* | 🟢 |
| 0.9 | Header "Account" affordance | Header shows the **avatar dropdown** (`ProfileBtn`) when logged-in and a **login trigger** when logged-out, instead of the sandbox's static "Account" label. Reflects real auth state. Confirmed 2026-07-27. | 🟢 |
| 0.10 | Footer content | Kept the **real footer content** (contact phone/email, social links, app version, powered-by) rather than the sandbox mock's non-functional "Stay in the loop" newsletter. Visual language (warm amber-tint→surface gradient, amber links, columns, bottom bar) already matches the sandbox. Flag if you want the newsletter block added (needs a subscribe endpoint to be wired). | 🟡 |

---

## 1. Home  🟢 (home builder integrated)
_Server-driven home builder wired to `/home-layout` (2026-07-27)._

The static hardcoded home (`getHomePageData` → `HomeBrands`/`HomeCategories`) is
replaced by the panel's **home builder**. `src/pages/index.tsx` SSR-fetches
`/home-layout?platform=web` and renders `HomeBuilder` → `HomeSectionRenderer`,
which covers every section type × style × config from the sandbox `HomeSection`:

- **banners** — `full` (stacked 21:7) · `peek` (85%-width rail).
- **products** — `orientation` vertical→grid / horizontal→rail; `background_type`
  none / color (`background_color`) / image (`background_image`, dark overlay);
  `source` (newly_added/top_rated/best_seller/featured/recommended/custom).
- **categories** — `full`→row card · `overlay`→scrim card · `card`→tile · `default`→circle; section bg applies here too.
- **brands** — `full`→name shown · `image_title`→logo only.
- **hero** — full-width autoplay slider (implemented; no live data to verify yet).

Pagination: sections load 6/page (SSR page 1, "Load more" for the rest). "See all"
→ `/home/sections/[id]` (paginated via `/home-layout/sections/{id}`; type/style/
title carried on the link since the endpoint returns rows only). Re-scopes to the
active home category and refetches on the shared `home-sections-refetch` event.
New cards: `CategoryOverlayCard`, `CategoryCircleCard`, `CategoryRowCard`,
`HomeBannerCard`, `HomeHeroSlider` (+ `BrandCard` gained `showName`).

- 🟡 **Brand `image_title` shows logo-only** (no caption), following the sandbox
  (`showName = style === 'full'`). The enum name implies image **+** title, so if
  the client wants the name under the logo for `image_title`, flip the one
  `showName` prop. Flagged for confirmation.
- **Search dropdown card** (`SearchProductCard`) no longer prints `N/A` / `0.0 (0)`
  for products missing delivery-time or ratings — those rows now render only when
  the data exists (moved onto solar icons + `@/components/ui`).
### Home builder — revision pass (2026-07-27)

Applied against the live builder after review:

- **ProductCard** stripped to the redesign spec — brand · name · rating · price /
  mrp / off%. Removed add-to-cart, quick-view (and the ProductModal), delivery
  time ("null Mins" gone), store name, low-stock, choices, indicator and the
  hover slide-up. Wishlist toggle kept. Applies app-wide (listings, search, PDP
  related). Rating hides entirely when the product has none.
- **Sliders** — every horizontal rail and both banner styles are now Swiper
  sliders (`CardSlider`), not raw side-scroll. Banners autoplay + loop +
  pagination; the peek banner shows the next slide peeking. Banner hover
  treatment removed.
- **Categories** — `full` (and default/fallback) render the **full-image card**
  (image + title + "Shop now →"); `overlay` and `card` unchanged. Circle/row
  variants dropped.
- **Brands** — swapped: `full` = logo only, `image_title` = logo + name.
- **Home = builder only** — Browse Stores and the static promo sections
  (service highlights, delivery banner, app download) removed; the page renders
  nothing but the `/home-layout` builder.
- **Infinite scroll** replaces "Load more" on the home and the section-detail
  page (IntersectionObserver sentinel — robust to window/container scroll).
- **Section detail** gained a filter sidebar (brand / price / rating, client-side
  over the loaded items) + a sort dropdown (relevance / price / rating /
  discount); mobile opens the filters in a `ui/Sheet`.
- **Page background** switched to white (`tokens.light.background` #ffffff).
- **Home empty state** matched to the sandbox ("Fresh finds on the way" + bag
  icon + Continue shopping).
- ⚠️ Infinite-scroll firing could not be verified in this environment (the
  headless browser pane runs with `document.hidden`, which suspends
  IntersectionObserver/scroll callbacks). The page-2 fetch + append path is
  verified; the sentinel renders when more pages exist.

## 2. Product detail (PDP)  ⚪️
_Redesign shows: brand, title, rating badge, reviews count, price/mrp/off%, 3 delivery promises, description, related. Live PDP has variants, seller info, reviews list, Q&A, wishlist — deltas logged at port time._

## 3. Listing (search / category / brand)  ⚪️
_Filter facets in the sandbox are derived from mock data (category/brand/price/rating/discount/stock). Live must map to real API facets — logged at port._

## 4. Cart  ⚪️

## 5. Checkout  ⚪️
_blocked on 0.1._

## 6. Account (overview, orders, order detail, addresses, wishlist, wallet, transactions, notifications, refer)  🟢 (reskinned 2026-07-28)

Ported the whole `my-account/*` area to the amber redesign, matching the
`/redesign/account` sandbox (sticky nav rail + panes). All API/SSR wiring kept;
only look changed. Icons moved off `lucide-react` onto the `@iconify/react` solar
set; every hardcoded gray/blue/green/red/purple/indigo class swapped for HeroUI
theme tokens (`content1/2/3`, `divider`, `primary-100/600`, `default-500`,
`secondary`, `success`/`warning`/`danger`). Card treatment → radius-lg (18) +
`border-divider` + `shadow-sm`. Nav rail: solar icons, sandbox order (overview,
orders, addresses, wishlists, wallet, transactions, notifications, refer),
amber-tint active row, 240px.

Deltas vs the sandbox (defaults shipped, flag to change):
- 🟡 **Overview pane** — the live `my-account/index` is the **profile editor**
  (name/email/phone + OTP verify + delete account), which the sandbox Overview
  (user card + quick-links grid) doesn't show. Kept the full editor and reskinned
  it; navigation to Orders/Addresses/Wallet/… is covered by the nav rail, so the
  quick-links grid was **not** added. Say if you want the sandbox quick-links row
  on top of the profile card.
- 🟡 **Wallet card** — redesigned from the dark credit-card metaphor to the
  sandbox's warm **amber-tint→surface balance panel** (label + big balance +
  masked id + deposit action). Logo dropped (dark logo unreadable on the light
  panel).
- 🟡 **Notifications** — the sandbox uses one amber tile for every type; replaced
  the per-type colour icons (blue/orange/purple/green) with a **uniform amber
  solar tile**. Flag if per-type colour was intentional.
- 🟡 **Order detail** — richer than the sandbox OrderDetail pane (per-store item
  groups, shipments, seller feedback, promo/gift-card lines, invoice/reorder).
  Kept all of it, reskinned to tokens; promo/cashback accents → amber, discounts →
  success, gift card → violet secondary.
- New i18n key `pages.walletPage.availableBalance` added to en/hi/ar.

## 7. Stores  ⚪️

## 8. Static / legal  ⚪️

## 9. Auth (login / OTP / forgot-password)  🟢
_No redesign counterpart — designed to the new foundations (point 3), all in the
one auth sheet (login ⇄ register ⇄ forgot swap in place)._

- **Forgot-password moved in-sheet, rewired to the OTP flow (2026-07-27).** The old
  standalone `/forgot-password` page hit the legacy email-link endpoint
  (`POST /forget-password`). Replaced with the backend's current 3-step OTP flow
  (`PasswordResetApiController`): `forget-password/send-otp` → `forget-password/verify-otp`
  (returns a reset token) → `reset-password`. New `useForgotPassword` hook +
  `ForgotPasswordForm` (identifier → OTP → new password), Email/Phone tabs mirroring
  OTP sign-in, so email code, custom SMS, and Firebase phone (client-sent) are all
  handled. The login sheet's "Forgot password?" now switches to `forgot` mode
  instead of navigating; `/forgot-password` 302-redirects to `/?auth=forgot` so old
  links land on the sheet. Endpoint wiring verified live (send-otp returns the
  expected "no account" message for an unknown identifier). Legacy `forgotPassword()`
  service fn + `pages.forgotPassword.*` locale keys are now dead — left in place to
  avoid an unrelated sweep; safe to prune later.
- **Header account links gated (2026-07-27).** Wishlist and Orders (both
  `/my-account/*`) now render only when signed in; logged-out header shows just
  Account + Cart. Cart stays for guests (offline cart).

## 10. Seller register  ⚪️
_No redesign counterpart — design new._

---

## Answered

- **2026-07-27 — Shell fidelity pass** (header → footer → auth → location, diffed
  against the sandbox at 375/769/1280). Concrete fixes: auth forms + login trigger
  moved off `lucide-react` onto the `@iconify/react` solar set (letter/eye/user/
  login-2); `LocationSelector` raw HeroUI `Modal` → `ui/Sheet` (mobile bottom
  drawer, centred modal tablet+); desktop header gained the sandbox's **Orders**
  action (Wishlist·Orders·Account·Cart); logged-out location sheet now offers a
  Sign-in button. Primitive fix: `ui/Input` was filling `content2` (page-bg) — now
  white surface with a 1px→amber focus border + `primary-100` tint ring, matching
  the sandbox `TextField` (also corrects `/design-system`). Tokens added (no
  hardcoding): `text-label` 11px (header labels), `text-compact` 13px (pill/tabs/
  footer). Footer gradient stop set to 55% and link/heading type to 13px per the
  sandbox FOOTER block. `nav.{account,wishlist,cart,orders}` keys added to en/hi/ar.
- **2026-07-27 — Shell rebuild.** Prior uncommitted foundations/shell attempt was
  discarded and rebuilt from the `/redesign` sandbox as the pixel target. Token
  values were verified already-correct (sandbox App/Kit values: ink `#1c1a17`,
  ink-soft `#7a7570`, amber-dark `#c9790a`, line `#ece8e2` — the Foundations
  sheet's `#171a1f`/`#727680`/`#b9760a`/`#e6e8ec` are the outliers, per the
  sandbox note). Concrete fixes shipped: page width 1360→1280 (0.7), header
  cutover 1024px (0.6), sandbox-matched two-row mobile + menu affordance (0.5),
  language in menu sheet (0.8). See rows 0.5–0.10.
