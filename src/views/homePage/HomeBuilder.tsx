import { FC, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import { EmptyState, ErrorState } from "@/components/ui";
import HomeSectionRenderer from "@/components/Home/HomeSectionRenderer";
import HomeSectionSkeleton from "@/components/Skeletons/HomeSectionSkeleton";
import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import { getActiveCategory } from "@/helpers/getters";
import { getHomeLayout } from "@/routes/api";
import { HomeLayout, HomeSection } from "@/types/ApiResponse";

interface HomeBuilderProps {
  initialLayout: HomeLayout | null;
  omitFirstSection?: boolean;
}

const SECTIONS_PER_PAGE = 6;

/**
 * Server-driven home — renders the `/home-layout` builder sections in order,
 * each by type × style × config (HomeSectionRenderer). Sections stream in via
 * infinite scroll (first page server-rendered). Re-scopes to the active home
 * category and re-fetches on the shared category/location change events (hidden
 * `home-sections-refetch` button).
 */
const HomeBuilder: FC<HomeBuilderProps> = ({
  initialLayout,
  omitFirstSection = false,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [sections, setSections] = useState<HomeSection[]>(initialLayout?.sections ?? []);
  const [page, setPage] = useState<number>(initialLayout?.current_page ?? 1);
  const [lastPage, setLastPage] = useState<number>(initialLayout?.last_page ?? 1);
  const [loading, setLoading] = useState<boolean>(!initialLayout);
  const [failed, setFailed] = useState<boolean>(false);

  const fetchPage = useCallback(async (nextPage: number) => {
    const category_slug = getActiveCategory();
    const response = await getHomeLayout({
      category_slug,
      page: nextPage,
      per_page: SECTIONS_PER_PAGE,
    });
    return response.success ? response.data : null;
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    const data = await fetchPage(1);
    setFailed(!data);
    if (data) {
      setSections(data.sections);
      setPage(data.current_page);
      setLastPage(data.last_page);
    }
    setLoading(false);
  }, [fetchPage]);

  // Static-export builds have no SSR `initialLayout`, so the home sections are
  // never fetched until a category/location change fires the refetch button.
  // Fetch the first page on mount in that case so the home is populated by
  // default (matching the active "All"/category tab). No ref guard here: under
  // React Strict Mode the effect runs twice, and a ref guard would let the
  // cancelled first run skip setLoading(false) while the second run bails —
  // leaving the page stuck on the skeleton. The per-run `cancelled` closure
  // already keeps this correct (the surviving run resolves loading).
  useEffect(() => {
    if (initialLayout) return;
    let cancelled = false;
    // `loading` already starts true here (no initialLayout), so fetch directly
    // and only flip loading off once the request resolves — avoids a synchronous
    // setState inside the effect body.
    (async () => {
      const data = await fetchPage(1);
      if (cancelled) return;
      setFailed(!data);
      if (data) {
        setSections(data.sections);
        setPage(data.current_page);
        setLastPage(data.last_page);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLayout, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || page >= lastPage) return;
    setLoading(true);
    const data = await fetchPage(page + 1);
    if (data) {
      setSections((prev) => [...prev, ...data.sections]);
      setPage(data.current_page);
      setLastPage(data.last_page);
    }
    setLoading(false);
  }, [fetchPage, loading, page, lastPage]);

  return (
    <section className="w-full max-w-site mx-auto" id="home-builder">
      {/* Driven by onHomeCategoryChange / onLocationChange (helpers/events). */}
      <button className="hidden" id="home-sections-refetch" onClick={refetch} />

      {failed && sections.length === 0 && !loading ? (
        <ErrorState
          title={t("home.error.title", "We couldn't load the home page")}
          description={t("home.error.description", "Please try again in a moment.")}
          retryLabel={t("common.retry", "Retry")}
          onRetry={refetch}
        />
      ) : sections.length === 0 && !loading ? (
        <EmptyState
          actionLabel={t("home.empty.action", "Continue shopping")}
          description={t(
            "home.empty.description",
            "We're stocking this space with new products and offers. In the meantime, explore what's trending across the store.",
          )}
          icon={<Icon icon="solar:bag-smile-linear" className="text-5xl text-primary-600" />}
          title={t("home.empty.title", "Fresh finds on the way")}
          onAction={() => router.push("/products/search")}
        />
      ) : (
        <>
          {sections
            .filter((_, index) => !omitFirstSection || index > 0)
            .map((section) => (
              <HomeSectionRenderer key={section.id} section={section} />
            ))}
          <InfiniteSentinel hasMore={page < lastPage} isLoading={loading} onLoadMore={loadMore} />
          {loading ? <HomeSectionSkeleton /> : null}
        </>
      )}
    </section>
  );
};

export default HomeBuilder;
