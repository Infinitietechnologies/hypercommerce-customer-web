import type {
  HeaderActionItem,
  HeaderActionStyle,
  HeaderBackgroundPosition,
  HeaderBackgroundFit,
  HeaderBackgroundType,
  HeaderContainerWidth,
  HeaderContentTone,
  HeaderDensity,
  HeaderGradientDirection,
  HeaderLayout,
  HeaderNavigationItem,
  HeaderNavigationScope,
  HeaderNavigationScrollBehavior,
  HeaderNavigationSource,
  HeaderNavigationStyle,
  HeaderSettings,
} from "@/types/header";

export interface ResolvedHeaderSettings {
  enabled: boolean;
  layout: HeaderLayout;
  density: HeaderDensity;
  sticky: boolean;
  containerWidth: HeaderContainerWidth;
  contentTone: HeaderContentTone;
  backgroundType: HeaderBackgroundType;
  backgroundColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  gradientDirection: HeaderGradientDirection;
  backgroundImage: string | null;
  mobileBackgroundImage: string | null;
  backgroundPosition: HeaderBackgroundPosition;
  backgroundFit: HeaderBackgroundFit;
  overlayColor: string | null;
  overlayOpacity: number;
  textColor: string | null;
  logoUrl: string | null;
  mobileLogoUrl: string | null;
  logoMaxWidth: number;
  showLocation: boolean;
  showSearch: boolean;
  showWishlist: boolean;
  showOrders: boolean;
  showAccount: boolean;
  showCart: boolean;
  showNotifications: boolean;
  showActionLabels: boolean;
  showLocationLabel: boolean;
  showUtilityBar: boolean;
  hideUtilityOnScroll: boolean;
  showSocialLinks: boolean;
  showSupportPhone: boolean;
  showLanguage: boolean;
  utilityText: string | null;
  utilityBackgroundColor: string | null;
  utilityTextColor: string | null;
  actionItems: HeaderActionItem[];
  showCategoryNavigation: boolean;
  navigationStyle: HeaderNavigationStyle;
  navigationSource: HeaderNavigationSource;
  navigationScope: HeaderNavigationScope;
  navigationScrollBehavior: HeaderNavigationScrollBehavior;
  navigationScrollThreshold: number;
  navigationBackgroundColor: string | null;
  navigationTextColor: string | null;
  navigationActiveColor: string | null;
  categoryLimit: number;
  showAllCategory: boolean;
  navigationItems: HeaderNavigationItem[];
  announcementEnabled: boolean;
  announcementText: string | null;
  announcementUrl: string | null;
  announcementBackgroundColor: string | null;
  announcementTextColor: string | null;
  announcementDismissible: boolean;
}

export const DEFAULT_HEADER_SETTINGS: ResolvedHeaderSettings = {
  enabled: true,
  layout: "showcase",
  density: "comfortable",
  sticky: true,
  containerWidth: "site",
  contentTone: "dark",
  backgroundType: "color",
  backgroundColor: null,
  gradientFrom: null,
  gradientTo: null,
  gradientDirection: "to-right",
  backgroundImage: null,
  mobileBackgroundImage: null,
  backgroundPosition: "top",
  backgroundFit: "fill",
  overlayColor: null,
  overlayOpacity: 0,
  textColor: null,
  logoUrl: null,
  mobileLogoUrl: null,
  logoMaxWidth: 160,
  showLocation: true,
  showSearch: true,
  showWishlist: true,
  showOrders: true,
  showAccount: true,
  showCart: true,
  showNotifications: true,
  showActionLabels: true,
  showLocationLabel: true,
  showUtilityBar: true,
  hideUtilityOnScroll: false,
  showSocialLinks: true,
  showSupportPhone: true,
  showLanguage: true,
  utilityText: null,
  utilityBackgroundColor: null,
  utilityTextColor: null,
  actionItems: [],
  showCategoryNavigation: true,
  navigationStyle: "icons",
  navigationSource: "categories",
  navigationScope: "all",
  navigationScrollBehavior: "compact",
  navigationScrollThreshold: 48,
  navigationBackgroundColor: null,
  navigationTextColor: null,
  navigationActiveColor: null,
  categoryLimit: 6,
  showAllCategory: true,
  navigationItems: [],
  announcementEnabled: false,
  announcementText: null,
  announcementUrl: null,
  announcementBackgroundColor: null,
  announcementTextColor: null,
  announcementDismissible: true,
};

const pick = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => (allowed.includes(value as T) ? (value as T) : fallback);

const optionalText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const safeUrl = (value: unknown): string | null => {
  const url = optionalText(value);
  if (!url) return null;
  return url.startsWith("/") || /^https?:\/\//i.test(url) ? url : null;
};

const safeIcon = (value: unknown): string | null => {
  const icon = optionalText(value);
  return icon && /^[a-z0-9-]+:[a-z0-9-]+$/i.test(icon) ? icon : null;
};

const resolveNavigationItems = (value: unknown): HeaderNavigationItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<HeaderNavigationItem>;
    const label = optionalText(candidate.label);
    const url = safeUrl(candidate.url);
    if (!label || !url) return [];

    return [
      {
        id: optionalText(candidate.id) ?? `header-link-${index}`,
        label,
        url,
        openInNewTab: candidate.openInNewTab === true,
        icon: safeIcon(candidate.icon),
        imageUrl: safeUrl(candidate.imageUrl),
      },
    ];
  });
};

const resolveActionItems = (value: unknown): HeaderActionItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<HeaderActionItem>;
      const label = optionalText(candidate.label);
      const url = safeUrl(candidate.url);
      if (!label || !url) return [];

      return [
        {
          id: optionalText(candidate.id) ?? `header-action-${index}`,
          label,
          url,
          openInNewTab: candidate.openInNewTab === true,
          icon: safeIcon(candidate.icon),
          imageUrl: safeUrl(candidate.imageUrl),
          style: pick<HeaderActionStyle>(
            candidate.style,
            ["solid", "soft", "outline"],
            index === 0 ? "soft" : "outline",
          ),
        },
      ];
    })
    .slice(0, 4);
};

export const resolveHeaderSettings = (
  value?: HeaderSettings | null,
): ResolvedHeaderSettings => {
  const settings = value ?? {};

  return {
    enabled: settings.enabled !== false,
    layout: pick(
      settings.layout,
      ["classic", "stacked", "showcase"],
      "showcase",
    ),
    density: pick(settings.density, ["compact", "comfortable"], "comfortable"),
    sticky: settings.sticky !== false,
    containerWidth: pick(
      settings.containerWidth,
      ["site", "wide", "full"],
      "site",
    ),
    contentTone: pick(settings.contentTone, ["light", "dark"], "dark"),
    backgroundType: pick(
      settings.backgroundType,
      ["color", "gradient", "image"],
      "color",
    ),
    backgroundColor: optionalText(settings.backgroundColor),
    gradientFrom: optionalText(settings.gradientFrom),
    gradientTo: optionalText(settings.gradientTo),
    gradientDirection: pick(
      settings.gradientDirection,
      ["to-right", "to-left", "to-bottom", "to-bottom-right"],
      "to-right",
    ),
    backgroundImage: safeUrl(settings.backgroundImage),
    mobileBackgroundImage: safeUrl(settings.mobileBackgroundImage),
    backgroundPosition: pick(
      settings.backgroundPosition,
      ["top", "center", "bottom"],
      "top",
    ),
    backgroundFit: pick(settings.backgroundFit, ["cover", "fill"], "fill"),
    overlayColor: optionalText(settings.overlayColor),
    overlayOpacity: Math.min(
      0.9,
      Math.max(0, Number(settings.overlayOpacity ?? 0)),
    ),
    textColor: optionalText(settings.textColor),
    logoUrl: safeUrl(settings.logoUrl),
    mobileLogoUrl: safeUrl(settings.mobileLogoUrl),
    logoMaxWidth: Math.min(
      240,
      Math.max(80, Number(settings.logoMaxWidth ?? 160)),
    ),
    showLocation: settings.showLocation !== false,
    showSearch: settings.showSearch !== false,
    showWishlist: settings.showWishlist !== false,
    showOrders: settings.showOrders !== false,
    showAccount: settings.showAccount !== false,
    showCart: settings.showCart !== false,
    showNotifications: settings.showNotifications !== false,
    showActionLabels: settings.showActionLabels !== false,
    showLocationLabel: settings.showLocationLabel !== false,
    showUtilityBar: settings.showUtilityBar !== false,
    hideUtilityOnScroll: settings.hideUtilityOnScroll === true,
    showSocialLinks: settings.showSocialLinks !== false,
    showSupportPhone: settings.showSupportPhone !== false,
    showLanguage: settings.showLanguage !== false,
    utilityText: optionalText(settings.utilityText),
    utilityBackgroundColor: optionalText(settings.utilityBackgroundColor),
    utilityTextColor: optionalText(settings.utilityTextColor),
    actionItems: resolveActionItems(settings.actionItems),
    showCategoryNavigation: settings.showCategoryNavigation !== false,
    navigationStyle: pick(
      settings.navigationStyle,
      ["pills", "links", "icons"],
      "icons",
    ),
    navigationSource: pick(
      settings.navigationSource,
      ["categories", "custom"],
      "categories",
    ),
    navigationScope: pick(
      settings.navigationScope,
      ["home", "all"],
      "all",
    ),
    navigationScrollBehavior: pick(
      settings.navigationScrollBehavior,
      ["keep", "compact", "hide"],
      "compact",
    ),
    navigationScrollThreshold: Math.min(
      400,
      Math.max(0, Math.round(Number(settings.navigationScrollThreshold ?? 48))),
    ),
    navigationBackgroundColor: optionalText(settings.navigationBackgroundColor),
    navigationTextColor: optionalText(settings.navigationTextColor),
    navigationActiveColor: optionalText(settings.navigationActiveColor),
    categoryLimit: Math.min(
      12,
      Math.max(1, Math.round(Number(settings.categoryLimit ?? 6))),
    ),
    showAllCategory: settings.showAllCategory !== false,
    navigationItems: resolveNavigationItems(settings.navigationItems),
    announcementEnabled: settings.announcementEnabled === true,
    announcementText: optionalText(settings.announcementText),
    announcementUrl: safeUrl(settings.announcementUrl),
    announcementBackgroundColor: optionalText(
      settings.announcementBackgroundColor,
    ),
    announcementTextColor: optionalText(settings.announcementTextColor),
    announcementDismissible: settings.announcementDismissible !== false,
  };
};
