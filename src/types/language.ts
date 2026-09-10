import type { ApiResponse } from "@/types/common";

export type LanguageDirection = "ltr" | "rtl";

export type ClientLanguage = {
  code: string;
  name: string;
  native_name: string;
  direction: LanguageDirection;
};

export type ClientLanguagesData = {
  default: string | null;
  languages: ClientLanguage[];
};

export type TranslationValue = string | TranslationLabels;

export type TranslationLabels = {
  [key: string]: TranslationValue;
};

export type ClientLabelsData = {
  locale: string;
  direction: LanguageDirection;
  labels: TranslationLabels;
};

export type ClientLanguagesResponse = ApiResponse<ClientLanguagesData>;
export type ClientLabelsResponse = ApiResponse<ClientLabelsData>;
