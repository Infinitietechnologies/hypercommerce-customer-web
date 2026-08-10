import { FC, useState } from "react";
import { toast, Button, Image } from "@/components/ui";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getSaveForLaterItems, removeItemFromCart } from "@/routes/api";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { updateCartData } from "@/helpers/updators";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { useSettings } from "@/contexts/SettingsContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Scrollbar } from "swiper/modules";
import { handleAddToCart, isRTL } from "@/helpers/functionalHelpers";
import { CartItem } from "@/types/ApiResponse";
import Lightbox from "yet-another-react-lightbox";
import CartAddonList from "@/components/Cart/CartAddonList";

const SaveForLaterItems: FC<{ moreProductsInline: boolean }> = ({
  moreProductsInline = false,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);
  const { formatPrice } = useSettings();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const isLoading = useSelector((state: RootState) => state?.cart?.isLoading);
  const [moveLoading, setMoveLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);

  const isLoggedIn = useSelector((state: RootState) => state?.auth?.isLoggedIn);

  const swrKey = isLoggedIn ? "/save-for-later" : null;

  const {
    data: itemsData,
    isLoading: isLoadingItems,
    mutate,
  } = useSWR(swrKey, () => getSaveForLaterItems(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const items = itemsData?.data?.items || [];

  const handleRemoveItem = async () => {
    if (!selectedItemId) return;
    try {
      const response = await removeItemFromCart(selectedItemId);
      if (response.success) {
        mutate();
        toast({
          title: t("cartItems.itemRemoved.title"),
          description: t("cartItems.itemRemoved.description"),
          color: "success",
        });
      } else {
        toast({
          title: t("cartItems.removeFailed.title"),
          description:
            response.message || t("cartItems.removeFailed.description"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("cartItems.networkError.title"),
        description: t("cartItems.networkError.description"),
        color: "danger",
      });
    } finally {
      setSelectedItemId(null);
      updateCartData(true, false);
    }
  };

  // 🟩 Placeholder: Move item to cart logic
  const handleMoveToCart = async (item: CartItem) => {
    setMoveLoading(true);
    try {
      const res = await handleAddToCart({
        product_variant_id: item.product_variant_id,
        onClose: () => {},
        quantity: item.quantity,
        store_id: item.store_id,
        renderToast: false,
        replace_quantity: true,
      });

      if (res && typeof res !== "string" && "success" in res && "data" in res) {
        toast({
          title: t("saveForLater.moveSuccess.title"),
          description: t("saveForLater.moveSuccess.description"),
          color: "success",
        });

        mutate();
        updateCartData(true, false);
      } else {
        toast({
          title: t("saveForLater.moveFailed.title"),
          description: t("saveForLater.moveFailed.description"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("saveForLater.moveFailed.title"),
        description: t("saveForLater.moveFailed.description"),
        color: "danger",
      });
    } finally {
      setMoveLoading(false);
    }
  };

  if (!isLoggedIn || isLoadingItems || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t("saveForLater.title") || "Saved for Later"}
      </h2>

      <Swiper
        key={rtl ? "rtl-sfl" : "ltr-sfl"}
        dir={rtl ? "rtl" : "ltr"}
        modules={[Scrollbar]}
        scrollbar={{ draggable: true }}
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: moreProductsInline ? 4 : 3 },
          768: { slidesPerView: moreProductsInline ? 5 : 4 },
          1024: { slidesPerView: moreProductsInline ? 6 : 5 },
          1440: { slidesPerView: moreProductsInline ? 7 : 6 },
        }}
        className="pb-4"
      >
        {items.map((item) => {
          const hasDiscount =
            !!item.total_item_special_price &&
            item.total_item_special_price !== item.total_item_price;

          return (
            <SwiperSlide key={item.id} className="h-auto">
              <div className="flex h-full flex-col rounded-large border border-divider bg-content1 p-2.5 transition-colors hover:border-default-300">
                <div className="relative aspect-square w-full overflow-hidden rounded-medium bg-content2">
                  <Image
                    loading="lazy"
                    src={item.product.image}
                    alt={item.variant.title || ""}
                    removeWrapper
                    radius="none"
                    className="absolute inset-0 h-full w-full cursor-pointer object-contain"
                    onClick={() => {
                      setLightboxImages([{ src: item.product.image }]);
                      setLightboxOpen(true);
                    }}
                  />

                  <Button
                    title={t("remove_item")}
                    aria-label={t("remove_item")}
                    className="absolute right-2 top-2 z-20 h-8 w-8 min-w-0 rounded-full bg-content1 text-danger shadow-sm"
                    size="sm"
                    variant="light"
                    radius="full"
                    isDisabled={isLoading}
                    isIconOnly
                    onPress={() => setSelectedItemId(item.id)}
                  >
                    <Icon
                      icon="solar:trash-bin-trash-linear"
                      className="text-base"
                    />
                  </Button>
                </div>

                <div className="mt-2 flex flex-1 flex-col">
                  <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-medium leading-snug text-foreground">
                    <Link
                      href={`/products/${item.product.slug}`}
                      title={item.variant.title || ""}
                    >
                      {item.variant.title}
                    </Link>
                  </h3>

                  {item.addons && item.addons.length > 0 && (
                    <CartAddonList
                      addons={item.addons}
                      className="mt-1"
                      showGroupTitle={false}
                    />
                  )}

                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {formatPrice(
                        hasDiscount
                          ? item.total_item_special_price!
                          : item.total_item_price || item.variant.price,
                      )}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-default-400 line-through">
                        {formatPrice(item.total_item_price)}
                      </span>
                    )}
                  </p>

                  <Button
                    size="sm"
                    isDisabled={moveLoading}
                    color="primary"
                    className="mt-2 h-8 w-full min-w-0 gap-1 whitespace-nowrap px-2 text-xs font-medium"
                    startContent={
                      <Icon
                        icon="solar:cart-plus-linear"
                        className="shrink-0 text-sm"
                      />
                    }
                    onPress={() => handleMoveToCart(item)}
                  >
                    <span className="truncate">{t("saveForLater.moveToCart")}</span>
                  </Button>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <ConfirmationModal
        isOpen={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onConfirm={handleRemoveItem}
        title={t("cartItems.removeItemModal.title")}
        icon={<Icon icon="solar:trash-bin-trash-linear" className="text-base" />}
        description={t("cartItems.removeItemModal.description")}
        confirmText={t("cartItems.removeItemModal.confirmText")}
        cancelText={t("cartItems.removeItemModal.cancelText")}
        variant="danger"
        alertTitle={t("cartItems.removeItemModal.alertTitle")}
        alertDescription={t("cartItems.removeItemModal.alertDescription")}
      />
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImages}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </div>
  );
};

export default SaveForLaterItems;
