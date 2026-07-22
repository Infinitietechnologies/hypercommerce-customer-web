export type Address = {
  id: number;
  user_id: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  landmark: string | null;
  state: string;
  zipcode: string;
  mobile: string;
  address_type: "home" | "work" | string; // Extend with more types if needed
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  created_at: string; // or `Date` if parsed
  updated_at: string; // or `Date` if parsed
};

export type VerifyUserData = {
  exists: boolean;
  type: "email" | "mobile";
  value: string;
};

export type userData = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  profile?: string;
  profile_image?: string;
  wallet_balance?: string | number;
  new_user?: boolean;
  friends_code?: string;
  email_verified_at?: string | null;
  mobile_verified_at?: string | null;
  otp_verified?: number | boolean | string;
  created_at?: string;
  country: string;
  iso_2: string;
};

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  total_bonus: number;
  program?: {
    referrer_bonus_value?: string | number;
    referrer_bonus_method?: string;
    referrer_bonus_max_cap?: string | number;
    referee_bonus_value?: string | number;
    referee_bonus_method?: string;
    referee_bonus_max_cap?: string | number;
  };
}
