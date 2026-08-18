import type { Brand, Category, Product } from "./catalog";
import type { SEOMetadata } from "./common";

// Home Layout — the server-driven home page builder
export type HomeSectionType =
  | "hero"
  | "products"
  | "categories"
  | "brands"
  | "play_image";

export interface HomeSectionItem {
  id: number;
  title?: string;
  image: string;
  /** Optional mobile-specific image; falls back to `image`. */
  mobile_image?: string | null;
  default_image?: string;
  type?: string;
  link_type?: string;
  link_url?: string;
  target_id: number | string | null;
  slug: string;
  config?: Record<string, any>;
}

// Hero items use `type`; play-image items use `link_type` (+ optional link_url).
export interface HomeHeroItem extends HomeSectionItem {
  type?: string;
}

export interface HomeSection {
  id: number;
  type: HomeSectionType;
  title: string | null;
  style?: string | null;
  config: Record<string, unknown> | null;
  background_image?: string | null;
  hero_media?: string | null;
  card_background_image?: string | null;
  content: {
    products?: Product[];
    categories?: Category[];
    brands?: Brand[];
    items?: HomeSectionItem[];
    rows?: {
      row_index: number;
      items: HomeSectionItem[];
    }[];
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
