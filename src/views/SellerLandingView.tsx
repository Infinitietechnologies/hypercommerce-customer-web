import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import DynamicSEO from "@/SEO/DynamicSEO";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { useSettings } from "@/contexts/SettingsContext";
import { SellerLandingSectionRenderer } from "@/features/seller-landing/components/SellerLandingSections";
import { resolveSellerLanding } from "@/features/seller-landing/types";
import type { SellerLandingSettings } from "@/types/sellerLanding";

export default function SellerLandingView() {
  const { t, i18n } = useTranslation();
  const { settings, webSettings } = useSettings();
  const configured = Array.isArray(settings)
    ? (settings as unknown as Array<{ variable: string; value: unknown }>).find(
        (entry) => entry.variable === "seller_landing",
      )?.value
    : undefined;
  const page = useMemo(
    () =>
      resolveSellerLanding(
        configured as SellerLandingSettings | undefined,
        i18n.resolvedLanguage || i18n.language || "en",
        t,
      ),
    [configured, i18n.language, i18n.resolvedLanguage, t],
  );
  const logo =
    webSettings?.siteHeaderLogo ||
    webSettings?.siteHeaderDarkLogo ||
    "https://placehold.co/160x40?text=Logo";

  return (
    <div className="min-h-screen w-full">
      <DynamicSEO
        title={page.seo.title}
        description={page.seo.description}
        keywords={page.seo.keywords}
        canonical="/seller-register"
        ogType="website"
        ogImage={page.seo.image}
      />
      <div className="flex w-full flex-col items-start gap-12">
        <MyBreadcrumbs
          breadcrumbs={[{ href: "/seller-register", label: page.seo.title }]}
        />
        {page.sections.map((section, index) => (
          <SellerLandingSectionRenderer
            key={section.id}
            section={section}
            previousType={page.sections[index - 1]?.type}
            logo={logo}
            siteName={webSettings?.siteName || "HyperCommerce"}
          />
        ))}
      </div>
    </div>
  );
}
