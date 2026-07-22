# GAP ANALYSIS — Flutter app → Customer Web

**Scope:** `hypercommerce-customer-app/` (Flutter, design + feature source of truth) vs `hypercommerce-customer-web/` (Next.js storefront).

**Note on paths:** the brief referred to `flutter-app/` and `web/`. Those folders do not exist under these names. The actual folders are:

| Brief name | Actual folder |
|---|---|
| `flutter-app/` | `hypercommerce-customer-app/` |
| `web/` | `hypercommerce-customer-web/` |

`BRIEF.md` was not present in the repository; this analysis is derived entirely from source inspection.

---

## 1. Extracted Flutter design tokens

Source: `hypercommerce-customer-app/lib/config/theme.dart` (`AppTheme`), plus frequency analysis of `BorderRadius`, `EdgeInsets`, `fontSize`, and `BoxShadow` across all 614 Dart files in `lib/`.

### 1.1 Brand / semantic colors

| Token | Value | Notes |
|---|---|---|
| `primary` | `#FFB616` | Amber. App main color. |
| `primaryVariant` | `#FFB616` @ 80% alpha | |
| `primaryLight` | `#FACC66` | |
| `secondary` | `#000000` | Foreground on primary buttons |
| `authBg` | `black87` (`#000000` @ 87%) | Auth screens background |
| `collapsedAppBar` | `#F5F3ED` | |
| `error` | `Colors.red` (`#F44336`) | |
| `success` | `Colors.green` (`#4CAF50`) | |
| `warning` | `Colors.orangeAccent` (`#FFAB40`) | |
| `ratingStar` | `#EEAB18` | |
| `deliveryTimeWidget` | `#C2FBFF` | |
| `discountCard` | `#256533` | |
| `orderTrackMain` | `#338518` | |
| `couponShade` | `blue.shade50` (`#E3F2FD`) | |
| `couponCollectBg` | `#FFB616` @ 10% | |

### 1.2 Light surfaces

| Token | Value |
|---|---|
| `background` | `#FFFFFF` |
| `background2` | `grey.shade100` (`#F5F5F5`) |
| `containerBg` | `#F7FAFC` |
| `secondary` | `#E0E0E0` |
| `tertiary` (primary text) | `#0D1117` |
| `productCard` | `#F5F5F5` |
| `subCategoryCard` | `#E5FBFF` |
| `outline` | `grey.shade200` (`#EEEEEE`) |
| `outlineVariant` | `grey.shade300` (`#E0E0E0`) |
| `onSecondaryContainer` (muted text) | `grey.700` (`#616161`) |

### 1.3 Dark surfaces — explicit 4-level elevation system

| Level | Token | Value | Use |
|---|---|---|---|
| L0 | `mainDarkBackgroundColor` | `#0D0D0D` | page background |
| L1 | `mainDarkContainerBgColor` | `#1A1A1A` | cards, inputs fill |
| L2 | `darkSubCategoryCardColor` | `#242424` | elevated cards |
| L3 | `darkExtraCardColor` | `#2E2E2E` | chips / inputs |
| — | `darkTertiary` | `#F0F0F0` | primary text |
| — | `darkOutline` | `rgba(255,255,255,0.12)` | borders |
| — | `darkOutlineVariant` | `rgba(255,255,255,0.06)` | dividers |
| — | muted text | `#9E9E9E` | |
| — | bottom nav bg | `#111111` | |
| — | bottom nav unselected | `#6B6B6B` | |
| — | divider | `rgba(255,255,255,0.08)` | thickness `0.5` |

### 1.4 Typography

- **Family:** `Figtree` (`assets/fonts/Figtree/static/*`), weights 300/400/500/600/700/800.
- **Size scale actually used** (top frequencies): `10, 11, 12, 13, 14, 15, 16, 18`. `14` and `12` dominate; `16` is the section-title size; `18` is the largest common size.
- Sizing goes through `flutter_screenutil` (`.sp`), i.e. sizes are relative to a mobile design width.

### 1.5 Radii

| Radius | Uses | Role |
|---|---|---|
| `12px` | 103 | **dominant** — cards, inputs, sheets, modals |
| `8px` | 77 | buttons, small cards |
| `10px` | 58 | secondary containers |
| `16px` | 38 | large cards / bottom sheets |
| `4px` | 24 | badges |
| `6px` / `2px` | ~21 | chips, micro elements |

Card theme (dark) is explicit: `radius 12`, `elevation 0`, `border 0.5px rgba(255,255,255,0.12)`.
Input theme is explicit: `radius 12`, `filled`, `border 0.5px` → focused `1px` primary.
`CustomButton`: `radius 8`, `elevation 0`, height `48` (mobile) / `40` (tablet), bg primary, fg black, disabled = primary @ 50%.
`CustomTextFormField`: default `borderRadius 8`, `borderWidth 1`, `filled: true`.

> Note the inconsistency in the Flutter source: theme-level inputs use `12`, `CustomTextFormField` defaults to `8`. **Resolved — web uses `12` for inputs** (the themed value, and what the app actually renders) and `8` for buttons.

### 1.6 Spacing

`EdgeInsets` frequencies cluster on: `6, 8, 10, 12, 14, 16, 20`. `16` is the dominant page/card padding. This maps cleanly to a 2px-step scale; Tailwind's default 4px scale covers `8/12/16/20` but **not** `6/10/14` — those need explicit tokens.

### 1.7 Shadows

Cards are **flat** (`elevation: 0` + hairline border) — shadows are used only for floating/overlay elements. 36 files use `BoxShadow`, with a consistent recipe:

| Name | Value |
|---|---|
| `shadow-sm` | `0 2px 10px rgba(0,0,0,0.10)` |
| `shadow-md` | `0 3px 10px rgba(0,0,0,0.12)` |
| `shadow-lg` | `0 6px 12px rgba(0,0,0,0.15)` |
| `shadow-overlay` | `0 2px 10px rgba(0,0,0,0.20)` |

---

## 2. Flutter screen inventory (routes)

All routes live in `hypercommerce-customer-app/lib/router/app_routes.dart` (`go_router`, 1047 lines, 62 screen views). Full list with web mapping is in §5.

Route constants (abridged): `/`, `/intro-slider`, `/login`, `/register`, `/otp-verification`, `/mobile-otp-login-page`, `/continue-with-otp`, `/email-otp-verification`, `/forgot-password`, `/referral-code-entry`, `/home`, `/home-layout-api`, `/order-again`, `/categories`, `/sub-category-list-page`, `/product-listing`, `/product-detail`, `/review-rating`, `/faq`, `/search`, `/cart`, `/promo-code`, `/order-confirmation`, `/payment-options`, `/payment-confirmation`, `/order-success`, `/order-delivered`, `/my-orders`, `/order-detail`, `/order-item-detail`, `/order-timeline`, `/return-timeline`, `/order-transaction-page`, `/product-rating`, `/seller-rating`, `/address-list`, `/add-edit-address`, `/location-picker`, `/account`, `/user-profile`, `/email-verification`, `/mobile-verification`, `/wallet`, `/add-money`, `/transactions`, `/wishlist`, `/wishlist-product`, `/save-for-later`, `/shopping-list`, `/shopping-list-result`, `/refer-and-earn-page`, `/notifications`, `/near-by-store`, `/near-by-store-details`, `/brands-list-page`, `/section-see-all`, `/product-section-see-all`, `/policy-page`, `/support-page`, `/delivery-zones`, `/delivery-zone-detail`, `/no-internet`, `/maintenance-page`, `/force-update-waiting-screen`.

## 3. Flutter reusable widget library

`lib/utils/widgets/` — 50 shared widgets. The ones that define UI patterns the web must match:

**Primitives:** `custom_button.dart`, `custom_textfield.dart`, `custom_image_container.dart`, `custom_shimmer.dart`, `custom_circular_progress_indicator.dart`, `custom_toast.dart`, `custom_snack_bar.dart`, `custom_shape_decoration.dart`, `custom_dotted_divider.dart`, `dashed_container.dart`, `custom_scaffold/`.

**Commerce:** `product_card/`, `save_for_later_product_card.dart`, `custom_brands_card.dart`, `custom_sub_category_card.dart`, `store_card_in_map.dart`, `add_button_inner.dart`, `quantity_stepper_inner.dart`, `basket_button.dart`, `custom_addon_section.dart`, `product_indicator.dart`, `custom_delivery_time_widget.dart`, `recommend_badge.dart`, `sponsored_badge.dart`.

**Bottom sheets (→ web modals/drawers):** `address_bottom_sheet.dart`, `country_bottom_sheet.dart`, `language_bottom_sheet.dart`, `custom_filter_bottom_sheet.dart`, `custom_sorting_bottom_sheet.dart`, `customisations_bottom_sheet.dart`, `bottom_variant_selector_with_addons.dart`, `map_country_picker_sheet.dart`.

**States / feedback:** `empty_states_page.dart`, `no_internet_connection.dart`, `whole_page_progress.dart`, `custom_refresh_indicator.dart`, `shake_widget.dart`, `animated_button.dart`, `dialog_box_animation.dart`, `page_animation.dart`, `connectivity_wrapper.dart`.

**Utilities:** `price_utils.dart`, `date_formatter.dart`, `debounce_function.dart`, `hero_tags.dart`, `nav_icons.dart`, `dominant_colors.dart`, `cache_manager.dart`.

## 4. Flutter data models

- **Global** (`lib/model/`, Hive-persisted): `user_data_model`, `user_cart_model` (`user_cart`, `cart_addon`, `cart_sync_action`), `selected_address_model`, `user_location_model`, `settings_model`, `recent_product_model`, `sorting_model`.
- **Feature-scoped** (`lib/screens/*/model/`): 54 models covering products, product detail/FAQ/reviews, categories, sub-categories, brands, banners, home layout, cart, promo codes, orders (list/detail/status/filter/tracking/reorder-errors), transactions, wallet recharge, addresses (city/country/pincode/delivery-zone), stores, wishlist, save-for-later, shopping list, notifications, refer-and-earn, payments, auth, ad campaigns.

Web equivalents already exist but are collapsed into a single 1718-line `src/types/ApiResponse/index.ts`.

---

## 5. Screen gap: Flutter vs Web

Legend: ✅ present · 🟡 partial / diverging · ❌ missing · ⬜ N/A on web

| Flutter screen | Web route | Status |
|---|---|---|
| `splash_screen` | — | ⬜ |
| `introduction_pages` (`/intro-slider`) | — | ❌ no onboarding/intro flow |
| `login_page` | `LoginModal` | 🟡 modal-only, no `/login` route |
| `register_page` | `RegisterModal` | 🟡 modal-only |
| `mobile_otp_login`, `otp_verification`, `continue_with_otp`, `email_otp_verification` | inside modals | 🟡 no dedicated OTP screens |
| `forgot_password` | `/forgot-password` | ✅ |
| `referral_code_entry` | — | ❌ |
| `email_verification` (`/email-verification`) | — | ❌ |
| `mobile_verification` (`/mobile-verification`) | — | ❌ |
| `home_page` | `/` | ✅ |
| `home_layout` (server-driven layout API) | — | ❌ web home is hard-composed in `views/homePage/*` |
| `dashboard` (bottom-nav shell) | `components/Functional/BottomNavigation.tsx` | 🟡 |
| `category_list_page` | `/categories` | ✅ |
| `sub_category_page` | `/categories/[slug]` | 🟡 |
| `product_listing_page` | `/categories/[slug]`, `/brands/[slug]`, `/stores/[slug]` | 🟡 no unified listing route |
| `product_detail_page` | `/products/[slug]` | ✅ |
| `review_rating_list_page` (`/review-rating`) | embedded `ProductReviewsSection` | 🟡 no full list page |
| `faq_list_page` (`/faq`) | embedded `ProductFaqSection` | 🟡 |
| `search_page` | `/products/search` + `SearchModal` | ✅ |
| `cart_page` | `/cart` | ✅ |
| `promo_code_page` | `PromoCodeModal` | 🟡 page → modal |
| `order_confirmation_page` | — | ❌ |
| `payment_options_page` | `PaymentModal` | 🟡 page → modal |
| `payment_confirmation_page` | — | ❌ |
| `order_success_page` / `/order-delivered` | — | ❌ |
| `order_list_page` | `/my-account/orders` | ✅ |
| `order_item_detail_page` | `/my-account/orders/[slug]` | 🟡 item-level detail missing |
| `order_timeline_page` | `TrackOrderModal` | 🟡 |
| `return_timeline_page` | — | ❌ |
| `product_rating_page` | `RatingModal` | 🟡 |
| `seller_rating_page` | `SellerFeedbacks` (read-only) | 🟡 no submit flow |
| `order_transaction_page` | `/my-account/transactions` | ✅ |
| `wallet_page` | `/my-account/wallet` | ✅ |
| `add_money_page` | `DepositModal` | 🟡 |
| `transaction_page` | `/my-account/transactions` | ✅ |
| `address_list_page` | `/my-account/addresses` | ✅ |
| `add_edit_address_page` | `AddressModal` | 🟡 |
| `location picker` (`/location-picker`) | `LocationSelector` | 🟡 |
| `account_page` | `/my-account` | ✅ |
| `user_profile_page` | — | ❌ no profile edit page |
| `notification_page` | `/my-account/notifications` | ✅ |
| `wishlist_page` | `/my-account/wishlists` | ✅ |
| `wishlist_product_listing_page` | — | 🟡 |
| `save_for_later_page` | `CartPageView/SaveForLaterItems` | 🟡 no standalone page |
| `shopping_list_page` | `/shopping-list` | ✅ |
| `shopping_list_result_page` | — | ❌ |
| `refer_and_earn_page` | `/my-account/refer-and-earn` | ✅ |
| `nearby_stores_page` | `/stores` | ✅ |
| `nearby_store_details` | `/stores/[slug]` | ✅ |
| `brands_list_page` | `/brands` | ✅ |
| `section_see_all` | `/feature-sections` | ✅ |
| `product_section_see_all` | `/feature-sections/[slug]` | 🟡 |
| `app_policies_page` | `/privacy-policy`, `/terms-and-conditions`, `/shipping-policy`, `/return-refund-policy` | ✅ |
| `support_page` | `/faqs` (partial) | 🟡 no ticket/support flow |
| `delivery_zone_listing/detail` | — | ⬜ **out of scope** — feature is being removed from the app too. Do not port |
| `market_picker` | — | not a screen — see §5.1 |
| `no_internet` | `components/OfflinePage.tsx` | ✅ |
| `maintenance_page` | `custom/WebMaintenanceMode.tsx` | ✅ |
| `force_update` | `custom/WebForceUpdate.tsx`, `UpdateBanner.tsx` | ✅ |

**Web-only (no Flutter counterpart — keep, do not delete):** `/about-us`, `/faqs`, `/seller-register`, `/share/products/[slug]`, `/404`.

**Summary:** 11 screens fully missing, 20 partial/diverging, 21 at parity.

### 5.1 Market picker — component gap, not a screen gap

`lib/screens/market_picker/market_picker_bottom_sheet.dart` is a **bottom sheet**, not a route. It is opened from `lib/screens/home_page/widgets/sections/home_top_market_section.dart:69` via `showMarketPickerBottomSheet(context)`. There is **no store picker** in the app — market and store are different concepts; do not conflate them.

Backing service: `lib/services/market/market_service.dart`. It caches the resolved market code in Hive and sends it as an `X-Market` header. The panel's `DetectMarket` middleware resolves in this order:

```
X-Market header → ?market= query → user_market pivot → market cookie
→ country header → Setting('default_market_id')
```

Changing the market fires a broadcast stream so blocs refetch.

**Web status: plumbing exists, UI does not.**

| Piece | Web | State |
|---|---|---|
| `X-Market` header injection | `src/routes/interceptor.ts:44`, `src/routes/api.ts:102` | ✅ |
| Market cookie read | `src/routes/interceptor.ts:37-50` | ✅ |
| Market-scoped settings/currency | `src/contexts/SettingsContext.tsx:111` | ✅ |
| Market-aware pagination | `src/hooks/useInfiniteData.ts:68` | ✅ |
| **Picker UI + switch action + refetch-on-change** | — | ❌ |

**Action:** add a `MarketPickerSheet` shared component (§8.3) plus a market entry point in the home top section and/or header. On switch: persist the market cookie, then invalidate SWR caches for all catalog data (products, categories, brands, stores, home layout) — mirroring the Flutter broadcast-stream refetch.

---

## 6. UI pattern divergences

### 6.1 🔴 Critical — brand color is wrong

`hypercommerce-customer-web/tailwind.config.ts` themes HeroUI with **blue `#3b82f6`** for both light and dark, plus blue focus rings. Flutter's brand is **amber `#FFB616`** with black foreground. Every button, link, focus ring, active tab, and selected state on web is currently off-brand.

Also hard-coded blue: `#007bff` for the nprogress bar in `src/styles/globals.css:52`.

### 6.2 🔴 Critical — wrong font

Web uses **Lexend Deca** (`src/config/fonts.ts`, loaded via `next/font/google`) at weights 300/400 only. Flutter uses **Figtree** at 300–800. Two mismatches: family, and the missing 500/600/700/800 weights that Flutter relies on for headings and price emphasis.

> The Flutter `CLAUDE.md` §7 still claims the font is `LexendDeca`; `pubspec.yaml` and `theme.dart` say `Figtree`. **`pubspec.yaml` wins.** The Flutter doc is stale.

### 6.3 🟠 Font-weight scale is remapped — **delete the remap**

`tailwind.config.ts:14-24` overrides every Tailwind weight downward (`normal` → 350, `medium` → 450, `semibold` → 550, `bold` → **600**, `black` → 850). This was a workaround for only loading Lexend Deca at weights 300/400 — with no real 500–800 faces available, the scale was pulled down so text didn't look over-heavy against synthesized weights.

**Resolution: remove the remap entirely and use the weights the app uses.** Figtree ships real faces at 300/400/500/600/700/800 (`pubspec.yaml`), and Flutter addresses them by their standard numeric values. Once Figtree is self-hosted at all six weights, Tailwind's default scale already maps 1:1:

| Tailwind class | Weight | Figtree face | Flutter usage |
|---|---|---|---|
| `font-light` | 300 | Figtree-Light | de-emphasized captions |
| `font-normal` | 400 | Figtree-Regular | body copy |
| `font-medium` | 500 | Figtree-Medium | labels, list rows |
| `font-semibold` | 600 | Figtree-SemiBold | section titles, prices |
| `font-bold` | 700 | Figtree-Bold | headings, primary emphasis |
| `font-extrabold` | 800 | Figtree-ExtraBold | hero / display |

Keeping the remap would make `font-bold` render at 600 while the app renders 700 — a visible mismatch on every heading and price.

### 6.4 🟠 Radius scale doesn't match

HeroUI layout radii are `small 6 / medium 8 / large 12`. Flutter's dominant radius is **12** for cards, sheets, and inputs, with **8** for buttons and **16** for large cards/sheets. Web has no 16 tier, so large surfaces round too tightly.

**Inputs use radius 12** — matching the app's themed `inputDecorationTheme`. The `borderRadius = 8.0` default in `CustomTextFormField` is a stale per-widget default that the theme overrides in practice; do not follow it.

### 6.5 🟠 Dark mode has no elevation system

Web dark theme is `background #000000` / `foreground #FFFFFF` — pure black, no surface levels. Flutter has a deliberate 4-level system (`#0D0D0D` → `#1A1A1A` → `#242424` → `#2E2E2E`) with 12%/6% white borders. Web dark mode will read flat and lose all card separation.

### 6.6 🟠 Page → modal substitutions

Flutter uses **full pages** for promo code, payment options, add money, add/edit address, product rating, and order tracking. Web uses **modals** for all six. On mobile widths this is a real behavioral divergence (no back-button history, no deep-linkability). Desktop modals are fine; mobile should route to a page or a full-screen sheet.

### 6.7 🟠 Auth is modal-only on web

Flutter has 8 dedicated auth screens. Web funnels everything through `LoginModal` / `RegisterModal`. There is no `/login` or `/register` URL to link to, and `serverSideAuthGuard` redirects to `/?auth=required` rather than a real auth route.

### 6.8 🟡 No `ui/` primitive layer

Web imports HeroUI components directly across ~137 component files. The only wrapper is `src/components/custom/MyButton.tsx` (an `extendVariants` on `Button` with two extra sizes). There is no single place to enforce Flutter parity for Input, Card, Chip, Modal, or Skeleton.

### 6.9 🟡 Styling escape hatches in use

14 files use inline `style={{ }}`; ~100 Tailwind arbitrary pixel values (`[Npx]`) appear across `src/`. Some are legitimate (dynamic map/carousel sizing), but most should become tokens once the Flutter scale (`6/10/14` spacing, radius `16`) exists in Tailwind config.

### 6.10 ✅ Type layer is one monolith — **resolved (Phase 2)**

`src/types/ApiResponse/index.ts` was 1718 lines in a single file versus 63 discrete Flutter models. Now 15 per-domain modules behind a barrel.

### 6.11 ✅ Flat services layer — **resolved (Phase 2)**

`src/routes/api.ts` was a single 1591-line module holding all 82 endpoint callers. Now 16 per-domain modules on a shared `client.ts`, behind a barrel.

### 6.12 🟡 Stale nested docs

Six `CLAUDE.md` files exist under `hypercommerce-customer-web/`. `src/components/CLAUDE.md` references `components/Pages/`, `components/product/`, `Functional/ClientOnly.tsx`, and `IfAuthenticated` — **none of which exist** — and its "HeroUI first, use it directly" guidance conflicts with the `ui/` wrapper layer. Refresh it in Phase 1. Precedence is recorded in `hypercommerce-customer-web/CLAUDE.md` §8.

### 6.13 🟡 No unified skeleton/empty/error contract

14 skeletons exist under `src/components/Skeletons/`, but coverage is partial and ad hoc. Empty states are scattered (`components/Empty/OrdersEmpty.tsx`, `views/empty/CartPageEmpty.tsx`, `views/WishListPageView/EmptyWishListState.tsx`, `components/NoProductsFound.tsx`). Flutter centralizes this in `empty_states_page.dart`. There is no shared error-state component at all.

---

## 7. Component library conflict — resolved

**There is no conflict.** `hypercommerce-customer-web` already depends on `@heroui/react ^2.8.7`, `@heroui/system 2.4.25`, `@heroui/theme 2.4.25`, with the `heroui()` plugin wired into `tailwind.config.ts`. The brief's recommendation is already the incumbent.

The real issue is **theming**, not library choice: HeroUI is running on a hand-written blue theme instead of the Flutter tokens. No migration path is needed — only a theme rewrite plus a `ui/` wrapper layer.

Adjacent UI dependencies to keep an eye on (not competing libraries, but overlapping surface): `framer-motion`, `swiper`, `react-icons` + `lucide-react` (**two icon sets — pick one**), `nprogress`, `react-confetti`, `yet-another-react-lightbox`.

> Flutter uses **Tabler icons** (`flutter_tabler_icons`) and Remix (`remixicon`), and `react-icons` ships Tabler as `react-icons/tb`. **But do not migrate to it.** Actual usage on web:
>
> | Library | Files | Imports |
> |---|---|---|
> | `lucide-react` | **118** | 119 |
> | `react-icons` | 4 | 4 — `/hi`, `/si`, `/fa6`; **`/tb` is not used at all** |
>
> Lucide is the incumbent by ~30x. Switching to Tabler would rewrite 118 files for a cosmetic gain and carries real regression risk. **Recommendation: keep `lucide-react` as the single icon set and retire the 4 `react-icons` usages instead.** Icon consolidation is deliberately **out of Phase 0** — it is unrelated to tokens. Schedule it as a standalone cleanup (Phase 9).

---

## 8. Shared components to add or refactor

### 8.1 New — `src/components/ui/` primitive layer

Wrap HeroUI once, so parity fixes land in one place:

| Wrapper | Wraps | Must match |
|---|---|---|
| `Button` | HeroUI `Button` | radius 8, h-48/40, elev 0, amber bg / black fg, disabled 50% |
| `Input` / `TextField` | HeroUI `Input` | radius 12, filled, 0.5px border → 1px amber on focus |
| `Card` | HeroUI `Card` | radius 12, shadow-none, hairline border, zero margin |
| `Chip` | HeroUI `Chip` | Flutter chip shape + L3 dark surface |
| `Modal` / `Sheet` | HeroUI `Modal`/`Drawer` | desktop modal, mobile bottom-sheet (matches Flutter bottom sheets) |
| `Skeleton` | HeroUI `Skeleton` | replaces ad-hoc `Skeletons/*` internals |
| `Toast` | HeroUI `Toast` | matches `custom_toast.dart` |
| `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Accordion`, `Pagination`, `Tooltip`, `Badge`, `Avatar`, `Divider`, `Spinner` | HeroUI | token-themed |

### 8.2 Refactor existing

- `components/custom/MyButton.tsx` → fold into `ui/Button`; keep the `xs` and `responsive` size variants.
- `components/Skeletons/*` → rebuild on `ui/Skeleton`; add missing skeletons for every list/detail screen.
- Empty states (`components/Empty/*`, `views/empty/*`, `WishListPageView/EmptyWishListState`, `NoProductsFound`) → single `ui/EmptyState` mirroring `empty_states_page.dart`.
- `components/theme-switch.tsx` → verify against Flutter's `theme_bloc` three-mode behavior (light/dark/system).

### 8.3 Missing — port from Flutter

| Web component needed | Flutter source |
|---|---|
| `ui/ErrorState` | inline error patterns + `no_internet_connection.dart` |
| `QuantityStepper` | `quantity_stepper_inner.dart`, `add_button_inner.dart` |
| `DeliveryTimeBadge` | `custom_delivery_time_widget.dart` |
| `SponsoredBadge`, `RecommendBadge` | `sponsored_badge.dart`, `recommend_badge.dart` |
| `DottedDivider`, `DashedContainer` | `custom_dotted_divider.dart`, `dashed_container.dart` |
| `FilterSheet`, `SortSheet` | `custom_filter_bottom_sheet.dart`, `custom_sorting_bottom_sheet.dart` |
| `VariantAddonSheet` | `bottom_variant_selector_with_addons.dart`, `customisations_bottom_sheet.dart` |
| `MarketPickerSheet` | `lib/screens/market_picker/market_picker_bottom_sheet.dart` (+ `services/market/market_service.dart`) — see §5.1 |
| `CountrySheet`, `LanguageSheet` | `country_bottom_sheet.dart`, `language_bottom_sheet.dart` |
| `PullToRefresh` (mobile web) | `custom_refresh_indicator.dart` |
| `ShakeInput` (validation feedback) | `shake_widget.dart` |
| `PageProgressOverlay` | `whole_page_progress.dart` |

---

## 9. Phased plan

All work happens on `dev` — no per-phase branches. Commit per screen; no unrelated changes in a commit.

### Phase 0 — Tokens & theme foundation ✅ **DONE**
1. ✅ Figtree self-hosted via `next/font/local` as the **variable font** (`Figtree-VariableFont_wght.ttf`, one 62KB file covering 300–900) rather than six statics; replaces Lexend Deca in `src/config/fonts.ts`.
2. ✅ `fontWeight` override block deleted — Tailwind's standard scale now maps 1:1 to Figtree (§6.3). Verified: `font-bold` computes to `700` (was `600`).
3. ✅ Tokens extracted to **`src/theme/tokens.ts`**, shaped into a HeroUI theme in **`src/theme/heroui.ts`**, consumed by `tailwind.config.ts`. Amber ramp, light/dark surfaces, dark 4-level elevation, amber focus.
4. ✅ Radius `xlarge: 16` added; spacing `1.5/2.5/3.5` = `6/10/14px`; four `shadow-*` recipes; commerce accents exposed as Tailwind colors.
5. ✅ `#007bff` replaced with `--nprogress-color`, derived from `--heroui-primary`.
6. ⏭️ **Moved out of Phase 0** — see §7. Lucide is the incumbent (118 files); consolidation is unrelated to tokens and is deferred to Phase 9.

**Verified:** `next build` passes (33 routes); dev renders both themes; computed values confirmed in-browser —
`--heroui-primary` → `#ffb616`, `primary-300` → `#facc66`, dark `background/content1/content2/content3` → `#0d0d0d / #1a1a1a / #242424 / #2e2e2e`, light `background/foreground` → `#ffffff / #0d1117`, `rounded-large` → `12px`, `font-bold` → `700`.

**Gotchas found (recorded so they aren't rediscovered):**
- `next/font/local` requires a **statically analyzable object literal** — no spreads, no shared config const. `tsc` does not catch this; it fails at build/runtime with "Unexpected spread".
- HeroUI converts theme colors to HSL channels and **drops alpha**. `rgba(255,255,255,0.06)` became opaque white. Opaque equivalents (`dividerSolid`, `outlineSolid`) are supplied in `tokens.ts`.
- Turbopack's console error buffer persists stale compile errors across reloads. Trust `next build` and the absence of the Next error overlay, not the console history.

### Phase 1 — `ui/` primitive layer ✅ **layer built**
`src/components/ui/` now exists as the single HeroUI import boundary.

- ✅ **Wrapped** (Flutter parity, each file cites its Dart source): `Button`, `Input`, `Textarea`, `Card`, `Chip`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorState`, `toast*` helpers.
- ✅ **Pass-through** re-exports for the ~45 primitives that need no behaviour change (`Divider`, `Spinner`, `Avatar`, `Badge`, `Tooltip`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Accordion`, `Pagination`, `Table`, `useDisclosure`, …) so the boundary still holds.
- ✅ `components/custom/MyButton.tsx` folded into `ui/Button`, preserving its `xs` and `responsive` size variants; its one call site (`LoginModal`) verified unchanged in-browser — 32px tall, 6px radius, `shadow-none`, amber `#DB9A0C`.
- ✅ `Sheet` resolves §6.6: bottom drawer with drag handle on mobile, centred modal from tablet up.

**Revised exit criterion.** The original — *"no direct `@heroui/react` imports outside `ui/`"* — was not achievable in one phase: **162 files** still import HeroUI directly. A repo-wide sweep would be a huge untestable diff touching every screen, which contradicts "commit after each screen".

Migration is therefore **incremental**: convert a file to `@/components/ui` when you touch it for another reason. Phases 3–9 each retire a slice. Track progress with:

```
grep -rl '@heroui/react' src | grep -v 'src/components/ui/' | wc -l   # 162 at Phase 1 close
```

**Gotchas found:**
- HeroUI prop types collide when extending: `size` (Button), and `title` / `placement` / `scrollBehavior` (Modal vs Drawer) must be `Omit`ted before redeclaring, or `tsc` fails with TS2430.
- `useScreenType()` breaks at 768/1024, but `tailwind.config.ts` uses `md: 769` / `lg: 1440`. `Sheet` keys off the hook, so its mobile cutoff is 1px from the CSS one and its "desktop" starts far earlier than `lg`. Harmless today; reconcile before building layout-dependent behaviour on it.

### Phase 2 — Structural refactor ✅ **DONE**
1. ✅ `src/routes/api.ts` (1591 lines, 82 endpoint callers) split into **16 domain modules** under `src/services/` — auth, catalog, cart, orders, wishlist, address, wallet, reviews, notifications, payments, market, home, settings, seller, content, ads. The axios instance and `constructApiBaseUrl()` moved to `src/services/client.ts`, still created once and wired to the same interceptors.
2. ✅ `src/types/ApiResponse/index.ts` (1718 lines, 94 declarations) split into **15 domain modules** under `src/types/`, with explicit `import type` edges between them.
3. ✅ `src/features/` created with its own `CLAUDE.md` defining the module shape (`components/`, `hooks/`, `types.ts`) mirroring Flutter's `lib/screens/<feature>/`. Empty by design — populated from Phase 3 on.

Both monoliths became **re-export barrels**, so none of the ~190 existing import sites changed.

| | Before | After |
|---|---|---|
| `routes/api.ts` | 1591 lines | 29 (barrel) |
| largest service | — | `auth.ts` 262 |
| `types/ApiResponse/index.ts` | 1718 lines | 24 (barrel) |
| largest type module | — | `order.ts` 425 |

**Verified:** 82 endpoint exports in → 82 out, none missing, none duplicated across modules; 94 type declarations in → 94 out, same. `tsc --noEmit` clean, `next build` passes (33 routes), and `/`, `/categories/`, `/brands/`, `/stores/`, `/cart/` all return 200 with live backend data.

**Gotchas found:**
- The types barrel lives at `src/types/ApiResponse/index.ts` but the domain modules are one level up in `src/types/` — the re-exports need `../name`, not `./name`. Getting this wrong produces ~90 confusing "has no exported member" errors that look like the split dropped types.
- `eslint-plugin-unused-imports` with `--fix` makes this kind of split tractable: give every generated module the full import header and let the linter prune it, rather than hand-curating imports for 31 new files.

**Deliberately not done:** endpoint callers are grouped by domain, but the older orchestrators (`homePageService.ts`, `ProductDetailPageService.ts`, `adTrackingService.ts`) keep their existing names and shape. Renaming them is churn with no benefit right now.

### Phase 3 — Auth parity
Real routes for `/login`, `/register`, `/otp`, `/email-otp`, `/referral-code`, `/verify-email`, `/verify-phone`. Keep modals for the desktop quick path; point `serverSideAuthGuard` at `/login?next=…`.

### Phase 4 — Checkout & order lifecycle
Pages for order confirmation, payment options, payment confirmation, order success. Convert promo code and add-money from modal-only to page-on-mobile / modal-on-desktop.

### Phase 5 — Orders & returns
Order item detail, order timeline page, return timeline, product rating, seller rating submission.

### Phase 6 — Account completion
User profile edit page, standalone save-for-later page, wishlist product listing page, address add/edit as a route on mobile, support page.

### Phase 7 — Discovery
Unified `/product-listing` route with filter + sort sheets; standalone review list and FAQ list pages; shopping-list result page.

### Phase 8 — Server-driven home + market picker
1. Port `home_layout` API consumption so web home is data-driven like the app.
2. Build `MarketPickerSheet` and mount it from the home top section (mirroring `home_top_market_section.dart`) plus the header. On switch: persist the market cookie and invalidate every catalog SWR key. See §5.1.

### Phase 9 — Onboarding & polish
Intro/onboarding flow; audit every screen for loading skeleton / empty state / error state / action feedback; accessibility pass (keyboard nav, focus rings, aria labels, semantic HTML); remove remaining inline styles and arbitrary values.

Also in this phase:
- **Icon consolidation** — retire the 4 `react-icons` usages, keep `lucide-react` (§7).
- **`text-primary` contrast** — amber `#FFB616` on white is ~1.9:1, below WCAG AA. 62 call sites use `text-primary`. The app uses amber as a *fill* with black text, not as a text colour. Sweep these to `text-primary-700` (`#A87507`) or a neutral, keeping amber for fills only. Deliberately **not** done in Phase 0, which only swapped token values.

---

## 10. Resolved decisions

All five open questions were answered on 2026-07-21. Recorded here so they are not re-litigated.

1. **Delivery zones — dropped everywhere.** The feature is being removed from the Flutter app as well. Do **not** port `/delivery-zones` or `/delivery-zone-detail` to web, and do not treat their absence as a gap. Web already migrated off the delivery-zone model (`MIGRATION-PHASE1-hyperlocal-to-hypercommerce.md`).

2. **Market picker — real gap, but a component not a screen.** It is a **market** picker; there is no store picker in the app, and the two must not be conflated. Web already has the `X-Market` header plumbing; only the picker UI, the switch action, and cache invalidation on switch are missing. See §5.1 and §8.3.

3. **`BRIEF.md` — does not exist.** No additional constraints beyond what is in the source. This document plus `hypercommerce-customer-web/CLAUDE.md` are the operating spec.

4. **Input radius — 12.** Match the app exactly. The `8.0` default inside `CustomTextFormField` is stale and overridden by the theme; ignore it.

5. **Font weights — drop the remap, use the app's weights.** The downward remap in `tailwind.config.ts:14-24` was a workaround for loading Lexend Deca at only 300/400. Self-host Figtree at 300/400/500/600/700/800 and delete the `fontWeight` override so Tailwind's standard scale maps 1:1 to Figtree's real faces. See §6.3 for the mapping table.
