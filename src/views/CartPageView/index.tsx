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
import { Button, toastError, toastSuccess } from "@/components/ui";
import { Icon } from "@iconify/react";
import { createCartShare } from "@/services/cart";
import { getSharedCartToken, getSharedCartUrl } from "@/features/cartSharing/sharedCartPayload";
import CartShareSheet from "@/features/cartSharing/components/CartShareSheet";
import { useSettings } from "@/contexts/SettingsContext";
import type { CartResponse } from "@/types/cart";

const CartPageView: FC = () => {
  const { t } = useTranslation();
  const { webSettings } = useSettings();
  const { cartData } = useSelector((state: RootState) => state.cart);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [sharedCartSnapshot, setSharedCartSnapshot] = useState<CartResponse | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShareCart = async () => {
    if (!cartData?.items.length || isCreatingShare) return;
    setIsCreatingShare(true);
    try {
      const response = await createCartShare();
      const token = response.success ? getSharedCartToken(response.data) : null;
      if (!token) {
        toastError(t("cartShare.createFailed"));
        return;
      }
      setShareLink(getSharedCartUrl(token, webSettings?.customerWebUrl));
      setSharedCartSnapshot(cartData);
      setIsShareOpen(true);
      toastSuccess(t("cartShare.linkReady"));
    } catch {
      toastError(t("cartShare.createFailed"));
    } finally {
      setIsCreatingShare(false);
    }
  };

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

  const cartHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
        {t("cart_title", { defaultValue: "My Cart" })} ({cartData?.total_quantity ?? 0})
      </h1>
      <Button
        variant="bordered"
        size="md"
        isLoading={isCreatingShare}
        isDisabled={!items.length || isCreatingShare}
        className="h-10 px-4 text-sm font-semibold"
        startContent={<Icon icon="solar:share-linear" width={18} height={18} />}
        onPress={() => void handleShareCart()}
      >
        {t("cartShare.shareCart")}
      </Button>
    </div>
  );

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {cartHeader}
        <CartPageEmpty />
        <SaveForLaterItems moreProductsInline={true} />
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

      <SimilarProductsSection
        initialSimilarProducts={productsData?.data?.data || []}
        isLoading={isProductsLoading}
        title={t("youMightAlsoLike") || "You might also like"}
        page="cart"
      />
      {shareLink && sharedCartSnapshot ? (
        <CartShareSheet
          cart={sharedCartSnapshot}
          link={shareLink}
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
        />
      ) : null}
    </div>
  );
};

export default CartPageView;
