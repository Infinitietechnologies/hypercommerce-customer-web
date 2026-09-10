import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { GetServerSidePropsContext } from "next";

import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGES,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_DIRECTION_COOKIE_KEY,
} from "@/config/languages";
import { getCookieFromContext } from "@/helpers/getters";
import { getCookie, setCookie } from "@/lib/cookies";
import { getWebLabels, getWebLanguages } from "@/services/language";
import type { LanguageDirection, TranslationLabels } from "@/types/language";
import arTranslation from "./public/locales/ar.json";
import enTranslation from "./public/locales/en.json";
import hiTranslation from "./public/locales/hi.json";

const translationResources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  ar: { translation: arTranslation },
};

i18n.use(initReactI18next).init({
  resources: translationResources,
  lng: getCookie<string>(LANGUAGE_COOKIE_KEY) || DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export const applyLanguage = async (
  code: string,
  labels: TranslationLabels | undefined,
  direction: LanguageDirection,
  persist = true,
): Promise<void> => {
  if (labels && Object.keys(labels).length > 0) {
    if (i18n.hasResourceBundle(code, "translation")) {
      i18n.removeResourceBundle(code, "translation");
    }
    i18n.addResourceBundle(code, "translation", labels, true, true);
  }

  await i18n.changeLanguage(code);

  if (typeof document !== "undefined") {
    if (persist) {
      setCookie(LANGUAGE_COOKIE_KEY, code, { expires: 365 });
    }
    setCookie(LANGUAGE_DIRECTION_COOKIE_KEY, direction, { expires: 365 });
    document.documentElement.setAttribute("dir", direction);
    document.documentElement.setAttribute("lang", code);
  }
};

export const loadTranslations = async (
  context: GetServerSidePropsContext,
): Promise<void> => {
  const languagesResponse = await getWebLanguages();
  const available =
    languagesResponse.success && languagesResponse.data?.languages.length
      ? languagesResponse.data.languages
      : FALLBACK_LANGUAGES;
  const storedCode = getCookieFromContext<string>(context, LANGUAGE_COOKIE_KEY);
  const selected =
    available.find((language) => language.code === storedCode) ??
    available.find(
      (language) => language.code === languagesResponse.data?.default,
    ) ??
    available.find((language) => language.code === DEFAULT_LANGUAGE) ??
    available[0];
  const labelsResponse = await getWebLabels(selected.code);
  const resolvedLanguage = labelsResponse.data
    ? (available.find(
        (language) => language.code === labelsResponse.data?.locale,
      ) ?? selected)
    : selected;

  await applyLanguage(
    resolvedLanguage.code,
    labelsResponse.success ? labelsResponse.data?.labels : undefined,
    labelsResponse.data?.direction ?? resolvedLanguage.direction,
    false,
  );
};

export default i18n;
