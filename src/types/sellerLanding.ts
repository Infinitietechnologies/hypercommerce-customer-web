export type SellerLandingSectionType =
  | "hero"
  | "benefits"
  | "steps"
  | "registration_form"
  | "testimonials";

export type LocalizedSellerContent = Record<string, Record<string, unknown>>;

export interface SellerLandingItem {
  id: string;
  preset?: string;
  content?: LocalizedSellerContent;
  settings?: Record<string, unknown>;
  media?: Record<string, string>;
}

export interface SellerLandingSection {
  id: string;
  type: SellerLandingSectionType;
  variant: string;
  preset?: string;
  enabled: boolean;
  content?: LocalizedSellerContent;
  settings?: Record<string, unknown>;
  media?: Record<string, string>;
  items?: SellerLandingItem[];
}

export interface SellerLandingSettings {
  schemaVersion: 1;
  seo?: LocalizedSellerContent;
  seoMedia?: Record<string, string>;
  sections: SellerLandingSection[];
}

export interface ResolvedSellerLandingItem extends SellerLandingItem {
  copy: Record<string, unknown>;
  settings: Record<string, unknown>;
  media: Record<string, string>;
}

export interface ResolvedSellerLandingSection extends SellerLandingSection {
  copy: Record<string, unknown>;
  settings: Record<string, unknown>;
  media: Record<string, string>;
  items: ResolvedSellerLandingItem[];
}
