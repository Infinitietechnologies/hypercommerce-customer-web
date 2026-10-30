import { useMemo } from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import useSWR from "swr";

import DynamicSEO from "@/SEO/DynamicSEO";
import DefaultLayout from "@/layouts/default";
import FullPageLoader from "@/components/ui/FullPageLoader";
import Custom404 from "@/pages/404";
import { getLandingPage } from "@/services/landingPage";
import type { LandingPageData } from "@/types/landingPage";
import type { Settings } from "@/types/ApiResponse";

interface LandingPageViewProps {
  initialLandingPage?: LandingPageData | null;
  initialSettings?: Settings | null;
  initialSlug?: string;
}

const cleanLandingHtml = (rawHtml?: string | null): string => {
  if (!rawHtml) return "";

  // Remove inert tailwind browser runtime script tag as we load it via next/script
  let cleaned = rawHtml.replace(
    /<script\b[^>]*src=["'][^"']*(?:tailwindcss|cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser)[^"']*["'][^>]*>\s*<\/script>/gi,
    "",
  );

  // If a full HTML document is returned, extract the contents inside <body>
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1];
  }

  return cleaned;
};

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

  const landingPage = response?.success && response?.data?.is_active ? response.data : null;

  const cleanedHtml = useMemo(
    () => cleanLandingHtml(landingPage?.html),
    [landingPage?.html],
  );

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

      <Head>
        {landingPage.css ? (
          <style
            id="custom-landing-page-css"
            key="custom-landing-page-css"
            dangerouslySetInnerHTML={{ __html: landingPage.css }}
          />
        ) : null}
      </Head>

      <Script
        id="tailwind-browser-runtime"
        src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3"
        strategy="afterInteractive"
      />

      <div
        className="w-full custom-landing-page"
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    </DefaultLayout>
  );
}
