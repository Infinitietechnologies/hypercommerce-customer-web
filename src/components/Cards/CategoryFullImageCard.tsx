import { FC, memo } from "react";
import { useTranslation } from "react-i18next";

import { Image, Link } from "@/components/ui";
import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { categoryHref } from "@/helpers/homeLayout";

interface CategoryFullImageCardProps {
  category: Category;
}

/**
 * Category — `full` (and default) style: a full image with the title and a
 * "Shop now →" caption below. The redesign's default category card.
 */
const CategoryFullImageCard: FC<CategoryFullImageCardProps> = ({ category }) => {
  const { t } = useTranslation();

  return (
    <Link
      href={categoryHref(category)}
      title={category.title}
      onPress={() => trackCategoryView(category?.id?.toString(), category?.title)}
      className="flex flex-col overflow-hidden rounded-large border border-divider bg-content1 text-foreground
         transition-all duration-200 hover:border-primary hover:shadow-md"
    >
      <div className="aspect-square sm:aspect-[5/3] w-full overflow-hidden bg-content2">
        <Image
          alt={category.title}
          src={category.image || category.banner || ""}
          removeWrapper
          loading="eager"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="px-2 py-2 sm:px-3 sm:py-2.5">
        <div className="line-clamp-2 text-[11px] sm:text-[13px] font-bold leading-tight">
          {category.title}
        </div>
        <div className="mt-0.5 hidden sm:block text-[11px] font-semibold text-primary-600">
          {t("home.shop_now", "Shop now")} →
        </div>
      </div>
    </Link>
  );
};

export default memo(CategoryFullImageCard);
