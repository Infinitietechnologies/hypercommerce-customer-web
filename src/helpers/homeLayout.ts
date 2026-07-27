import { Category, HomeBannerItem, HomeHeroItem } from "@/types/ApiResponse";

type HomeItem = HomeHeroItem | HomeBannerItem;

/**
 * Category link target — a subcategory deep-links through its parent so the
 * parent listing opens with it preselected. Mirrors CategoryCard.
 */
export const categoryHref = (category: Pick<Category, "slug" | "parent_slug">): string =>
  category?.parent_slug
    ? `/categories/${category.parent_slug}?subcategory=${category.slug}`
    : `/categories/${category?.slug ?? ""}`;

/**
 * Build the link target for a hero/banner item coming from /home-layout.
 * Hero items use `type`; banner items use `link_type`. The kind is one of
 * product | category | brand | custom.
 *   product  → /products/{slug}
 *   category → /categories/{slug}
 *   brand    → /brands/{slug}
 *   custom   → link_url (banners only)
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

/** Pick the displayable image for a hero/banner item. */
export const homeItemImage = (item: HomeItem): string => {
  if ("image" in item && item.image) return item.image;
  if ("default_image" in item && item.default_image) return item.default_image;
  return "";
};
