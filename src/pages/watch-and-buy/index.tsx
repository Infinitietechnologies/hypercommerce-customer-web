import type { GetServerSideProps } from "next";

import { getAccessTokenFromContext } from "@/helpers/auth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { getSettings } from "@/services/settings";
import { getWatchBuyReels, getWatchBuyStatuses } from "@/services/watchBuy";
import type { Settings } from "@/types/settings";
import type {
  WatchBuyReelsResponse,
  WatchBuyStatusesResponse,
} from "@/types/watchBuy";
import type { NextPageWithLayout } from "@/types";
import WatchBuyView from "@/views/WatchBuyView";
import { loadTranslations } from "../../../i18n";

interface WatchBuyPageProps {
  initialReels?: WatchBuyReelsResponse;
  initialSettings?: Settings | null;
  initialStatuses?: WatchBuyStatusesResponse;
  slug?: string;
}

const WatchBuyPage: NextPageWithLayout<WatchBuyPageProps> = (props) => (
  <WatchBuyView {...props} />
);

export const getServerSideProps:
  | GetServerSideProps<WatchBuyPageProps>
  | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const access_token =
        (await getAccessTokenFromContext(context)) || undefined;
      const market = getMarketFromContext(context);
      const slug =
        typeof context.query.slug === "string" ? context.query.slug : undefined;

      const [settingsResponse, reelsResponse, statusesResponse] =
        await Promise.all([
          getSettings({ access_token, market }),
          getWatchBuyReels({ access_token, market, per_page: 10, slug }),
          getWatchBuyStatuses({ access_token, market, per_page: 20 }),
        ]);

      return {
        props: {
          initialReels: reelsResponse,
          initialSettings: settingsResponse.data ?? null,
          initialStatuses: statusesResponse,
          ...(slug ? { slug } : {}),
        },
      };
    }
  : undefined;

export default WatchBuyPage;
