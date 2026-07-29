import { getSettings } from "@/routes/api";
import { GetServerSideProps } from "next";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { NextPageWithLayout } from "@/types";
import dynamic from "next/dynamic";
import { withAuth } from "@/guards/withAuth";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

const OrderPaymentView = dynamic(() => import("@/views/OrderPaymentView"), {
  ssr: false,
});

interface PaymentPageProps {
  error?: string;
}

const PaymentPage: NextPageWithLayout<PaymentPageProps> = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHead
        pageTitle={t("pageTitle.payment", { defaultValue: "Payment" })}
      />
      <div className="min-h-screen">
        <OrderPaymentView />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const market = getMarketFromContext(context);
        const settingsRes = await getSettings({ market });
        await loadTranslations(context);

        return {
          props: {
            initialSettings: settingsRes.data ?? null,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
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

export default withAuth(PaymentPage);
