export type HeaderLayout = "classic" | "stacked" | "showcase";
export type HeaderDensity = "compact" | "comfortable";
export type HeaderContainerWidth = "site" | "wide" | "full";
export type HeaderBackgroundType = "color" | "gradient" | "image";
export type HeaderBackgroundPosition = "top" | "center" | "bottom";
export type HeaderBackgroundFit = "cover" | "fill";
export type HeaderGradientDirection =
  | "to-right"
  | "to-left"
  | "to-bottom"
  | "to-bottom-right";
export type HeaderContentTone = "light" | "dark";
export type HeaderNavigationStyle = "pills" | "links" | "icons";
export type HeaderNavigationSource = "categories" | "custom";
export type HeaderNavigationScope = "home" | "all";
export type HeaderNavigationScrollBehavior = "keep" | "compact" | "hide";
export type HeaderActionStyle = "solid" | "soft" | "outline";

export interface HeaderNavigationItem {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  icon?: string | null;
  imageUrl?: string | null;
}

export interface HeaderActionItem extends HeaderNavigationItem {
  style?: HeaderActionStyle;
}

export interface HeaderSettings {
  enabled?: boolean;
  layout?: HeaderLayout;
  density?: HeaderDensity;
  sticky?: boolean;
  containerWidth?: HeaderContainerWidth;
  contentTone?: HeaderContentTone;
  backgroundType?: HeaderBackgroundType;
  backgroundColor?: string | null;
  gradientFrom?: string | null;
  gradientTo?: string | null;
  gradientDirection?: HeaderGradientDirection;
  backgroundImage?: string | null;
  mobileBackgroundImage?: string | null;
  backgroundPosition?: HeaderBackgroundPosition;
  backgroundFit?: HeaderBackgroundFit;
  overlayColor?: string | null;
  overlayOpacity?: number;
  textColor?: string | null;
  logoUrl?: string | null;
  mobileLogoUrl?: string | null;
  logoMaxWidth?: number;
  showLocation?: boolean;
  showSearch?: boolean;
  showWishlist?: boolean;
  showOrders?: boolean;
  showAccount?: boolean;
  showCart?: boolean;
  showNotifications?: boolean;
  showActionLabels?: boolean;
  showLocationLabel?: boolean;
  showUtilityBar?: boolean;
  hideUtilityOnScroll?: boolean;
  showSocialLinks?: boolean;
  showSupportPhone?: boolean;
  showLanguage?: boolean;
  utilityText?: string | null;
  utilityBackgroundColor?: string | null;
  utilityTextColor?: string | null;
  actionItems?: HeaderActionItem[];
  showCategoryNavigation?: boolean;
  navigationStyle?: HeaderNavigationStyle;
  navigationSource?: HeaderNavigationSource;
  navigationScope?: HeaderNavigationScope;
  navigationScrollBehavior?: HeaderNavigationScrollBehavior;
  navigationScrollThreshold?: number;
  navigationBackgroundColor?: string | null;
  navigationTextColor?: string | null;
  navigationActiveColor?: string | null;
  categoryLimit?: number;
  showAllCategory?: boolean;
  navigationItems?: HeaderNavigationItem[];
  announcementEnabled?: boolean;
  announcementText?: string | null;
  announcementUrl?: string | null;
  announcementBackgroundColor?: string | null;
  announcementTextColor?: string | null;
  announcementDismissible?: boolean;
}
