import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

import DynamicSEO from "@/SEO/DynamicSEO";
import { Divider, EmptyState, ErrorState, Pagination, Skeleton } from "@/components/ui";
import BlogCard from "@/features/blogs/components/BlogCard";
import BlogSearch from "@/features/blogs/components/BlogSearch";
import { getBlogCategories, getBlogs } from "@/services/blogs";
import type { BlogCategory, BlogListResponse } from "@/types/blogs";

interface BlogsViewProps {
  initialBlogs?: BlogListResponse | null;
  initialCategories?: BlogCategory[] | null;
  initialQuery?: { page: number; search: string; category: string };
}

const PER_PAGE = 9;
const topicButtonClasses = (selected: boolean) => clsx(
  "min-h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  selected
    ? "bg-primary text-primary-foreground hover:bg-primary-600"
    : "bg-content2 text-default-700 hover:bg-primary-100 hover:text-primary-600",
);

const BlogsView = ({ initialBlogs, initialCategories, initialQuery }: BlogsViewProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const search = typeof router.query.search === "string" ? router.query.search : "";
  const category = typeof router.query.category === "string" ? router.query.category : "";
  const page = Math.max(1, Number(router.query.page) || 1);
  const matchesInitialQuery = initialQuery?.page === page
    && initialQuery.search === search
    && initialQuery.category === category;

  const { data: blogs, isLoading, mutate } = useSWR(
    ["blogs:list", page, search, category],
    () => getBlogs({ page, per_page: PER_PAGE, search: search || undefined, category_slug: category || undefined }),
    { fallbackData: matchesInitialQuery ? initialBlogs ?? undefined : undefined, revalidateOnFocus: false, dedupingInterval: 30_000 },
  );
  const { data: categories } = useSWR("blogs:categories", getBlogCategories, {
    fallbackData: initialCategories ?? undefined,
    revalidateOnFocus: false,
    dedupingInterval: 30 * 60_000,
  });

  const updateQuery = useCallback((next: { search?: string; category?: string; page?: number }) => {
    const nextSearch = next.search ?? search;
    const nextCategory = next.category ?? category;
    const nextPage = next.page ?? 1;
    void router.push({
      pathname: "/blogs",
      query: {
        ...(nextSearch ? { search: nextSearch } : {}),
        ...(nextCategory ? { category: nextCategory } : {}),
        ...(nextPage > 1 ? { page: nextPage } : {}),
      },
    }, undefined, { shallow: true, scroll: true });
  }, [router, search, category]);

  const list = blogs?.data;
  const hasFilters = Boolean(search || category);
  const featured = !hasFilters && page === 1 && list?.total
    ? list.data[0]
    : null;
  const cards = list?.data.filter((blog) => blog.slug !== featured?.slug) ?? [];

  return (
    <>
      <DynamicSEO
        title={t("blogs.title")}
        description={t("blogs.description")}
        canonical="/blogs/"
        ogType="website"
      />
      <main className="mx-auto w-full max-w-site px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <nav aria-label={t("blogs.breadcrumb")} className="mb-8 flex items-center gap-2 text-sm text-default-500">
          <Link href="/" className="hover:text-primary">{t("nav.home")}</Link>
          <Icon aria-hidden="true" icon="solar:alt-arrow-right-linear" className="size-4 rtl:rotate-180" />
          <span aria-current="page" className="text-foreground">{t("blogs.title")}</span>
        </nav>

        <header className="max-w-3xl pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{t("blogs.title")}</h1>
          <p className="mt-4 text-base leading-7 text-default-600">{t("blogs.description")}</p>
        </header>
        <Divider className="bg-divider" />

        <div className="flex flex-col gap-5 py-6 min-[1024px]:flex-row min-[1024px]:items-center min-[1024px]:justify-between">
          <div role="group" aria-label={t("blogs.topics")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button type="button" aria-pressed={!category} onClick={() => updateQuery({ category: "" })}
              className={topicButtonClasses(!category)}>
              {t("blogs.allStories")}
            </button>
            {(categories ?? []).filter((item) => (item.blogs_count ?? 1) > 0).map((item) => (
              <button key={item.id} type="button" aria-pressed={category === item.slug}
                onClick={() => updateQuery({ category: item.slug })}
                className={topicButtonClasses(category === item.slug)}>
                {item.name}
              </button>
            ))}
          </div>
          <BlogSearch key={search} value={search} onSearch={(value) => updateQuery({ search: value, page: 1 })} />
        </div>
        <Divider className="mb-8 bg-divider" />

        {isLoading && !list ? (
          <div className="space-y-6" aria-label={t("blogs.loading")}>
            <Skeleton className="h-72 w-full rounded-large" />
            <div className="grid gap-6 sm:grid-cols-2 min-[1024px]:grid-cols-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 rounded-large" />)}
            </div>
          </div>
        ) : !blogs?.success || !list ? (
          <ErrorState title={t("blogs.errorTitle")} description={t("blogs.errorBody")}
            retryLabel={t("common.retry")} onRetry={() => void mutate()} />
        ) : list.total === 0 ? (
          <EmptyState
            icon={<Icon icon="solar:book-bookmark-linear" className="size-14" />}
            title={t(hasFilters ? "blogs.noResultsTitle" : "blogs.emptyTitle")}
            description={t(hasFilters ? "blogs.noResultsBody" : "blogs.emptyBody")}
            actionLabel={hasFilters ? t("blogs.clearFilters") : t("blogs.shopNow")}
            onAction={() => hasFilters ? updateQuery({ search: "", category: "" }) : void router.push("/categories")}
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-default-600">{t("blogs.storyCount", { count: list.total })}</p>
            {featured ? <section aria-label={t("blogs.featured")} className="mb-10"><BlogCard blog={featured} featured /></section> : null}
            {cards.length > 0 ? (
              <section aria-labelledby="blog-list-heading">
                {featured ? <Divider className="mb-8 bg-divider" /> : null}
                <h2 id="blog-list-heading" className="mb-5 text-2xl font-bold text-foreground">{t(featured ? "blogs.latest" : "blogs.results")}</h2>
                <div className="grid gap-6 sm:grid-cols-2 min-[1024px]:grid-cols-3">
                  {cards.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
                </div>
              </section>
            ) : null}
            {list.last_page > 1 ? (
              <div className="mt-12 flex justify-center">
                <Pagination page={page} total={list.last_page} showControls onChange={(nextPage) => updateQuery({ page: nextPage })} />
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
};

export default BlogsView;
