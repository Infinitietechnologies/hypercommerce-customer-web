import { FC, memo } from "react";

import { Image, Link } from "@/components/ui";
import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { categoryHref } from "@/helpers/homeLayout";

interface CategoryOverlayCardProps {
  category: Category;
}

/**
 * Category — `overlay` style: 4:3 photo with a bottom gradient scrim and a
 * white label. (Source: /redesign cards `CategoryOverlay`.)
 */
const CategoryOverlayCard: FC<CategoryOverlayCardProps> = ({ category }) => (
  <Link
    href={categoryHref(category)}
    title={category.title}
    onPress={() => trackCategoryView(category?.id?.toString(), category?.title)}
    className="relative block aspect-[4/3] overflow-hidden rounded-large border border-divider
      transition-all duration-200 hover:border-primary hover:shadow-md"
  >
    <Image
      alt={category.title}
      src={category.image || category.banner || ""}
      removeWrapper
      loading="eager"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent to-60%" />
    <span className="absolute bottom-3.5 start-4 z-10 text-base font-bold text-white">
      {category.title}
    </span>
  </Link>
);

export default memo(CategoryOverlayCard);
