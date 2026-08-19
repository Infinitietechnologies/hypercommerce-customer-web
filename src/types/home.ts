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
      style?: string;
      config?: Record<string, unknown>;
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
  navbar_slug?: string;
  navbar_title?: string;
}

export interface HomeNavbarAppearance {
  background_type: "none" | "color" | "gradient" | "image" | "lottie";
  gradient_start: string;
  gradient_end: string;
  gradient_angle: string | number;
  font_color: string;
  active_font_color: string;
  icon: string;
  active_icon: string;
  background_image: string;
}

export interface HomeNavbarItem {
  id: number | null;
  title: string;
  slug: string | null;
  is_default?: boolean;
  platforms: Array<"app" | "web">;
  layout_query: { navbar_slug?: string };
  appearance: HomeNavbarAppearance;
  home_appearance?: {
    app: HomeNavbarAppearance;
    desktop: HomeNavbarAppearance;
  };
  icon?: string | null;
  active_icon?: string | null;
  background_image?: string | null;
  desktop_icon?: string | null;
  desktop_active_icon?: string | null;
  desktop_background_image?: string | null;
  search_labels: string[];
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
