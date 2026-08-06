import { getCookie } from "@/lib/cookies";
import { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { maintenanceStore } from "@/stores/maintenanceStore";
import { MaintenanceResponse } from "@/types/common";

// Helper function to clean token (remove quotes if present)
const cleanToken = (token: string): string => {
  if (!token) return "";

  // Remove surrounding quotes if they exist
  return token.replace(/^["']|["']$/g, "").trim();
};

export const setupInterceptors = (instance: AxiosInstance): void => {
  // Request Interceptor - Combined logic
  instance.interceptors.request.use(
    (config) => {
      // First, check if we have a token in params (for SSR)
      const paramToken = config?.params?.access_token || "";

      if (paramToken) {
        const cleanedToken = cleanToken(paramToken);
        if (config.headers) {
          config.headers.set("Authorization", `Bearer ${cleanedToken}`);
        }
        // Remove the token from params to avoid sending it in the URL
        delete config.params.access_token;
      } else if (typeof window !== "undefined") {
        // If no param token and not SSR, try to get from cookies (client-side)
        const access_token = getCookie("access_token") || "";
        if (access_token) {
          if (config.headers) {
            config.headers.set("Authorization", `Bearer ${access_token}`);
          }
        }
      }

      // Market (hypercommerce): attach X-Market header so the backend's
      // DetectMarket middleware resolves the right market. SSR passes it via
      // params.market; client reads the `market` cookie set by /markets/switch.
      const paramMarket = config?.params?.market || "";
      if (paramMarket) {
        const cleanedMarket = cleanToken(String(paramMarket));
        if (cleanedMarket && config.headers) {
          config.headers.set("X-Market", cleanedMarket);
        }
        delete config.params.market;
      } else if (typeof window !== "undefined") {
        const market = getCookie("market");
        if (market && config.headers) {
          config.headers.set("X-Market", cleanToken(String(market)));
        }
      }

      if (config?.params?.scope_category_slug === "all") {
        delete config.params.scope_category_slug;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Clear maintenance state on successful response (non-503)
      if (typeof window !== "undefined") {
        maintenanceStore.setMaintenance(false, null);
      }
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            console.error("Unauthorized request");
            if (typeof window !== "undefined") {
              const { handleLogout } = require("@/helpers/auth");
              handleLogout(false);
            }
            break;
          case 403:
            console.error("Forbidden access");
            break;
          case 500:
            console.error("Server error");
            break;
          case 503:
            // Check for maintenance mode in 503 response
            if (typeof window !== "undefined") {
              try {
                const responseData = error.response.data as
                  | MaintenanceResponse
                  | undefined;

                if (
                  responseData &&
                  typeof responseData === "object" &&
                  responseData.maintenance === true
                ) {
                  maintenanceStore.setMaintenance(
                    true,
                    responseData.message || null
                  );
                } else {
                  // If 503 but no maintenance flag, clear maintenance state
                  maintenanceStore.setMaintenance(false, null);
                }
              } catch (e) {
                console.error("Error parsing 503 response:", e);
                maintenanceStore.setMaintenance(false, null);
              }
            }
            break;
          default:
            console.error(`Error: ${error.response.status}`);
            // Clear maintenance state for other errors
            if (typeof window !== "undefined") {
              maintenanceStore.setMaintenance(false, null);
            }
        }
      } else if (error.request) {
        console.error("No response received from server");
      } else {
        console.error("Request setup error:", error.message);
      }
      return Promise.reject(error);
    }
  );
};
