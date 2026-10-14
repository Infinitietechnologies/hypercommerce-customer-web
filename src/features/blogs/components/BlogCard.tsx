import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import type { BlogSummary } from "@/types/blogs";

interface BlogCardProps {
  blog: BlogSummary;
  featured?: boolean;
}

const BlogCard = ({ blog, featured = false }: BlogCardProps) => {
  const { t, i18n } = useTranslation();
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
      className={`group block overflow-hidden rounded-large border border-divider bg-content1 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${featured ? "min-[1024px]:grid min-[1024px]:grid-cols-2" : ""}`}
    >
      <div className={`relative overflow-hidden bg-content2 ${featured ? "aspect-[16/10] min-[1024px]:aspect-auto min-[1024px]:min-h-80" : "aspect-[16/10]"}`}>
        {blog.image ? (
          <Image
            unoptimized
            fill
            priority={featured}
            loading={featured ? "eager" : "lazy"}
            alt=""
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
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
          <span className="absolute start-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {t("blogs.featured")}
          </span>
        ) : null}
      </div>
      <div className={`flex flex-col p-5 ${featured ? "justify-center sm:p-8" : "gap-3"}`}>
        {blog.category?.name ? (
          <span className="text-xs font-bold uppercase tracking-wide text-primary">
            {blog.category.name}
          </span>
        ) : null}
        <h3 className={`${featured ? "mt-3 text-2xl sm:text-3xl" : "text-lg"} font-bold leading-snug text-foreground group-hover:text-primary`}>
          {blog.title}
        </h3>
        {blog.short_description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-default-600">
            {blog.short_description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-500">
          {publishedDate ? <time dateTime={blog.published_at ?? undefined}>{publishedDate}</time> : null}
          {blog.author?.username ? <span>{blog.author.username}</span> : null}
        </div>
        {featured ? (
          <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            {t("blogs.readStory")}
            <Icon aria-hidden="true" icon="solar:arrow-right-linear" className="size-4 rtl:rotate-180" />
          </span>
        ) : null}
      </div>
    </Link>
  );
};

export default BlogCard;
