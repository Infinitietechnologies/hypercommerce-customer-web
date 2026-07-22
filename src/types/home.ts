import type { Brand, Category, Product } from "./catalog";
import type { SEOMetadata } from "./common";

export type SectionType =
  | "trending"
  | "best_seller"
  | "featured"
  | "on_sale"
  | "recommended";

export interface FeaturedSection {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  style: "without_background" | "with_background";
  section_type: SectionType;
  sort_order: number;
  status: "active" | "inactive" | string;
  scope_type: "global" | "local" | string;
  scope_id: number | null;
  scope_category_slug: string;
  scope_category_title: string;
  background_type: "image" | "color" | string | null;
  background_color: string | null;
  background_image: string;
  desktop_4k_background_image: string;
  desktop_fdh_background_image: string;
  tablet_background_image: string;
  mobile_background_image: string;
  text_color: string;
  categories: Category[];
  products: Product[];
  products_count: number;
  created_at: string;
  updated_at: string;
}

// Home Layout (replaces featured-sections builder)

// Home Layout (replaces featured-sections builder)
export type HomeSectionType =
  | "hero"
  | "banners"
  | "products"
  | "categories"
  | "brands";

export interface HomeSectionItem {
  id: number;
  title?: string;
  image: string;
  default_image?: string;
  type?: string;
  link_type?: string;
  link_url?: string;
  target_id: number | string | null;
  slug: string;
}

// Hero items use `type`; banner items use `link_type` (+ optional link_url).
// Both share the common image/slug fields of HomeSectionItem.

// Hero items use `type`; banner items use `link_type` (+ optional link_url).
// Both share the common image/slug fields of HomeSectionItem.
export interface HomeHeroItem extends HomeSectionItem {
  type?: string;
}

export interface HomeBannerItem extends HomeSectionItem {
  link_type?: string;
  link_url?: string;
}

export interface HomeSection {
  id: number;
  type: HomeSectionType;
  title: string;
  style: string | null;
  config: Record<string, unknown> | null;
  background_image: string | null;
  hero_media: string | null;
  card_background_image: string | null;
  content: {
    products?: Product[];
    categories?: Category[];
    brands?: Brand[];
    items?: HomeSectionItem[];
  };
}

export interface HomeLayout {
  scope_type: string;
  scope_id: number | null;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sections: HomeSection[];
}

// Cart API Type

export interface BannerData {
  top: Banner[];
  carousel: Banner[];
  sidebar?: Banner[];
}

export interface Banner {
  id: number;
  type: string;
  type_id: number;
  image: string;
  banner_image: string;
  title: string;
  slug?: string;
  brand_slug?: string;
  category_slug?: string;
  product_slug?: string;
  custom_url?: string;
  metadata?: SEOMetadata | string | null;
}
