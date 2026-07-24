// Design tokens for the HyperCommerce storefront redesign.
//
// Source of truth: `ecommerce-website-design/HyperCommerce App.dc.html` and
// `HyperCommerce Kit Gallery.dc.html`. Those two files disagree slightly with
// `HyperCommerce Foundations.dc.html` (ink #171a1f vs #1c1a17, bg #ffffff vs
// #faf8f5, amber-dark #b9760a vs #c9790a). The App/Kit values win here because
// they are the ones the real screens are drawn with; Foundations is the outlier.
//
// Nothing in this folder touches the live app theme — every value below is
// emitted as a `--rd-*` CSS variable scoped to the `.rd` wrapper.

export const rdColors = {
  ink: "#1c1a17",
  inkSoft: "#7a7570",
  line: "#ece8e2",
  surface: "#ffffff",
  bg: "#faf8f5",
  amber: "#f5a623",
  amberDark: "#c9790a",
  amberTint: "#fdf1dc",
  danger: "#d1453b",
  /** Label colour on amber fills. */
  onAmber: "#1a1200",
  /** Status pill palettes (order status, shipped/cancelled). */
  shippedBg: "#eef2f6",
  shippedFg: "#3a5a7a",
  cancelledBg: "#fbe9e7",
} as const;

/**
 * Shorthands for the CSS vars — used everywhere instead of raw hex. The
 * variables themselves are declared once, on `.rd`, in `redesign.css`.
 */
export const v = {
  ink: "var(--rd-ink)",
  inkSoft: "var(--rd-ink-soft)",
  line: "var(--rd-line)",
  surface: "var(--rd-surface)",
  bg: "var(--rd-bg)",
  amber: "var(--rd-amber)",
  amberDark: "var(--rd-amber-dark)",
  amberTint: "var(--rd-amber-tint)",
  danger: "var(--rd-danger)",
  onAmber: rdColors.onAmber,
} as const;

/**
 * Type scale, verbatim from the Foundations sheet. Half-pixel sizes are
 * intentional — the design uses 13.5/12.5/14.5 in several places.
 */
export const type = {
  display: { fontSize: 28, fontWeight: 700 },
  heading: { fontSize: 22, fontWeight: 700 },
  sectionTitle: { fontSize: 19, fontWeight: 600 },
  subtitle: { fontSize: 15, fontWeight: 600 },
  body: { fontSize: 13.5, fontWeight: 400 },
  caption: { fontSize: 12, color: v.inkSoft },
} as const;

/** Corner radii used across the kit. */
export const radius = {
  chip: 999,
  badge: 8,
  sm: 10,
  md: 12,
  input: 14,
  card: 18,
  panel: 20,
  banner: 22,
} as const;

/** Elevation ramp. Every shadow in the design reduced to five steps. */
export const shadow = {
  hairline: "0 1px 2px rgba(28,26,23,.03)",
  card: "0 2px 10px -6px rgba(28,26,23,.08)",
  cardFlat: "0 2px 8px -4px rgba(28,26,23,.06)",
  cardHover: "0 12px 26px -14px rgba(28,26,23,.18)",
  tileHover: "0 10px 22px -12px rgba(28,26,23,.18)",
  banner: "0 14px 30px -18px rgba(28,26,23,.28)",
  bannerHover: "0 18px 36px -16px rgba(28,26,23,.36)",
  header: "0 2px 16px -12px rgba(28,26,23,.15)",
  amber: "0 8px 20px -10px rgba(245,166,35,.5)",
  amberHover: "0 10px 24px -8px rgba(245,166,35,.65)",
  circle: "0 4px 12px -8px rgba(28,26,23,.2)",
  circleHover: "0 8px 18px -8px rgba(245,166,35,.35)",
  overlay: "0 8px 24px -12px rgba(28,26,23,.3)",
} as const;

/** Page shell metrics. */
export const layout = {
  /** Full header/footer/main content width. */
  maxWidth: 1280,
  /** Minimal-header screens (checkout, static, 404) run narrower. */
  narrowWidth: 900,
  gutter: 24,
} as const;

/** Product/category grid minimums, from the design's auto-fill tracks. */
export const grids = {
  product: "repeat(auto-fill,minmax(200px,1fr))",
  productCompact: "repeat(auto-fill,minmax(180px,1fr))",
  categoryCard: "repeat(auto-fill,minmax(130px,1fr))",
  categoryTile: "repeat(auto-fill,minmax(160px,1fr))",
  categoryOverlay: "repeat(auto-fill,minmax(220px,1fr))",
  brand: "repeat(auto-fill,minmax(130px,1fr))",
  brandList: "repeat(auto-fill,minmax(150px,1fr))",
  store: "repeat(auto-fill,minmax(260px,1fr))",
  quickLink: "repeat(auto-fill,minmax(180px,1fr))",
  footer: "repeat(auto-fit,minmax(180px,1fr))",
} as const;
