import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";

// Plus Jakarta Sans — the typeface of the HyperCommerce amber redesign
// (Claude Design 6302fd32…). Supersedes Figtree as the storefront's `sans`.
// next/font requires plain object literals here: no spreads, no shared consts.
export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: "normal",
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "arial"],
});

export const fontMono = localFont({
  src: "../assets/fonts/Figtree-VariableFont_wght.ttf",
  weight: "300 900",
  style: "normal",
  variable: "--font-mono",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
