export interface SharedCartPreviewItem {
  id: string;
  name: string;
  image: string | null;
  productSlug: string | null;
  variant: string | null;
  store: string | null;
  quantity: number;
}

export interface CartShareSelectionItem extends SharedCartPreviewItem {
  variantId: number;
  storeId: number;
  addons: { groupId: number; itemId: number }[];
}

export interface SharedCartPreview {
  items: SharedCartPreviewItem[];
  ownerName: string | null;
  totalQuantity: number;
}
