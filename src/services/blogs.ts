import { api } from "./client";
import type {
  BlogCategory,
  BlogDetail,
  BlogDetailResponse,
  BlogListResponse,
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
    return {
      success: false,
      message: status === 404 ? "Blog not found." : "Blog could not be loaded.",
      data: null,
    };
  }
};
