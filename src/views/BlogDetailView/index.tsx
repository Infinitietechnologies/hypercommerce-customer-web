import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

import DynamicSEO from "@/SEO/DynamicSEO";
import { Button, EmptyState, ErrorState, Skeleton, toast } from "@/components/ui";
import BlogCard from "@/features/blogs/components/BlogCard";
import BlogContent from "@/features/blogs/components/BlogContent";
import { getBlog } from "@/services/blogs";
import type { BlogDetailResponse } from "@/types/blogs";

interface BlogDetailViewProps {
  initialBlog?: BlogDetailResponse | null;
  initialSlug?: string;
}

const BlogDetailView = ({ initialBlog, initialSlug }: BlogDetailViewProps) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
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
  const publishedDate = blog?.published_at
    ? new Intl.DateTimeFormat(i18n.language, { year: "numeric", month: "long", day: "numeric" }).format(new Date(blog.published_at))
    : null;
  const description = blog?.seo?.description || blog?.short_description || undefined;

  const share = async () => {
    if (!blog) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, url: window.location.href });
        toast({ title: t("blogs.shared"), color: "success" });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: t("blogs.linkCopied"), color: "success" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ title: t("blogs.shareFailed"), color: "danger" });
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
        <nav aria-label={t("blogs.breadcrumb")} className="mb-8 flex flex-wrap items-center gap-2 text-sm text-default-500">
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
                {blog.category ? (
                  <Link href={`/blogs/?category=${encodeURIComponent(blog.category.slug)}`}
                    className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-600 hover:bg-primary-200">
                    {blog.category.name}
                  </Link>
                ) : null}
                <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">{blog.title}</h1>
                {blog.short_description ? <p className="mt-5 text-lg leading-8 text-default-600">{blog.short_description}</p> : null}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-divider pb-6">
                  <div className="flex items-center gap-3 text-sm text-default-600">
                    {blog.author?.photo_url ? (
                      <Image unoptimized alt="" src={blog.author.photo_url} width={40} height={40} className="size-10 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-10 place-items-center rounded-full bg-content2"><Icon aria-hidden="true" icon="solar:user-linear" className="size-5" /></span>
                    )}
                    <div>
                      {blog.author?.username ? <p className="font-semibold text-foreground">{blog.author.username}</p> : null}
                      {publishedDate ? <time dateTime={blog.published_at ?? undefined}>{publishedDate}</time> : null}
                    </div>
                  </div>
                  <Button variant="bordered" size="sm" className="h-10 px-4 text-sm font-semibold" startContent={<Icon aria-hidden="true" icon="solar:share-linear" className="size-5" />} onPress={() => void share()}>
                    {t("blogs.share")}
                  </Button>
                </div>
              </header>

              {blog.image ? (
                <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-large bg-content2 shadow-sm">
                  <Image unoptimized fill priority alt={blog.title} sizes="(min-width: 1024px) 900px, 100vw" src={blog.image} className="object-cover" />
                </div>
              ) : null}
              <BlogContent html={blog.content || ""} />
              {blog.tags?.length ? (
                <ul aria-label={t("blogs.tags")} className="mt-9 flex flex-wrap gap-2 border-t border-divider pt-6">
                  {blog.tags.map((tag) => <li key={tag} className="rounded-full bg-content2 px-3 py-1.5 text-xs font-semibold text-default-600">#{tag}</li>)}
                </ul>
              ) : null}
              <Link href="/blogs/" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Icon aria-hidden="true" icon="solar:arrow-left-linear" className="size-5 rtl:rotate-180" />
                {t("blogs.backToBlogs")}
              </Link>
            </article>

            {blog.linked_products?.length ? (
              <section aria-labelledby="blog-products" className="mt-16 border-t border-divider pt-10">
                <div className="mb-5">
                  <h2 id="blog-products" className="text-2xl font-bold text-foreground">{t("blogs.shopStory")}</h2>
                  <p className="mt-1 text-sm text-default-600">{t("blogs.shopStoryDescription")}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 min-[1024px]:grid-cols-3">
                  {blog.linked_products.map((product) => (
                    <Link key={product.id} href={`/products/${encodeURIComponent(product.slug)}/`}
                      className="group flex items-center gap-4 rounded-large border border-divider bg-content1 p-3 shadow-sm hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-focus">
                      <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-medium bg-content2">
                        {product.main_image ? <Image unoptimized fill alt="" src={product.main_image} sizes="80px" className="object-cover" /> : <Icon aria-hidden="true" icon="solar:bag-linear" className="size-7 text-default-400" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold text-foreground">{product.title}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">{t("blogs.viewProduct")} <Icon aria-hidden="true" icon="solar:arrow-right-linear" className="size-4 rtl:rotate-180" /></span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {blog.related_blogs?.length ? (
              <section aria-labelledby="blog-related" className="mt-16 border-t border-divider pt-10">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <h2 id="blog-related" className="text-2xl font-bold text-foreground">{t("blogs.related")}</h2>
                  <Link href="/blogs/" className="text-sm font-semibold text-primary hover:underline">{t("blogs.viewAll")}</Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 min-[1024px]:grid-cols-3">
                  {blog.related_blogs.slice(0, 3).map((item) => <BlogCard key={item.id} blog={item} />)}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </>
  );
};

export default BlogDetailView;
