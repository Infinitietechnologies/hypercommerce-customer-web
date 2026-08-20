import { heroui } from "@heroui/theme";

import { heroLayout, heroThemes } from "./src/theme/heroui";
import {
  accent,
  aspectRatio,
  dark,
  light,
  radius,
  shadow,
  shell,
  spacing,
} from "./src/theme/tokens";

/** @type {import('tailwindcss').Config} */
const config: import("tailwindcss").Config = {
  content: [
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Font weights use Tailwind's standard scale — Plus Jakarta Sans ships
      // every face the app uses (400-800), so no remap is needed.
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      fontSize: {
        tiny: "0.4375rem", // 7px
        xxs: "0.625rem", // 10px
        label: "0.6875rem", // 11px — stacked header-action labels (sandbox HeaderIconButton)
        xs: "0.75rem", // 12px
        compact: "0.8125rem", // 13px — dense labels/body (sandbox pill, tabs, footer links)
        small: "0.875rem", // 14px
        medium: "0.9375rem", // 15px
        large: "1.125rem", // 18px
      },
      spacing,
      aspectRatio,
      maxWidth: {
        // Shared storefront page width — header, content and footer align on it.
        // Matches the redesign sandbox's `layout.maxWidth` (1280px) exactly.
        site: "1280px",
      },
      width: {
        // Full-bleed sections use the page container's content width, which
        // excludes classic scrollbars unlike 100vw.
        page: "100cqw",
      },
      borderRadius: {
        xlarge: radius.xlarge,
      },
      boxShadow: {
        sm: shadow.sm,
        md: shadow.md,
        lg: shadow.lg,
        overlay: shadow.overlay,
        primary: shadow.primary,
      },
      colors: {
        "rating-star": accent.ratingStar,
        "delivery-time": accent.deliveryTime,
        "discount-card": accent.discountCard,
        "order-track": accent.orderTrack,
        "coupon-shade": accent.couponShade,
        "auth-bg": accent.authBg,
        "sub-category-card": light.subCategoryCard,
        "collapsed-appbar": light.collapsedAppBar,
        "bottom-nav": dark.bottomNav,
        "bottom-nav-inactive": dark.bottomNavInactive,
        // Storefront shell (black header/footer) — the only dark surfaces.
        shell: shell.background,
        "shell-foreground": shell.foreground,
        "shell-muted": shell.muted,
        "shell-divider": shell.divider,
        "shell-surface": shell.surface,
        ink: "var(--ink, oklch(0.2 0.012 70))",
        "ink-foreground": "var(--ink-foreground, oklch(0.98 0.004 95))",
        "tint-grape": "var(--tint-grape)",
        "tint-mint": "var(--tint-mint)",
        "tint-butter": "var(--tint-butter)",
        "tint-blush": "var(--tint-blush)",
        "tint-sky": "var(--tint-sky)",
        "tint-peach": "var(--tint-peach)",
        "tint-lilac": "var(--tint-lilac)",
        "tint-sand": "var(--tint-sand)",
      },
      screens: {
        xxs: "320px",
        xs: "375px",
        sm: "431px",
        md: "769px",
        // Shell desktop/mobile cutover matches the sandbox (1024px). The header
        // uses arbitrary `min-[1024px]:` variants keyed to this same value.
        lg: "1440px",
        xl: "1800px",
        xxl: "2550px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      prefix: "heroui",
      addCommonColors: false,
      defaultTheme: "light",
      defaultExtendTheme: "light",
      layout: heroLayout,
      themes: heroThemes,
    }),
  ],
};

export default config;
