import { useSyncExternalStore } from "react";
import Script from "next/script";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_ENABLED,
  getAnalyticsConsent,
} from "@/lib/analytics";

const MICROSOFT_CLARITY_ID =
  process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || "y7wc5695pb";

const subscribeToAnalyticsConsent = (onStoreChange: () => void) => {
  window.addEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
  };
};

export default function MicrosoftClarity() {
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    () => null,
  );

  if (!ANALYTICS_ENABLED || consent !== "accepted") return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${MICROSOFT_CLARITY_ID}");
      `}
    </Script>
  );
}
