# `src/features/` — Feature modules

New feature work goes here. It mirrors the Flutter app's `lib/screens/<feature>/`
so the two codebases stay easy to compare.

```
features/
└── <feature>/
    ├── components/   # UI used only by this feature
    ├── hooks/        # data hooks for this feature (SWR over src/services/*)
    └── types.ts      # feature-local types that are NOT API response shapes
```

Name the folder after the Flutter feature it mirrors — `checkout`, `orders`,
`wishlist` — not after a route.

## What goes where

| Thing | Location |
|---|---|
| Component used by one feature | `features/<feature>/components/` |
| Component reused across features | `components/shared/` |
| Any HeroUI primitive | `components/ui/` — never import `@heroui/react` here |
| API caller | `services/<domain>.ts` — never `axios` in a feature |
| API response type | `types/<domain>.ts` |
| Cross-page state | `lib/redux/slices/` |
| Page shell + `getServerSideProps` | `pages/` (Pages Router — unchanged) |

## Rules

- **This does not replace `pages/`.** Routing stays file-based in `src/pages/`.
  A page remains a thin shell that runs `getServerSideProps` and renders a view.
- **No data fetching in components.** A component takes props or calls a hook
  from `hooks/`; the hook calls a service.
- **Existing code stays put.** `components/`, `views/`, and `pages/` are not
  being migrated wholesale — this is for new work and for features being
  rebuilt against the Flutter reference.
- **Open the Flutter screen first.** `hypercommerce-customer-app/lib/screens/<feature>/view/`
  is the reference for layout, ordering, and interaction.
- Every screen ships loading, empty, and error states — `ui/Skeleton`,
  `ui/EmptyState`, `ui/ErrorState`.
