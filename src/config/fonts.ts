import localFont from "next/font/local";

// Figtree is loaded globally from Google Fonts via the <link> in _document.tsx
// and exposed to Tailwind through the `--font-sans` CSS variable (globals.css).
// This plain descriptor keeps existing imports (e.g. `_app`'s `fonts` export)
// resolving to the Figtree family without bundling a second, self-hosted copy.
export const fontSans = {
  className: "",
  variable: "",
  style: {
    fontFamily:
      '"Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  },
} as const;

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
