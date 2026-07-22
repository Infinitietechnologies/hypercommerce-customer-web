# `src/components/` — Presentational components

This directory holds **building blocks** — components that take props and render JSX. They should not fetch data, not own global state, and not know what page they're on.

```
components/
├── ui/                   # ★ the UI layer — the ONLY place @heroui/react is imported
├── Cards/                # product cards, store cards, brand cards, etc.
├── Cart/                 # cart-row, cart-summary, promo input, etc.
├── CartQuantityControl.tsx
├── Empty/                # empty-state illustrations (folding into ui/EmptyState)
├── FilePreview.tsx
├── Footer/
├── Functional/           # behavioural wrappers + inputs (PhoneInput, InfiniteScroll, …)
├── Location/             # address & map picker pieces
├── Modals/               # bootstrap modals (auth, address, share, …)
├── NoProductsFound.tsx
├── OfflinePage.tsx
├── PaymentGateway/       # gateway-specific UI fragments (Stripe Elements, Razorpay button)
├── PaymentMethods.tsx
├── Products/             # ProductDetailPage + ProductFilter
├── ProfileBtn.tsx
├── ProgressBar.tsx       # top-of-page nprogress bar
├── RatingStars.tsx
├── SectionHeading.tsx
├── Seller/               # seller profile snippets
├── Skeletons/            # loading skeletons (rebuild on ui/Skeleton)
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
- **Import from `@/components/ui`, not `@heroui/react`.** The `ui/` layer is the single place HeroUI is imported and themed to match the Flutter app. Don't hand-roll a component `ui/` already exports, and don't reach past it.
- **Tailwind classes** — no inline `style` objects except for dynamic computed values (e.g. progress bar width).
- **Skeletons live in `Skeletons/`.** Always use a skeleton for loading state on lists/cards — don't roll a per-page spinner. Build them on `ui/Skeleton`.
- **Every screen needs loading, empty, and error states** — `ui/Skeleton`, `ui/EmptyState`, `ui/ErrorState`.

### The `ui/` layer

Two kinds of export from `components/ui/index.ts`:

- **Wrapped** — `Button`, `Input`, `Textarea`, `Card`, `Chip`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorState`, and the `toast*` helpers. These carry Flutter parity; each file cites the Dart source it matches. Change behaviour here, never at a call site.
- **Pass-through** — `Divider`, `Spinner`, `Avatar`, `Badge`, `Tooltip`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tabs`, `Accordion`, `Pagination`, `Table`, `useDisclosure`, and friends. Already correct via the theme, re-exported so the import boundary holds.

**Use `Sheet`, not `Modal`, for anything the app presents as a bottom sheet** — filters, sort, variant pickers, address/country selection, confirmations. It renders a bottom drawer on mobile and a centred modal from tablet up.

Migration is incremental: existing files still import `@heroui/react` directly. Convert a file to `@/components/ui` when you touch it for another reason — do not do a repo-wide sweep in an unrelated commit.

## When to create a new folder

If a domain has ≥3 components, give it a folder (`components/Reviews/`, `components/Wallet/`, …). For 1–2 components, a single file at the root is fine.

## Don'ts

- Don't fetch data inside a component — push that to a view or service.
- Don't read `process.env.*` inside a component — receive as prop or read in `_app.tsx`.
- Don't put navigation logic deep inside a card — emit a callback / wrap with `<Link>`.
- Don't import a slice action and call it from a deep component — let the view orchestrate.
- Don't render UI that depends on `window` outside `useEffect` (SSR mismatch).
- Don't hard-code English strings — `useTranslation` and `t('key')`.
