import { useRouter } from "next/router";
import useSWR from "swr";

import LandingPageDocument from "@/components/LandingPageDocument";
import DynamicSEO from "@/SEO/DynamicSEO";
import DefaultLayout from "@/layouts/default";
import FullPageLoader from "@/components/ui/FullPageLoader";
import Custom404 from "@/pages/404";
import {
  getLandingPage,
  getLandingPageAssetBaseUrl,
} from "@/services/landingPage";
import type { LandingPageData } from "@/types/landingPage";
import type { Settings } from "@/types/ApiResponse";

interface LandingPageViewProps {
  initialLandingPage?: LandingPageData | null;
  initialSettings?: Settings | null;
  initialSlug?: string;
}

export default function LandingPageView({
  initialLandingPage,
  initialSettings,
  initialSlug,
}: LandingPageViewProps) {
  const router = useRouter();

  const routeSlug =
    typeof router.query.slug === "string"
      ? router.query.slug
      : router.asPath.match(/^\/go\/([^/?#]+)/)?.[1];

  let slug = routeSlug || initialSlug || "";
  try {
    slug = decodeURIComponent(slug);
  } catch {
    slug = "";
  }

  const { data: response, isLoading } = useSWR(
    slug ? ["landing-page", slug] : null,
    () => getLandingPage(slug),
    {
      fallbackData:
        initialSlug === slug && initialLandingPage
          ? { success: true, message: "", data: initialLandingPage }
          : undefined,
      revalidateOnFocus: false,
      revalidateOnMount: !initialLandingPage || initialSlug !== slug,
      dedupingInterval: 60_000,
    },
  );

  const landingPage =
    response?.success && response?.data?.is_active ? response.data : null;

  if (isLoading && !landingPage) {
    return (
      <DefaultLayout
        initialSettings={initialSettings}
        showHeaderFooter={true}
        fullWidth={true}
      >
        <FullPageLoader />
      </DefaultLayout>
    );
  }

  if (!landingPage) {
    return (
      <DefaultLayout
        initialSettings={initialSettings}
        showHeaderFooter={true}
        fullWidth={false}
      >
        <Custom404 />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout
      initialSettings={initialSettings}
      showHeaderFooter={landingPage.show_header_footer}
      fullWidth={true}
    >
      <DynamicSEO
        title={landingPage.title}
        canonical={`/go/${encodeURIComponent(landingPage.slug)}/`}
        ogType="website"
      />

      <LandingPageDocument
        html={landingPage.html}
        css={landingPage.css}
        title={landingPage.title}
        assetBaseUrl={getLandingPageAssetBaseUrl()}
      />
    </DefaultLayout>
  );
}
