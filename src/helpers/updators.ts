import {
  clearCart,
  setCartData,
  setCartLoading,
  setError,
} from "@/lib/redux/slices/cartSlice";
import { store } from "@/lib/redux/store";
import { getCart, syncOfflineCart } from "@/routes/api";
import { ApiResponse, CartResponse, CartSyncData } from "@/types/ApiResponse";
import { addToast } from "@heroui/react";
import i18n from "../../i18n";
import { resetCheckOutState } from "./functionalHelpers";
import {
  clearOfflineCart,
  setOfflineCart,
} from "@/lib/redux/slices/offlineCartSlice";
import { setFailedCartItems } from "@/lib/redux/slices/cartNoticeSlice";

export const updateCartData = async (
  passAddress: boolean = true,
  renderToast: boolean = true,
  customAddress: string | number = 0,
  // Retained for call-site compatibility; rush/express delivery is removed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _customRushMode: boolean = true,
  emtyCartToast: boolean = true
): Promise<ApiResponse<CartResponse> | undefined> => {
  try {
    const isLoggedIn = store.getState().auth.isLoggedIn;
    const address_id = store
      .getState()
      .checkout.selectedAddress?.id?.toString();

    if (!isLoggedIn) {
      return;
    }

    store.dispatch(setCartLoading(true));
    const state = store.getState();
    const use_wallet = state?.checkout?.useWallet || false;
    const promo_code = state?.checkout?.promoCode || "";
    const cartRes: ApiResponse<CartResponse> = await getCart({
      address_id: customAddress ? customAddress : passAddress ? address_id : "",
      use_wallet,
      promo_code,
    });

    if (cartRes.success && cartRes.data) {
      store.dispatch(setCartData(cartRes.data));

    } else if (isEmptyCartResponse(cartRes)) {
      store.dispatch(clearCart());
      resetCheckOutState();
      if (renderToast && emtyCartToast) {
        addToast({
          title: i18n.t("cartStatus.emptyTitle"),
          description: i18n.t("cartStatus.emptyDescription"),
          color: "warning",
        });
      }
    } else {
      store.dispatch(setError("Failed to fetch updated cart"));
      if (renderToast) {
        addToast({
          title: i18n.t("cartStatus.fetchFailedTitle"),
          description: i18n.t("cartStatus.fetchFailedDescription"),
          color: "warning",
        });
      }
    }
    return cartRes;
  } catch (error) {
    console.error(error);
  } finally {
    store.dispatch(setCartLoading(false));
  }
};

/**
 * The panel answers an empty cart with `success: false` and an empty `data`,
 * carrying no machine-readable marker yet, so the message is the fallback. A
 * transport failure must never take this branch — it would clear a cart the
 * customer still has.
 */
const isEmptyCartResponse = (res: ApiResponse<CartResponse>): boolean => {
  if (res.success) return false;

  const code = (res as { code?: string }).code;
  if (code) return code === "cart_is_empty";

  return (res.message || "").trim().toLowerCase() === "your cart is empty";
};

export const syncOfflineCartToServer = async (): Promise<boolean> => {
  try {
    const offlineCartItems = store.getState().offlineCart.items;

    // If no offline cart items, skip sync
    if (!offlineCartItems || offlineCartItems.length === 0) {
      return true;
    }

    // Transform offline cart items to API format
    const items = offlineCartItems.map((item) => ({
      store_id: item.store_id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      addons:
        item.addons?.map((addon) => ({
          addon_group_id: addon.addon_group_id,
          addon_item_id: addon.addon_item_id,
        })) || [],
    }));

    // Call sync API
    const response: ApiResponse<CartSyncData> = await syncOfflineCart({
      items,
    });

    if (response.success && response.data) {
      // Update cart with the synced cart data
      if (response.data.cart) {
        store.dispatch(setCartData(response.data.cart));
      }

      // Keep anything the server refused — it only exists locally, so clearing
      // the whole offline cart here would lose it.
      const failedItems = response.data.failed_items ?? [];
      const rejected = offlineCartItems.filter((item) =>
        failedItems.some(
          (failed) =>
            failed.store_id === item.store_id &&
            failed.product_variant_id === item.product_variant_id,
        ),
      );

      if (rejected.length > 0) {
        store.dispatch(setOfflineCart(rejected));
      } else {
        store.dispatch(clearOfflineCart());
      }

      if (failedItems.length > 0) {
        store.dispatch(setFailedCartItems(failedItems));
      }

      // Show success message after 3 seconds
      setTimeout(() => {
        addToast({
          title: i18n.t("cart.sync_success_title") || "Cart Synced",
          description:
            i18n.t("cart.sync_success_desc") ||
            "Your cart items have been synced successfully",
          color: "success",
        });
      }, 3000);

      return true;
    } else {
      console.error("Failed to sync offline cart:", response.message);

      // Show error message after 3 seconds
      setTimeout(() => {
        addToast({
          title: i18n.t("cart.sync_error_title") || "Sync Failed",
          description:
            response.message || "Failed to sync your cart. Please try again.",
          color: "warning",
        });
      }, 2000);

      return false;
    }
  } catch (error) {
    console.error("Error syncing offline cart:", error);
    addToast({
      title: i18n.t("cart.sync_error_title") || "Sync Error",
      description:
        i18n.t("cart.sync_error_desc") ||
        "An error occurred while syncing your cart",
      color: "danger",
    });
    return false;
  }
};

export const updateDataOnAuth = async () => {
  if (typeof window === "undefined") return;

  const pathButtonMap: Record<string, string[]> = {
    "/": ["home-products-refetch", "home-sections-refetch"],
    "/shopping-list": ["shopping-list-refetch"],
  };

  const normalizePath = (path: string) =>
    path !== "/" ? path.replace(/\/+$/, "") : "/";

  const currentPath = normalizePath(window.location.pathname);

  let buttonIds: string[] = [];

  if (currentPath.startsWith("/products/")) {
    buttonIds = ["similar-products-refetch", "specific-product-refetch"];
  } else if (currentPath.startsWith("/brands/")) {
    buttonIds = ["refetch-brand-products"];
  } else if (currentPath.startsWith("/categories/")) {
    buttonIds = ["category-products-refetch"];
  } else if (currentPath.startsWith("/stores/")) {
    buttonIds = ["refetch-store-products"];
  } else {
    // Handle exact matches
    buttonIds = pathButtonMap[currentPath] || [];
  }

  buttonIds.forEach((id) => document.getElementById(id)?.click?.());
};
