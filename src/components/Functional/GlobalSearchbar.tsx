import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDisclosure } from "@/components/ui";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Product, PaginatedResponse } from "@/types/ApiResponse";
import { getProducts } from "@/routes/api";
import SearchModal from "../Modals/SearchModal";
import { useRouter } from "next/router";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import clsx from "clsx";

const DEBOUNCE_DELAY = 300;

const searchFetcher = async (
  key: string,
): Promise<PaginatedResponse<Product[]> | null> => {
  const [, query] = key.split(":");
  if (!query || query.trim().length < 2) return null;

  const response = await getProducts({
    search: query,
    page: 1,
    per_page: 8,
    include_child_categories: 0,
  });

  return response;
};

interface GlobalSearchBarProps {
  tone?: "light" | "dark" | "inherit";
  size?: "default" | "large";
  shape?: "pill" | "rounded";
  searchLabels?: string[];
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  tone = "light",
  size = "default",
  shape = "pill",
  searchLabels,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const { t } = useTranslation();
  const { homeGeneralSettings } = useSettings();
  const router = useRouter();

  const currentSearchLabels = useSelector(
    (state: RootState) => state.search.currentSearchLabels,
  );

  const placeholders = useMemo<string[]>(() => {
    // Priority 1: Header-selected home category labels.
    if (Array.isArray(searchLabels) && searchLabels.length > 0) {
      return searchLabels;
    }

    // Priority 2: Dynamic labels from other category views.
    if (Array.isArray(currentSearchLabels) && currentSearchLabels.length > 0) {
      return currentSearchLabels;
    }

    // Priority 3: Global settings labels.
    const SearchPlaceHolders = homeGeneralSettings?.searchLabels || [];
    if (Array.isArray(SearchPlaceHolders) && SearchPlaceHolders.length > 0) {
      return SearchPlaceHolders;
    }

    // Priority 4: Translation fallback.
    return [t("search_placeholder")];
  }, [currentSearchLabels, homeGeneralSettings?.searchLabels, searchLabels, t]);

  // === Animated placeholder state ===
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0);
  const [animationState, setAnimationState] = useState<
    "enter" | "stay" | "exit"
  >("enter");

  // Adjust state when placeholders change
  const [prevPlaceholders, setPrevPlaceholders] = useState(placeholders);

  if (placeholders !== prevPlaceholders) {
    setPrevPlaceholders(placeholders);
    setPlaceholderIndex(0);
    setAnimationState("enter");
  }

  // Animation sequence: enter → stay → exit
  useEffect(() => {
    if (!placeholders || placeholders.length <= 1) {
      setTimeout(() => {
        setAnimationState("stay");
      }, 0);
      return;
    }

    const enterDuration = 500; // Time to slide from bottom to center
    const stayDuration = 2000; // Time to stay in center
    const exitDuration = 500; // Time to slide from center to top

    // Start with enter animation
    setTimeout(() => {
      setAnimationState("enter");
    }, 0);

    const stayTimer = setTimeout(() => {
      setAnimationState("stay");
    }, enterDuration);

    const exitTimer = setTimeout(() => {
      setAnimationState("exit");
    }, enterDuration + stayDuration);

    const nextTimer = setTimeout(
      () => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setAnimationState("enter");
      },
      enterDuration + stayDuration + exitDuration,
    );

    return () => {
      clearTimeout(stayTimer);
      clearTimeout(exitTimer);
      clearTimeout(nextTimer);
    };
  }, [placeholderIndex, placeholders]);

  // === Search logic ===
  const { recentSearches, addSearch, removeSearch, clearAll } =
    useRecentSearches();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, DEBOUNCE_DELAY);
  const swrKey = debouncedSearchQuery.trim()
    ? `search:${debouncedSearchQuery}`
    : null;

  const {
    data: searchResponse,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKey, searchFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    errorRetryCount: 1,
  });

  const searchResults = useMemo<Product[]>(() => {
    if (
      !searchResponse?.success ||
      !searchResponse?.data?.data ||
      !Array.isArray(searchResponse.data.data)
    ) {
      return [];
    }
    return searchResponse.data.data;
  }, [searchResponse]);

  // Extract keywords from API response
  const searchKeywords = useMemo<string[]>(() => {
    if (
      searchResponse?.success &&
      Array.isArray(searchResponse?.data?.keywords)
    ) {
      return searchResponse.data.keywords;
    }
    return [];
  }, [searchResponse]);

  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsTyping(true);
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return;
    const timeout = setTimeout(() => setIsTyping(false), 0);
    return () => clearTimeout(timeout);
  }, [debouncedSearchQuery, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setIsTyping(false);
    mutate(undefined, false);
  }, [mutate]);

  const handleCloseSearchModal = useCallback(() => {
    onClose();
    handleClearSearch();
  }, [onClose, handleClearSearch]);

  const handleSearchSubmit = useCallback(
    (query: string = searchQuery) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length >= 2) {
        addSearch(trimmedQuery);
        if (trimmedQuery !== debouncedSearchQuery) {
          mutate(searchFetcher(`search:${trimmedQuery}`), false);
        }
        handleCloseSearchModal();
        router.push({
          pathname: "/products/search",
          query: { q: trimmedQuery },
        });
      }
    },
    [
      searchQuery,
      addSearch,
      debouncedSearchQuery,
      mutate,
      router,
      handleCloseSearchModal,
    ],
  );

  const handleProductClick = useCallback(
    (product: Product) => {
      router.push(`/products/${product.slug}`);
      onClose();
      handleClearSearch();
    },
    [onClose, router, handleClearSearch],
  );

  const handleChipClick = useCallback(
    (searchTerm: string) => {
      setSearchQuery(searchTerm);
      handleSearchSubmit(searchTerm);
    },
    [handleSearchSubmit],
  );

  const handleRemoveSearch = useCallback(
    (searchTerm: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeSearch(searchTerm);
    },
    [removeSearch],
  );

  const formatDeliveryTime = useCallback((time: number | null) => {
    return !time ? "N/A" : `${time} min`;
  }, []);

  const getOpacity = () => {
    return animationState === "stay" ? 1 : 0;
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className={clsx(
          "relative flex w-full cursor-pointer items-center gap-2 border px-4 transition-colors",
          size === "large" ? "h-12" : "h-10",
          shape === "rounded"
            ? "rounded-small"
            : size === "large"
              ? "rounded-medium"
              : "rounded-full",
          tone === "light"
            ? "border-white/10 bg-white/10"
            : tone === "inherit"
              ? "border-divider bg-white/90 text-current"
              : "border-divider bg-content1/90",
        )}
      >
        <Icon
          icon="solar:magnifer-linear"
          className={clsx(
            "shrink-0 text-lg",
            tone === "light"
              ? "text-white/70"
              : "text-default-500/75",
          )}
        />

        <div className="relative flex-1 min-w-0 h-5 overflow-hidden pointer-events-none">
          <span
            key={placeholderIndex}
            className={clsx(
              "absolute inset-0 truncate text-sm font-normal leading-5 transition-all duration-600 ease-in-out",
              tone === "light"
                ? "text-white/60"
                : "text-default-500/75",
            )}
            style={{
              transform: `translateY(${animationState === "enter" ? "20px" : animationState === "exit" ? "-20px" : "0px"})`,
              opacity: getOpacity(),
            }}
          >
            {String(placeholders?.[placeholderIndex] ?? "")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) || "Search"}
          </span>
        </div>

        <button
          title={t("userLayout.shoppingList")}
          onClick={(e) => {
            e.stopPropagation();
            router.push("/shopping-list");
          }}
          aria-label={t("userLayout.shoppingList")}
          className={clsx(
            "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent transition-colors",
            tone === "light"
              ? "text-white/70 hover:bg-white/10 hover:text-white"
              : "text-default-500/75 hover:bg-content2 hover:text-default-600",
          )}
        >
          <Icon icon="solar:clipboard-text-linear" className="text-xl" />
        </button>
      </div>

      <SearchModal
        isOpen={isOpen}
        isTyping={isTyping}
        onClose={handleCloseSearchModal}
        searchQuery={searchQuery}
        searchResults={searchResults}
        keywords={searchKeywords}
        isLoading={isLoading}
        hasError={!!error}
        recentSearches={recentSearches}
        handleClearSearch={handleClearSearch}
        handleInputChange={handleInputChange}
        handleSearchSubmit={handleSearchSubmit}
        handleProductClick={handleProductClick}
        handleChipClick={handleChipClick}
        handleRemoveSearch={handleRemoveSearch}
        handleClearAllSearches={clearAll}
        formatDeliveryTime={formatDeliveryTime}
      />
    </>
  );
};

export default GlobalSearchBar;
