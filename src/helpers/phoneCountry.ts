import type { SystemSettings } from "@/types/settings";

export const getDefaultPhoneCountry = (
  settings: Pick<SystemSettings, "defaultISO2"> | null | undefined,
): string => {
  const country = settings?.defaultISO2?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : "US";
};
