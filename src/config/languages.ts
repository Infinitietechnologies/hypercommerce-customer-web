import type { ClientLanguage } from "@/types/language";

export const LANGUAGE_COOKIE_KEY = "i18nextLng";
export const LANGUAGE_DIRECTION_COOKIE_KEY = "i18nextDir";

export const DEFAULT_LANGUAGE = "en";

export const FALLBACK_LANGUAGES: ClientLanguage[] = [
  {
    code: "en",
    name: "English",
    native_name: "English",
    direction: "ltr",
  },
  {
    code: "ar",
    name: "Arabic",
    native_name: "العربية",
    direction: "rtl",
  },
  {
    code: "hi",
    name: "Hindi",
    native_name: "हिन्दी",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    native_name: "Français",
    direction: "ltr",
  },
];
