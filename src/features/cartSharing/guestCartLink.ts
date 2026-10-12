export type CartLinkSourceItem = {
  slug: string | null | undefined;
  product_variant_id: number;
  store_id: number;
  quantity: number;
  addons?: { addon_group_id: number; addon_item_id: number }[];
};

export type GuestCartLinkItem = {
  slug: string;
  variantId: number;
  storeId: number;
  quantity: number;
  addons: { groupId: number; itemId: number }[];
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

const encode = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const decode = (value: string) => {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
};

export const createGuestCartUrl = (
  items: CartLinkSourceItem[],
  configuredOrigin?: string,
): string => {
  if (!items.length || items.length > 100) throw new Error("invalid_cart_size");

  const payload = items.map((item) => {
    if (
      !item.slug || item.slug.length > 200 ||
      !isPositiveInteger(item.product_variant_id) ||
      !isPositiveInteger(item.store_id) ||
      !isPositiveInteger(item.quantity) || item.quantity > 99999 ||
      (item.addons?.length ?? 0) > 30 ||
      item.addons?.some((addon) =>
        !isPositiveInteger(addon.addon_group_id) || !isPositiveInteger(addon.addon_item_id)
      )
    ) {
      throw new Error("invalid_cart_item");
    }
    return {
      s: item.slug,
      v: item.product_variant_id,
      r: item.store_id,
      q: item.quantity,
      a: (item.addons ?? []).map((addon) => [addon.addon_group_id, addon.addon_item_id]),
    };
  });

  const encoded = encode(JSON.stringify({ v: 1, i: payload }));
  if (encoded.length > 12000) throw new Error("cart_link_too_long");

  const url = new URL("/shared-cart/", configuredOrigin?.trim() || window.location.origin);
  url.searchParams.set("guest", encoded);
  return url.toString();
};

export const parseGuestCartLink = (encoded: string): GuestCartLinkItem[] | null => {
  if (!encoded || encoded.length > 12000) return null;

  try {
    const payload: unknown = JSON.parse(decode(encoded));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    const record = payload as Record<string, unknown>;
    if (record.v !== 1 || !Array.isArray(record.i) || !record.i.length || record.i.length > 100) {
      return null;
    }

    const items: GuestCartLinkItem[] = [];
    for (const entry of record.i) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as Record<string, unknown>;
      if (
        typeof item.s !== "string" || !item.s.trim() || item.s.length > 200 ||
        !isPositiveInteger(item.v) || !isPositiveInteger(item.r) ||
        !isPositiveInteger(item.q) || item.q > 99999 ||
        !Array.isArray(item.a) || item.a.length > 30
      ) return null;

      const addons: GuestCartLinkItem["addons"] = [];
      for (const addon of item.a) {
        if (
          !Array.isArray(addon) || addon.length !== 2 ||
          !isPositiveInteger(addon[0]) || !isPositiveInteger(addon[1])
        ) return null;
        addons.push({ groupId: addon[0], itemId: addon[1] });
      }

      items.push({
        slug: item.s,
        variantId: item.v,
        storeId: item.r,
        quantity: item.q,
        addons,
      });
    }
    return items;
  } catch {
    return null;
  }
};
