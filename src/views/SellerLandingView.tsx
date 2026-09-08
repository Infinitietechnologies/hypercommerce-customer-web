import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import DynamicSEO from "@/SEO/DynamicSEO";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { Skeleton } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { SellerLandingSectionRenderer } from "@/features/seller-landing/components/SellerLandingSections";
import { resolveSellerLanding } from "@/features/seller-landing/types";
import { getSellerLandingPage } from "@/services/sellerLanding";
import type { SellerLandingSettings } from "@/types/sellerLanding";

function SellerLandingLoading() {
  return (
    <div className="flex w-full flex-col gap-8 px-4" aria-busy="true">
      <div className="mx-auto flex w-full max-w-site flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[420px] w-full rounded-large" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-large" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SellerLandingView({
  configuration,
}: {
  configuration?: SellerLandingSettings | null;
}) {
  const { t, i18n } = useTranslation();
  const { webSettings } = useSettings();
  const {
    data: liveConfiguration,
    isLoading,
    isValidating,
  } = useSWR<SellerLandingSettings | null>(
    "/seller-landing",
    async () => {
      const response = await getSellerLandingPage();

      return response.success ? response.data ?? null : null;
    },
    {
      fallbackData: configuration ?? null,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      refreshInterval: 0,
    },
  );
  const page = useMemo(
    () =>
      resolveSellerLanding(
        liveConfiguration,
        i18n.resolvedLanguage || i18n.language || "en",
        t,
      ),
    [liveConfiguration, i18n.language, i18n.resolvedLanguage, t],
  );
  const logo =
    webSettings?.siteHeaderLogo ||
    webSettings?.siteHeaderDarkLogo ||
    "https://placehold.co/160x40?text=Logo";

  if (!configuration && !liveConfiguration && (isLoading || isValidating)) {
    return <SellerLandingLoading />;
  }

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
