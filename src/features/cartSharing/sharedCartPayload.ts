import type { SharedCartPreview, SharedCartPreviewItem } from "@/types/sharedCart";

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const firstText = (record: RecordValue, keys: string[]): string | null => {
  for (const key of keys) {
    const value = asText(record[key]);
    if (value) return value;
  }
  return null;
};

const tokenFromUrl = (value: string): string | null => {
  try {
    const url = new URL(value, "https://example.invalid");
    const queryToken = url.searchParams.get("token");
    if (queryToken) return queryToken;
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
};

export const getSharedCartToken = (payload: unknown): string | null => {
  const value = asText(payload);
  if (value) return value.includes("/") ? tokenFromUrl(value) : value;

  const record = asRecord(payload);
  if (!record) return null;

  const token = firstText(record, ["token", "share_token", "shareToken"]);
  if (token) return token;

  const url = firstText(record, ["share_url", "shareUrl", "share_link", "url", "link"]);
  if (url) return tokenFromUrl(url);

  return getSharedCartToken(record.shared_list ?? record.share ?? record.data);
};

export const getSharedCartUrl = (token: string, configuredOrigin?: string) => {
  const origin =
    configuredOrigin?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    window.location.origin;
  const url = new URL("/shared-cart/", origin);
  url.searchParams.set("token", token);
  return url.toString();
};

const toPreviewItem = (value: unknown, index: number): SharedCartPreviewItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  const product = asRecord(item.product) ?? {};
  const variant = asRecord(item.variant) ?? {};
  const store = asRecord(item.store) ?? {};
  const name =
    firstText(product, ["name", "title", "product_name"]) ??
    firstText(item, ["product_name", "name", "title"]);
  if (!name) return null;

  const rawQuantity = Number(item.quantity ?? 1);
  return {
    id: String(item.id ?? item.product_variant_id ?? index),
    name,
    image:
      firstText(product, ["image", "image_url", "thumbnail"]) ??
      firstText(item, ["product_image", "image"]),
    productSlug:
      firstText(product, ["slug"]) ?? firstText(item, ["product_slug", "slug"]),
    variant:
      firstText(variant, ["title", "name"]) ?? firstText(item, ["variant_name"]),
    store: firstText(store, ["name"]) ?? firstText(item, ["store_name"]),
    quantity: Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1,
  };
};

export const getSharedCartPreview = (payload: unknown): SharedCartPreview | null => {
  const outer = asRecord(payload);
  if (!outer) return null;
  const nested = asRecord(outer.shared_list ?? outer.list ?? outer.cart ?? outer.data);
  const list = nested ?? outer;
  const rawItems = list.items ?? list.products;
  if (!Array.isArray(rawItems)) return null;

  const items = rawItems.map(toPreviewItem).filter((item): item is SharedCartPreviewItem => item !== null);
  if (items.length !== rawItems.length) return null;

  const owner = asRecord(list.owner ?? list.user ?? list.shared_by) ?? {};
  return {
    items,
    ownerName: firstText(owner, ["name"]) ?? firstText(list, ["owner_name", "shared_by_name"]),
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
  };
};
