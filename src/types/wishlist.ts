export interface Wishlist {
  id: number;
  title: string;
  slug: string;
  items_count: number;
  items: WishlistItem[];
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: number;
  wishlist_id: number;
  product: {
    id: number;
    title: string;
    slug: string;
    image: string;
    short_description: string;
  };
  variant: {
    id: number;
    sku: string | null;
    image: string;
    price: number | null;
  };
  store: {
    id: number;
    name: string;
    slug: string;
  };
  created_at: string;
  updated_at: string;
}

export interface WishTitle {
  id: number;
  title: string;
  slug: string;
  items_count: number;
  created_at: string;
}

// FAQs
