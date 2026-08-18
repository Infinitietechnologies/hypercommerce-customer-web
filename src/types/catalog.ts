import type { SEOMetadata } from "./common";

export type CategoryHomeAppearance = {
  background_type: "none" | "color" | "gradient" | "image";
  gradient_start: string;
  gradient_end: string;
  gradient_angle: string | number;
  font_color: string;
  active_font_color: string;
};

export type HomeCategory = {
  id: number;
  title: string;
  slug: string;
  image: string;
  banner: string;
  icon?: string;
  active_icon?: string;
  desktop_icon?: string;
  desktop_active_icon?: string;
  background_image?: string;
  desktop_background_image?: string;
  home_appearance: {
    app: CategoryHomeAppearance;
    desktop: CategoryHomeAppearance;
  };
  search_labels: string[];
  parent_id: number | null;
  parent_slug: string | null;
  description: string | null;
  status: "active" | "inactive";
  requires_approval: boolean;
  metadata: SEOMetadata | string | null;
  subcategory_count: number;
  product_count: number;
  enabled: boolean;
};

export type Category = {
  id: number;
  title: string;
  slug: string;
  image: string;
  banner: string;
  icon: string;
  active_icon: string;
  background_type: string | null;
  background_color: string;
  background_image: string;
  font_color: string;
  parent_id: number | null;
  parent_slug: string | null;
  description: string | null;
  status: "active" | "inactive";
  requires_approval: boolean;
  metadata: SEOMetadata | string | null;
  subcategory_count: number;
  product_count: number;
  enabled?: boolean;
};

export type SliderImage = {
  id: string;
  url: string;
  alt: string;
};
// Extended type definitions

// Extended type definitions
export interface AddonGroupItem {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  indicator: "veg" | "non_veg" | null;
  price: number;
  cost: number;
  stock: number;
  is_available: boolean;
}

export interface AddonGroup {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  selection_type: "single" | "multiple";
  is_required: boolean;
  sort_order: number;
  items: AddonGroupItem[];
}

export interface ProductVariant {
  id: number;
  title: string;
  slug: string;
  image: string;
  weight: number;
  height: number;
  breadth: number;
  length: number;
  availability: boolean;
  cart_item?: {
    exists: boolean;
    cart_item_id: number | null;
  };
  barcode: string;
  is_default: boolean;
  price: number;
  special_price: number;
  /** Backend market-formatted price strings (rounded, with symbol). */
  formatted?: string | null;
  formatted_special_price?: string | null;
  store_id: number;
  store_slug: string;
  store_name: string;
  stock: number;
  sku: string;
  attributes: Record<string, string>;
  addon_groups?: AddonGroup[];
  is_addons?: boolean;
}

export interface SwatchValue {
  value: string;
  swatch: string;
}

export interface ProductAttribute {
  name: string;
  slug: string;
  swatche_type: "text" | "image" | "color";
  values: string[];
  swatch_values: SwatchValue[];
}

export interface KeywordSearch {
  keyword: string;
  total_products: number;
  current_page: number;
  last_page: number;
  per_page: number;
  products: Product[];
}

export interface CustomFields {
  [key: string]: string | undefined;
}

export interface CustomProductSectionField {
  id: number;
  uuid: string;
  title: string;
  description: string;
  image: string;
  sort_order: number;
}

export interface CustomProductSection {
  id: number;
  uuid: string;
  title: string;
  description: string;
  sort_order: number;
  fields: CustomProductSectionField[];
}

export interface ProductBadge {
  id: number;
  label: string;
  bg_color: string;
  text_color: string;
  border_color: string;
}

export interface Product {
  id: number;
  uuid: string;
  category_id: number;
  brand_id: number | null;
  brand_name: string | null;
  seller_id: number;
  title: string;
  slug: string;
  type: "simple" | "variant";
  short_description: string;
  description: string;
  category: string;
  category_name: string;
  brand: string;
  seller: string | null;
  indicator: "veg" | "non_veg" | null;
  favorite: FavoriteItem[] | null;
  estimated_delivery_time: number | null;
  /** Zone/country-based delivery window (backend resolveProductEta via country_iso2). */
  delivery_eta?: {
    min: number | null;
    max: number | null;
    unit: string;
  } | null;
  ratings: number;
  rating_count: number;
  main_image: string;
  image_fit?: "contain" | "cover";
  additional_images: string[];
  minimum_order_quantity: number;
  quantity_step_size: number;
  total_allowed_quantity: number;
  is_returnable: number;
  returnable_days: number | null;
  is_cancelable: number;
  cancelable_till: string | null;
  tags: string[];
  warranty_period: string | null;
  guarantee_period: string | null;
  made_in: string | null;
  is_inclusive_tax: string;
  video_type: "youtube" | "self_hosted" | null;
  video_link: string | null;
  status: string;
  featured: "1" | "0" | null;
  is_recommended?: boolean;
  badge?: ProductBadge | null;
  is_sponsored?: boolean;
  campaign_id?: number;
  visitor_key?: string;
  metadata: {
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
  } | string | null;
  item_count_in_cart?: string;
  seller_ratings?: {
    total_reviews: number | null;
    average_rating: number | null;
    one_star_count: number | null;
    two_star_count: number | null;
    three_star_count: number | null;
    four_star_count: number | null;
    five_star_count: number | null;
  };
  custom_fields: CustomFields;
  created_at: string;
  updated_at: string;
  store_status: {
    is_open: boolean;
    status: string;
    current_slot?: string | null;
    next_opening_time?: string;
  };
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  custom_product_sections: CustomProductSection[];
}

export interface FavoriteItem {
  id: number;
  wishlist_id: number;
  wishlist_title: string;
  variant_id: number;
  variant_name: string;
  store_id: number;
  store_name: string;
}

export interface ToggleFavoriteResponse {
  is_favorited: boolean;
  item_id: number | null;
  items_count: number;
}

export interface Brand {
  id: number;
  title: string;
  slug: string;
  logo: string;
  description?: string | null;
  enabled?: boolean;
  metadata?: SEOMetadata | string | null;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  address: string;
  latitude: string;
  longitude: string;
  lat?: string | number;
  lng?: string | number;
  enabled?: boolean;
  status?: {
    is_open: boolean;
    status: string;
  };
  avg_store_rating: string;
  total_store_feedback: number;
  distance: string | number;
  timing?: string;
  product_count?: number;
  description?: string;
  contact_number?: string;
  contact_email?: string;
  metadata?: SEOMetadata | string | null;
  is_recommended?: boolean;
}

export interface SidebarFilters {
  categories_count: number;
  brands_count: number;
  attributes_count: number;
  categories: Category[];
  brands: Brand[];
  attributes: FilterAttribute[];
}

export interface FilterAttribute {
  title: string;
  slug: string;
  values: FilterAttributeValue[];
}

export interface FilterAttributeValue {
  id: number;
  title: string;
  swatche_value: string;
  enabled: boolean;
}
