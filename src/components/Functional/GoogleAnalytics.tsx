import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  GOOGLE_ANALYTICS_ENABLED,
  GOOGLE_ANALYTICS_ID,
  initializeGoogleAnalytics,
  trackPageView,
} from "@/lib/analytics";

const isAnalyticsRoute = (path: string) =>
  !path.startsWith("/redesign") && !path.startsWith("/design-system");

const subscribeToAnalyticsConsent = (onStoreChange: () => void) => {
  window.addEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
  };
};

export default function GoogleAnalytics() {
  const router = useRouter();
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    () => null,
  );

  useEffect(() => {
    if (!GOOGLE_ANALYTICS_ENABLED || consent !== "accepted") return;

    initializeGoogleAnalytics();
  }, [consent]);

  useEffect(() => {
    if (
      !GOOGLE_ANALYTICS_ENABLED ||
      consent !== "accepted" ||
      !isAnalyticsRoute(router.asPath)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      trackPageView(router.asPath, document.title || router.asPath);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [consent, router.asPath]);

  if (!GOOGLE_ANALYTICS_ENABLED || consent !== "accepted") return null;

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
      strategy="afterInteractive"
    />
  );
}
