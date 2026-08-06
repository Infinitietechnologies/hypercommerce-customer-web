import { isMarketScopedKey } from "@/helpers/market";
import { store } from "@/lib/redux/store";
import { updateCartData } from "./updators";
import { getCookie, setCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { clearRecentlyViewed } from "@/lib/redux/slices/recentlyViewedSlice";
import { mutate } from "swr";

export const onLocationChange = () => {
  if (typeof window === "undefined") return;

  // Clear recently viewed products when location changes
  store.dispatch(clearRecentlyViewed());

  const pathButtonMap: Record<string, string[]> = {
    "/": [
      "home-products-refetch",
      "home-sections-refetch",
      "home-stores-refetch",
      "home-banners-refetch",
      "home-brands-refetch",
      "home-categories-refetch",
      "home-category-tabs",
    ],
    "/stores": ["refetch-store-page"],
    "/cart": ["refetch-cart-page", "refetch-similar-products"],
    "/categories": ["refetch-categories-page"],
    "/shopping-list": ["shopping-list-refetch"],
    "/brands": ["refetch-brands-page"],
  };

  const normalizePath = (path: string) =>
    path !== "/" ? path.replace(/\/+$/, "") : "/";

  const currentPath = normalizePath(window.location.pathname);

  let buttonIds: string[] = [];

  if (currentPath === "/products/search") {
    // Search listing (must come before the /products/ PDP check below).
    // sidebar-filters-refetch → market-scoped ProductFilter counts.
    buttonIds = ["search-products-refetch", "sidebar-filters-refetch"];
  } else if (
    currentPath.startsWith("/products/") ||
    currentPath.startsWith("/share/products/")
  ) {
    buttonIds = ["similar-products-refetch", "specific-product-refetch"];
  } else if (currentPath.startsWith("/brands/")) {
    buttonIds = ["refetch-brand-products", "sidebar-filters-refetch"];
  } else if (currentPath.startsWith("/categories/")) {
    buttonIds = ["category-products-refetch", "sidebar-filters-refetch"];
  } else if (currentPath.startsWith("/stores/")) {
    buttonIds = ["refetch-store-products", "sidebar-filters-refetch"];
  } else {
    // Handle exact matches
    buttonIds = pathButtonMap[currentPath] || [];
  }

  buttonIds.forEach((id) => document.getElementById(id)?.click?.());

  // A location/market change moves prices, availability and delivery ETAs, so
  // every market-scoped key is dropped. Manual-fetch views (e.g. HomeBuilder)
  // are covered by the button clicks above; SWR dedupes any overlap.
  mutate(isMarketScopedKey, undefined, { revalidate: true });

  updateCartData(false, false, 0, false);
};

export const onAppLoad = () => {
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  // 1. Check for location in URL params (deep link support)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLat = urlParams.get("lat");
    const urlLng = urlParams.get("lng");

    if (urlLat && urlLng) {
      const currentUserLocation = getCookie("userLocation");
      if (!currentUserLocation) {
        const newUserLocation: UserLocation = {
          lat: parseFloat(urlLat),
          lng: parseFloat(urlLng),
          placeName: "Shared Location",
          placeDescription: "",
        };
        setCookie("userLocation", newUserLocation);
        // Location changed via URL, trigger refetch for current page components
        onLocationChange();
      }
    }
  }

  if (store.getState().auth.isLoggedIn) {
    if (path !== "/cart" && path !== "/cart/") {
      updateCartData(true, false);
    }
  }

  // Location bootstrap (default-market fallback, or the client's location when
  // already permitted) is handled silently by LocationSelector on mount, so we
  // no longer nag the shopper with a "select location" toast/modal here.
};

export const onHomeCategoryChange = () => {
  if (typeof window === "undefined") return;

  const pathButtonMap: Record<string, string[]> = {
    "/": [
      "home-banners-refetch",
      "home-brands-refetch",
      "home-categories-refetch",
      "home-products-refetch",
      "home-sections-refetch",
    ],
  };

  const normalizePath = (path: string) =>
    path !== "/" ? path.replace(/\/+$/, "") : "/";

  const currentPath = normalizePath(window.location.pathname);

  let buttonIds: string[] = [];

  buttonIds = pathButtonMap[currentPath] || [];

  buttonIds.forEach((id) => document.getElementById(id)?.click?.());
};
