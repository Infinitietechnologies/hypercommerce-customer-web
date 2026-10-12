import type { GetServerSideProps } from "next";
import { useTranslation } from "react-i18next";

import PageHead from "@/SEO/PageHead";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { getSettings } from "@/services/settings";
import type { Settings } from "@/types/settings";
import type { NextPageWithLayout } from "@/types";
import SharedCartView from "@/views/SharedCartView";
import { loadTranslations } from "../../../i18n";

interface SharedCartPageProps {
  initialSettings?: Settings | null;
}

const SharedCartPage: NextPageWithLayout<SharedCartPageProps> = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHead pageTitle={t("cartShare.previewTitle")} />
      <SharedCartView />
    </>
  );
};

export const getServerSideProps:
  | GetServerSideProps<SharedCartPageProps>
  | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const settings = await getSettings({ market: getMarketFromContext(context) });
      return { props: { initialSettings: settings.data ?? null } };
    }
  : undefined;

export default SharedCartPage;
