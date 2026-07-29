import { FC } from "react";
import { useSelector } from "react-redux";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { RootState } from "@/lib/redux/store";
import { getProducts } from "@/routes/api";
import CartItems from "./CartItems";
import CartSummary from "./CartSummary";
import CartPageEmpty from "../empty/CartPageEmpty";
import SaveForLaterItems from "./SaveForLaterItems";
import SimilarProductsSection from "@/components/Products/ProductDetailPage/SimilarProductsSection";

const CartPageView: FC = () => {
  const { t } = useTranslation();
  const { cartData } = useSelector((state: RootState) => state.cart);

  const items = cartData?.items ?? [];
  const productSlugs = items
    .map((item) => item?.product?.slug)
    .filter((slug): slug is string => !!slug)
    .join(", ");

  const { data: productsData, isLoading: isProductsLoading } = useSWR(
    "/you-might-also-like",
    () =>
      getProducts({
        per_page: 10,
        page: 1,
        exclude_product: productSlugs || "",
        include_child_categories: 0,
      }),
  );

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <CartPageEmpty />
        <SaveForLaterItems moreProductsInline={true} />
      </div>
    );
  }

  return (
    <div className="rd-fade flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
        {t("cart_title", { defaultValue: "My Cart" })} ({cartData.total_quantity})
      </h1>

      <div className="flex w-full flex-col gap-4 md:flex-row md:items-start">
        <div className="w-full md:w-[60%] lg:w-[65%]">
          <CartItems items={cartData.items} layout="cart" />
        </div>
        <div className="w-full md:w-[40%] lg:w-[35%] md:max-w-md">
          <CartSummary cart={cartData} />
        </div>
      </div>

      <SaveForLaterItems moreProductsInline={false} />

      <SimilarProductsSection
        initialSimilarProducts={productsData?.data?.data || []}
        isLoading={isProductsLoading}
        title={t("youMightAlsoLike") || "You might also like"}
        page="cart"
      />
    </div>
  );
};

export default CartPageView;
