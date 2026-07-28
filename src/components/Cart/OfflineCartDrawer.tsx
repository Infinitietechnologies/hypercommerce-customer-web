import React, { FC } from "react";
import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Image,
  ScrollShadow,
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
  updateOfflineCartItemQuantity,
} from "@/lib/redux/slices/offlineCartSlice";
import Link from "next/link";
import { useState } from "react";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import dynamic from "next/dynamic";
import { getProductBySlug } from "@/routes/api";
import { Product, ProductVariant } from "@/types/ApiResponse";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});

type OfflineCartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const OfflineCartDrawer: FC<OfflineCartDrawerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { formatPrice } = useSettings();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const dispatch = useDispatch();
  const offlineCart = useSelector((state: RootState) => state.offlineCart);
  const hasItems = offlineCart.items.length > 0;

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

  const handleCustomize = async (item: any) => {
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
          item.addons?.reduce(
            (acc: any, addon: any) => {
              if (!acc[addon.addon_group_id]) acc[addon.addon_group_id] = [];
              acc[addon.addon_group_id].push(addon.addon_item_id);
              return acc;
            },
            {} as Record<number, number[]>,
          ) || {};

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
        <DrawerContent className="max-w-md">
          <DrawerHeader className="flex flex-col gap-1">
            <p className="text-lg font-semibold">{t("cart_title")}</p>
            <p className="text-sm text-foreground/60">
              {t("cart.login_required") || "Please login to continue"}
            </p>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-4">
            {hasItems ? (
              <>
                <ScrollShadow className="flex flex-col gap-3 max-h-[50vh] pr-1">
                  {offlineCart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-divider bg-content1 p-3"
                    >
                      {item.image ? (
                        <Image
                          alt={item.name}
                          src={item.image}
                          removeWrapper
                          className="h-16 w-16 rounded-xl object-contain bg-content2"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-content2 text-foreground/50 flex items-center justify-center text-sm font-semibold uppercase">
                          {item.name?.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col sm:gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/products/${item.slug}`}
                            className="text-xs sm:text-sm font-semibold block truncate overflow-hidden text-ellipsis max-w-[120px] sm:max-w-[220px] min-w-0"
                          >
                            {item.name}
                          </Link>

                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            aria-label={t("cartItems.removeItemModal.title")}
                            onPress={() => setSelectedItemId(item.id)}
                          >
                            <Icon
                              icon="solar:trash-bin-trash-linear"
                              className="text-base"
                            />
                          </Button>
                        </div>
                        {item.storeName && (
                          <Link
                            href={`/stores/${item.storeSlug}`}
                            className="text-xxs sm:text-xs text-foreground/60"
                          >
                            {item.storeName}
                          </Link>
                        )}
                        <div className="flex flex-col gap-2">
                          <div className="flex sm:items-center flex-col sm:flex-row justify-between text-xs text-foreground/60">
                            <div className="flex gap-2">
                              <span>
                                {t("product_modal.qty") + ":"} {item.quantity}
                              </span>
                              <span>
                                {t("product_modal.stock", {
                                  stock: item.stock,
                                })}
                              </span>
                            </div>
                            <span>
                              {formatPrice(item.price)} /{" "}
                              {t("item") || "item"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1 rounded-xl border border-divider p-1">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label={t("decrease_quantity", "Decrease quantity")}
                                className="w-7 h-7 min-w-7 text-primary-600"
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
                                <Icon icon="solar:minus-square-linear" className="text-lg" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                aria-label={t("increase_quantity", "Increase quantity")}
                                className="w-7 h-7 min-w-7 text-primary-600"
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
                                <Icon icon="solar:add-square-linear" className="text-lg" />
                              </Button>
                            </div>
                            <p className="text-sm font-bold text-foreground whitespace-nowrap">
                              {formatPrice(
                                (item.price +
                                  (item.addons?.reduce(
                                    (sum, a) => sum + (a.price || 0),
                                    0,
                                  ) || 0)) *
                                  item.quantity,
                              )}
                            </p>
                          </div>
                          {/* CUSTOMIZE BUTTON */}
                          <button
                            onClick={() => handleCustomize(item)}
                            disabled={isCustomizing}
                            className="text-xxs font-semibold mt-1 flex items-center gap-0.5 text-primary-600 hover:opacity-80 transition-opacity"
                          >
                            <span className="cursor-pointer">
                              {isCustomizing &&
                              customizingProduct?.slug === item.slug
                                ? t("loading")
                                : t("cartItems.customize") || "Customize"}
                            </span>
                            <Icon icon="solar:alt-arrow-right-linear" className="text-sm" />
                          </button>

                          {item.addons && item.addons.length > 0 && (
                            <div className="text-xxs text-foreground/40 leading-tight mt-1 break-words">
                              {item.addons
                                .map((addon: any) => {
                                  const groupTitle =
                                    addon.group?.title ||
                                    addon.addon_group_name;
                                  const itemTitle =
                                    addon.item?.title || addon.title;
                                  return groupTitle
                                    ? `${groupTitle}: ${itemTitle}`
                                    : itemTitle;
                                })
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollShadow>

                <Divider />

                <div className="flex flex-col gap-2 rounded-2xl border border-divider bg-content2 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">
                      {t("checkout.itemsTotal")}
                    </span>
                    <span className="font-bold text-foreground">
                      {formatPrice(offlineCart.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>{t("items") || "items"}</span>
                    <span>{offlineCart.totalQuantity}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Image
                  alt="Empty cart"
                  src="/empty/noOrder.png"
                  width={180}
                  height={140}
                  className="w-44 h-auto object-contain"
                />
                <p className="text-base font-semibold">
                  {t("cart.cartEmptyTitle")}
                </p>
                <p className="text-sm text-foreground/60">
                  {t("cart.cartEmptyDescription")}
                </p>
              </div>
            )}
          </DrawerBody>

          <DrawerFooter className="flex flex-col gap-2">
            <Button color="primary" className="w-full" onPress={handleLogin}>
              {t("cart.login_required") || "Please login to continue"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
