import type { ConfigThemes } from "@heroui/theme";

import {
  brand,
  dark,
  light,
  neutralDark,
  neutralLight,
  onBrand,
  radius,
  status,
} from "./tokens";

const primary = { ...brand, DEFAULT: brand[500], foreground: onBrand };

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
      default: { ...neutralLight, DEFAULT: neutralLight[300], foreground: light.foreground },
      primary,
      secondary: { ...neutralLight, DEFAULT: light.foreground, foreground: "#FFFFFF" },
      success: { DEFAULT: status.success, foreground: "#FFFFFF" },
      warning: { DEFAULT: status.warning, foreground: onBrand },
      danger: { DEFAULT: status.error, foreground: "#FFFFFF" },
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
      default: { ...neutralDark, DEFAULT: neutralDark[200], foreground: dark.foreground },
      primary,
      secondary: { ...neutralDark, DEFAULT: dark.foreground, foreground: onBrand },
      success: { DEFAULT: status.success, foreground: "#FFFFFF" },
      warning: { DEFAULT: status.warning, foreground: onBrand },
      danger: { DEFAULT: status.error, foreground: "#FFFFFF" },
    },
  },
};
