import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { getSettings } from "@/routes/api";
import { GetServerSideProps } from "next";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { NextPageWithLayout } from "@/types";
import dynamic from "next/dynamic";
import { updateCartData } from "@/helpers/updators";
import { withAuth } from "@/guards/withAuth";
import { serverSideAuthGuard } from "@/guards/authGuard";
import { loadTranslations } from "../../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const CheckoutPageView = dynamic(() => import("@/views/CheckoutPageView"), {
  ssr: false,
});

interface CheckoutPageProps {
  error?: string;
}

const CheckoutPage: NextPageWithLayout<CheckoutPageProps> = () => {
  const { t } = useTranslation();
  const [isCartReady, setIsCartReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    void updateCartData(false, false, 0, false).finally(() => {
      if (mounted) setIsCartReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHead
        pageTitle={t("pageTitle.checkout", { defaultValue: "Checkout" })}
      />

      <button
        id="refetch-cart-page"
        onClick={() => updateCartData(true, false)}
        className="hidden"
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/cart", label: "Shopping Cart" },
            { href: "/cart/checkout", label: "Checkout" },
          ]}
        />
        <CheckoutPageView initializing={!isCartReady} />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const guard = await serverSideAuthGuard(context);
        if (guard) return guard;

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

export default withAuth(CheckoutPage);
