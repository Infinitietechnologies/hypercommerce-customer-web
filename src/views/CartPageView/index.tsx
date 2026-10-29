import { FC, useState } from "react";
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
import { Button, ErrorState, Skeleton } from "@/components/ui";
import { Icon } from "@iconify/react";
import CartShareSheet from "@/features/cartSharing/components/CartShareSheet";
import { getSharedCartToken, getSharedCartUrl } from "@/features/cartSharing/sharedCartPayload";
import { createCartShare } from "@/services/cart";
import { updateCartData } from "@/helpers/updators";

const CartPageView: FC = () => {
  const { t } = useTranslation();
  const { cartData, error, isLoading } = useSelector((state: RootState) => state.cart);
  const recentlyViewedProducts = useSelector(
    (state: RootState) => state.recentlyViewed.products,
  );
  const [isShareOpen, setIsShareOpen] = useState(false);

  const items = cartData?.items ?? [];
  const createShareLink = async () => {
    const response = await createCartShare();
    const token = response.success ? getSharedCartToken(response.data) : null;
    if (!token) throw new Error("Cart share did not return a token");
    return getSharedCartUrl(token);
  };

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

  const recentlyViewedSection = (
    <SimilarProductsSection
      initialSimilarProducts={recentlyViewedProducts}
      isLoading={false}
      title={t("home.recently_viewed.title")}
      page="cart"
    />
  );

  const cartHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
        {t("cart_title", { defaultValue: "My Cart" })} ({cartData?.total_quantity ?? 0})
      </h1>
      <Button
        variant="bordered"
        size="md"
        isDisabled={!items.length}
        className="h-10 px-4 text-sm font-semibold"
        startContent={<Icon icon="solar:share-linear" width={18} height={18} />}
        onPress={() => setIsShareOpen(true)}
      >
        {t("cartShare.shareCart")}
      </Button>
    </div>
  );

  if (isLoading && !cartData) {
    return (
      <div className="space-y-6" aria-label={t("cartStatus.loading")}>
        <Skeleton className="h-10 w-56 rounded-medium" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-72 rounded-large md:col-span-2" />
          <Skeleton className="h-72 rounded-large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t("cartStatus.fetchFailedTitle")}
        description={t("cartStatus.pageFetchFailedDescription")}
        retryLabel={t("common.retry")}
        onRetry={() => void updateCartData(false, false, 0, false)}
      />
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {cartHeader}
        <CartPageEmpty />
        <SaveForLaterItems moreProductsInline={true} />
        {recentlyViewedSection}
      </div>
    );
  }

  return (
    <div className="rd-fade flex flex-col gap-6">
      {cartHeader}

      <div className="flex w-full flex-col gap-4 md:flex-row md:items-start">
        <div className="w-full md:w-[60%] lg:w-[65%]">
          <CartItems items={cartData.items} layout="cart" />
        </div>
        <div className="w-full md:w-[40%] lg:w-[35%] md:max-w-md">
          <CartSummary cart={cartData} />
        </div>
      </div>

      <SaveForLaterItems moreProductsInline={false} />

      {recentlyViewedSection}

      <SimilarProductsSection
        initialSimilarProducts={productsData?.data?.data || []}
        isLoading={isProductsLoading}
        title={t("youMightAlsoLike") || "You might also like"}
        page="cart"
      />
      <CartShareSheet
        itemCount={cartData.total_quantity ?? items.length}
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        onCreateLink={createShareLink}
      />
    </div>
  );
};

export default CartPageView;
