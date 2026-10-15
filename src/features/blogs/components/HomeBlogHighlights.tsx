import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

import BlogCard from "@/features/blogs/components/BlogCard";
import { getBlogsWithReadingTimes } from "@/services/blogs";

const HomeBlogHighlights = () => {
  const { t } = useTranslation();
  const { data } = useSWR("blogs:home", () => getBlogsWithReadingTimes({ per_page: 3 }), {
    dedupingInterval: 5 * 60_000,
    revalidateOnFocus: false,
  });
  const blogs = data?.success ? data.data?.data : null;
  if (!blogs?.length) return null;

  return (
    <section aria-labelledby="home-blogs-heading" className="mx-auto w-full max-w-site px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-primary">{t("blogs.eyebrow")}</span>
          <h2 id="home-blogs-heading" className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{t("blogs.homeTitle")}</h2>
          <p className="mt-2 text-sm text-default-600">{t("blogs.homeDescription")}</p>
        </div>
        <Link href="/blogs/" className="inline-flex min-h-10 items-center gap-2 rounded-small px-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {t("blogs.viewAll")}
          <Icon aria-hidden="true" icon="solar:arrow-right-linear" className="size-5 rtl:rotate-180" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 min-[1024px]:grid-cols-3">
        {blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
      </div>
    </section>
  );
};

export default HomeBlogHighlights;
