import { useCallback, useEffect, useState } from "react";

import { parseGuestCartLink } from "@/features/cartSharing/guestCartLink";
import { handleOfflineAddToCart } from "@/helpers/functionalHelpers";
import { getProductBySlug } from "@/services/catalog";
import { addToCart } from "@/services/cart";
import type { Product, ProductVariant } from "@/types/catalog";
import type { SharedCartPreview } from "@/types/sharedCart";

type GuestStatus = "idle" | "loading" | "ready" | "invalid" | "error";
type Addon = { addon_group_id: number; addon_item_id: number; title: string; price: number };
type ResolvedItem = {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  addons: Addon[];
};

export const useGuestSharedCart = (encoded: string, enabled: boolean) => {
  const [status, setStatus] = useState<GuestStatus>("idle");
  const [items, setItems] = useState<ResolvedItem[]>([]);
  const [unavailableCount, setUnavailableCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setItems([]);
    setUnavailableCount(0);
    const parsed = parseGuestCartLink(encoded);
    if (!parsed) {
      setStatus("invalid");
      return;
    }

    setStatus("loading");
    const products = await Promise.all(
      [...new Set(parsed.map((item) => item.slug))].map(async (slug) => {
        try {
          return [slug, await getProductBySlug({ slug })] as const;
        } catch {
          return [slug, null] as const;
        }
      }),
    );
    const productBySlug = new Map(products);
    const resolved: ResolvedItem[] = [];

    for (const [index, item] of parsed.entries()) {
      const response = productBySlug.get(item.slug);
      const product = response?.success ? response.data : null;
      const variant = product?.variants.find(
        (candidate) => candidate.id === item.variantId && candidate.store_id === item.storeId,
      );
      if (!product || !variant || !variant.availability || variant.is_in_stock === false) {
        continue;
      }

      const min = product.minimum_order_quantity || 1;
      const max = product.total_allowed_quantity || 1;
      const step = product.quantity_step_size || 1;
      if (
        item.quantity < min || item.quantity > max ||
        (variant.stock !== null && item.quantity > variant.stock) ||
        (item.quantity - min) % step !== 0
      ) {
        continue;
      }

      const addons: Addon[] = [];
      let validAddons = true;
      for (const selected of item.addons) {
        const group = variant.addon_groups?.find((entry) => entry.id === selected.groupId);
        const addon = group?.items.find((entry) => entry.id === selected.itemId && entry.is_available);
        if (
          !group || !addon ||
          addons.some((entry) => entry.addon_item_id === addon.id) ||
          (group.selection_type === "single" &&
            addons.some((entry) => entry.addon_group_id === group.id))
        ) {
          validAddons = false;
          break;
        }
        addons.push({
          addon_group_id: group.id,
          addon_item_id: addon.id,
          title: addon.title,
          price: addon.price,
        });
      }

      if (!validAddons || variant.addon_groups?.some(
        (group) => group.is_required && !addons.some((addon) => addon.addon_group_id === group.id),
      )) {
        continue;
      }

      resolved.push({ id: String(index), product, variant, quantity: item.quantity, addons });
    }

    setItems(resolved);
    setUnavailableCount(parsed.length - resolved.length);
    setStatus(resolved.length ? "ready" : "error");
  }, [encoded, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const importItems = useCallback(async (isLoggedIn: boolean, selectedIds: string[]) => {
    const selectedSet = new Set(selectedIds);
    const selectedItems = items.filter((item) => selectedSet.has(item.id));
    if (status !== "ready" || isImporting || !selectedItems.length) {
      return { added: 0, failed: selectedItems.length };
    }
    setIsImporting(true);
    try {
      if (!isLoggedIn) {
        for (const item of selectedItems) {
          handleOfflineAddToCart({
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
            addons: item.addons,
            renderToast: false,
          });
        }
        return { added: selectedItems.length, failed: 0 };
      }

      let added = 0;
      for (const item of selectedItems) {
        try {
          const response = await addToCart({
            store_id: item.variant.store_id,
            product_variant_id: item.variant.id,
            quantity: item.quantity,
            addons: item.addons.map((addon) => ({
              addon_group_id: addon.addon_group_id,
              addon_item_id: addon.addon_item_id,
            })),
          });
          if (response.success) added += 1;
        } catch {
          continue;
        }
      }
      return { added, failed: selectedItems.length - added };
    } finally {
      setIsImporting(false);
    }
  }, [isImporting, items, status]);

  const preview: SharedCartPreview = {
    ownerName: null,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    items: items.map((item) => ({
      id: item.id,
      name: item.product.title || item.variant.title,
      image: item.variant.image || item.product.main_image,
      productSlug: item.product.slug,
      variant: item.variant.title,
      store: item.variant.store_name,
      quantity: item.quantity,
    })),
  };

  return { status, preview, unavailableCount, isImporting, load, importItems };
};
