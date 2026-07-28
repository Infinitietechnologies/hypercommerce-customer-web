/**
 * Design tokens extracted from the Flutter app.
 * Source: hypercommerce-customer-app/lib/config/theme.dart (AppTheme)
 *
 * This file is the ONLY place raw hex values belong. Everything else consumes
 * these through the Tailwind/HeroUI theme.
 */

/**
 * Brand slate/ink. 500 is the brand primary.
 * Global scheme (2026-07): a neutral slate anchor replaces the amber accent —
 * tint `#eef1f6` (100), primary `#0f172a` (500), dark `#0b1120` (600) — ramp
 * filled to stay monotonic. Supersedes the amber `#f5a623` / `#eba513` handoffs.
 */
export const brand = {
  50: "#f5f7fa",
  100: "#eef1f6",
  200: "#d6dde8",
  300: "#aab6c9",
  400: "#526079",
  500: "#0f172a",
  600: "#0b1120",
  700: "#080d18",
  800: "#050810",
  900: "#020617",
} as const;

/** Label colour on brand (slate) fills — white for contrast. */
export const onBrand = "#ffffff";

/** Label colour on the amber `warning` fill — near-black for contrast. */
export const onWarning = "#1a1200";

/** Material greys, matching the grey.shadeN values used throughout the app. */
export const neutralLight = {
  50: "#FAFAFA",
  100: "#F5F5F5",
  200: "#EEEEEE",
  300: "#E0E0E0",
  400: "#BDBDBD",
  500: "#9E9E9E",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
} as const;

/** Dark neutrals follow the app's 4-level surface elevation, then invert for text. */
export const neutralDark = {
  50: "#1A1A1A",
  100: "#242424",
  200: "#2E2E2E",
  300: "#3A3A3A",
  400: "#5C5C5C",
  500: "#6B6B6B",
  600: "#9E9E9E",
  700: "#C4C4C4",
  800: "#E0E0E0",
  900: "#F0F0F0",
} as const;

// Surfaces from the new redesign. Warm cream page, white cards, warm hairlines.
// content1 = card, content2 = subtle fill, content3/4 = deeper wells.
// Source: `src/redesign/tokens.ts` (bg #faf8f5, surface #fff, line #ece8e2,
// ink #1c1a17, ink-soft #7a7570).
export const light = {
  background: "#f7f8fa",
  foreground: "#101828",
  surface1: "#ffffff",
  surface2: "#f1f4f8",
  surface3: "#e8edf3",
  surface4: "#dde3ec",
  divider: "#e6e9ee",
  outline: "#e6e9ee",
  muted: "#667085",
  subCategoryCard: "#E5FBFF",
  collapsedAppBar: "#f1f4f8",
} as const;

/**
 * Dark theme — DELIBERATELY ALIASED TO LIGHT for the redesign's light-only ship
 * (decision 2026-07-27, see THEME_REDESIGN.md). Keys kept so `heroui.ts` and
 * `tailwind.config.ts` keep compiling; values mirror `light` so nothing renders
 * a stale dark surface if a `dark` class slips through. `_app.tsx` also forces
 * the light theme. Restore a real dark ramp here when dark mode is revived.
 */
export const dark = {
  background: light.background,
  foreground: light.foreground,
  surface1: light.surface1,
  surface2: light.surface2,
  surface3: light.surface3,
  surface4: light.surface4,
  divider: light.divider,
  outline: light.outline,
  dividerSolid: light.divider,
  outlineSolid: light.outline,
  muted: light.muted,
  bottomNav: light.surface1,
  bottomNavInactive: light.muted,
} as const;

// success/danger are mode-specific in the redesign; heroui.ts picks per theme.
export const status = {
  // Redesign danger is #d1453b. *Dark variants mirror light (light-only ship).
  error: "#d1453b",
  errorDark: "#d1453b",
  success: "#178a4e",
  successDark: "#178a4e",
  warning: "#f5a623",
} as const;

/** Redesign secondary = violet accent (chips, "arriving" alerts). */
export const secondaryAccent = {
  light: "#6d5ae0",
  dark: "#a794ff",
} as const;

/** Commerce accents with no HeroUI slot — exposed as Tailwind utilities. */
export const accent = {
  ratingStar: "#EEAB18",
  deliveryTime: "#C2FBFF",
  discountCard: "#256533",
  orderTrack: "#338518",
  couponShade: "#E3F2FD",
  authBg: "rgba(0,0,0,0.87)",
} as const;

/**
 * Redesign radii: buttons 12 (small), cards/inputs 14 (medium), sheets 18
 * (large), large surfaces 20 (xlarge). HeroUI's `sm/md/lg` map to
 * small/medium/large; xlarge is a Tailwind utility.
 */
export const radius = {
  small: "12px",
  medium: "14px",
  large: "18px",
  xlarge: "20px",
} as const;

/** Fills the 6/10/14 gaps in Tailwind's 4px scale. */
export const spacing = {
  1.5: "6px",
  2.5: "10px",
  3.5: "14px",
} as const;

/**
 * Redesign elevation ramp — soft, tinted with the warm ink. Cards carry `sm`;
 * hover lifts to `md`; banners/overlays use `lg`/`overlay`.
 */
export const shadow = {
  sm: "0 2px 10px -6px rgba(16,24,40,0.08)",
  md: "0 12px 26px -14px rgba(16,24,40,0.18)",
  lg: "0 14px 30px -18px rgba(16,24,40,0.28)",
  overlay: "0 8px 24px -12px rgba(16,24,40,0.30)",
  // Slate lift under the primary CTA — the signature button shadow.
  primary: "0 8px 20px -10px rgba(15,23,42,0.4)",
} as const;
