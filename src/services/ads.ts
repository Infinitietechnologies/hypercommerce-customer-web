import { api } from "./client";
import {
  AdEvent,
} from "@/types/ApiResponse";


import {
  fallbackApiRes,
} from "@/config/constants";

// Ad Tracking
export const trackBulkImpressions = async (events: AdEvent[]) => {
  try {
    const response = await api.post("/ads/bulk-impressions", { events });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const trackBulkClicks = async (events: AdEvent[]) => {
  try {
    const response = await api.post("/ads/bulk-clicks", { events });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};
