import { api } from "./client";
import {
  ApiResponse,
  userData,
  VerifyUserData,
  ReferralInfo,
} from "@/types/ApiResponse";
import {
  RegisterUserParams,
  UpdateUserParams,
} from "@/types/params";
import {
  fallbackApiRes,
} from "@/config/constants";

// User Interactions
export const verifyUser = async (params: {
  type: "email" | "mobile";
  value: string;
}): Promise<ApiResponse<VerifyUserData>> => {
  try {
    const response = await api.post("/verify-user", null, { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const registerUser = async (params: RegisterUserParams) => {
  try {
    const response = await api.post("/register", null, { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const getReferralInfo = async (
  access_token?: string | null,
): Promise<ApiResponse<ReferralInfo>> => {
  try {
    const response = await api.get<ApiResponse<ReferralInfo>>(
      "/user/referral",
      {
        headers: access_token
          ? { Authorization: `Bearer ${access_token}` }
          : undefined,
      },
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

export const deleteUser = async () => {
  try {
    const response = await api.delete("/user/delete-account");
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const login = async (params: {
  email?: string;
  password: string;
  mobile?: string;
  fcm_token?: string | null;
  device_type?: "web";
}): Promise<ApiResponse<userData>> => {
  try {
    const response = await api.post("/login", null, { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

export const googleLogin = async (params: {
  idToken: string;
  fcm_token?: string | null;
  device_type?: string | null;
  friends_code?: string | null;
  country?: string | null;
  iso_2?: string | null;
}): Promise<ApiResponse<userData>> => {
  try {
    const response = await api.post("/auth/google/callback", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

export const appleLogin = async (params: {
  idToken: string;
  fcm_token?: string | null;
  device_type?: string | null;
  friends_code?: string | null;
  country?: string | null;
  iso_2?: string | null;
}): Promise<ApiResponse<userData>> => {
  try {
    const response = await api.post("/auth/apple/callback", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

export const phoneLogin = async (params: {
  idToken: string;
  name?: string | null;
  friends_code?: string | null;
  fcm_token?: string | null;
  device_type?: string | null;
  access_token?: string;
}): Promise<ApiResponse<userData>> => {
  try {
    const { access_token, ...body } = params;
    const config = access_token
      ? { headers: { Authorization: `Bearer ${access_token}` } }
      : {};
    const response = await api.post("/auth/phone/callback", body, config);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

// Custom SMS OTP (auth/send-otp)

// Custom SMS OTP (auth/send-otp)
export const sendOtp = async (params: {
  mobile: string;
  expires_in?: number;
}): Promise<ApiResponse<{ mobile: string; expires_in: number }>> => {
  try {
    const response = await api.post("/auth/send-otp", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

// Custom SMS OTP verification (auth/verify-otp)

// Custom SMS OTP verification (auth/verify-otp)
export const verifyOtp = async (params: {
  mobile: string;
  otp: string;
  friends_code?: string | null;
}): Promise<ApiResponse<userData>> => {
  try {
    const response = await api.post("/auth/verify-otp", params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const logout = async (
  access_token: string | null,
  params?: { fcm_id?: string; fcm_token?: string | null },
): Promise<ApiResponse<{}>> => {
  try {
    const response = await api.post(
      "/logout",
      params ?? {},
      access_token
        ? {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        : undefined,
    );

    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

export const forgotPassword = async (params: {
  email: string;
}): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post("/forget-password", null, { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const getUserData = async (
  params: { access_token?: string } = {},
): Promise<ApiResponse<userData>> => {
  try {
    const response = await api.get("/user/profile", { params });
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return { success: false, message: "An error occurred.", data: undefined };
  }
};

export const updateUserData = async (params: UpdateUserParams | FormData) => {
  try {
    // Pass params to the request
    const response = await api.post<ApiResponse<userData>>(
      "/user/profile",
      params,
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const updateEmail = async (email: string) => {
  try {
    const response = await api.post<ApiResponse<userData>>(
      "/user/update-email",
      {
        email,
      },
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

export const resendVerificationEmail = async () => {
  try {
    const response = await api.post<ApiResponse<any>>(
      "/user/email/verification-notification",
    );
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    return fallbackApiRes;
  }
};

//categories
