import type { GetServerSideProps } from "next";

import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getBlog } from "@/services/blogs";
import { getSettings } from "@/services/settings";
import type { Settings } from "@/types/settings";
import type { BlogDetailResponse } from "@/types/blogs";
import type { NextPageWithLayout } from "@/types";
import BlogDetailView from "@/views/BlogDetailView";
import { loadTranslations } from "../../../i18n";

interface BlogPageProps {
  initialSettings?: Settings | null;
  initialBlog?: BlogDetailResponse | null;
  initialSlug?: string;
}

const BlogPage: NextPageWithLayout<BlogPageProps> = (props) => <BlogDetailView {...props} />;

export const getServerSideProps: GetServerSideProps<BlogPageProps> | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const slug = typeof context.params?.slug === "string" ? context.params.slug : "";
      if (!slug) return { notFound: true };
      const [initialBlog, settings] = await Promise.all([
        getBlog(slug),
        getSettings({ market: getMarketFromContext(context) }),
      ]);
      if (initialBlog.message === "Blog not found.") return { notFound: true };
      return { props: { initialBlog, initialSlug: slug, initialSettings: settings.data ?? null } };
    }
  : undefined;

export default BlogPage;
