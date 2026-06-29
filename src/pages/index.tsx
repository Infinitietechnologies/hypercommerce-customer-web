import { getCookieFromContext, isSSR } from "@/helpers/getters";
import HomeCategories from "@/views/homePage/HomeCategories";
import HomeTopSlider from "@/views/homePage/HomeTopSlider";
import { GetServerSideProps } from "next";
import { getHomePageData } from "@/services/homePageService";

import DeliveryBanner from "@/views/homePage/DeliveryBanner";
import {
  HomeBannerItem,
  HomeHeroItem,
  HomeLayout,
  HomeSection,
  Settings,
  Store,
} from "@/types/ApiResponse";
import HomeBrands from "@/views/homePage/HomeBrands";
import HomeStores from "@/views/homePage/HomeStores";
import { NextPageWithLayout } from "@/types";
import HomeFeaturedSections from "@/views/homePage/HomeFeaturedSections";
import { getAccessTokenFromContext } from "@/helpers/auth";
import HomeCarouselSlider from "@/views/homePage/HomeCarouselSlider";
import { loadTranslations } from "../../i18n";
import { useTranslation } from "react-i18next";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/helpers/seo";
import { useSettings } from "@/contexts/SettingsContext";
import { siteConfig } from "@/config/site";
import AppDownloadSection from "@/views/homePage/AppDownloadSection";
import HomeServiceHighlights from "@/views/homePage/HomeServiceHighlights";

type HomePageProps = {
  initialSettings?: Settings | null;
  initialHomeLayout?: HomeLayout | null;
  initialStores?: Store[];
  error?: string;
};

const HomePage: NextPageWithLayout<HomePageProps> = ({
  initialHomeLayout,
  initialStores,
}) => {
  const { t } = useTranslation();
  const { webSettings } = useSettings();

  // Generate SEO schemas
  const siteName = webSettings?.siteName || siteConfig.name;
  const siteDescription =
    webSettings?.metaDescription || siteConfig.metaDescription;
  const siteLogo = webSettings?.siteHeaderLogo || "/logo.png";

  const organizationSchema = generateOrganizationSchema(
    siteName,
    siteDescription,
    siteLogo,
  );

  const websiteSchema = generateWebsiteSchema(siteName);

  const sections = initialHomeLayout?.sections ?? [];

  // Whether the layout already provides categories / brands sections.
  const hasCategoriesSection = sections.some((s) => s.type === "categories");
  const hasBrandsSection = sections.some((s) => s.type === "brands");

  const renderSection = (section: HomeSection) => {
    const heroItems = (section.content?.items ?? []) as (
      | HomeHeroItem
      | HomeBannerItem
    )[];

    switch (section.type) {
      case "hero":
        return (
          <HomeTopSlider
            key={section.id}
            items={heroItems}
            swiperKeyPrefix={`hero-${section.id}`}
          />
        );
      case "banners":
        return (
          <HomeCarouselSlider
            key={section.id}
            items={heroItems}
            swiperKeyPrefix={`banners-${section.id}`}
          />
        );
      case "products":
        return <HomeFeaturedSections key={section.id} section={section} />;
      case "categories":
        return (
          <HomeCategories
            key={section.id}
            initialCategories={section.content?.categories ?? []}
          />
        );
      case "brands":
        return (
          <HomeBrands
            key={section.id}
            initialBrands={section.content?.brands ?? []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.home")}
        description={siteDescription}
        keywords={siteConfig.metaKeywords}
        canonical="/"
        ogType="website"
        ogTitle={siteName}
        ogDescription={siteDescription}
        ogImage={siteLogo}
        jsonLd={[organizationSchema, websiteSchema]}
      />

      <div className="flex flex-col gap-0">
        {/* Render the home layout sections in backend-defined order. */}
        {sections.map((section) => renderSection(section))}

        {/* Fallbacks: if the layout has no categories/brands section, still
            show those rails (they fetch standalone via SWR). */}
        {!hasCategoriesSection && <HomeCategories />}
        {!hasBrandsSection && <HomeBrands />}

        {/* Stores rail (not a home-layout section type). */}
        <HomeStores initialStores={initialStores} />

        <HomeServiceHighlights />

        <DeliveryBanner />

        <AppDownloadSection />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> | undefined =
  isSSR()
    ? async (context) => {
        try {
          await loadTranslations(context);

          const access_token = (await getAccessTokenFromContext(context)) || "";

          // 1️⃣ take category from query if available, else fallback to cookie
          const queryCategory = context.query.category as string | undefined;
          const cookieCategory =
            (getCookieFromContext(context, "homeCategory") as string) || "";

          const homeCategory = queryCategory || cookieCategory;

          const { settings, homeLayout, stores } = await getHomePageData({
            access_token,
            homeCategory,
          });

          return {
            props: {
              initialSettings: settings,
              initialHomeLayout: homeLayout,
              initialStores: stores,
            },
          };
        } catch (err) {
          console.error("Error in getServerSideProps:", err);
          return {
            props: {
              initialSettings: null,
              initialHomeLayout: null,
              initialStores: [],
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
