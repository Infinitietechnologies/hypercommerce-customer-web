import type { ApiResponse } from "@/types/common";
import type {
  WatchBuyProfileStatusesData,
  WatchBuyReelsData,
  WatchBuyStatusFeedData,
} from "@/types/watchBuy";

import { api } from "./client";

interface FeedParams {
  access_token?: string;
  cursor?: string;
  market?: string;
  per_page?: number;
  session_id?: string;
}

interface ReelsParams extends FeedParams {
  slug?: string;
}

const failed = <T>(message: string, data: T): ApiResponse<T> => ({
  success: false,
  message,
  data,
});

export const getWatchBuyReels = async (
  params: ReelsParams = {},
): Promise<ApiResponse<WatchBuyReelsData>> => {
  try {
    const response = await api.get<ApiResponse<WatchBuyReelsData>>(
      "/watch-and-buy/reels",
      { params },
    );
    return response.data;
  } catch {
    return failed("Unable to load Watch & Buy reels.", {
      items: [],
      meta: {
        session_id: "",
        next_cursor: null,
        per_page: params.per_page ?? 10,
        slug_not_found: false,
      },
    });
  }
};

export const getWatchBuyStatuses = async (
  params: FeedParams = {},
): Promise<ApiResponse<WatchBuyStatusFeedData>> => {
  try {
    const response = await api.get<ApiResponse<WatchBuyStatusFeedData>>(
      "/watch-and-buy/statuses",
      { params },
    );
    return response.data;
  } catch {
    return failed("Unable to load Watch & Buy stories.", {
      items: [],
      meta: {
        session_id: "",
        next_cursor: null,
        per_page: params.per_page ?? 20,
      },
    });
  }
};

export const getWatchBuyProfileStatuses = async (
  username: string,
  params: FeedParams = {},
): Promise<ApiResponse<WatchBuyProfileStatusesData>> => {
  try {
    const response = await api.get<ApiResponse<WatchBuyProfileStatusesData>>(
      `/watch-and-buy/profiles/${encodeURIComponent(username)}/statuses`,
      { params },
    );
    return response.data;
  } catch {
    return failed("Unable to load this story.", {
      profile: {
        id: 0,
        type: "seller",
        username,
        bio: null,
        photo_url: null,
        status: "inactive",
        suspension_reason: null,
        suspended_at: null,
        has_active_status: false,
        has_unseen_status: false,
      },
      items: [],
      pagination: {
        per_page: params.per_page ?? 20,
        total: 0,
        next_cursor: null,
        previous_cursor: null,
        has_more_pages: false,
      },
    });
  }
};

export const updateWatchBuyLikes = async (
  items: Array<{ reel_id: number; liked: boolean }>,
): Promise<ApiResponse<null>> => {
  try {
    const response = await api.put<ApiResponse<null>>(
      "/watch-and-buy/reels/likes",
      { items },
    );
    return response.data;
  } catch {
    return failed("Unable to update this reel.", null);
  }
};

export const markWatchBuyStatusesSeen = async (
  status_ids: number[],
): Promise<ApiResponse<null>> => {
  try {
    const response = await api.put<ApiResponse<null>>(
      "/watch-and-buy/statuses/seen",
      { status_ids },
    );
    return response.data;
  } catch {
    return failed("Unable to update story progress.", null);
  }
};
