import { api } from "./client";
import { estimateReadingMinutes } from "@/features/blogs/readingTime";
import type {
  BlogCategory,
  BlogDetail,
  BlogDetailResponse,
  BlogListResponse,
  BlogSummary,
} from "@/types/blogs";

export interface BlogListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_slug?: string;
}

export const getBlogs = async (
  params: BlogListParams = {},
): Promise<BlogListResponse> => {
  try {
    const { data } = await api.get<BlogListResponse>("/blogs", { params });
    return data;
  } catch {
    return { success: false, message: "Blogs could not be loaded.", data: null };
  }
};

const addReadingMinutes = async (blogs: BlogSummary[]): Promise<BlogSummary[]> => {
  const result: BlogSummary[] = [];
  for (let offset = 0; offset < blogs.length; offset += 3) {
    const batch = await Promise.all(blogs.slice(offset, offset + 3).map(async (blog) => {
      const detail = await getBlog(blog.slug);
      return {
        ...blog,
        reading_minutes: detail.success && detail.data?.content
          ? estimateReadingMinutes(detail.data.content)
          : null,
      };
    }));
    result.push(...batch);
  }
  return result;
};

export const getBlogsWithReadingTimes = async (
  params: BlogListParams = {},
): Promise<BlogListResponse> => {
  const response = await getBlogs(params);
  if (!response.success || !response.data) return response;
  return {
    ...response,
    data: {
      ...response.data,
      data: await addReadingMinutes(response.data.data),
    },
  };
};

export const getEditorPicks = async (): Promise<BlogSummary[] | null> => {
  const firstPage = await getBlogs({ page: 1, per_page: 100 });
  if (!firstPage.success || !firstPage.data) return null;

  const pages = [firstPage.data];
  for (let page = 2; page <= firstPage.data.last_page; page += 1) {
    const response = await getBlogs({ page, per_page: 100 });
    if (!response.success || !response.data) return null;
    pages.push(response.data);
  }

  return addReadingMinutes(pages.flatMap((page) => page.data).filter((blog) => blog.editor_pick));
};

export const getBlogCategories = async (): Promise<BlogCategory[] | null> => {
  try {
    const { data } = await api.get<{
      success: boolean;
      data: BlogCategory[] | { data: BlogCategory[] };
    }>("/blog-categories");
    if (!data.success) return null;
    return Array.isArray(data.data) ? data.data : data.data.data;
  } catch {
    return null;
  }
};

export const getBlog = async (slug: string): Promise<BlogDetailResponse> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data } = await api.get<{ success: boolean; message: string; data: { blog: BlogDetail & { metadata?: { seo_title?: string; seo_description?: string; seo_keywords?: string[] } } } }>(
        `/blogs/${encodeURIComponent(slug)}`,
      );
      const blog = data.data?.blog;
      if (!data.success || !blog) return { success: false, message: data.message, data: null };
      return {
        success: true,
        message: data.message,
        data: {
          ...blog,
          category: blog.categories?.[0] ?? null,
          seo: {
            title: blog.metadata?.seo_title,
            description: blog.metadata?.seo_description,
            keywords: blog.metadata?.seo_keywords,
          },
        },
      };
    } catch (error: unknown) {
      const status = error && typeof error === "object" && "response" in error
        ? (error.response as { status?: number } | undefined)?.status
        : undefined;
      if (status === 404) return { success: false, message: "Blog not found.", data: null };
      if (attempt < 2 && (status === undefined || status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 300));
        continue;
      }
      return { success: false, message: "Blog could not be loaded.", data: null };
    }
  }
  return { success: false, message: "Blog could not be loaded.", data: null };
};
