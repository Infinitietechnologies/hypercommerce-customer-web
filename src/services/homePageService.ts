import { getHomeLayout, getSettings, getStores } from "@/routes/api";
import { HomeLayout, Settings, Store } from "@/types/ApiResponse";

export type HomePageData = {
  settings: Settings;
  homeLayout: HomeLayout | null;
  stores: Store[];
};

type HomePageParams = {
  access_token?: string;
  homeCategory?: string;
};

/**
 * Centralized function to fetch all homepage data (hypercommerce model).
 * - Settings provide site config + active market.
 * - /home-layout returns the ordered sections (hero/banners/products/
 *   categories/brands) with their content already resolved.
 * - Stores are not a home-layout section type, so they are fetched standalone.
 *
 * Each call is independent — if one fails, the others still resolve.
 * No location gate: market is auto-detected server-side.
 */
export const getHomePageData = async (
  params: HomePageParams = {},
): Promise<HomePageData> => {
  const { homeCategory = "" } = params;

  let settings: Settings = {} as Settings;
  let homeLayout: HomeLayout | null = null;
  let stores: Store[] = [];

  // Settings (site config + market)
  try {
    const settingsResponse = await getSettings();
    if (settingsResponse.success && settingsResponse.data) {
      settings = settingsResponse.data;
    } else {
      console.error(
        settingsResponse.message || "Invalid settings response data",
      );
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  // Home layout (ordered sections)
  try {
    const isAllCategory = homeCategory === "all";
    const category_slug =
      isAllCategory || !homeCategory ? undefined : homeCategory;

    const homeLayoutResponse = await getHomeLayout({ category_slug });
    if (homeLayoutResponse.success && homeLayoutResponse.data) {
      homeLayout = homeLayoutResponse.data;
    } else {
      console.error(
        homeLayoutResponse.message || "Invalid home layout response data",
      );
    }
  } catch (error) {
    console.error("Failed to fetch home layout:", error);
  }

  // Stores rail (standalone — not a home-layout section type)
  try {
    const storesResponse = await getStores();
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
    homeLayout,
    stores,
  };
};
