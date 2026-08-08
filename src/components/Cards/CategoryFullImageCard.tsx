import { FC, memo } from "react";
import { useTranslation } from "react-i18next";

import { Image } from "@/components/ui";
import Link from "next/link";
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
      onClick={() => trackCategoryView(category?.id?.toString(), category?.title)}
      className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white text-foreground
         transition-all duration-300 hover:border-primary hover:shadow-xl cursor-pointer"
    >
      <div className="aspect-square sm:aspect-[5/3] w-full overflow-hidden bg-zinc-50/50">
        <Image
          alt={category.title}
          src={category.image || category.banner || ""}
          removeWrapper
          loading="eager"
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="px-3 py-3 sm:px-4 sm:py-3.5 flex-1 flex flex-col">
        <div className="line-clamp-2 text-sm font-semibold transition-colors hover:text-primary leading-tight text-zinc-800">
          {category.title}
        </div>
        <div className="mt-1 hidden sm:block text-xs font-bold text-primary">
          {t("home.shop_now", "Shop now")} →
        </div>
      </div>
    </Link>
  );
};

export default memo(CategoryFullImageCard);
