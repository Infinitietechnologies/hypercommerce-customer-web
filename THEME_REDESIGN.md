# Theme redesign — migration plan

Reskin the live customer-web to the new amber redesign, **keeping HeroUI**. The
`/redesign/*` sandbox is the visual reference; this plan brings the real,
API-wired app up to it.

## Decisions (confirmed 2026-07-27)

| Question | Decision |
|---|---|
| Token source | **New redesign wins** — amber `#f5a623`, dark `#c9790a`, tint `#fdf1dc`, warm neutrals. Supersedes the old `#eba513` handoff. |
| Dark mode | **Ship light-only.** Dark theme aliased to light and forced off during the redesign. Revisit later. |
| Rollout | **In-place flip.** Rewrite the theme layer + `ui/` wrappers first (whole app adopts new atoms at once), then port screen layouts one by one. Legacy screens look transitional until ported. |
| Data gaps | **One running doc** — `REDESIGN_QUESTIONS.md`. Every missed/extra field logged there, batch-confirmed. A sensible default ships meanwhile, flagged. |

## Source of truth

- **Visual design** (colour, type, spacing, radii, shadows, component look): the
  `ecommerce-website-design/` files + the `src/redesign/` sandbox.
- **Screen inventory, features, API contract**: still the Flutter app + panel.
- Raw hex belongs **only** in `src/theme/tokens.ts`. Everything else consumes the
  HeroUI theme or Tailwind tokens.

## Phases

### A — Foundations flip
Rewrite `src/theme/tokens.ts` to the new palette/radii/shadows, preserving every
exported name so `heroui.ts` + `tailwind.config.ts` keep compiling. Alias dark to
light and force light in `_app.tsx`. **One edit reskins the whole app's atoms.**

### B — `ui/` wrapper layer + `/design-system`
Reskin each `src/components/ui/*` wrapper to the new foundations. Add wrappers for
HeroUI primitives the new UI needs but that aren't wrapped yet (Checkbox, Radio,
Select, Accordion, Tabs, Pagination, Drawer, Switch, …). Rebuild `/design-system`
as the new foundations + component gallery — the regression target every screen
is diffed against.

### C — Shell
Reskin `navbar.tsx`, `Footer`, `MobileTabBar`, `SearchBar`, location selector to
the new header/footer. Responsive: desktop bar ≥1024px, compact mobile bar below
(location replaces logo, account + cart top-right, search + wishlist full-width).

### D — Screens, one at a time
Port each live page to the new design, mapped to its `/redesign` counterpart.
Every screen keeps its four states (loading / empty / error / loaded). Every data
delta vs the redesign goes in `REDESIGN_QUESTIONS.md`.

Order: home → PDP → listing (search / category / brand) → cart → checkout →
account (overview, orders, order detail, addresses, wishlist, wallet,
transactions, notifications, refer) → stores → static/legal → 404 → auth.

## Screen map — live page ↔ redesign reference

| Live page | Redesign reference |
|---|---|
| `pages/index.tsx` | `/redesign/home` + kit sections |
| `pages/products/[slug]` | `/redesign/pdp` |
| `pages/products/search` | `/redesign/search` (filter rail + sort) |
| `pages/categories`, `categories/[slug]` | `/redesign/categories`, `/redesign/category` |
| `pages/brands`, `brands/[slug]` | `/redesign/brands`, `/redesign/brand` |
| `pages/stores`, `stores/[slug]` | `/redesign/stores`, `/redesign/store` |
| `pages/cart` | `/redesign/cart` |
| _checkout_ (live: none found) | `/redesign/checkout` + processing + result — **confirm route**, see questions doc |
| `pages/my-account/*` | `/redesign/account?tab=*` |
| `pages/shopping-list` | `/redesign/shopping-list` |
| `pages/share/products/[slug]` | `/redesign/share` |
| static/legal (`about-us`, `faqs`, `privacy-policy`, …) | `/redesign/static` |
| `pages/404` | `/redesign/not-found` |
| `pages/forgot-password`, auth sheet | **no redesign counterpart — design new (point 3)** |
| `pages/seller-register` | **no redesign counterpart — design new (point 3)** |

## Gaps needing new design (point 3)

Screens/components with no redesign counterpart — I design them to the new
foundations and log the rationale in the questions doc:
auth (login / OTP / forgot-password), seller-register, payment-gateway screens,
maintenance/offline page, and any HeroUI component the sandbox never exercised.

## Rules (point 4 — follow foundations strictly)

1. Colour only through the HeroUI theme / Tailwind tokens. No raw hex outside
   `tokens.ts`. No HeroUI default blue.
2. HeroUI imports only inside `src/components/ui/`.
3. Radii, spacing, shadows, type come from the token scale — no arbitrary values
   unless the token is added first.
4. Every screen ships loading / empty / error / loaded.
5. Icons: `@iconify/react` solar set.
6. i18n every user-facing string; keys into all three locales.
