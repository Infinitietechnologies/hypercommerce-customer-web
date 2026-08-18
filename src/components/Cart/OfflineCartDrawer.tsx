import React, { FC } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Image,
  toast,
  useDisclosure,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useSettings } from "@/contexts/SettingsContext";
import {
  removeOfflineCartItem,
  type OfflineCartItem,
  updateOfflineCartItemQuantity,
} from "@/lib/redux/slices/offlineCartSlice";
import Link from "next/link";
import { useState } from "react";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import dynamic from "next/dynamic";
import { getProductBySlug } from "@/routes/api";
import { Product, ProductVariant } from "@/types/ApiResponse";
import CartAddonList from "@/components/Cart/CartAddonList";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});

type OfflineCartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

type OfflineCartItemWithVariant = OfflineCartItem & {
  variantTitle?: string;
  variantAttributes?: Record<string, string>;
};

const OfflineCartDrawer: FC<OfflineCartDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { formatPrice, systemSettings } = useSettings();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const dispatch = useDispatch();
  const offlineCart = useSelector((state: RootState) => state.offlineCart);
  const hasItems = offlineCart.items.length > 0;
  const lowStockLimit = Number(systemSettings?.lowStockLimit) || 0;

  const {
    isOpen: isProductModalOpen,
    onOpen: openProductModal,
    onClose: closeProductModal,
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

  const handleLogin = () => {
    onClose();
    document.getElementById("login-btn")?.click();
  };

  const getStepSize = (stepSize?: number) => {
    if (typeof stepSize === "number" && stepSize > 0) {
      return stepSize;
    }
    return 1;
  };

  const handleQuantityChange = (
    id: string,
    currentQuantity: number,
    step: number,
    direction: "inc" | "dec",
    minQuantity?: number,
    maxQuantity?: number,
    stock?: number,
  ) => {
    const delta = direction === "inc" ? step : -step;
    const newQuantity = currentQuantity + delta;
    const minQty = Number(minQuantity) || 1;
    const maxLimit = Number(maxQuantity) || 99999;

    // Check minimum quantity
    if (newQuantity < minQty) {
      toast({
        title: t("min_quantity_error_title"),
        description: t("min_quantity_error_description", {
          min: minQty,
        }),
        color: "danger",
      });
      return;
    }

    // Check stock limit
    if (stock && newQuantity > stock) {
      toast({
        title: t("stock_limit_error_title"),
        description: t("stock_limit_error_description", {
          stock: stock,
        }),
        color: "danger",
      });
      return;
    }

    // Check maximum quantity
    if (newQuantity > maxLimit) {
      toast({
        title: t("max_quantity_error_title"),
        description: t("max_quantity_error_description", {
          max: maxLimit,
        }),
        color: "danger",
      });
      return;
    }

    // Check step size
    if (step > 1) {
      if (newQuantity % step !== 0) {
        toast({
          title: t("step_error_title"),
          description: t("step_error_description", { step: step }),
          color: "danger",
        });
        return;
      }
    } else if ((newQuantity - minQty) % step !== 0) {
      toast({
        title: t("step_error_title"),
        description: t("step_error_description", { step: step }),
        color: "danger",
      });
      return;
    }

    dispatch(
      updateOfflineCartItemQuantity({
        id,
        quantity: newQuantity,
      }),
    );
  };
  const handleRemoveItem = () => {
    if (!selectedItemId) return;

    try {
      dispatch(removeOfflineCartItem(selectedItemId));
      setSelectedItemId(null);

      toast({
        title: t("cartItems.itemRemoved.title"),
        description: t("cartItems.itemRemoved.description"),
        color: "success",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: t("cartItems.removeFailed.title"),
        description: t("cartItems.removeFailed.description"),
        color: "danger",
      });
    }
  };

  const handleCustomize = async (item: OfflineCartItem) => {
    if (!item.slug) return;

    setIsCustomizing(true);
    try {
      const res = await getProductBySlug({
        slug: item.slug,
      });
      if (res.success && res.data) {
        setCustomizingProduct(res.data);
        const variant = res.data.variants.find(
          (v) => v.id === item.product_variant_id,
        );
        setCustomizingVariant(variant || null);

        // Convert cart addons back to modal format
        const addonsMap =
          item.addons?.reduce<Record<number, number[]>>((acc, addon) => {
            if (!acc[addon.addon_group_id]) acc[addon.addon_group_id] = [];
            acc[addon.addon_group_id].push(addon.addon_item_id);
            return acc;
          }, {}) || {};

        setInitialAddons(addonsMap);
        setEditingCartItemId(item.id);
        setEditingQuantity(item.quantity);
        openProductModal();
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
    <>
      <Drawer placement="right" isOpen={isOpen} onClose={onClose} size="sm">
        <DrawerContent className="max-w-md bg-content1">
          <DrawerHeader className="pe-12 pb-4 pt-5">
            <h2 className="text-xl font-bold text-foreground">
              {t("cart_title")}
            </h2>
          </DrawerHeader>

          <DrawerBody className="flex min-h-0 flex-col px-4 pb-4">
            {hasItems ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {offlineCart.items.map((item) => {
                    const itemWithVariant = item as OfflineCartItemWithVariant;
                    const addonsTotal =
                      item.addons?.reduce(
                        (sum, addon) => sum + (addon.price || 0),
                        0,
                      ) || 0;
                    const lineTotal =
                      (item.price + addonsTotal) * item.quantity;
                    const isLowStock =
                      lowStockLimit > 0 &&
                      item.stock > 0 &&
                      item.stock <= lowStockLimit;
                    const variantOptions = Object.entries(
                      itemWithVariant.variantAttributes || {},
                    ).filter(([, value]) => String(value).trim());
                    const fallbackVariant =
                      variantOptions.length === 0 &&
                      itemWithVariant.variantTitle &&
                      itemWithVariant.variantTitle !== item.name
                        ? itemWithVariant.variantTitle
                            .replace(item.name, "")
                            .replace(/^[\s|,/·\-–—:]+/, "")
                            .trim()
                        : "";

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-large border border-divider bg-content1 p-3 shadow-sm"
                      >
                        <div className="flex gap-3">
                          {item.image ? (
                            <Image
                              alt={item.name}
                              src={item.image}
                              removeWrapper
                              className="h-20 w-20 shrink-0 rounded-medium bg-content2 p-1 object-contain"
                            />
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-medium bg-content2 text-sm font-semibold uppercase text-foreground/50">
                              {item.name?.slice(0, 2)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/products/${item.slug}`}
                                  className="line-clamp-2 text-sm font-semibold leading-snug text-foreground"
                                >
                                  {item.name}
                                </Link>

                                {item.storeName && item.storeSlug && (
                                  <Link
                                    href={`/stores/${item.storeSlug}`}
                                    className="mt-1 flex max-w-full items-center gap-1 text-xs text-foreground/50"
                                  >
                                    <Icon
                                      icon="solar:shop-2-linear"
                                      className="shrink-0 text-sm"
                                    />
                                    <span className="truncate">
                                      {item.storeName}
                                    </span>
                                  </Link>
                                )}
                              </div>

                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="light"
                                aria-label={t(
                                  "cartItems.removeItemModal.title",
                                )}
                                className="h-8 min-w-8 rounded-full p-0"
                                onPress={() => setSelectedItemId(item.id)}
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-linear"
                                  className="text-base"
                                />
                              </Button>
                            </div>

                            {(variantOptions.length > 0 || fallbackVariant) && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {variantOptions.map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="inline-flex max-w-full items-center gap-1 rounded-small bg-content2 px-2 py-1 text-xs leading-none text-foreground/60"
                                  >
                                    <span className="capitalize">
                                      {key.replace(/[_-]+/g, " ")}:
                                    </span>
                                    <span className="truncate font-semibold text-foreground/80">
                                      {value}
                                    </span>
                                  </span>
                                ))}
                                {fallbackVariant && (
                                  <span className="inline-flex max-w-full truncate rounded-small bg-content2 px-2 py-1 text-xs font-semibold leading-none text-foreground/80">
                                    {fallbackVariant}
                                  </span>
                                )}
                              </div>
                            )}

                            {isLowStock && (
                              <p className="mt-1 text-xs font-semibold text-warning-600">
                                {t("product_modal.low_stock_alert", {
                                  stock: item.stock,
                                })}
                              </p>
                            )}

                            <p className="mt-2 text-base font-bold text-foreground">
                              {formatPrice(lineTotal)}
                            </p>
                          </div>
                        </div>

                        {item.addons && item.addons.length > 0 && (
                          <CartAddonList
                            addons={item.addons}
                            className="mt-3 border-t border-divider pt-3"
                          />
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-divider pt-3">
                          <div className="inline-flex h-9 items-center overflow-hidden rounded-medium border border-divider bg-content1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={t(
                                "decrease_quantity",
                                "Decrease quantity",
                              )}
                              className="h-full min-w-9 rounded-none bg-transparent p-0 text-foreground"
                              onPress={() =>
                                handleQuantityChange(
                                  item.id,
                                  item.quantity,
                                  getStepSize(item.stepSize),
                                  "dec",
                                  item.minQuantity,
                                  item.maxQuantity,
                                  item.stock,
                                )
                              }
                            >
                              <span
                                aria-hidden="true"
                                className="text-lg font-semibold leading-none"
                              >
                                −
                              </span>
                            </Button>
                            <span className="min-w-8 text-center text-sm font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label={t(
                                "increase_quantity",
                                "Increase quantity",
                              )}
                              className="h-full min-w-9 rounded-none bg-transparent p-0 text-foreground"
                              onPress={() =>
                                handleQuantityChange(
                                  item.id,
                                  item.quantity,
                                  getStepSize(item.stepSize),
                                  "inc",
                                  item.minQuantity,
                                  item.maxQuantity,
                                  item.stock,
                                )
                              }
                            >
                              <span
                                aria-hidden="true"
                                className="text-lg font-semibold leading-none"
                              >
                                +
                              </span>
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            isDisabled={isCustomizing}
                            className="h-9 min-w-0 gap-1 px-2 text-xs font-semibold"
                            endContent={
                              <Icon
                                icon="solar:alt-arrow-right-linear"
                                className="text-sm"
                              />
                            }
                            onPress={() => handleCustomize(item)}
                          >
                            {isCustomizing &&
                            customizingProduct?.slug === item.slug
                              ? t("loading")
                              : t("cartItems.customize")}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="border-t border-divider pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60">
                      {t("cart.subtotal")}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {formatPrice(offlineCart.subtotal)}
                    </span>
                  </div>
                  <Button
                    color="primary"
                    className="mt-3 w-full font-semibold"
                    onPress={handleLogin}
                  >
                    {t("cart.signInCheckout")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-primary-50 text-primary-600">
                  <Icon icon="solar:cart-large-2-linear" className="text-5xl" />
                </div>
                <p className="text-lg font-bold text-foreground">
                  {t("cart.cartEmptyTitle")}
                </p>
                <p className="max-w-xs text-sm leading-relaxed text-foreground/60">
                  {t("cart.cartEmptyDescription")}
                </p>
              </div>
            )}
          </DrawerBody>

          {!hasItems && (
            <DrawerFooter className="border-t border-divider bg-content1 px-4 py-4">
              <Button
                color="primary"
                className="w-full font-semibold"
                onPress={handleLogin}
              >
                {t("cart.signIn")}
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
      <ConfirmationModal
        isOpen={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onConfirm={handleRemoveItem}
        title={t("cartItems.removeItemModal.title")}
        icon={
          <Icon icon="solar:trash-bin-trash-linear" className="text-base" />
        }
        description={t("cartItems.removeItemModal.description")}
        confirmText={t("cartItems.removeItemModal.confirmText")}
        cancelText={t("cartItems.removeItemModal.cancelText")}
        variant="danger"
        alertTitle={t("cartItems.removeItemModal.alertTitle")}
        alertDescription={t("cartItems.removeItemModal.alertDescription")}
      />
      {isProductModalOpen && customizingProduct && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
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
};

export default OfflineCartDrawer;
