import { FC, useState, useMemo } from "react";
import { CartItem, Product, ProductVariant } from "@/types/ApiResponse";
import {
  toast,
  Button,
  Divider,
  Image,
  ScrollShadow,
  useDisclosure,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import Link from "next/link";
import CartQuantityControl from "@/components/CartQuantityControl";
import {
  removeItemFromCart,
  saveCartItemToSaveForLater,
  getProductBySlug,
} from "@/routes/api";
import dynamic from "next/dynamic";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { updateCartData } from "@/helpers/updators";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import { mutate } from "swr";
import { useSettings } from "@/contexts/SettingsContext";
import AttachmentUploader from "@/components/Cart/AttachmentUploader";
import type { AttachmentFile } from "@/components/Cart/AttachmentUploader";

interface CartItemsProps {
  items: CartItem[];
  /** Cap height and scroll internally (checkout summary). Off = flows with page (cart page). */
  scrollable?: boolean;
}

const CartItems: FC<CartItemsProps> = ({ items = [], scrollable = false }) => {
  const { t } = useTranslation();
  const { formatPrice, systemSettings, isSingleVendor } = useSettings();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  // Local state for attachments: Record<productId, AttachmentFile[]>
  const [attachments, setAttachments] = useState<
    Record<number, AttachmentFile[]>
  >({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(
    null,
  );
  const [customizingVariant, setCustomizingVariant] =
    useState<ProductVariant | null>(null);
  const [initialAddons, setInitialAddons] = useState<Record<number, number[]>>(
    {},
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState<
    number | string | null
  >(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);

  // Store attachments in parent component or context
  // Export this for checkout validation
  if (typeof window !== "undefined") {
    (window as any).__cartAttachments = attachments;
  }

  const lowStockLimit = Number(systemSettings?.lowStockLimit || 0) || null;

  // Group items by store
  const groupedItems = useMemo(() => {
    const grouped = items.reduce(
      (acc, item) => {
        const storeId = item.store.id;
        if (!acc[storeId]) {
          acc[storeId] = {
            store: item.store,
            items: [],
          };
        }
        acc[storeId].items.push(item);
        return acc;
      },
      {} as Record<number, { store: CartItem["store"]; items: CartItem[] }>,
    );

    return Object.values(grouped);
  }, [items]);

  const handleRemoveItem = async () => {
    if (!selectedItemId) return;

    try {
      const response = await removeItemFromCart(selectedItemId);
      if (response.success) {
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
      await updateCartData(true, true);
      document.getElementById("refetch-similar-products")?.click();
    }
  };

  // Placeholder for "Save for Later"
  const handleSaveForLater = async (itemId: number, quantity: number) => {
    try {
      const res = await saveCartItemToSaveForLater(itemId, quantity);
      if (res.success) {
        mutate("/save-for-later");
        updateCartData(true, false);
        toast({
          title: t("saveForLater.movedMessage"),
          color: "success",
        });
      } else {
        toast({
          title: t("saveForLater.errorMessage"),
          color: "success",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("cartItems.networkError.title"),
        description: t("cartItems.networkError.description"),
        color: "danger",
      });
    }
  };

  // Handle attachment change for a single product
  const handleAttachmentChange = (
    productId: number,
    attachmentFiles: AttachmentFile[],
  ) => {
    setAttachments((prev) => ({
      ...prev,
      [productId]: attachmentFiles,
    }));
  };

  const handleCustomize = async (item: CartItem) => {
    setIsCustomizing(true);
    try {
      const res = await getProductBySlug({
        slug: item.product.slug,
      });
      if (res.success && res.data) {
        setCustomizingProduct(res.data);
        const variant = res.data.variants.find(
          (v) => v.id === item.product_variant_id,
        );
        setCustomizingVariant(variant || null);

        // Convert cart addons back to modal format
        const addonsMap =
          item.addons?.reduce(
            (acc, addon) => {
              if (!acc[addon.addon_group_id]) acc[addon.addon_group_id] = [];
              acc[addon.addon_group_id].push(addon.addon_item_id);
              return acc;
            },
            {} as Record<number, number[]>,
          ) || {};

        setInitialAddons(addonsMap);
        setEditingCartItemId(item.id);
        setEditingQuantity(item.quantity);
        onModalOpen();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("general.error.title"),
        description: t("general.error.somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setIsCustomizing(false);
    }
  };

  return (
    <ScrollShadow
      className={`w-full py-1 flex flex-col gap-4 ${scrollable ? "max-h-[50vh]" : ""}`}
    >
      {groupedItems.length > 0 &&
        groupedItems.map((group) => (
          <div
            key={group.store.id}
            className="bg-content2 rounded-2xl p-4 border border-divider"
          >
            {/* Store Header */}
            {!isSingleVendor && (
              <div className="mb-4 pb-3 border-b border-divider flex gap-1 w-full justify-between flex-wrap sm:flex-nowrap">
                <div className="flex gap-1 flex-wrap sm:flex-nowrap">
                  <span className="text-sm text-foreground inline-flex items-center gap-1">
                    {t("cartItems.from")}:
                  </span>
                  <Link
                    href={`/stores/${group.store.slug}`}
                    className="text-xs sm:text-sm font-semibold text-foreground inline-flex items-center gap-1"
                    title={group.store.name}
                  >
                    {group.store.name}
                  </Link>
                </div>
              </div>
            )}

            {/* Items in this store */}
            <div className="flex flex-col gap-3">
              {group.items.map((item, itemIndex) => {
                const isLowStock =
                  lowStockLimit !== null &&
                  item.variant.stock > 0 &&
                  item.variant.stock <= lowStockLimit;

                return (
                  <div key={item.id}>
                    {/* Main Item Row */}
                    <div className="flex items-start space-x-2 sm:space-x-3 py-2">
                      {/* Product Image - Smaller on mobile */}
                      <div className="w-16 sm:w-[25%] shrink-0 flex justify-center">
                        <Image
                          loading="eager"
                          src={item.product.image}
                          alt={item.variant.title || ""}
                          className="w-16 h-16 sm:w-full sm:h-16 object-cover rounded-xl cursor-pointer bg-content1"
                          onClick={() => {
                            setLightboxImages([{ src: item.product.image }]);
                            setLightboxOpen(true);
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          <Link
                            title={item.product.name || ""}
                            href={`/products/${item.product.slug}`}
                            className="text-xs block truncate overflow-hidden text-ellipsis"
                          >
                            {item.product.name}
                          </Link>

                          {/* VARIANT NAME & LOW STOCK INDICATOR */}
                          {item.variant?.title && (
                            <div className="text-xs text-foreground/50 flex flex-wrap gap-2 items-center mt-1">
                              <span className="max-w-24 sm:max-w-32 truncate block">
                                {item.variant.title}
                              </span>
                              {isLowStock && (
                                <span className="text-warning-600 font-semibold text-xxs bg-warning-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  {t("product_modal.low_stock_alert", {
                                    stock: item.variant.stock,
                                  })}
                                </span>
                              )}
                            </div>
                          )}

                          {item.addons && item.addons.length > 0 && (
                            <div className="text-[10px] text-foreground/40 leading-tight mt-0.5 break-words flex flex-wrap gap-x-1">
                              {item.addons.map((addon: any, i: number) => {
                                const addonPrice = Number(
                                  addon.price || addon.item?.price || 0,
                                );
                                return (
                                  <span key={i} className="flex items-center">
                                    {addon.group?.title || addon.addon_group_name
                                      ? `${addon.group?.title || addon.addon_group_name}: `
                                      : ""}
                                    {addon.title || addon.item?.title}
                                    {addonPrice > 0 && (
                                      <span className="ml-0.5 opacity-80 font-medium">
                                        ({formatPrice(addonPrice)})
                                      </span>
                                    )}
                                    {i < item.addons!.length - 1 && ","}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* CUSTOMIZE BUTTON - Show if the item supports addons (item.variant.is_addons is present) */}
                          {item.variant.is_addons && (
                            <button
                              onClick={() => handleCustomize(item)}
                              disabled={isCustomizing}
                              className="text-[10px] md:text-xs font-semibold mt-1 flex items-center gap-0.5 text-primary-600 hover:opacity-80 transition-opacity"
                            >
                              <span className="cursor-pointer">
                                {isCustomizing &&
                                customizingProduct?.slug === item.product.slug
                                  ? t("loading")
                                  : t("cartItems.customize")}
                              </span>
                              <Icon
                                icon="solar:alt-arrow-right-linear"
                                className="mt-0.5 text-sm"
                              />
                            </button>
                          )}
                        </h3>

                        {/* Price and Quantity - Stack on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-1">
                          <span className="font-medium text-xs text-foreground/60 whitespace-nowrap">
                            {item.total_item_special_price &&
                            item.total_item_special_price !==
                              item.total_item_price ? (
                              <>
                                <span className="line-through opacity-60">
                                  {formatPrice(item.total_item_price)}
                                </span>{" "}
                                {formatPrice(item.total_item_special_price)}
                              </>
                            ) : (
                              formatPrice(
                                item.total_item_price || item.variant.price,
                              )
                            )}{" "}
                            × {item.quantity}
                          </span>

                          <CartQuantityControl
                            item={item}
                            maxQuantity={item.product.total_allowed_quantity}
                            minQuantity={item.product.minimum_order_quantity}
                            quantityStep={item.product.quantity_step_size}
                            stock={item.variant.stock}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1 -mt-2">
                        <Button
                          title={t("saveForLater.title")}
                          aria-label={t("saveForLater.title")}
                          className="p-0 bg-transparent min-w-0 text-primary-600"
                          size="sm"
                          isDisabled={isLoading}
                          isIconOnly
                          onPress={() =>
                            handleSaveForLater(item.id, item.quantity)
                          }
                        >
                          <Icon icon="solar:bookmark-linear" className="text-base" />
                        </Button>
                        <Button
                          title={t("remove_item")}
                          aria-label={t("remove_item")}
                          className="p-0 bg-transparent min-w-0 text-danger"
                          size="sm"
                          isDisabled={isLoading}
                          isIconOnly
                          onPress={() => setSelectedItemId(item.id)}
                        >
                          <Icon icon="solar:trash-bin-trash-linear" className="text-base" />
                        </Button>
                      </div>
                    </div>

                    {/* Attachment Section - Full Width Below Item */}
                    {item.product.is_attachment_required && (
                      <div className="w-full mt-3 mb-2 space-y-3 rounded-xl border border-divider p-3 bg-content1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-xxs font-semibold text-foreground">
                            {item.product.attachment_mode === "required"
                              ? t("cart.attachments.requiredLabel", {
                                  defaultValue: "Attachment required",
                                })
                              : t("cart.attachments.optionalLabel", {
                                  defaultValue: "Attachment optional",
                                })}
                          </p>
                          <p className="text-xxs text-foreground/60">
                            {t("cart.attachments.helperModeText", {
                              defaultValue:
                                item.product.attachment_mode === "required"
                                  ? "Upload at least one file."
                                  : "Upload files if you want.",
                            })}
                          </p>
                        </div>

                        <AttachmentUploader
                          attachment={attachments[item.product.id] || []}
                          onAttachmentChange={(attachmentFiles) =>
                            handleAttachmentChange(
                              item.product.id,
                              attachmentFiles,
                            )
                          }
                        />
                      </div>
                    )}

                    {itemIndex < group.items.length - 1 && (
                      <Divider className="my-2" orientation="horizontal" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

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

      {isModalOpen && customizingProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          product={customizingProduct}
          selectedVariant={customizingVariant}
          initialSelectedAddons={initialAddons}
          initialStep="addons"
          editingCartItemId={editingCartItemId}
          editingQuantity={editingQuantity}
        />
      )}
    </ScrollShadow>
  );
};

export default CartItems;
