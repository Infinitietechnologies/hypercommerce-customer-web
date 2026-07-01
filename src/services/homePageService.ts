import {
  getBrands,
  getCategories,
  getProducts,
  getSettings,
  getStores,
  getSubCategories,
} from "@/routes/api";
import {
  Brand,
  Category,
  Product,
  Settings,
  Store,
} from "@/types/ApiResponse";

export type HomePageData = {
  settings: Settings;
  categories: Category[];
  products: Product[];
  brands: Brand[];
  stores: Store[];
};

type HomePageParams = {
  access_token?: string;
  homeCategory?: string;
  market?: string;
};

/**
 * Centralized function to fetch all homepage data
 * Each API call is handled independently - if one fails, others continue
 * @param params - Optional parameters
 * @returns Promise<HomePageData> - Object containing all homepage data
 */
export const getHomePageData = async (
  params: HomePageParams = {}
): Promise<HomePageData> => {
  const { access_token = "", homeCategory = "", market } = params;

  // Initialize with default values
  let settings: Settings = {} as Settings;
  let categories: Category[] = [];
  let products: Product[] = [];
  let brands: Brand[] = [];
  let stores: Store[] = [];

  // Fetch settings (still needed for site config)
  try {
    const settingsResponse = await getSettings({ market });
    if (settingsResponse.success && settingsResponse.data) {
      settings = settingsResponse.data;
    } else {
      console.error(
        settingsResponse.message || "Invalid settings response data"
      );
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  // Fetch categories
  try {
    const isAllCategory = homeCategory === "all";

    const slug = isAllCategory || !homeCategory ? undefined : homeCategory;

    const categoriesResponse = await (isAllCategory
      ? getSubCategories({
          slug,
          filter: "top_category",
          market,
        })
      : getCategories({
          slug,
          market,
        }));

    if (categoriesResponse.success && categoriesResponse.data) {
      categories = categoriesResponse.data.data || [];
    } else {
      console.error(
        categoriesResponse.message || "Invalid categories response data"
      );
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }

  // Fetch brands
  try {
    const brandsResponse = await getBrands({
      scope_category_slug: homeCategory ? homeCategory : undefined,
      market,
    });
    if (brandsResponse.success && brandsResponse.data) {
      brands = brandsResponse.data.data || [];
    } else {
      console.error(brandsResponse.message || "Invalid brands response data");
    }
  } catch (error) {
    console.error("Failed to fetch brands:", error);
  }

  // Fetch products
  try {
    const productsResponse = await getProducts({
      access_token,
      market,
      include_child_categories: 0,
      categories: homeCategory
        ? homeCategory == "all"
          ? undefined
          : homeCategory
        : undefined,
    });
    if (productsResponse.success && productsResponse.data) {
      products = productsResponse.data.data || [];
    } else {
      console.error(
        productsResponse.message || "Invalid products response data"
      );
    }
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }

  // Fetch stores
  try {
    const storesResponse = await getStores({ market });
    if (storesResponse.success && storesResponse.data) {
      stores = storesResponse.data.data || [];
    } else {
      console.error(storesResponse.message || "Invalid stores response data");
    }
  } catch (error) {
    console.error("Failed to fetch stores:", error);
  }

  return {
    settings,
    categories,
    products,
    brands,
    stores,
  };
};
