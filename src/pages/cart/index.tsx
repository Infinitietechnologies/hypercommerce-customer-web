import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { getSettings } from "@/routes/api";
import { GetServerSideProps } from "next";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { NextPageWithLayout } from "@/types";
import dynamic from "next/dynamic";
import { updateCartData } from "@/helpers/updators";
import { withAuth } from "@/guards/withAuth";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const CartPageView = dynamic(() => import("@/views/CartPageView"), {
  ssr: false,
});

interface CartPageProps {
  error?: string;
}

const CartPage: NextPageWithLayout<CartPageProps> = () => {
  const { t } = useTranslation();
  useEffect(() => {
    updateCartData(false, false, 0, false);
  }, []);

  return (
    <>
      <PageHead pageTitle={t("pageTitle.cart")} />

      <button
        id="refetch-cart-page"
        onClick={() => updateCartData(true, false)}
        className="hidden"
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[{ href: "/cart", label: "Shopping Cart" }]}
        />
        <CartPageView />
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

export default withAuth(CartPage);
