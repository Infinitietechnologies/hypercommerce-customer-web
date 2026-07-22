export type ApiResponse<T> = {
  success: boolean;
  message: string;
  access_token?: string;
  data?: T | null;
  errors?: string[];
  total?: number;
};

// ---- Market currency / formatting (hypercommerce) ----

export type PaginatedResponse<T, M = {}> = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: T;
    first_page_url?: string;
    from?: number;
    last_page?: number;
    last_page_url?: string;
    links?: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    next_page_url?: string | null;
    path?: string;
    per_page: number;
    prev_page_url?: string | null;
    to?: number;
    total: number;
    keywords?: string[];
    category_ids?: number[];
    brand_ids?: number[];
    main_category_data?: {
      id: number;
      title: string;
      search_labels: string[];
    };
  } & M;
};

export type SEOMetadata = {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
};
