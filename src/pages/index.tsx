import {
  getCookieFromContext,
  getDefaultMarketCode,
  isSSR,
} from "@/helpers/getters";
import { GetServerSideProps } from "next";
import { getHomeLayout, getSettings } from "@/routes/api";

import { HomeLayout, Settings } from "@/types/ApiResponse";
import HomeBuilder from "@/views/homePage/HomeBuilder";
import { NextPageWithLayout } from "@/types";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { loadTranslations } from "../../i18n";
import { useTranslation } from "react-i18next";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/helpers/seo";
import { useSettings } from "@/contexts/SettingsContext";
import { siteConfig } from "@/config/site";

// const HomeRecentlyViewed = dynamic(
//   () => import("@/views/homePage/HomeRecentlyViewed"),
//   { ssr: false }
// );

type HomePageProps = {
  initialSettings?: Settings | null;
  initialLayout?: HomeLayout | null;
  error?: string;
};

const HomePage: NextPageWithLayout<HomePageProps> = ({
  initialLayout = null,
}) => {
  const { t } = useTranslation();
  const { webSettings } = useSettings();

  // Generate SEO schemas
  const siteName = webSettings?.siteName || siteConfig.name;
  const siteDescription =
    webSettings?.metaDescription || siteConfig.metaDescription;
  const siteLogo = webSettings?.siteHeaderDarkLogo || "/logo.png";

  const organizationSchema = generateOrganizationSchema(
    siteName,
    siteDescription,
    siteLogo
  );

  const websiteSchema = generateWebsiteSchema(siteName);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.home")}
        description={siteDescription}
        keywords={webSettings?.metaKeywords || siteConfig.metaKeywords}
        canonical="/"
        ogType="website"
        ogTitle={siteName}
        ogDescription={siteDescription}
        ogImage={siteLogo}
        jsonLd={[organizationSchema, websiteSchema]}
      />
      <HomeBuilder initialLayout={initialLayout} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> | undefined =
  isSSR()
    ? async (context) => {
        try {
          await loadTranslations(context);

          const cookieMarket = getMarketFromContext(context);
          const access_token = (await getAccessTokenFromContext(context)) || "";

          // Category from query if present, else the saved home-category cookie.
          const queryCategory = context.query.category as string | undefined;
          const cookieCategory =
            (getCookieFromContext(context, "homeCategory") as string) || "";
          const homeCategory = queryCategory || cookieCategory;
          const category_slug =
            homeCategory && homeCategory !== "all" ? homeCategory : undefined;

          // Fetch settings first so that, when the shopper has not picked a
          // location yet (no `market` cookie), we can fall back to the store's
          // default market instead of rendering an empty home behind a
          // "select location" prompt.
          const settings = await getSettings({ market: cookieMarket });
          const market =
            cookieMarket || getDefaultMarketCode(settings.data) || undefined;

          const layoutRes = await getHomeLayout({
            category_slug,
            page: 1,
            per_page: 6,
            market,
            access_token,
          });

          return {
            props: {
              initialLayout: layoutRes.success ? layoutRes.data : null,
              initialSettings: settings.data,
            },
          };
        } catch (err) {
          console.error("Error in getServerSideProps:", err);
          return {
            props: {
              initialLayout: null,
              initialSettings: null,
              error:
                err instanceof Error
                  ? err.message
                  : "An error occurred during SSR",
            },
          };
        }
      }
    : undefined;

export default HomePage;
