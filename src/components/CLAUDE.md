# `src/components/` — Presentational components

This directory holds **building blocks** — components that take props and render JSX. They should not fetch data, not own global state, and not know what page they're on.

```
components/
├── Cards/                # product cards, store cards, brand cards, etc.
├── Cart/                 # cart-row, cart-summary, promo input, etc.
├── CartQuantityControl.tsx
├── Empty/                # empty-state illustrations
├── FilePreview.tsx
├── Footer/
├── Functional/           # behavioural wrappers (e.g. ClientOnly, IfAuthenticated)
├── Location/             # address & zone picker pieces
├── Modals/               # bootstrap modals (auth, address, share, …)
├── NoProductsFound.tsx
├── OfflinePage.tsx
├── Pages/                # page-section components (header bands, sub-headers)
├── PaymentGateway/       # gateway-specific UI fragments (Stripe Elements, Razorpay button)
├── PaymentMethods.tsx
├── product/              # PDP-specific pieces (review row, variant picker)
├── Products/             # ProductDetailPage + ProductFilter
├── ProfileBtn.tsx
├── ProgressBar.tsx       # top-of-page nprogress bar
├── RatingStars.tsx
├── SectionHeading.tsx
├── Seller/               # seller profile snippets
├── Skeletons/            # loading skeletons (use these instead of building per-page)
├── StoreProfile.tsx
├── SwiperNavigation.tsx
├── Tables/               # generic table components
├── custom/               # one-off custom widgets
├── navbar.tsx
├── primitives.ts         # text/colour primitives via tailwind-variants
└── theme-switch.tsx
```

## The component contract

- **Props in, JSX out.** No `useRouter` redirects to "/login" — let the page handle protection. No data fetching — receive data as props.
- **Local state is fine** (form state, hover state, accordion open/closed). Global state via Redux selectors or context.
- **HeroUI first.** When HeroUI ships the component (Button, Input, Modal, Card, Toast), use it. Don't hand-roll.
- **Tailwind classes** — no inline `style` objects except for dynamic computed values (e.g. progress bar width).
- **Skeletons live in `Skeletons/`.** Always use a skeleton for loading state on lists/cards — don't roll a per-page spinner.

## When to create a new folder

If a domain has ≥3 components, give it a folder (`components/Reviews/`, `components/Wallet/`, …). For 1–2 components, a single file at the root is fine.

## Don'ts

- Don't fetch data inside a component — push that to a view or service.
- Don't read `process.env.*` inside a component — receive as prop or read in `_app.tsx`.
- Don't put navigation logic deep inside a card — emit a callback / wrap with `<Link>`.
- Don't import a slice action and call it from a deep component — let the view orchestrate.
- Don't render UI that depends on `window` outside `useEffect` (SSR mismatch).
- Don't hard-code English strings — `useTranslation` and `t('key')`.
