import type { GetServerSideProps } from "next";

import { isSSR } from "@/helpers/getters";
import { getBlogCategories, getBlogsWithReadingTimes, getEditorPicks } from "@/services/blogs";
import type { BlogCategory, BlogListResponse, BlogSummary } from "@/types/blogs";
import type { NextPageWithLayout } from "@/types";
import BlogsView from "@/views/BlogsView";
import { loadTranslations } from "../../../i18n";

interface BlogsPageProps {
  initialBlogs?: BlogListResponse | null;
  initialCategories?: BlogCategory[] | null;
  initialEditorPicks?: BlogSummary[] | null;
  initialQuery?: { page: number; search: string; category: string };
}

const BlogsPage: NextPageWithLayout<BlogsPageProps> = (props) => <BlogsView {...props} />;

export const getServerSideProps: GetServerSideProps<BlogsPageProps> | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const page = Math.max(1, Number(context.query.page) || 1);
      const search = typeof context.query.search === "string" ? context.query.search : undefined;
      const category_slug = typeof context.query.category === "string" ? context.query.category : undefined;
      const [initialBlogs, initialCategories, initialEditorPicks] = await Promise.all([
        getBlogsWithReadingTimes({ page, per_page: 9, search, category_slug }),
        getBlogCategories(),
        page === 1 && !search && !category_slug ? getEditorPicks() : Promise.resolve(null),
      ]);
      return { props: { initialBlogs, initialCategories, initialEditorPicks, initialQuery: { page, search: search ?? "", category: category_slug ?? "" } } };
    }
  : undefined;

export default BlogsPage;
