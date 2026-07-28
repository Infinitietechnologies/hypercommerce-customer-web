import type { ConfigThemes } from "@heroui/theme";

import { brand, dark, light, onBrand, onWarning, radius, secondaryAccent, status } from "./tokens";

const primary = { ...brand, DEFAULT: brand[500], foreground: onBrand };

/**
 * Warm neutral "default" scales for the amber redesign. HeroUI uses `default`
 * for muted fills/borders/disabled text, so these follow the cream (light) and
 * warm-black (dark) surface ramps rather than Material greys.
 */
const defaultLight = {
  50: "#f8fafc",
  100: light.surface2, // #f1f4f8
  200: light.surface3, // #e8edf3
  300: light.surface4, // #dde3ec
  400: "#9aa4b2",
  500: light.muted, // #667085
  600: "#475467",
  700: "#344054",
  800: "#1d2939",
  900: "#101828",
  foreground: light.foreground,
  DEFAULT: light.surface3,
} as const;

const defaultDark = {
  50: "#1a1712",
  100: dark.surface2, // #231f18
  200: dark.surface3, // #2b2620
  300: dark.surface4, // #3a342b
  400: "#5c5647",
  500: dark.muted, // #a89f8c
  600: "#c4bba6",
  700: "#d8d0bd",
  800: "#e8e2d3",
  900: dark.foreground,
  foreground: dark.foreground,
  DEFAULT: dark.surface3,
} as const;

/** Layout values shared by both themes. Border widths match the app's hairlines. */
export const heroLayout = {
  dividerWeight: "1px",
  disabledOpacity: 0.45,
  radius: {
    small: radius.small,
    medium: radius.medium,
    large: radius.large,
  },
  borderWidth: {
    small: "1px",
    medium: "1px",
    large: "2px",
  },
};

export const heroThemes: ConfigThemes = {
  light: {
    colors: {
      background: light.background,
      foreground: light.foreground,
      focus: brand[500],
      divider: light.divider,
      overlay: "#000000",
      content1: light.surface1,
      content2: light.surface2,
      content3: light.surface3,
      content4: light.surface4,
      default: defaultLight,
      primary,
      secondary: { DEFAULT: secondaryAccent.light, foreground: "#ffffff" },
      success: { DEFAULT: status.success, foreground: "#ffffff" },
      warning: { DEFAULT: status.warning, foreground: onWarning },
      danger: { DEFAULT: status.error, foreground: "#ffffff" },
    },
  },
  dark: {
    colors: {
      background: dark.background,
      foreground: dark.foreground,
      focus: brand[500],
      divider: dark.dividerSolid,
      overlay: "#000000",
      content1: dark.surface1,
      content2: dark.surface2,
      content3: dark.surface3,
      content4: dark.surface4,
      default: defaultDark,
      primary,
      secondary: { DEFAULT: secondaryAccent.dark, foreground: "#0d0820" },
      success: { DEFAULT: status.successDark, foreground: "#08110b" },
      warning: { DEFAULT: status.warning, foreground: onWarning },
      danger: { DEFAULT: status.errorDark, foreground: "#1a0605" },
    },
  },
};
