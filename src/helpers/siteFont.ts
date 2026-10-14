import type { Settings } from "@/types/settings";

export const getSiteFontFamily = (
  settings: Settings | null | undefined,
): string | null => {
  if (!Array.isArray(settings)) return null;

  const family = settings.find((item) => item?.variable === "web")?.value
    ?.googleFontFamily;
  if (typeof family !== "string") return null;

  const normalized = family.trim().replace(/\s+/g, " ");
  return normalized.length > 0 &&
    normalized.length <= 80 &&
    /^[A-Za-z0-9 -]+$/.test(normalized)
    ? normalized
    : null;
};

export const getGoogleFontUrl = (family: string): string =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}&display=swap`;
