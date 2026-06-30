import { GetServerSideProps } from "next";
import { getSlugFromContext, isSSR } from "@/helpers/getters";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { getSettings } from "@/routes/api";
import { fetchProductDetailPageData } from "@/services/ProductDetailPageService";
import ProductPage from "@/pages/products/[slug]/index";

export const getServerSideProps: GetServerSideProps = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        const slug = getSlugFromContext(context);

        const settingsRes = await getSettings();
        const settings = settingsRes.data || null;

        // Fetch all product page data (market resolved server-side via header)
        const data = await fetchProductDetailPageData({
          slug,
          access_token,
          PER_PAGE: 20,
        });

        return {
          props: {
            ...data,
            initialSettings: settings,
            slug,
          },
        };
      } catch (err) {
        console.error("Error in share page getServerSideProps:", err);
        return {
          props: {
            error: err instanceof Error ? err.message : "An unexpected error occurred",
          },
        };
      }
    }
  : undefined as any;

export default ProductPage;
