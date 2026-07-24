/**
 * Design tokens extracted from the Flutter app.
 * Source: hypercommerce-customer-app/lib/config/theme.dart (AppTheme)
 *
 * This file is the ONLY place raw hex values belong. Everything else consumes
 * these through the Tailwind/HeroUI theme.
 */

/**
 * Brand amber. 500 is the brand primary.
 * Source: HyperCommerce "Ecommerce redesign with amber theme" Hero UI handoff
 * (Claude Design 6302fd32…), tailwind.config.js `primary` scale. This supersedes
 * the old Flutter amber (#FFB616) — the redesign is now the source of truth.
 */
export const brand = {
  50: "#fdf7e8",
  100: "#fdf2d5",
  200: "#f9e3a5",
  300: "#f4cf6a",
  400: "#efba3f",
  500: "#eba513",
  600: "#c2870a",
  700: "#946608",
  800: "#6b4a06",
  900: "#443003",
} as const;

/** Label colour on brand fills. Redesign primary-foreground (#1c1608, near-black). */
export const onBrand = "#1c1608";

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

// Surfaces below come from the amber redesign (warm cream in light, warm
// near-black in dark). content1 = card, content2 = subtle fill, content3/4 =
// deeper wells. Source: handoff tailwind.config.js.
export const light = {
  background: "#f4f2ec",
  foreground: "#181510",
  surface1: "#ffffff",
  surface2: "#f0ede5",
  surface3: "#ece8df",
  surface4: "#d8d2c4",
  divider: "#ece8df",
  outline: "#ece8df",
  muted: "#6d6656",
  subCategoryCard: "#E5FBFF",
  collapsedAppBar: "#f0ede5",
} as const;

/** L0 page → L1 card → L2 elevated → L3 chip/input — warm dark. */
export const dark = {
  background: "#100e0b",
  foreground: "#f5f0e5",
  surface1: "#1a1712",
  surface2: "#231f18",
  surface3: "#2b2620",
  surface4: "#3a342b",
  divider: "#2b2620",
  outline: "#3a342b",
  // Kept for API compatibility with prior callers; now opaque warm tones.
  dividerSolid: "#2b2620",
  outlineSolid: "#3a342b",
  muted: "#a89f8c",
  bottomNav: "#100e0b",
  bottomNavInactive: "#a89f8c",
} as const;

// success/danger are mode-specific in the redesign; heroui.ts picks per theme.
export const status = {
  error: "#d6453f",
  errorDark: "#f06a63",
  success: "#178a4e",
  successDark: "#4ec982",
  warning: "#FFAB40",
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

/** Buttons 8, cards/inputs/sheets 12, large surfaces 16. */
export const radius = {
  small: "6px",
  medium: "8px",
  large: "12px",
  xlarge: "16px",
} as const;

/** Fills the 6/10/14 gaps in Tailwind's 4px scale. */
export const spacing = {
  1.5: "6px",
  2.5: "10px",
  3.5: "14px",
} as const;

/** Cards are flat in the app — shadows are for floating/overlay surfaces only. */
export const shadow = {
  sm: "0 2px 10px rgba(0,0,0,0.10)",
  md: "0 3px 10px rgba(0,0,0,0.12)",
  lg: "0 6px 12px rgba(0,0,0,0.15)",
  overlay: "0 2px 10px rgba(0,0,0,0.20)",
} as const;
