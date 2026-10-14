import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

import DynamicSEO from "@/SEO/DynamicSEO";
import { Button, EmptyState, ErrorState, Skeleton, toast, Tooltip } from "@/components/ui";
import BlogCard from "@/features/blogs/components/BlogCard";
import BlogContent from "@/features/blogs/components/BlogContent";
import BlogProductCard from "@/features/blogs/components/BlogProductCard";
import BlogShareSheet from "@/features/blogs/components/BlogShareSheet";
import { estimateReadingMinutes } from "@/features/blogs/readingTime";
import { getBlog } from "@/services/blogs";
import type { BlogDetailResponse } from "@/types/blogs";

interface BlogDetailViewProps {
  initialBlog?: BlogDetailResponse | null;
  initialSlug?: string;
}

const BlogDetailView = ({ initialBlog, initialSlug }: BlogDetailViewProps) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const routeSlug = typeof router.query.slug === "string"
    ? router.query.slug
    : router.asPath.match(/^\/blogs\/([^/?#]+)/)?.[1];
  let slug = initialSlug || routeSlug || "";
  try { slug = decodeURIComponent(slug); } catch { slug = ""; }
  const { data: response, isLoading, mutate } = useSWR(
    slug ? ["blogs:detail", slug] : null,
    () => getBlog(slug),
    { fallbackData: initialSlug === slug ? initialBlog ?? undefined : undefined, revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  );
  const blog = response?.success ? response.data : null;
  const readingMinutes = blog?.content ? estimateReadingMinutes(blog.content) : null;
  const publishedDate = blog?.published_at
    ? new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long", day: "numeric" }).format(new Date(blog.published_at))
    : null;
  const description = blog?.seo?.description || blog?.short_description || undefined;
  const category = blog?.category ?? blog?.categories?.[0];

  const share = async () => {
    if (!blog) return;
    const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || window.location.origin;
    const url = new URL(`/blogs/${encodeURIComponent(blog.slug)}/`, publicOrigin).toString();
    setShareUrl(url);
    if (window.innerWidth >= 1024 || !navigator.share) {
      setShareOpen(true);
      return;
    }
    try {
      await navigator.share({ title: blog.title, text: blog.short_description ?? undefined, url });
      toast({ title: t("blogs.shared"), color: "success" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareOpen(true);
    }
  };

  return (
    <>
      <DynamicSEO
        title={blog?.seo?.title || blog?.title || t("blogs.title")}
        description={description}
        keywords={blog?.seo?.keywords?.filter(Boolean).join(", ")}
        author={blog?.author?.username}
        canonical={blog ? `/blogs/${encodeURIComponent(blog.slug)}/` : undefined}
        ogType="article"
        ogTitle={blog?.seo?.title || blog?.title}
        ogDescription={description}
        ogImage={blog?.image || undefined}
      />
      <main className="mx-auto w-full max-w-site px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <nav aria-label={t("blogs.breadcrumb")} className="mx-auto mb-8 flex max-w-4xl flex-wrap items-center gap-2 text-sm text-default-500">
          <Link href="/" className="hover:text-primary">{t("nav.home")}</Link>
          <Icon aria-hidden="true" icon="solar:alt-arrow-right-linear" className="size-4 rtl:rotate-180" />
          <Link href="/blogs/" className="hover:text-primary">{t("blogs.title")}</Link>
          {blog ? <><Icon aria-hidden="true" icon="solar:alt-arrow-right-linear" className="size-4 rtl:rotate-180" /><span aria-current="page" className="max-w-60 truncate text-foreground">{blog.title}</span></> : null}
        </nav>

        {isLoading && !response ? (
          <div aria-label={t("blogs.loading")} className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="aspect-[16/9] w-full rounded-large" />
            <Skeleton className="h-80 w-full rounded-large" />
          </div>
        ) : !response || (!response.success && response.message !== "Blog not found.") ? (
          <ErrorState title={t("blogs.errorTitle")} description={t("blogs.errorBody")}
            retryLabel={t("common.retry")} onRetry={() => void mutate()} />
        ) : !blog ? (
          <EmptyState
            icon={<Icon icon="solar:book-bookmark-linear" className="size-14" />}
            title={t("blogs.notFoundTitle")}
            description={t("blogs.notFoundBody")}
            actionLabel={t("blogs.backToBlogs")}
            onAction={() => void router.push("/blogs/")}
          />
        ) : (
          <>
            <article className="mx-auto max-w-4xl">
              <header className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {category ? (
                    <Link href={`/blogs/?category=${encodeURIComponent(category.slug)}`}
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-focus">
                      {category.name}
                    </Link>
                  ) : <span />}
                  <Tooltip content={t("blogs.share")}>
                    <Button aria-label={t("blogs.share")} variant="flat" size="sm" className="h-10 min-w-10 px-2 text-sm font-semibold sm:px-4" startContent={<Icon aria-hidden="true" icon="solar:share-linear" className="size-5" />} onPress={() => void share()}>
                      <span className="hidden sm:inline">{t("blogs.share")}</span>
                    </Button>
                  </Tooltip>
                </div>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">{blog.title}</h1>
                {blog.short_description ? <p className="mt-5 text-lg leading-8 text-default-600">{blog.short_description}</p> : null}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-default-600">
                  {blog.author?.photo_url ? (
                    <Image unoptimized alt="" src={blog.author.photo_url} width={36} height={36} className="size-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-content2"><Icon aria-hidden="true" icon="solar:user-linear" className="size-5" /></span>
                  )}
                  {blog.author?.username ? <span className="font-semibold text-foreground">{t("blogs.byAuthor", { name: blog.author.username })}</span> : null}
                  {publishedDate ? <span className="inline-flex items-center gap-1.5"><Icon aria-hidden="true" icon="solar:calendar-linear" className="size-4" /><time dateTime={blog.published_at ?? undefined}>{t("blogs.publishedOn", { date: publishedDate })}</time></span> : null}
                  {readingMinutes ? <span className="inline-flex items-center gap-1.5"><Icon aria-hidden="true" icon="solar:clock-circle-linear" className="size-4" />{t("blogs.readingTime", { count: readingMinutes })}</span> : null}
                  {typeof blog.views_count === "number" ? <span className="inline-flex items-center gap-1.5"><Icon aria-hidden="true" icon="solar:eye-linear" className="size-4" />{t("blogs.viewsCount", { count: blog.views_count })}</span> : null}
                </div>
              </header>

              {blog.image ? (
                <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-large bg-content2 shadow-sm">
                  <Image unoptimized fill priority alt={blog.title} sizes="(min-width: 1024px) 900px, 100vw" src={blog.image} className="object-cover" />
                </div>
              ) : null}
              <BlogContent html={blog.content || ""} />
              {blog.products?.length ? (
                <section id="blog-products" aria-labelledby="blog-products-heading" className="mt-12 rounded-large bg-content2 p-5 sm:p-7">
                  <div className="mb-5">
                    <h2 id="blog-products-heading" className="text-2xl font-bold text-foreground">{t("blogs.shopStory")}</h2>
                    <p className="mt-1 text-sm text-default-600">{t("blogs.shopStoryDescription")}</p>
                  </div>
                  <div className={clsx("grid gap-4", blog.products.length > 1 && "sm:grid-cols-2")}>
                    {blog.products.map((product) => <BlogProductCard key={product.id} product={product} />)}
                  </div>
                </section>
              ) : null}
              {blog.tags?.length ? (
                <ul aria-label={t("blogs.tags")} className="mt-8 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => <li key={tag} className="rounded-full bg-content2 px-3 py-1.5 text-xs font-semibold text-default-600">#{tag}</li>)}
                </ul>
              ) : null}
              <Link href="/blogs/" className="mt-10 inline-flex min-h-10 items-center gap-2 rounded-full bg-content2 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-100 focus-visible:outline-2 focus-visible:outline-focus">
                <Icon aria-hidden="true" icon="solar:arrow-left-linear" className="size-5 rtl:rotate-180" />
                {t("blogs.backToBlogs")}
              </Link>
            </article>

            {blog.related_blogs?.length ? (
              <section aria-labelledby="blog-related" className="mx-auto mt-16 max-w-4xl">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <h2 id="blog-related" className="text-2xl font-bold text-foreground">{t("blogs.related")}</h2>
                  <Link href="/blogs/" className="text-sm font-semibold text-primary hover:underline">{t("blogs.viewAll")}</Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 min-[1024px]:grid-cols-3">
                  {blog.related_blogs.slice(0, 3).map((item) => <BlogCard key={item.id} blog={item} />)}
                </div>
              </section>
            ) : null}
            <BlogShareSheet isOpen={shareOpen} onOpenChange={setShareOpen} title={blog.title} image={blog.image} url={shareUrl} />
          </>
        )}
      </main>
    </>
  );
};

export default BlogDetailView;
