import { FC, memo } from "react";

import { Image, Link } from "@/components/ui";
import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { categoryHref } from "@/helpers/homeLayout";

interface CategoryOverlayCardProps {
  category: Category;
}

/**
 * Category — `overlay` style: a photo tile with a clean frosted-glass pill
 * label pinned bottom-left (dark text on a translucent chip), rather than a
 * heavy dark scrim. Reads on any image and looks premium.
 */
const CategoryOverlayCard: FC<CategoryOverlayCardProps> = ({ category }) => (
  <Link
    href={categoryHref(category)}
    title={category.title}
    onPress={() => trackCategoryView(category?.id?.toString(), category?.title)}
    className="group relative block aspect-square sm:aspect-[4/3] overflow-hidden rounded-large border border-divider
      transition-all duration-200 hover:border-gray-300 hover:shadow-md"
  >
    <Image
      alt={category.title}
      src={category.image || category.banner || ""}
      removeWrapper
      loading="eager"
      className="absolute inset-0 h-full w-full object-contain"
    />
    <div className="absolute inset-x-2 bottom-2 z-10 flex">
      <span className="max-w-full truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] sm:text-[13px] font-bold text-foreground shadow-sm backdrop-blur-md">
        {category.title}
      </span>
    </div>
  </Link>
);

export default memo(CategoryOverlayCard);
