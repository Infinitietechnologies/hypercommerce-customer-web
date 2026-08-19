import { Category, HomeHeroItem, HomeSectionItem } from "@/types/ApiResponse";

type HomeItem = HomeHeroItem | HomeSectionItem;

/**
 * Category link target — a subcategory deep-links through its parent so the
 * parent listing opens with it preselected. Mirrors CategoryCard.
 */
export const categoryHref = (category: Pick<Category, "slug" | "parent_slug">): string =>
  category?.parent_slug
    ? `/categories/${category.parent_slug}?subcategory=${category.slug}`
    : `/categories/${category?.slug ?? ""}`;

/**
 * Build the link target for a hero or play-image item coming from /home-layout.
 * Hero items use `type`; play-image items use `link_type`. The kind is one of
 * product | category | brand | custom.
 *   product  → /products/{slug}
 *   category → /categories/{slug}
 *   brand    → /brands/{slug}
 *   custom   → link_url (play-image items only)
 */
export const homeItemHref = (item: HomeItem): string => {
  const kind =
    "link_type" in item ? item.link_type : (item as HomeHeroItem).type;
  const slug = item.slug;

  switch (kind) {
    case "product":
      return slug ? `/products/${slug}` : "#";
    case "category":
      return slug ? `/categories/${slug}` : "#";
    case "brand":
      return slug ? `/brands/${slug}` : "#";
    case "custom":
      return ("link_url" in item && item.link_url) || "#";
    default:
      return "#";
  }
};

/** Pick the displayable image for a hero or play-image item. */
export const homeItemImage = (item: HomeItem): string => {
  if ("image" in item && item.image) return item.image;
  if ("default_image" in item && item.default_image) return item.default_image;
  return "";
};

/** Parse boolean value from various configurations */
export const parseBoolSetting = (val: any, defaultVal: boolean): boolean => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const s = val.toLowerCase().trim();
    return s === "true" || s === "1" || s === "yes" || s === "on";
  }
  return !!val;
};

/** Get standard CSS spacing value (appending px if raw number) */
export const getSpacingValueSetting = (val: any, defaultVal: string): string => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "number") return `${val}px`;
  if (typeof val === "string" && !isNaN(Number(val))) return `${val}px`;
  return String(val);
};

/** Resolve custom 4-side padding values or fallback spacing */
export const getPaddingValueSetting = (outerPaddingCustom: any, outerPadding: any, defaultVal = "16px"): string => {
  if (outerPaddingCustom) {
    return String(outerPaddingCustom)
      .split("/")
      .map((v) => {
        const trimmed = v.trim();
        if (!trimmed) return "0px";
        if (trimmed.endsWith("px") || trimmed.endsWith("%") || trimmed.endsWith("rem")) {
          return trimmed;
        }
        return `${trimmed}px`;
      })
      .join(" ");
  }
  return getSpacingValueSetting(outerPadding, defaultVal);
};

/** Resolve dynamic breakout wrapper classes and content alignment classes based on container width settings */
export const getContainerWidthClasses = (containerWidthSetting: string) => {
  const width = containerWidthSetting || "container";
  let wrapperClass = "w-full";
  let innerClass = "w-full";

  if (width === "fluid") {
    wrapperClass = "relative left-1/2 w-page max-w-none -translate-x-1/2";
    innerClass = "w-full max-w-[1440px] mx-auto px-4 sm:px-8";
  } else if (width === "full") {
    wrapperClass = "relative left-1/2 w-page max-w-none -translate-x-1/2";
    innerClass = "w-full px-0";
  } else {
    wrapperClass = "w-full max-w-site mx-auto";
    innerClass = "w-full";
  }

  return { wrapperClass, innerClass };
};

/** Resolve element card hover CSS animation classes */
export const getHoverEffectClasses = (hoverEffectSetting: string): string => {
  const effect = hoverEffectSetting || "none";
  if (effect === "zoom") {
    return "hover:scale-[1.03] transition-transform duration-300";
  } else if (effect === "lift") {
    return "hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300";
  } else if (effect === "opacity") {
    return "hover:opacity-85 transition-opacity duration-300";
  }
  return "";
};
