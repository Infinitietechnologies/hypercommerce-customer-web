import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

import { estimateReadingMinutes } from "@/features/blogs/readingTime";
import { getBlog } from "@/services/blogs";
import type { BlogSummary } from "@/types/blogs";

interface BlogCardProps {
  blog: BlogSummary;
  featured?: boolean;
}

const BlogCard = ({ blog, featured = false }: BlogCardProps) => {
  const { t, i18n } = useTranslation();
  const { data: detail, isLoading: isReadingTimeLoading } = useSWR(
    typeof blog.reading_minutes === "number" ? null : ["blogs:detail", blog.slug],
    async () => {
      const response = await getBlog(blog.slug);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60_000,
      errorRetryCount: 2,
    },
  );
  const readingMinutes = blog.reading_minutes ?? (
    detail?.success && detail.data?.content
      ? estimateReadingMinutes(detail.data.content)
      : null
  );
  const category = blog.category ?? blog.categories?.[0];
  const publishedDate = blog.published_at
    ? new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(blog.published_at))
    : null;

  return (
    <Link
      href={`/blogs/${encodeURIComponent(blog.slug)}/`}
      className={clsx("group flex h-full cursor-pointer flex-col overflow-hidden rounded-large border border-divider bg-content1 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus", featured && "min-[1024px]:grid min-[1024px]:grid-cols-2")}
    >
      <div className={clsx("relative aspect-[16/10] overflow-hidden bg-content2", featured && "min-[1024px]:aspect-auto min-[1024px]:min-h-80")}>
        {blog.image ? (
          <Image
            unoptimized
            fill
            priority={featured}
            loading={featured ? "eager" : "lazy"}
            alt=""
            className="object-cover"
            sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            src={blog.image}
          />
        ) : (
          <Icon
            aria-hidden="true"
            icon="solar:book-bookmark-linear"
            className="absolute inset-0 m-auto size-12 text-default-400"
          />
        )}
        {featured ? (
          <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-divider bg-content1 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            <Icon aria-hidden="true" icon="solar:star-bold" className="size-4 text-warning" />
            {t("blogs.handpicked")}
          </span>
        ) : null}
      </div>
      <div className={clsx("flex flex-1 flex-col p-5", featured && "justify-center sm:p-8")}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
          {category?.name ? <span className="text-primary">{category.name}</span> : null}
        </div>
        <h3 className={clsx("font-bold leading-snug text-foreground", featured ? "mt-4 text-2xl sm:text-3xl" : "mt-3 text-lg")}>
          {blog.title}
        </h3>
        {blog.short_description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-default-600">
            {blog.short_description}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 text-xs text-default-600">
          {publishedDate ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon aria-hidden="true" icon="solar:calendar-linear" className="size-4" />
              <time dateTime={blog.published_at ?? undefined}>{t("blogs.publishedOn", { date: publishedDate })}</time>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Icon aria-hidden="true" icon="solar:clock-circle-linear" className="size-4" />
            {readingMinutes
              ? t("blogs.readingTime", { count: readingMinutes })
              : t(isReadingTimeLoading ? "blogs.readingTimeLoading" : "blogs.readingTimeUnavailable")}
          </span>
          {typeof blog.views_count === "number" ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon aria-hidden="true" icon="solar:eye-linear" className="size-4" />
              {t("blogs.viewsCount", { count: blog.views_count })}
            </span>
          ) : null}
        </div>
        <span className={clsx(
          "mt-5 inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-small px-4 text-sm font-semibold transition",
          featured
            ? "bg-foreground text-background group-hover:opacity-90"
            : "border border-divider bg-content1 text-foreground group-hover:border-foreground group-hover:bg-foreground group-hover:text-background",
        )}>
          {t("blogs.readStory")}
          <Icon aria-hidden="true" icon="solar:arrow-right-linear" className="size-4 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
};

export default BlogCard;
