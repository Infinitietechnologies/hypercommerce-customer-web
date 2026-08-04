import { FC, memo } from "react";

import { Image, Link } from "@/components/ui";
import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { categoryHref } from "@/helpers/homeLayout";

interface CategoryHorizontalCardProps {
  category: Category;
}

/** Paired pastel tint + matching darker title colour, cycled per category. */
const TINTS = [
  { bg: "bg-warning-100", text: "text-primary-700" },
  { bg: "bg-secondary-100", text: "text-secondary-700" },
  { bg: "bg-success-100", text: "text-success-700" },
  { bg: "bg-warning-100", text: "text-warning-700" },
  { bg: "bg-danger-100", text: "text-danger-700" },
];

/**
 * Category — `full` style: a soft colored tile with the title pinned top-start
 * and the product image resting in the lower-end corner. Background and title
 * colours come from the category's own theme (`background_color` / `font_color`),
 * falling back to a pastel tint cycled per category so the row stays colourful.
 */
const CategoryHorizontalCard: FC<CategoryHorizontalCardProps> = ({ category }) => {
  const tint = TINTS[(category.id ?? 0) % TINTS.length];
  const backgroundColor = category.background_color || undefined;
  const color = category.font_color || undefined;

  return (
    <Link
      href={categoryHref(category)}
      title={category.title}
      onPress={() => trackCategoryView(category?.id?.toString(), category?.title)}
      className={`group relative block aspect-[16/10] overflow-hidden rounded-large
         transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        ${tint.bg}`}
    >
      <div className="relative z-10 max-w-[55%] p-3 sm:p-4">
        <div
          className={`line-clamp-3 text-sm sm:text-lg font-bold leading-tight ${tint.text}`}
        >
          {category.title}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 end-0 flex w-[58%] items-end justify-end p-2">
        <Image
          alt={category.title}
          src={category.image || category.banner || ""}
          removeWrapper
          loading="eager"
          className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>
    </Link>
  );
};

export default memo(CategoryHorizontalCard);
