import { getProductBySlug, getProducts, getSettings } from "@/routes/api";
import { Product, Settings } from "@/types/ApiResponse";

/**
 * Input parameters for fetching product detail page data
 */
export interface ProductDetailPageParams {
  slug: string;
  access_token: string;
  PER_PAGE?: number | string;
  market?: string;
}

/**
 * Output of fetchProductDetailPageData function
 */
/** Narrow an API payload to a real product, rejecting the `[]` not-found shape. */
const asProduct = (data: unknown): Product | null =>
  data && !Array.isArray(data) && typeof data === "object" && "id" in data
    ? (data as Product)
    : null;

export interface ProductDetailPageData {
  initialProduct: Product | null; // replace `any` with your Product type
  initialSimilarProducts: Product[]; // replace `any` with your Product type
  initialSettings: Settings | null; // replace `any` with your Settings type
  errors: {
    productDetail: string | null;
    similarProducts: string | null;
    settings: string | null;
  };
}

/**
 * Fetches product detail page data concurrently:
 * - Product detail
 * - Similar products
 * - App settings
 *
 * Uses Promise.allSettled to ensure failure of one API does not block others.
 *
 * @param {ProductDetailPageParams} params - Input parameters including slug, access_token
 * @returns {Promise<ProductDetailPageData>} - The fetched data and any errors
 */
export async function fetchProductDetailPageData(
  params: ProductDetailPageParams
): Promise<ProductDetailPageData> {
  const { slug, access_token, PER_PAGE = 20, market } = params;

  console.log("========== PRODUCT DETAIL FETCH ==========");
  console.log("Slug:", slug);

  // Concurrent API calls
  const [productDetailResult, similarProductsResult, settingsResult] =
    await Promise.allSettled([
      getProductBySlug({
        slug,
        access_token,
        market,
      }),
      getProducts({
        exclude_product: slug,
        per_page: PER_PAGE,
        access_token,
        market,
        include_child_categories: 0,
      }),
      getSettings({ market }),
    ]);

  console.log(
    "Product Detail Status:",
    productDetailResult.status
  );

  if (productDetailResult.status === "fulfilled") {
    console.log(
      "Fetched Product:",
      productDetailResult.value?.data
    );

    console.log(
      "Fetched Product Slug:",
      productDetailResult.value?.data?.slug
    );

   console.log(
  "Fetched Product Full:",
  JSON.stringify(productDetailResult.value?.data, null, 2)
);
  } else {
    console.error(
      "Product Fetch Failed:",
      productDetailResult.reason
    );
  }

  return {
    // A missing product comes back as success:false with `data: []`, and an
    // empty array is truthy — so `?? null` alone would hand the page an "empty
    // product" and the 404 branch would never fire.
    initialProduct:
      productDetailResult.status === "fulfilled"
        ? (asProduct(productDetailResult.value.data) ?? null)
        : null,

    initialSimilarProducts:
      similarProductsResult.status === "fulfilled"
        ? (similarProductsResult.value.data?.data ?? [])
        : [],

    initialSettings:
      settingsResult.status === "fulfilled"
        ? (settingsResult.value.data ?? null)
        : null,

    errors: {
      productDetail:
        productDetailResult.status === "rejected"
          ? productDetailResult.reason?.message ||
            "Failed to fetch product detail"
          : null,
      similarProducts:
        similarProductsResult.status === "rejected"
          ? similarProductsResult.reason?.message ||
            "Failed to fetch similar products"
          : null,
      settings:
        settingsResult.status === "rejected"
          ? settingsResult.reason?.message ||
            "Failed to fetch settings"
          : null,
    },
  };
}
