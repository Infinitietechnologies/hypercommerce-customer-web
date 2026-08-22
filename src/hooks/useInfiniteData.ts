import { isSSR } from "@/helpers/getters";
import { useCallback, useEffect, useRef, useState , useMemo } from "react";
import useSWR from "swr";
import { getCookie } from "@/lib/cookies";

/** Stale times from CLAUDE.md 7.3, in ms. */
export const STALE_TIME = {
  list: 2 * 60 * 1000,
  detail: 5 * 60 * 1000,
  reference: 30 * 60 * 1000,
};

interface UseInfiniteDataProps<T> {
  fetcher: (params: {
    page: number;
    per_page: number;
    [key: string]: any;
  }) => Promise<any>;

  perPage?: number;
  initialData?: T[];
  initialTotal?: number;
  extraParams?: {
    [key: string]: any;
  };
  forceFetchOnMount?: boolean;
  dataKey?: string | null;
  enabled?: boolean;
  /** SWR dedupingInterval in ms — set per CLAUDE.md 7.3 volatility table. */
  staleTime?: number;
}

export const useInfiniteData = <T>({
  fetcher,
  perPage = 24,
  initialData = [],
  initialTotal = 0,
  extraParams = {},
  forceFetchOnMount = false,
  dataKey = null,
  enabled = true,
  staleTime = STALE_TIME.list,
}: UseInfiniteDataProps<T>) => {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialData.length < initialTotal);

  // Add this state to track if we're in the initial sync phase
  const [isSyncing, setIsSyncing] = useState(!isSSR() && enabled);

  const isLoadingRef = useRef(false);
  const currentPageRef = useRef(1);
  const extraParamsRef = useRef(extraParams);

  useEffect(() => {
    extraParamsRef.current = extraParams;
  }, [extraParams]);

  const serializedParams = useMemo(
    () => JSON.stringify(extraParams),
    [extraParams],
  );

  // The market travels as a header, so it must be part of the key too —
  // otherwise two markets share one cache entry for the same listing.
  const market = (getCookie<string>("market") as string) || "";

  const swrKey = enabled
    ? dataKey
      ? [`/infinite-data-${dataKey}`, serializedParams, market]
      : ["/infinite-data", serializedParams, market]
    : null;

  const {
    data: swrResponse,
    isLoading: isInitialLoading,
    isValidating,
    error,
    mutate,
  } = useSWR(
    swrKey,
    async ([, params]: [string, string, string]) => {
      const currentParams = JSON.parse(params);
      // hypercommerce: no location gate. Market is auto-detected server-side
      // (X-Market header / market cookie), so we never block on lat/lng.
      const res = await fetcher({
        page: 1,
        per_page: perPage,
        ...currentParams,
      });
      if (res.success) {
        return res.data;
      }
      // Must throw: returning a value here records a success and leaves `error`
      // empty, so a failed request renders as a genuine empty result.
      throw new Error(res.message || "Failed to fetch initial data");
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: forceFetchOnMount ? forceFetchOnMount : !isSSR(),
      errorRetryCount: 2,
      dedupingInterval: staleTime,
    },
  );

  useEffect(() => {
    if (swrResponse || error) {
      if (swrResponse) {
        const items = swrResponse?.data || [];
        const totalItems = swrResponse?.total || 0;
        setData(items);
        setTotal(totalItems);
        setHasMore(items.length < totalItems);
        setPage(1);
        currentPageRef.current = 1;
        isLoadingRef.current = false;
      }
      setIsSyncing(false);
    }
  }, [swrResponse, error]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) {
      return;
    }

    const nextPage = page + 1;

    if (currentPageRef.current >= nextPage) {
      return;
    }

    setIsLoadingMore(true);
    isLoadingRef.current = true;
    currentPageRef.current = nextPage;

    try {
      const res = await fetcher({
        page: nextPage,
        per_page: perPage,
        ...extraParamsRef.current,
      });

      if (res.success) {
        const newItems = res.data?.data || [];
        const newTotal = res.data?.total || 0;

        setData((prev) => [...prev, ...newItems]);
        setPage(nextPage);
        setTotal(newTotal);
        setHasMore(data.length + newItems.length < newTotal);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more failed", error);
      setHasMore(false);
      currentPageRef.current = page;
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [page, perPage, hasMore, fetcher, data.length]);

  const refetch = useCallback(async () => {
    setPage(1);
    currentPageRef.current = 1;
    isLoadingRef.current = false;
    setIsLoadingMore(false);
    setIsSyncing(true);

    try {
      await mutate();
    } finally {
      setIsSyncing(false);
    }
  }, [mutate]);

  return {
    data,
    isLoading: isInitialLoading || isSyncing, // Combine both states
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    error,
    refetch,
    isValidating,
    rawResponse: swrResponse,
  };
};
