import type { ApiResponse } from "@/types/common";

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  blogs_count?: number;
}

export interface BlogAuthor {
  id: number;
  username: string;
  bio?: string | null;
  photo_url?: string | null;
}

export interface BlogSummary {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  image: string | null;
  editor_pick?: boolean;
  published_at: string | null;
  views_count?: number;
  categories?: BlogCategory[];
  category?: BlogCategory | null;
  tags?: string[];
  author?: BlogAuthor | null;
}

export interface BlogSeo {
  title?: string | null;
  description?: string | null;
  keywords?: string[] | null;
}

export interface BlogProduct {
  id: number;
  title: string;
  slug: string;
  main_image: string | null;
  variants?: {
    id: number;
    is_default?: boolean;
    price: number;
    special_price: number | null;
    formatted?: string;
    formatted_special_price?: string | null;
    availability?: boolean;
    is_in_stock?: boolean;
  }[];
}

export interface BlogDetail extends BlogSummary {
  content: string;
  seo?: BlogSeo | null;
  products?: BlogProduct[];
  related_blogs?: BlogSummary[];
}

export interface BlogList {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: BlogSummary[];
  editors_pick?: BlogSummary[];
}

export type BlogListResponse = ApiResponse<BlogList>;
export type BlogDetailResponse = ApiResponse<BlogDetail>;
