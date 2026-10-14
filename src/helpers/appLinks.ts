import type { AppSettings, WebSettings } from "@/types/settings";

export type MobilePlatform = "android" | "ios" | "other";

export const detectMobilePlatform = (
  userAgent: string,
  platform = "",
  maxTouchPoints = 0,
): MobilePlatform => {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (platform === "MacIntel" && maxTouchPoints > 1) return "ios";
  return "other";
};

const firstValidUrl = (
  candidates: (string | null | undefined)[],
  store: "apple" | "play",
): string | null => {
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      const url = new URL(candidate.trim());
      if (
        store === "apple" &&
        (((url.protocol === "https:" || url.protocol === "itms-apps:") &&
          ["apps.apple.com", "itunes.apple.com"].includes(url.hostname)) ||
          (url.protocol === "https:" &&
            url.hostname === "testflight.apple.com" &&
            /^\/join\/[A-Za-z0-9]+\/?$/.test(url.pathname)))
      ) {
        return url.toString();
      }
      if (
        store === "play" &&
        url.protocol === "https:" &&
        url.hostname === "play.google.com"
      ) {
        return url.toString();
      }
      if (
        store === "play" &&
        url.protocol === "market:" &&
        url.searchParams.get("id")
      ) {
        return `https://play.google.com/store/apps/details?id=${encodeURIComponent(url.searchParams.get("id")!)}`;
      }
    } catch {
      continue;
    }
  }
  return null;
};

export const getCustomerAppLinks = (
  appSettings: AppSettings | null,
  webSettings: WebSettings | null | undefined,
) => {
  const scheme =
    [appSettings?.customerAppScheme, appSettings?.appScheme]
      .map((value) => value?.trim().replace(/:\/\/.*$/, ""))
      .find(
        (value) =>
          value &&
          /^[a-z][a-z0-9+.-]*$/i.test(value) &&
          !["http", "https", "intent", "market"].includes(value.toLowerCase()),
      ) ?? null;
  const iosStoreUrl = firstValidUrl(
    [
      appSettings?.customerAppstoreLink,
      webSettings?.appSectionAppstoreLink,
      appSettings?.appstoreLink,
    ],
    "apple",
  );
  const androidStoreUrl = firstValidUrl(
    [
      appSettings?.customerPlaystoreLink,
      webSettings?.appSectionPlaystoreLink,
      appSettings?.playstoreLink,
    ],
    "play",
  );
  const packageId = androidStoreUrl
    ? new URL(androidStoreUrl).searchParams.get("id")
    : null;
  const androidPackage =
    packageId &&
    /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageId)
      ? packageId
      : null;

  return { scheme, iosStoreUrl, androidStoreUrl, androidPackage };
};

export const getCustomerAppTarget = (
  scheme: string,
  pathname: string,
  asPath: string,
  rootDestination: "home" | "products" = "home",
): string => {
  const segments = asPath.split(/[?#]/)[0].split("/").filter(Boolean);
  const isProductDetail =
    pathname === "/products/[slug]" ||
    pathname === "/share/products/[slug]" ||
    (segments.length === 2 && segments[0] === "products") ||
    (segments.length === 3 &&
      segments[0] === "share" &&
      segments[1] === "products");

  if (isProductDetail && segments.length > 0) {
    const slug = segments[segments.length - 1];
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      decodedSlug = slug;
    }
    return `${scheme}://products?slug=${encodeURIComponent(decodedSlug)}`;
  }
  if (segments[0] === "products") return `${scheme}://products`;
  return `${scheme}://${rootDestination}`;
};

export const getAndroidIntentUrl = (
  target: string,
  packageId: string | null,
  storeUrl: string | null,
): string => {
  const [scheme, destination] = target.split("://", 2);
  const packagePart = packageId ? `package=${packageId};` : "";
  const fallbackPart = storeUrl
    ? `S.browser_fallback_url=${encodeURIComponent(storeUrl)};`
    : "";
  return `intent://${destination}#Intent;scheme=${scheme};${packagePart}${fallbackPart}end`;
};
