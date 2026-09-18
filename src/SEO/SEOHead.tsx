import React from "react";
import NextHead from "next/head";
import Script from "next/script";
import { Settings } from "@/types/ApiResponse";
import { getWebSettings } from "@/helpers/getters";
import { siteConfig } from "@/config/site";
import {
  defaultRobotsForUrl,
  ensureAbsoluteUrl,
  getCanonicalUrl,
} from "@/helpers/seo";
import { useRouter } from "next/router";

interface HeadProps {
  settings: Settings;
}

export const SEOHead = ({ settings }: HeadProps) => {
  const router = useRouter();
  const webSettings = getWebSettings(settings as Settings);
  const siteName =
    webSettings?.siteName || siteConfig.name || "Default Site Name";
  const fullTitle = siteName;
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    webSettings?.customerWebUrl ||
    ""
  ).trim();
  const siteLogo = ensureAbsoluteUrl(
    webSettings?.defaultSeoImage || webSettings?.siteHeaderLogo || "/logo.png",
    baseUrl,
  );
  const pathname = router.asPath.split(/[?#]/)[0] || "/";
  const canonical = getCanonicalUrl(pathname, baseUrl);
  const robots = defaultRobotsForUrl(router.asPath);

  if (!webSettings) {
    return (
      <NextHead>
        <title>{fullTitle}</title>
        <meta
          name="description"
          content={siteConfig.metaDescription}
          key="description"
        />
        <meta
          name="keywords"
          content={siteConfig.metaKeywords}
          key="keywords"
        />
        <meta name="robots" content={robots} key="robots" />
        <meta name="googlebot" content={robots} key="googlebot" />
        {canonical && <link rel="canonical" href={canonical} key="canonical" />}
      </NextHead>
    );
  }
  return (
    <NextHead>
      <title>{fullTitle}</title>
      <link
        rel="icon"
        href={webSettings?.siteFavicon || "/default-favicon.ico"}
        type="image/x-icon"
        key="favicon"
      />
      <meta
        name="description"
        content={webSettings.metaDescription || "Default meta description"}
        key="description"
      />

      <meta
        name="keywords"
        content={webSettings.metaKeywords || "default, keywords"}
        key="keywords"
      />
      <meta name="copyright" content={webSettings.siteCopyright} />
      <meta name="author" content={webSettings.supportEmail} />
      <meta name="robots" content={robots} key="robots" />
      <meta name="googlebot" content={robots} key="googlebot" />
      {canonical && <link rel="canonical" href={canonical} key="canonical" />}
      {webSettings.googleSiteVerification && (
        <meta
          name="google-site-verification"
          content={webSettings.googleSiteVerification}
          key="google-site-verification"
        />
      )}
      {webSettings.bingSiteVerification && (
        <meta
          name="msvalidate.01"
          content={webSettings.bingSiteVerification}
          key="msvalidate.01"
        />
      )}
      <meta property="og:title" content={webSettings.siteName} key="og:title" />
      <meta
        property="og:description"
        content={webSettings.metaDescription || "Default meta description"}
        key="og:description"
      />
      <meta property="og:image" content={siteLogo} key="og:image" />
      <meta property="og:url" content={canonical} key="og:url" />
      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta
        name="twitter:title"
        content={webSettings.siteName || "Default Site Name"}
        key="twitter:title"
      />
      <meta
        name="twitter:description"
        content={webSettings.metaDescription || "Default meta description"}
        key="twitter:description"
      />
      <meta name="twitter:image" content={siteLogo} key="twitter:image" />

      {webSettings?.headerScript && (
        <Script
          id="global-header-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: webSettings.headerScript }}
          key="global-header-script"
        />
      )}
      {webSettings?.footerScript && (
        <Script
          id="global-footer-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: webSettings.footerScript }}
          key="global-footer-script"
        />
      )}
    </NextHead>
  );
};
