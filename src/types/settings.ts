import type { HomeNavbarAppearance } from "./home";

export type VersionCheckData = {
  update_available: boolean;
  update_type: string;
  min_supported_version: string;
  latest_version: string;
  message: string;
  update_url: string;
};

export type Settings = [
  {
    variable: "app";
    value: AppSettings;
  },
  {
    variable: "authentication";
    value: AuthenticationSettings;
  },
  {
    variable: "web";
    value: WebSettings;
  },
  {
    variable: "system";
    value: SystemSettings;
  },
  {
    variable: "payment";
    value: PaymentSettings;
  },
  {
    variable: "notification";
    value: NotificationSettings;
  },
  {
    variable: "home_general_settings";
    value: HomeGeneralSettings;
  },
  {
    variable: "advertisement";
    value: AdvertisementSettings;
  },
];

export type SystemSettings = {
  // App basics
  appName: string;
  logo: string;
  favicon: string;
  copyrightDetails: string;
  systemTimezone: string;

  // Support
  sellerSupportNumber: string;
  sellerSupportEmail: string;

  // Store & checkout
  systemVendorType: "single" | "multiple";
  checkoutType: "single_store" | "multi_store";
  minimumCartAmount: number;
  maximumItemsAllowedInCart: number;
  lowStockLimit: number | string;
  maximumDistanceToNearestStore: string | null;

  // Wallet
  enableWallet: boolean;
  welcomeWalletBalanceAmount: number;

  // Currency
  currency: string;
  currencySymbol: string;

  // Customer-facing order status codes (CustomerItemStatusEnum::values()) —
  // drives the order-listing status filter.
  orderStatusEnum: string[];

  // Return reasons (ReturnReasonCodeEnum::options()) as {code: label}.
  returnReasonEnum: Record<string, string>;

  // Third-party integrations
  enableThirdPartyStoreSync: boolean;
  Shopify: boolean;
  Woocommerce: boolean;
  etsy: boolean;

  // Maintenance modes
  sellerAppMaintenanceMode: boolean;
  sellerAppMaintenanceMessage: string;
  webMaintenanceMode: boolean;
  webMaintenanceMessage: string;

  // Demo mode (✅ missing earlier)
  demoMode: boolean;
  adminDemoModeMessage: string;
  sellerDemoModeMessage: string;
  customerDemoModeMessage: string;
  customerLocationDemoModeMessage: string;
  deliveryBoyDemoModeMessage: string;

  // Refer & Earn
  referEarnStatus: boolean;
  referEarnMethodUser: "fixed" | "percentage" | string;
  referEarnBonusUser: string;
  referEarnMaximumBonusAmountUser: string;
  referEarnMethodReferral: "fixed" | "percentage" | string;
  referEarnBonusReferral: string;
  referEarnMaximumBonusAmountReferral: string;
  referEarnMinimumOrderAmount: string;
  referEarnNumberOfTimesBonus: string;
};

export interface PaymentSettings {
  stripePayment: boolean;
  stripePaymentMode: "test" | "live";
  stripePublishableKey: string;
  stripeCurrencyCode: string;

  razorpayPayment: boolean;
  razorpayPaymentMode: "test" | "live";
  razorpayKeyId: string;

  paystackPayment: boolean;
  paystackPaymentMode: "test" | "live";
  paystackPublicKey: string;

  cod: boolean;

  directBankTransfer: boolean;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  bankExtraNote: string;

  flutterwavePayment: boolean;
  flutterwavePaymentMode: "test" | "live";
  flutterwavePublicKey: string;
  flutterwaveCurrencyCode: string;

  wallet: boolean;
}

export type AuthenticationSettings = {
  // SMS Gateway configuration
  customSms: boolean;
  customSmsUrl: string;
  customSmsMethod: "GET" | "POST" | string;
  googleRecaptchaSiteKey: string;
  customSmsTokenAccountSid: string;
  customSmsAuthToken: string;
  customSmsTextFormatData: string;
  customSmsHeaderKey: string[];
  customSmsHeaderValue: string[];
  customSmsParamsKey: string[];
  customSmsParamsValue: string[];
  customSmsBodyKey: string[];
  customSmsBodyValue: string[];
  firebase: boolean;

  /**
   * Selected SMS gateway for OTP flows.
   * "firebase" → use Firebase phone auth
   * "custom"   → use backend auth/send-otp & auth/verify-otp
   */
  smsGateway?: "firebase" | "custom";

  // Firebase configuration
  fireBaseApiKey: string;
  fireBaseAuthDomain: string;
  fireBaseDatabaseURL: string;
  fireBaseProjectId: string;
  fireBaseStorageBucket: string;
  fireBaseMessagingSenderId: string;
  fireBaseAppId: string;
  fireBaseMeasurementId: string;

  // Social login configuration
  appleLogin: boolean;
  googleLogin: boolean;
  facebookLogin: boolean;
  googleApiKey: string;
};

export type NotificationSettings = {
  firebaseProjectId: string;
  serviceAccountFile: string;
  vapIdKey: string;
};

export type WebSettings = {
  siteName: string;
  siteCopyright: string;
  supportNumber: string;
  supportEmail: string;
  address: string;
  shortDescription: string;
  siteHeaderLogo: string;
  siteHeaderDarkLogo: string;
  siteFooterLogo: string;
  siteFavicon: string;
  headerScript: string;
  footerScript: string;
  googleMapKey: string;
  mapIframe: string;
  appDownloadSection: boolean;
  appSectionTitle: string;
  appSectionTagline: string;
  appSectionPlaystoreLink: string;
  appSectionAppstoreLink: string;
  appSectionShortDescription: string;
  facebookLink: string;
  instagramLink: string;
  xLink: string;
  youtubeLink: string;
  shippingFeatureSection: string;
  shippingFeatureSectionTitle: string;
  shippingFeatureSectionDescription: string;
  returnFeatureSection: string;
  returnFeatureSectionTitle: string;
  returnFeatureSectionDescription: string;
  safetySecurityFeatureSection: string;
  safetySecurityFeatureSectionTitle: string;
  safetySecurityFeatureSectionDescription: string;
  supportFeatureSection: string;
  supportFeatureSectionTitle: string;
  supportFeatureSectionDescription: string;
  metaKeywords: string;
  metaDescription: string;
  defaultLatitude: string;
  defaultLongitude: string;
  enableCountryValidation: boolean;
  allowedCountries: string[];
  returnRefundPolicy: string;
  shippingPolicy: string;
  privacyPolicy: string;
  termsCondition: string;
  aboutUs: string;
};

export type AppSettings = {
  appstoreLink: string;
  playstoreLink: string;
  appScheme: string;
  appDomainName: string;
  customerAppScheme?: string;
  customerAppstoreLink?: string;
  customerPlaystoreLink?: string;
  sellerAppScheme?: string;
  sellerAppstoreLink?: string;
  sellerPlaystoreLink?: string;
};

export type HomeGeneralSettings = {
  title: string;
  searchLabels: string[];
  backgroundType: "image" | "color";
  backgroundColor: string;
  backgroundImage?: string;
  appTabletBackgroundImage?: string;
  icon?: string;
  activeIcon?: string;
  desktopIcon?: string;
  desktopActiveIcon?: string;
  desktopBackgroundImage?: string;
  desktopTabletBackgroundImage?: string;
  desktopMobileBackgroundImage?: string;
  fontColor: string;
  homeAppearance?: {
    app: HomeNavbarAppearance;
    desktop: HomeNavbarAppearance;
  };
};

export type AdvertisementSettings = {
  featureEnabled: boolean;
  disableBehavior: string;
  cpcRate: number;
  walletMinTopup: number;
  searchSlotCount: number;
  relatedSlotCount: number;
  impressionMultiplierMin: number;
  impressionMultiplierMax: number;
  adImpressionVisibilityPct: number;
  adImpressionVisibilityMs: number;
  broadcastDriver: string;
  pusherAppId: string;
  pusherKey: string;
  pusherSecret: string;
  pusherCluster: string;
  reverbAppId: string;
  reverbKey: string;
  reverbSecret: string;
  reverbHost: string;
  reverbPort: number | null;
  reverbScheme: string;
};

export interface firebaseConfigType {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}
