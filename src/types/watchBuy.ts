import type { ApiResponse } from "./common";

export interface WatchBuyProfile {
  id: number;
  type: "platform" | "seller" | string;
  username: string;
  bio: string | null;
  photo_url: string | null;
  status: string;
  suspension_reason: string | null;
  suspended_at: string | null;
  has_active_status: boolean;
  has_unseen_status: boolean;
}

export interface WatchBuyProduct {
  product_id: number;
  product_slug: string;
  title: string;
  image: string | null;
  store_id: number;
  store_slug: string;
  store_name: string;
  variant_id: number;
  variant_title: string;
  price: number;
  special_price: number | null;
  currency_code: string;
  currency_symbol: string;
  available: boolean;
  sort_order: number;
  is_primary?: boolean;
}

export interface WatchBuyReel {
  id: number;
  uuid: string;
  slug: string;
  caption: string | null;
  status: string;
  source: "seller" | "seller_behalf" | "admin_direct" | string;
  block_reason: string | null;
  blocked_at: string | null;
  video_url: string;
  cover_url: string | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  profile: WatchBuyProfile;
  like_count: number;
  liked_by_me: boolean;
  products: WatchBuyProduct[];
  published_at: string;
}

export interface WatchBuyReelsData {
  items: WatchBuyReel[];
  meta: {
    session_id: string;
    next_cursor: string | null;
    per_page: number;
    slug_not_found: boolean;
  };
}

export interface WatchBuyStatusSummary {
  profile: WatchBuyProfile;
  status_count: number;
}

export interface WatchBuyStatusFeedData {
  items: WatchBuyStatusSummary[];
  meta: {
    session_id: string;
    next_cursor: string | null;
    per_page: number;
  };
}

export interface WatchBuyStatus {
  id: number;
  uuid: string;
  source: "seller" | "seller_behalf" | "admin_direct" | string;
  content_type: "image" | "video" | "text" | string;
  text: string | null;
  media_url: string | null;
  media_mime: string | null;
  media_size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  products: WatchBuyProduct[];
  creator: {
    id: number;
    name: string;
  };
  created_at: string;
  expires_at: string;
  seen_by_me: boolean;
}

export interface WatchBuyProfileStatusesData {
  profile: WatchBuyProfile;
  items: WatchBuyStatus[];
  pagination: {
    per_page: number;
    total: number;
    next_cursor: string | null;
    previous_cursor: string | null;
    has_more_pages: boolean;
  };
}

export type WatchBuyReelsResponse = ApiResponse<WatchBuyReelsData>;
export type WatchBuyStatusesResponse = ApiResponse<WatchBuyStatusFeedData>;
export type WatchBuyProfileStatusesResponse =
  ApiResponse<WatchBuyProfileStatusesData>;
