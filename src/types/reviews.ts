export interface ProductReviews {
  total_reviews: number;
  average_rating: string;
  ratings_breakdown: RatingsBreakdown;
  reviews: Review[];
}

export interface RatingsBreakdown {
  "1_star": string;
  "2_star": string;
  "3_star": string;
  "4_star": string;
  "5_star": string;
}

export interface Review {
  id: number;
  product_id: number;
  rating: number;
  title: string;
  slug: string;
  comment: string;
  review_images: string[];
  user: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface SellerReview {
  id: number;
  user_id: number;
  seller_id: number;
  order_id: number;
  rating: number;
  title: string;
  slug: string;
  description: string;
  user: {
    id: number;
    name: string;
  };
  seller: {
    id: number;
    name: string;
  };
  order: {
    id: number;
    order_number: string | null;
  };
  created_at: string; // or Date if you convert later
  updated_at: string; // or Date if you convert later
}

export interface ProductFaq {
  id: number;
  product_id: number;
  product_slug: string;
  product: {
    id: number;
    title: string;
    slug: string;
  };
  question: string;
  answer: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// Orders Type

/** Shopper-facing derived status (read-only tracker headline). */

export type SellerFeedbackItem = {
  seller_id: number;
  is_feedback_given: boolean;
  feedback: {
    id: number;
    user_id: number;
    seller_id: number;
    order_id: number;
    rating: number;
    title: string;
    slug: string;
    description: string;
    created_at: string;
    updated_at: string;
  } | null;
};
