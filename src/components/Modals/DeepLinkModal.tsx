import React, { FC, useEffect, useState } from "react";
import { Button, Sheet, useDisclosure } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import {
  detectMobilePlatform,
  getAndroidIntentUrl,
  getCustomerAppLinks,
  getCustomerAppTarget,
} from "@/helpers/appLinks";

const DeepLinkModal: FC = () => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { appSettings, webSettings } = useSettings();
  const router = useRouter();
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [platform] = useState(() => {
    if (typeof navigator === "undefined") return "other";
    return detectMobilePlatform(
      navigator.userAgent || navigator.vendor || "",
      navigator.platform,
      navigator.maxTouchPoints,
    );
  });
  const [manuallyClosed, setManuallyClosed] = useState(false);
  const { scheme, iosStoreUrl, androidStoreUrl, androidPackage } =
    getCustomerAppLinks(appSettings, webSettings);
  const storeUrl = platform === "ios" ? iosStoreUrl : androidStoreUrl;
  const hasRequiredConfig = platform !== "other" && !!(scheme || storeUrl);
  const androidIntentUrl =
    platform === "android" && scheme
      ? getAndroidIntentUrl(
          getCustomerAppTarget(scheme, router.pathname, router.asPath),
          androidPackage,
          androidStoreUrl,
        )
      : undefined;

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(max-width: 768px)").matches);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || manuallyClosed || !hasRequiredConfig) return;

    const checkAndOpen = () => {
      if (manuallyClosed || !hasRequiredConfig) return;

      const dismissed = sessionStorage.getItem("deepLinkModalDismissed");

      // /share/products/[slug] is the unified share link (from web & app)
      const isSharePage = router.pathname === "/share/products/[slug]";

      const isSharedLink =
        isSharePage ||
        router.query.utm_medium === "share" ||
        router.query.invited === "true" ||
        router.query.open_app === "1";

      if ((dismissed && !isSharedLink) || isOpen) return;

      const allowedPaths = ["/", "/products/search"];
      const isProductDetail = router.pathname === "/products/[slug]";

      if (
        allowedPaths.includes(router.pathname) ||
        isProductDetail ||
        isSharePage
      ) {
        onOpen();
      }
    };

    checkAndOpen();

    const interval = setInterval(checkAndOpen, 1000);
    return () => clearInterval(interval);
  }, [
    isMobile,
    router.pathname,
    router.query,
    onOpen,
    isOpen,
    manuallyClosed,
    hasRequiredConfig,
  ]);

  const handleDismiss = () => {
    sessionStorage.setItem("deepLinkModalDismissed", "true");
    setManuallyClosed(true);
    onClose();
  };

  const tryDeepLink = () => {
    if (!scheme) {
      if (storeUrl) window.location.assign(storeUrl);
      return;
    }
    const target = getCustomerAppTarget(scheme, router.pathname, router.asPath);

    if (platform === "ios") {
      const start = Date.now();
      let appOpened = false;
      const markOpened = () => {
        if (document.visibilityState === "hidden") appOpened = true;
      };
      const onPageHide = () => {
        appOpened = true;
      };
      window.addEventListener("pagehide", onPageHide, { once: true });
      document.addEventListener("visibilitychange", markOpened);
      try {
        window.location.assign(target);
      } catch {
        window.removeEventListener("pagehide", onPageHide);
        document.removeEventListener("visibilitychange", markOpened);
        if (iosStoreUrl) window.location.assign(iosStoreUrl);
        return;
      }
      setTimeout(() => {
        window.removeEventListener("pagehide", onPageHide);
        document.removeEventListener("visibilitychange", markOpened);
        if (
          !appOpened &&
          document.visibilityState === "visible" &&
          Date.now() - start < 3500 &&
          iosStoreUrl
        ) {
          window.location.assign(iosStoreUrl);
        }
      }, 2500);
    }
  };

  if (!isMobile) return null;

  // Get first letter of site name for the icon
  const siteName = webSettings?.siteName || "HyperCommerce";
  const iconLetter = siteName.charAt(0).toUpperCase();

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={handleDismiss}
      hideCloseButton
      backdrop="transparent"
      size="sm"
      className="m-0"
    >
      <div className="p-2">
        {/* App info row */}
        <div className="flex items-center gap-3 mb-4">
          {/* App icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-focus">
            <span className="text-white text-xl font-bold">{iconLetter}</span>
          </div>

          {/* App name & subtitle */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-tight">
              {siteName}
            </span>
            <span className="text-xs text-gray-500 leading-tight mt-0.5">
              {t("appLink.description")}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            as={androidIntentUrl ? "a" : undefined}
            href={androidIntentUrl}
            color="primary"
            className="flex-1 h-11 font-semibold text-sm rounded-xl"
            onPress={androidIntentUrl ? undefined : tryDeepLink}
          >
            {scheme ? t("appLink.openInApp") : t("appLink.getApp")}
          </Button>
          <Button
            variant="flat"
            className="flex-1 h-11 font-semibold text-sm rounded-xl bg-gray-100 text-gray-700"
            onPress={handleDismiss}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
};

export default DeepLinkModal;
