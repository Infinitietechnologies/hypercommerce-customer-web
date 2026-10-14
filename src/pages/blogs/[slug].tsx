import type { GetServerSideProps } from "next";

import { isSSR } from "@/helpers/getters";
import { getBlog } from "@/services/blogs";
import type { BlogDetailResponse } from "@/types/blogs";
import type { NextPageWithLayout } from "@/types";
import BlogDetailView from "@/views/BlogDetailView";
import { loadTranslations } from "../../../i18n";

interface BlogPageProps {
  initialBlog?: BlogDetailResponse | null;
  initialSlug?: string;
}

const BlogPage: NextPageWithLayout<BlogPageProps> = (props) => <BlogDetailView {...props} />;

export const getServerSideProps: GetServerSideProps<BlogPageProps> | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const slug = typeof context.params?.slug === "string" ? context.params.slug : "";
      if (!slug) return { notFound: true };
      const initialBlog = await getBlog(slug);
      if (initialBlog.message === "Blog not found.") return { notFound: true };
      return { props: { initialBlog, initialSlug: slug } };
    }
  : undefined;

export default BlogPage;
