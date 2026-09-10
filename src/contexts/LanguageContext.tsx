import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGES,
  LANGUAGE_COOKIE_KEY,
} from "@/config/languages";
import { getCookie } from "@/lib/cookies";
import { getWebLabels, getWebLanguages } from "@/services/language";
import type { ClientLanguage } from "@/types/language";
import { applyLanguage } from "../../i18n";

type LanguageContextValue = {
  languages: ClientLanguage[];
  currentLanguage: ClientLanguage;
  isLoading: boolean;
  selectLanguage: (code: string) => Promise<void>;
};

const fallbackLanguage =
  FALLBACK_LANGUAGES.find((language) => language.code === DEFAULT_LANGUAGE) ??
  FALLBACK_LANGUAGES[0];

const LanguageContext = createContext<LanguageContextValue>({
  languages: FALLBACK_LANGUAGES,
  currentLanguage: fallbackLanguage,
  isLoading: true,
  selectLanguage: async () => undefined,
});

export const useLanguages = () => useContext(LanguageContext);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [languages, setLanguages] =
    useState<ClientLanguage[]>(FALLBACK_LANGUAGES);
  const [currentLanguage, setCurrentLanguage] =
    useState<ClientLanguage>(fallbackLanguage);
  const [isLoading, setIsLoading] = useState(true);

  const activate = useCallback(
    async (language: ClientLanguage, persist: boolean) => {
      const response = await getWebLabels(language.code);
      const resolvedLanguage = response.data
        ? (languages.find((item) => item.code === response.data?.locale) ??
          language)
        : language;

      await applyLanguage(
        resolvedLanguage.code,
        response.success ? response.data?.labels : undefined,
        response.data?.direction ?? resolvedLanguage.direction,
        persist,
      );
      setCurrentLanguage(resolvedLanguage);
    },
    [languages],
  );

  const selectLanguage = useCallback(
    async (code: string) => {
      const language = languages.find((item) => item.code === code);
      if (!language || language.code === currentLanguage.code) return;

      setIsLoading(true);
      await activate(language, true);
      setIsLoading(false);
    },
    [activate, currentLanguage.code, languages],
  );

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const response = await getWebLanguages();
      const available =
        response.success && response.data?.languages.length
          ? response.data.languages
          : FALLBACK_LANGUAGES;
      const storedCode = getCookie<string>(LANGUAGE_COOKIE_KEY);
      const selected =
        available.find((language) => language.code === storedCode) ??
        available.find(
          (language) => language.code === response.data?.default,
        ) ??
        available.find((language) => language.code === DEFAULT_LANGUAGE) ??
        available[0];

      if (!active) return;
      setLanguages(available);

      const labelsResponse = await getWebLabels(selected.code);
      if (!active) return;

      const resolvedLanguage = labelsResponse.data
        ? (available.find(
            (language) => language.code === labelsResponse.data?.locale,
          ) ?? selected)
        : selected;
      await applyLanguage(
        resolvedLanguage.code,
        labelsResponse.success ? labelsResponse.data?.labels : undefined,
        labelsResponse.data?.direction ?? resolvedLanguage.direction,
        storedCode !== resolvedLanguage.code,
      );
      if (!active) return;

      setCurrentLanguage(resolvedLanguage);
      setIsLoading(false);
    };

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ languages, currentLanguage, isLoading, selectLanguage }),
    [currentLanguage, isLoading, languages, selectLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
