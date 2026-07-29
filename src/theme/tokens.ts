/**
 * Design tokens extracted from the Flutter app.
 * Source: hypercommerce-customer-app/lib/config/theme.dart (AppTheme)
 *
 * This file is the ONLY place raw hex values belong. Everything else consumes
 * these through the Tailwind/HeroUI theme.
 */

/**
 * Brand amber. 500 is the brand primary (#FFB616).
 * Global scheme (2026-07): amber accent anchored on `#FFB616` (500) with a
 * monotonic light→dark ramp. Primary fills use a near-black label (`onBrand`)
 * since amber needs a dark, not white, foreground for contrast.
 */
export const brand = {
  50: "#fff8e6",
  100: "#ffeec0",
  200: "#ffe196",
  300: "#ffd268",
  400: "#ffc63f",
  500: "#ffb616",
  600: "#e09e00",
  700: "#b37e00",
  800: "#8a6100",
  900: "#5e4200",
} as const;

/** Label colour on brand (amber) fills — near-black for contrast. */
export const onBrand = "#1a1200";

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

/**
 * Storefront shell (header + footer) — pure-black bars with light content
 * (2026-07). These are the ONLY dark surfaces in the otherwise light-only
 * redesign: the header/footer sit on `#000000` while the page between them
 * keeps the cream/white `light` surfaces. Consumed via the `shell*` Tailwind
 * color utilities registered in `tailwind.config.ts`.
 *   background → the black bar; foreground → primary labels/icons on it;
 *   muted → secondary text & footer links; divider → hairline on black;
 *   surface → raised chips/social-icon fills on black.
 */
export const shell = {
  background: "#000000",
  // Near-white, NOT pure #fff: on a pure-black bar, maximum-bright content
  // haloes ("halation") and thin strokes/labels read as blurry. Softening the
  // foreground a touch kills most of that bloom while staying high-contrast.
  foreground: "#ededed",
  muted: "#a1a1aa",
  divider: "#2a2a2a",
  surface: "#161616",
} as const;

// Surfaces from the new redesign. Warm cream page, white cards, warm hairlines.
// content1 = card, content2 = subtle fill, content3/4 = deeper wells.
// Source: `src/redesign/tokens.ts` (bg #faf8f5, surface #fff, line #ece8e2,
// ink #1c1a17, ink-soft #7a7570).
export const light = {
  background: "#ffffff",
  foreground: "#101828",
  surface1: "#ffffff",
  surface2: "#f4f4f4",
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
  // Amber lift under the primary CTA — the signature button shadow.
  primary: "0 8px 20px -10px rgba(255,182,22,0.5)",
} as const;
