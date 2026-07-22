import localFont from "next/font/local";

// Figtree matches the Flutter app (hypercommerce-customer-app/pubspec.yaml).
// Variable font — one file covers every weight the app uses (300-800).
// next/font requires plain object literals here: no spreads, no shared consts.
export const fontSans = localFont({
  src: "../assets/fonts/Figtree-VariableFont_wght.ttf",
  weight: "300 900",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
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
