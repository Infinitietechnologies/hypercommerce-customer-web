export const SUPPORTED_LANGUAGES = [
  { code: "en", countryCode: "us", name: "English", flag: "🇺🇸", direction: "ltr" },
  { code: "hi", countryCode: "in", name: "हिन्दी", flag: "🇮🇳", direction: "ltr" },
  { code: "ar", countryCode: "sa", name: "العربية", flag: "🇸🇦", direction: "rtl" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = "en";
