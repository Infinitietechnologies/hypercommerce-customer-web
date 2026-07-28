import { FC, useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import { EmptyState } from "@/components/ui";
import HomeSectionRenderer from "@/components/Home/HomeSectionRenderer";
import HomeSectionSkeleton from "@/components/Skeletons/HomeSectionSkeleton";
import InfiniteSentinel from "@/components/Functional/InfiniteSentinel";
import { getActiveCategory } from "@/helpers/getters";
import { getHomeLayout } from "@/routes/api";
import { HomeLayout, HomeSection } from "@/types/ApiResponse";

interface HomeBuilderProps {
  initialLayout: HomeLayout | null;
}

const SECTIONS_PER_PAGE = 6;

/**
 * Server-driven home — renders the `/home-layout` builder sections in order,
 * each by type × style × config (HomeSectionRenderer). Sections stream in via
 * infinite scroll (first page server-rendered). Re-scopes to the active home
 * category and re-fetches on the shared category/location change events (hidden
 * `home-sections-refetch` button).
 */
const HomeBuilder: FC<HomeBuilderProps> = ({ initialLayout }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [sections, setSections] = useState<HomeSection[]>(initialLayout?.sections ?? []);
  const [page, setPage] = useState<number>(initialLayout?.current_page ?? 1);
  const [lastPage, setLastPage] = useState<number>(initialLayout?.last_page ?? 1);
  const [loading, setLoading] = useState(false);

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
    if (data) {
      setSections(data.sections);
      setPage(data.current_page);
      setLastPage(data.last_page);
    }
    setLoading(false);
  }, [fetchPage]);

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
    <section className="w-full max-w-site mx-auto px-3 sm:px-6 py-4 sm:py-6" id="home-builder">
      {/* Driven by onHomeCategoryChange / onLocationChange (helpers/events). */}
      <button className="hidden" id="home-sections-refetch" onClick={refetch} />

      {sections.length === 0 && !loading ? (
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
          {sections.map((section) => (
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
