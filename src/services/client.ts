import axios from "axios";

import { setupInterceptors } from "@/routes/interceptor";

// Helper function to construct API base URL properly
const constructApiBaseUrl = (baseUrl: string | undefined): string => {
  if (!baseUrl) {
    console.error(
      "NEXT_PUBLIC_ADMIN_PANEL_URL is not defined in environment variables.",
    );
    return "/api"; // Fallback to relative path to avoid crashing top-level module load
  }

  const trimmedUrl = baseUrl.trim();
  if (!trimmedUrl) {
    console.error("NEXT_PUBLIC_ADMIN_PANEL_URL is empty.");
    return "/api";
  }

  try {
    const url = new URL(trimmedUrl);
    // Preserve existing pathname and append /api
    const pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash if exists
    url.pathname = `${pathname}/api`;
    return url.toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_ADMIN_PANEL_URL:", trimmedUrl);
    console.error("Error details:", error);
    // Return the original trimmed value or fallback to avoid crashing module load
    return trimmedUrl.endsWith("/api")
      ? trimmedUrl
      : `${trimmedUrl.replace(/\/$/, "")}/api`;
  }
};

/**
 * The single axios instance for the whole app. Every service module imports
 * this — never create another one, and never import axios in a component.
 */
export const api = axios.create({
  baseURL: constructApiBaseUrl(process.env.NEXT_PUBLIC_ADMIN_PANEL_URL),
});

setupInterceptors(api);

export default api;
