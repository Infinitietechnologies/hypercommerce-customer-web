import type { GetServerSideProps } from "next";

import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getLandingPage } from "@/services/landingPage";
import { getSettings } from "@/services/settings";
import type { Settings } from "@/types/ApiResponse";
import type { LandingPageData } from "@/types/landingPage";
import type { NextPageWithLayout } from "@/types";
import LandingPageView from "@/views/LandingPageView";
import { loadTranslations } from "../../../i18n";

interface GoLandingPageProps {
  initialLandingPage?: LandingPageData | null;
  initialSettings?: Settings | null;
  initialSlug?: string;
}

const GoLandingPage: NextPageWithLayout<GoLandingPageProps> = (props) => (
  <LandingPageView {...props} />
);

GoLandingPage.getLayout = (page) => page;

export const getServerSideProps: GetServerSideProps<GoLandingPageProps> | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const slug =
        typeof context.params?.slug === "string" ? context.params.slug : "";
      if (!slug) return { notFound: true };

      const market = getMarketFromContext(context);
      const [landingResponse, settingsResponse] = await Promise.all([
        getLandingPage(slug, { market }),
        getSettings({ market }),
      ]);

      if (
        !landingResponse.success ||
        !landingResponse.data ||
        !landingResponse.data.is_active
      ) {
        return { notFound: true };
      }

      return {
        props: {
          initialLandingPage: landingResponse.data,
          initialSettings: settingsResponse.data ?? null,
          initialSlug: slug,
        },
      };
    }
  : undefined;

export default GoLandingPage;
