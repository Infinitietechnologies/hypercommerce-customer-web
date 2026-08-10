import { FC, useState, useMemo, ReactNode } from "react";
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
import { formatDeliveryByDate } from "@/helpers/delivery";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import { mutate } from "swr";
import { useSettings } from "@/contexts/SettingsContext";
import AttachmentUploader from "@/components/Cart/AttachmentUploader";
import type { AttachmentFile } from "@/components/Cart/AttachmentUploader";
import CartAddonList from "@/components/Cart/CartAddonList";
import { getDiscountPercent } from "@/helpers/getters";

interface CartItemsProps {
  items: CartItem[];
  /** Cap height and scroll internally (checkout summary). Off = flows with page (cart page). */
  scrollable?: boolean;
  /**
   * "cart" renders the full-width cart-page item cards (redesign); "default" is
   * the compact list reused by the checkout summary. Cart page only.
   */
  layout?: "default" | "cart";
  /** Product attachment uploaders. Checkout only — the cart page never collects them. */
  showAttachments?: boolean;
}

/**
 * Line amounts for a cart row, addons included. `total` is the payable line
 * total from the API; `total_item_price` is the pre-discount unit price it is
 * compared against.
 */
const getLineAmounts = (item: CartItem) => {
  const unitPrice = Number(item.total_item_price ?? item.variant.price) || 0;
  const lineOriginal = unitPrice * (item.quantity || 1);
  const shownPrice = Number(item.total ?? lineOriginal) || lineOriginal;
  const hasDiscount = shownPrice > 0 && shownPrice < lineOriginal;

  return {
    lineOriginal,
    shownPrice,
    hasDiscount,
    saving: hasDiscount ? lineOriginal - shownPrice : 0,
    discountPct: getDiscountPercent(lineOriginal, shownPrice),
  };
};

const CartItems: FC<CartItemsProps> = ({
  items = [],
  scrollable = false,
  layout = "default",
  showAttachments = false,
}) => {
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

  // Human-readable delivery ETA for a cart item. Prefers the backend's
  // zone/country-based window (delivery_eta); falls back to the distance-based
  // quick ETA (minutes) on the product.
  const deliveryEtaLabel = (item: CartItem): string | null => {
    const byDate = formatDeliveryByDate(item.delivery_eta);
    if (byDate) {
      return t("cart.deliveryBy", {
        date: byDate,
        defaultValue: `Delivery by ${byDate}`,
      });
    }
    const mins = item.product?.estimated_delivery_time;
    if (mins) {
      return t("cart.deliveredInMins", {
        count: mins,
        defaultValue: `Delivered in ${mins} mins`,
      });
    }
    return null;
  };

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

  const openLightbox = (src: string) => {
    setLightboxImages([{ src }]);
    setLightboxOpen(true);
  };

  // Shared sub-blocks so the two layouts stay in sync -----------------------

  // "finish" -> "Finish", "screen_size" -> "Screen Size"
  const prettifyKey = (k: string) =>
    k.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Human-readable variant detail for a line. Prefers the backend's structured
  // attribute map (e.g. "Finish: Walnut"); otherwise falls back to the variant
  // title with the redundant "{product name} - " prefix stripped, since the API
  // returns titles like "Extendable Dining Table - Walnut". Returns "" for
  // simple/default products so no extra line renders.
  const getVariantLabel = (item: CartItem): string => {
    const attrs = (
      item.variant as { attributes?: Record<string, string> | null }
    )?.attributes;
    if (attrs && typeof attrs === "object") {
      const parts = Object.entries(attrs)
        .filter(([, v]) => v != null && String(v).trim() !== "")
        .map(([k, v]) => `${prettifyKey(k)}: ${String(v).trim()}`);
      if (parts.length) return parts.join(" · ");
    }
    const title = (item.variant?.title || "").trim();
    const name = (item.product?.name || "").trim();
    if (title && name && title.toLowerCase().startsWith(name.toLowerCase())) {
      return title.slice(name.length).replace(/^[\s|,/·\-–—:]+/, "").trim();
    }
    return title;
  };

  const renderVariantMeta = (item: CartItem, isLowStock: boolean): ReactNode => {
    const variantLabel = getVariantLabel(item);
    return (
    <>
      {variantLabel && (
        <div className="text-xs text-foreground/50 flex flex-wrap gap-2 items-center">
          <span className="line-clamp-2 block">
            {variantLabel}
          </span>
          {isLowStock && (
            <span className="text-warning-600 font-semibold text-xxs bg-warning-50 px-1.5 py-0.5 rounded whitespace-nowrap">
              {t("product_modal.low_stock_alert", { stock: item.variant.stock })}
            </span>
          )}
        </div>
      )}

      {item.addons && item.addons.length > 0 && (
        <CartAddonList addons={item.addons} />
      )}

      {item.variant.is_addons && (
        <button
          onClick={() => handleCustomize(item)}
          disabled={isCustomizing}
          className="text-[10px] md:text-xs font-semibold flex items-center gap-0.5 text-primary-600 hover:opacity-80 transition-opacity w-fit"
        >
          <span className="cursor-pointer">
            {isCustomizing && customizingProduct?.slug === item.product.slug
              ? t("loading")
              : t("cartItems.customize")}
          </span>
          <Icon icon="solar:alt-arrow-right-linear" className="mt-0.5 text-sm" />
        </button>
      )}
    </>
    );
  };

  const renderAttachment = (item: CartItem): ReactNode =>
    showAttachments && item.product.is_attachment_required ? (
      <div className="w-full mt-3 space-y-3 rounded-xl border border-divider p-3 bg-content2">
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
            handleAttachmentChange(item.product.id, attachmentFiles)
          }
        />
      </div>
    ) : null;

  const modals = (
    <>
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
    </>
  );

  // ---- Cart-page layout: full-width item cards ----------------------------
  if (layout === "cart") {
    return (
      <div className="flex w-full flex-col gap-4">
        {items.map((item) => {
          const isLowStock =
            lowStockLimit !== null &&
            item.variant.stock > 0 &&
            item.variant.stock <= lowStockLimit;

          const { lineOriginal, shownPrice, hasDiscount, saving, discountPct } =
            getLineAmounts(item);

          return (
            <div
              key={item.id}
              className="rounded-large border border-divider bg-content1 p-3 sm:p-4"
            >
              <div className="flex gap-3 sm:gap-4">
                {/* Image + quantity */}
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-medium bg-content2 sm:h-28 sm:w-28">
                    <Image
                      loading="eager"
                      src={item.product.image}
                      alt={item.variant.title || item.product.name || ""}
                      removeWrapper
                      radius="none"
                      className="h-full w-full cursor-pointer object-contain"
                      onClick={() => openLightbox(item.product.image)}
                    />
                  </div>
                  <CartQuantityControl
                    item={item}
                    maxQuantity={item.product.total_allowed_quantity}
                    minQuantity={item.product.minimum_order_quantity}
                    quantityStep={item.product.quantity_step_size}
                    stock={item.variant.stock}
                  />
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {!isSingleVendor && item.store?.name && (
                    <Link
                      href={`/stores/${item.store.slug}`}
                      title={item.store.name}
                      className="flex w-fit items-center gap-1 text-[11px] font-medium text-foreground/50 transition-colors hover:text-foreground"
                    >
                      <Icon icon="solar:shop-2-linear" className="text-xs" />
                      {t("cartItems.soldBy", { defaultValue: "Sold by" })}{" "}
                      {item.store.name}
                    </Link>
                  )}

                  <Link
                    title={item.product.name || ""}
                    href={`/products/${item.product.slug}`}
                    className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
                  >
                    {item.product.name}
                  </Link>

                  {renderVariantMeta(item, isLowStock)}

                      {/* Price */}
                      <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(shownPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[13px] text-default-400 line-through">
                            {formatPrice(lineOriginal)}
                          </span>
                        )}
                        {discountPct > 0 && (
                          <span className="text-[13px] font-semibold text-success">
                            {t("discount", { percent: discountPct })}
                          </span>
                        )}
                      </div>

                      {saving > 0 && (
                        <span className="text-xs font-medium text-success">
                          {t("cart.youSaved", {
                            amount: formatPrice(saving),
                            defaultValue: `You saved ${formatPrice(saving)}`,
                          })}
                        </span>
                      )}

                      {/* Estimated delivery */}
                      {deliveryEtaLabel(item) && (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                          <Icon icon="solar:clock-circle-linear" className="text-sm" />
                          <span>{deliveryEtaLabel(item)}</span>
                        </div>
                      )}
                      {/* Actions */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            handleSaveForLater(item.id, item.quantity)
                          }
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-60"
                        >
                          <Icon icon="solar:bookmark-linear" className="text-sm" />
                          {t("saveForLater.title")}
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setSelectedItemId(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                        >
                          <Icon
                            icon="solar:trash-bin-trash-linear"
                            className="text-sm"
                          />
                          {t("remove_item")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {renderAttachment(item)}
                </div>
              );
            })}

        {modals}
      </div>
    );
  }

  // ---- Default layout: compact list (checkout summary) --------------------
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
                const line = getLineAmounts(item);
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
                          {getVariantLabel(item) && (
                            <div className="text-xs text-foreground/50 flex flex-wrap gap-2 items-center mt-1">
                              <span className="line-clamp-2 block">
                                {getVariantLabel(item)}
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
                            <CartAddonList
                              addons={item.addons}
                              className="mt-1"
                            />
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
                            {line.hasDiscount && (
                              <span className="line-through opacity-60">
                                {formatPrice(line.lineOriginal)}
                              </span>
                            )}{" "}
                            <span className="text-sm font-semibold text-foreground">
                              {formatPrice(line.shownPrice)}
                            </span>
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
                    {showAttachments && item.product.is_attachment_required && (
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

      {modals}
    </ScrollShadow>
  );
};

export default CartItems;
