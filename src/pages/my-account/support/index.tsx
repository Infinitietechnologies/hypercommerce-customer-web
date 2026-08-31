import type { GetServerSideProps } from "next";

import { getAccessTokenFromContext } from "@/helpers/auth";
import { serverSideAuthGuard } from "@/guards/authGuard";
import { withAuth } from "@/guards/withAuth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { getSettings } from "@/routes/api";
import { supportService } from "@/services/support";
import type { NextPageWithLayout } from "@/types";
import type { SupportThreadPayload } from "@/types/support";
import SupportChatView from "@/views/SupportChatView";
import { loadTranslations } from "../../../../i18n";

type Props = { initialData: SupportThreadPayload | null; initialSettings?: unknown };

const SupportPage: NextPageWithLayout<Props> = ({ initialData }) => <SupportChatView initialData={initialData} />;

export const getServerSideProps: GetServerSideProps<Props> | undefined = isSSR()
  ? async (context) => {
      const guard = await serverSideAuthGuard(context);
      if (guard) return guard;

      const accessToken = (await getAccessTokenFromContext(context)) || "";
      const market = getMarketFromContext(context);
      const [thread, settings] = await Promise.allSettled([
        supportService.getThread({access_token: accessToken}),
        getSettings({market}),
      ]);
      await loadTranslations(context);

      return {
        props: {
          initialData: thread.status === "fulfilled" ? thread.value : null,
          initialSettings: settings.status === "fulfilled" && settings.value?.success ? settings.value.data : null,
        },
      };
    }
  : undefined;

export default withAuth(SupportPage);
