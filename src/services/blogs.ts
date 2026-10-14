import { api } from "./client";
import type {
  BlogCategory,
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
    const { data } = await api.get<BlogDetailResponse>(
      `/blogs/${encodeURIComponent(slug)}`,
    );
    return data;
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
