# HyperCommerce — Web Storefront Design Brief

> Copy everything below this line into Claude to generate the interactive design.

---

## Role

You are designing the complete visual system and screen-by-screen design for **HyperCommerce**, a multi-vendor marketplace storefront (web).

Deliver an **interactive HTML prototype** — real, clickable, responsive screens — not static images and not a written description. I will hand your output to an engineer to implement in an existing Next.js codebase, so the design must be buildable with the stack listed under *Technical constraints*.

---

## Product

HyperCommerce is a multi-seller marketplace. Customers browse products from many sellers and stores, add to cart, check out with several payment methods, track orders, manage a wallet, keep wishlists and shopping lists, and refer friends. There is an existing **Flutter mobile app** that is the feature reference; the web storefront must feel like the same product, not a different one.

Key domain concepts you must design for:

- **Market** — a country/region storefront scope. Catalog, currency and pricing are all scoped to the active market. A customer can switch market.
- **Store / Seller** — a vendor with a profile, rating, and its own products. Products show who sells them.
- **Product variants and addons** — products can have variants (size/colour, with colour swatches) and optional addon groups.
- **Wallet** — internal balance, top-up, and transaction history.
- **Wishlists** — multiple named lists, not a single favourites list.

---

## Brand and design tokens — use these exactly

These are extracted from the production mobile app. **Do not invent a palette.** Do not use a generic blue/indigo "AI default" theme.

### Colour

```
PRIMARY (brand amber)
  50  #FFF9E9    500 #FFB616  ← brand
  100 #FFF0C7    600 #DB9A0C
  200 #FDE49B    700 #A87507
  300 #FACC66    800 #7A5405
  400 #FFC23C    900 #533903

  Foreground on primary: #000000  (black text on amber, never white)

SEMANTIC
  error   #F44336
  success #4CAF50
  warning #FFAB40
  rating star #EEAB18

COMMERCE ACCENTS
  discount badge   #256533
  order tracking   #338518
  delivery badge   #C2FBFF
  coupon shade     #E3F2FD

LIGHT THEME
  background #FFFFFF   surface-2 #F7FAFC   surface-3 #F5F5F5
  text #0D1117         muted text #616161
  border #EEEEEE       divider #E0E0E0

DARK THEME — 4-level elevation, NOT flat black
  L0 page      #0D0D0D
  L1 card      #1A1A1A
  L2 elevated  #242424
  L3 chip/input #2E2E2E
  text #F0F0F0        muted #9E9E9E
  border rgba(255,255,255,.12)   divider rgba(255,255,255,.06)
  bottom nav #111111   inactive icon #6B6B6B
```

Both light and dark themes are required for every screen.

### Typography

**Figtree**, weights 300/400/500/600/700/800 (standard numeric semantics — no custom weight scale).

Size scale actually used by the app: `10, 11, 12, 13, 14, 15, 16, 18` px. 14 and 12 dominate; 16 is a section title; 18 is the largest common size. Headings on marketing/auth screens go larger (26–34px).

### Shape and depth

```
radius   4 (badges) · 6 · 8 (buttons) · 10 · 12 (cards, inputs, sheets — dominant) · 16 (large surfaces, sheet tops)
spacing  6 · 8 · 10 · 12 · 14 · 16 (dominant page/card padding) · 20
shadow   sm  0 2px 10px rgba(0,0,0,.10)
         md  0 3px 10px rgba(0,0,0,.12)
         lg  0 6px 12px rgba(0,0,0,.15)
         overlay 0 2px 10px rgba(0,0,0,.20)
```

**Cards are flat** — no shadow. They use `radius 12` + a hairline 1px border. Shadows are reserved for floating and overlay surfaces only. This is a defining characteristic of the app's look; please respect it.

### Component rules from the app

| Element | Spec |
|---|---|
| Primary button | radius 8, no shadow, height 48 mobile / 40 tablet+, amber fill, black label, disabled at 50% opacity, spinner **replaces** the label while loading |
| Input | radius 12, filled surface, 1px hairline border, thickens to 2px amber on focus |
| Card | radius 12, flat, hairline border, no margin of its own |
| Chip | full pill radius, sits on the L3 surface, flat |
| Bottom sheet | top radius 16, drag handle |
| Divider | hairline |

---

## Responsive rules — non-negotiable

- **Mobile (< 769px)** — must match the Flutter app 1:1 in layout, ordering and component shape. Bottom navigation bar visible. Overlays are **bottom sheets**, not centred dialogs.
- **Tablet (769–1439px)** — two-column: content plus a secondary panel (filters, order summary, related items).
- **Desktop (≥ 1440px)** — multi-column with persistent sidebars: category/filter rail on the left, cart/summary on the right where relevant. Header navigation replaces the bottom bar. Centred modals are acceptable here.

Design mobile-first. Desktop must never degrade the mobile experience.

**RTL is required.** Arabic is a supported locale and flips the entire layout. Use logical direction, not hard-coded left/right.

---

## Every screen needs four states

No screen is complete without all four designed:

1. **Loading** — skeleton that mirrors the final layout. Never a bare centred spinner for a full page.
2. **Empty** — illustration, headline, supporting line, and one primary action.
3. **Error** — human-readable message plus a retry action. Never a blank page or a raw error.
4. **Loaded** — the real content.

Also design: every action's feedback (toast on success *and* failure), optimistic states that can roll back (cart quantity, wishlist toggle), and destructive-action confirmation.

---

## Accessibility baseline

- Visible focus rings on everything focusable, using the amber focus colour.
- Full keyboard operation; sheets and modals trap focus and restore it on close; Esc closes.
- Semantic structure — real buttons, real headings in order, real lists.
- Icon-only controls carry a visible-on-hover tooltip and an accessible label.
- Respect reduced-motion.
- **Note a known issue to solve:** amber `#FFB616` on white is roughly 1.9:1 contrast — far below AA. Amber is a *fill* colour with black text, not a text colour. Where you need amber-coloured text, specify a darker step (700 `#A87507`) or a neutral. Please make this explicit in your output.

---

## Screens to design

Group A is the priority. Design every screen in A fully (all four states, all three breakpoints, light + dark). For B and C, design the layout and key states.

### A. Core shopping flow

1. **Home — a server-driven, category-aware page builder.** This is the most important screen to get right. It has its own full specification below (see *The home page builder*). Read that section before designing anything else.
2. **Category listing** — all categories, then a category detail with subcategory tabs/sidebar. Note that landing on a category may swap the whole home layout — see the builder spec.
3. **Product listing (PLP)** — grid of product cards, sort control, filter entry. Filters: category, brand, price range, colour swatches, attributes. Infinite scroll. Filters are a **bottom sheet on mobile, sidebar on desktop**.
4. **Product detail (PDP)** — image gallery with lightbox, title/price/discount, rating summary, variant selector (incl. colour swatches), addon groups, quantity stepper, add-to-cart / buy-now bar, delivery estimate, sold-by seller card, additional detail sections, FAQ accordion, reviews with rating breakdown, seller reviews, similar products. Sticky action bar on mobile.
5. **Search** — search entry with recent searches and keyword suggestions, then results.
6. **Cart** — line items with quantity steppers and per-seller grouping, save-for-later list, promo code, delivery address selection, express-delivery option, tip, order note/attachment, wallet application, and an order summary with tax and shipping breakdown. Multi-step checkout stepper.
7. **Checkout: payment** — payment method selection (card via Stripe, Razorpay, Paystack, Flutterwave, bank transfer, wallet, COD), then confirmation and a success screen.
8. **Order success / failure**.

### B. Account and orders

9. **Account hub** — profile summary and navigation to the sections below.
10. **Orders** — list with status filters; order detail with item list, shipment/delivery info, payment info, order summary, and a **tracking timeline**; item-level detail; cancel and return flows; return timeline.
11. **Rate order** — product rating and seller rating (stars, text, photo upload).
12. **Addresses** — list, add/edit with map picker and country/city selection.
13. **Wallet** — balance card, top-up, transaction history table.
14. **Transactions** — filterable list.
15. **Wishlists** — multiple named lists, list detail, move item between lists, create/edit/delete list.
16. **Shopping list** — build a list, then a results view matching it to products.
17. **Notifications** — list with read/unread.
18. **Refer and earn** — referral code, share, and reward explanation.
19. **Profile edit** — name, email, phone, avatar, and email/phone verification states.

### C. Auth, discovery, and system

20. **Auth** — sign in (password and phone-OTP as two paths), register, forgot password, OTP entry, email verification, phone verification, referral-code entry. The mobile app uses **full-screen auth pages**; on desktop a sheet is acceptable. There is no "welcome/onboarding carousel" on web yet — design one.
21. **Stores** — store listing (with map view and distance), store profile with its product catalog and reviews.
22. **Brands** — brand listing and brand detail.
23. **Market picker** — a sheet for switching country/region storefront, showing currency implications.
24. **Location picker** — the app gates browsing on choosing a location; design this entry moment carefully, it is the first thing a new visitor meets.
25. **Static** — about, FAQs, privacy, terms, shipping policy, refund policy, seller registration landing.
26. **System** — 404, offline, maintenance, forced-update banner, cookie consent.

---

## The home page builder — read this carefully

The home page is **not a fixed design.** Admins compose it in a drag-and-drop builder in the back office, and the storefront renders whatever they saved. Your job is to design a **kit of section blocks and their style variants**, not one home page.

This is the single biggest constraint in this brief. A beautiful fixed home page is unusable here.

### Two things vary independently

**1. Platform.** Layouts are stored per platform — `app` and `web` have separate layouts. You are designing **web**.

> ### ⛔ There is no hero section on web
>
> The `hero` section type exists **only for the mobile app**. The back office removes it from the web builder entirely, so an admin cannot add one and the storefront can never receive one.
>
> **Do not design a hero.** No full-bleed banner at the top of the home page, no large image-with-headline block, no autoplaying hero slider, no "featured" masthead. This is the default move for an ecommerce home page and it is wrong here.
>
> The page opens directly with whatever section the admin placed first — commonly a `banners` or `categories` section. **The first section is not special** and gets no extra height, no different treatment, and no assumption that an image sits there.
>
> Web section types are exactly four: **`products`, `categories`, `brands`, `banners`.** Nothing else.

**2. Scope — this is the category-wise behaviour.** A layout has a scope:

- `global` — the default home page.
- `category` — a layout attached to a specific category.

So **each category can have a completely different home page**: different sections, different order, different styles. Landing on a category can swap the entire page composition, not just filter a product grid.

Uniqueness is `(platform, scope_type, scope_id)`, so web-global, web-electronics, web-groceries are all separate compositions.

> **Behaviour to design for:** when a category has no layout of its own, the API returns **zero sections** — it does *not* fall back to the global layout. So a category-scoped home page can legitimately be empty. Design that empty state; it is a real production state, not an edge case.

### Section types and their variants

Every section has: a **type**, an optional **title**, a **style** (visual preset), a **config** object, an ordered list of **items**, an `is_active` flag, and an optional **market** restriction (a section can be shown only in certain country/region storefronts).

Design each type in **every style listed**, in both orientations where applicable, at all three breakpoints, in light and dark.

| Type | Styles to design | Config |
|---|---|---|
| **products** | *no style picker* | `source`: `newly_added` · `top_rated` · `best_seller` · `featured` · `recommended` · `custom`<br>`orientation`: `vertical` (grid) · `horizontal` (scrolling rail)<br>`background_type`: `none` · `color` · `image` |
| **categories** | `default` · `full` · `card` · `overlay` | `source`: `all` · `custom` |
| **brands** | `full` · `image_title` | `source`: `all` · `custom` |
| **banners** | `full` · `peek` | — |

Notes that affect the visuals:

- **products / orientation** — `horizontal` is a side-scrolling rail; `vertical` is a grid that grows down the page. The same section type must work both ways.
- **products / background_type** — a section can sit on the page background, on a **solid colour**, or on a **background image**. Your product card must stay legible on all three. Show a card on a busy image background.
- **products / source** — the source only changes *which* products load, not the layout. But the section title conveys it ("Best Sellers", "New Arrivals", "Recommended for you"), so design a section header with title + "see all".
- **banners / `peek`** — the next banner is partially visible at the edge to signal scrollability. `full` is edge-to-edge. Design both.
- **categories / `overlay`** — text sits over the category image, so it needs a scrim for legibility. `card` is image-above-label. `full` and `default` are the denser variants.
- **Items** can be `display` (shown) or `filter` (used to constrain what the section loads) — filter items are invisible on the storefront, so ignore them visually.
- **Banner items** may link to a product, category, brand, **or an arbitrary URL**.

### What the storefront receives

`GET /api/home-layout?platform=web&category_slug=…`, returning ordered sections and **paginated** — `current_page`, `last_page`, `per_page`, `total`. Sections load in pages, so the home page can be long and loads progressively.

**Design consequences:**

- **Section-level skeletons.** Each section type needs its own loading skeleton, because sections arrive progressively rather than the page arriving at once.
- **Infinite section loading** — design the transition as further sections stream in below the fold.
- **Unknown section types must degrade safely.** Admins may add types later; the design should not break if a section type is unrecognised — show nothing rather than a broken block.
- **Sections have no guaranteed order or presence.** Two `products` rails may sit adjacent; there may be no categories section at all. Vertical rhythm and spacing must hold for *any* permutation. Show at least two contrasting example compositions to prove it.

### What I want from you for the home page

1. The **section-block kit** — every type × every style, as reusable blocks.
2. **Three assembled example home pages**, proving the kit composes:
   - a global home page,
   - a category-scoped home page that looks clearly different,
   - a sparse one (2–3 sections) proving it doesn't look broken when an admin configures little.
3. The **empty state** for a category with no layout.
4. Section loading skeletons and the progressive-load behaviour.

None of the three example pages may open with a hero-style masthead. Each should start with an ordinary `banners`, `categories` or `products` section, at its normal size — that is what the storefront actually renders.

---

## Global components to specify

Header (with search, market/location, cart, account), bottom navigation (mobile), footer, product card (grid and list variants, with discount badge, rating, sponsored/recommended badges, quantity stepper inline), store card, brand card, category card, order card, address card, review card, wishlist card, price display (with strike-through original and discount pill), rating stars, quantity stepper, delivery-time badge, section heading with "see all", breadcrumbs, pagination and infinite-scroll status, toast, skeletons per card type, empty states, error states.

---

## Technical constraints — the design must be implementable in this stack

- **Next.js (Pages Router)** + React + TypeScript
- **Tailwind CSS v4**
- **HeroUI** component library, themed with the tokens above — prefer its primitives (Button, Input, Card, Chip, Modal, Drawer, Tabs, Accordion, Pagination, Select, Skeleton, Toast, Table) over bespoke widgets
- **lucide-react** icons
- **framer-motion** for animation, **swiper** for carousels
- Dark mode via a class on the root element

Do not introduce a second component library, a different icon set, or a CSS-in-JS approach.

---

## What to produce

1. **A design-system page** — the palette in both themes, type scale, spacing, radii, shadows, and every component in all its states (default, hover, focus, active, disabled, loading, error).
2. **The home section-block kit** — every section type × every style variant, plus the three assembled example home pages described above. Treat this as the centrepiece.
3. **Interactive screens** for the list above — responsive, theme-switchable, clickable between related screens.
4. **A short rationale** — the layout decisions you made for tablet and desktop, since the mobile layout is fixed by the app.
5. **An explicit list of anything you changed or improved** versus the app, and why.

Prioritise the home builder kit, then the rest of Group A. Tell me what you skipped rather than silently thinning it.

Use realistic marketplace content — real-sounding product names, prices, seller names, ratings, order states. No lorem ipsum, no placeholder grey boxes standing in for content.
