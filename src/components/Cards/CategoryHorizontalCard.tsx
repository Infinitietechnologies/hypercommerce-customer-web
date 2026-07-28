import { FC, memo } from "react";

import { Image, Link } from "@/components/ui";
import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { categoryHref } from "@/helpers/homeLayout";

interface CategoryHorizontalCardProps {
  category: Category;
}

/** Soft, readable pastel tints — cycled per category for a colourful row. */
const TINTS = [
  "bg-primary-100",
  "bg-secondary-100",
  "bg-success-100",
  "bg-warning-100",
  "bg-danger-100",
];

/**
 * Category — `full` style: a horizontal pill with a small image and the name on
 * a soft, colourful background (a pastel tint chosen per category). Text stays
 * dark so it reads on every tint.
 */
const CategoryHorizontalCard: FC<CategoryHorizontalCardProps> = ({ category }) => {
  const tint = TINTS[(category.id ?? 0) % TINTS.length];

  return (
    <Link
      href={categoryHref(category)}
      title={category.title}
      onPress={() => trackCategoryView(category?.id?.toString(), category?.title)}
      className={`flex flex-col sm:flex-row items-center gap-3 rounded-large p-2.5 pe-4 transition-shadow duration-200 hover:shadow-md ${tint}`}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-medium bg-white/80">
        <Image
          alt={category.title}
          src={category.image || ""}
          removeWrapper
          loading="eager"
          className="h-9 w-9 object-contain"
        />
      </div>
      <span className="min-w-0 text-sm font-bold text-foreground">{category.title}</span>
    </Link>
  );
};

export default memo(CategoryHorizontalCard);
