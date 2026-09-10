import { api } from "@/services/client";
import type {
  ClientLabelsResponse,
  ClientLanguagesResponse,
} from "@/types/language";

const WEB_SURFACE = "web";

export const getWebLanguages = async (): Promise<ClientLanguagesResponse> => {
  try {
    const response = await api.get<ClientLanguagesResponse>("/languages", {
      params: { surface: WEB_SURFACE },
    });

    return response.data;
  } catch (error) {
    console.error("Unable to load website languages:", error);

    return {
      success: false,
      message: "Unable to load website languages.",
      data: null,
    };
  }
};

export const getWebLabels = async (
  locale?: string,
): Promise<ClientLabelsResponse> => {
  try {
    const response = await api.get<ClientLabelsResponse>("/language-labels", {
      params: { surface: WEB_SURFACE, locale },
    });

    return response.data;
  } catch (error) {
    console.error("Unable to load website labels:", error);

    return {
      success: false,
      message: "Unable to load website labels.",
      data: null,
    };
  }
};
