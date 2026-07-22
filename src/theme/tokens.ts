/**
 * Design tokens extracted from the Flutter app.
 * Source: hypercommerce-customer-app/lib/config/theme.dart (AppTheme)
 *
 * This file is the ONLY place raw hex values belong. Everything else consumes
 * these through the Tailwind/HeroUI theme.
 */

/** Brand amber. 500 is AppTheme.primaryColor, 300 is AppTheme.lightPrimaryColor. */
export const brand = {
  50: "#FFF9E9",
  100: "#FFF0C7",
  200: "#FDE49B",
  300: "#FACC66",
  400: "#FFC23C",
  500: "#FFB616",
  600: "#DB9A0C",
  700: "#A87507",
  800: "#7A5405",
  900: "#533903",
} as const;

/** AppTheme.secondaryColor — sits on top of brand fills. */
export const onBrand = "#000000";

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

export const light = {
  background: "#FFFFFF",
  foreground: "#0D1117",
  surface1: "#FFFFFF",
  surface2: "#F7FAFC",
  surface3: "#F5F5F5",
  surface4: "#E0E0E0",
  divider: "#E0E0E0",
  outline: "#EEEEEE",
  muted: "#616161",
  subCategoryCard: "#E5FBFF",
  collapsedAppBar: "#F5F3ED",
} as const;

/** L0 page → L1 card → L2 elevated → L3 chip/input. */
export const dark = {
  background: "#0D0D0D",
  foreground: "#F0F0F0",
  surface1: "#1A1A1A",
  surface2: "#242424",
  surface3: "#2E2E2E",
  surface4: "#3A3A3A",
  divider: "rgba(255,255,255,0.06)",
  outline: "rgba(255,255,255,0.12)",
  // HeroUI stores colors as HSL channels and drops alpha, so it needs opaque
  // equivalents. These are the rgba values above flattened over the L0/L1 surfaces.
  dividerSolid: "#262626",
  outlineSolid: "#2E2E2E",
  muted: "#9E9E9E",
  bottomNav: "#111111",
  bottomNavInactive: "#6B6B6B",
} as const;

export const status = {
  error: "#F44336",
  success: "#4CAF50",
  warning: "#FFAB40",
} as const;

/**
 * The header bar is dark in both themes, so it cannot reuse `background`.
 * Matches the dark L0 surface so the two agree in dark mode.
 */
export const chrome = {
  header: "#0D0D0D",
  headerForeground: "#FFFFFF",
  headerMuted: "#9E9E9E",
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
