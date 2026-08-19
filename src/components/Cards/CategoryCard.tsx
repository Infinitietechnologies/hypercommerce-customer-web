import { trackCategoryView } from "@/lib/analytics";
import { Category } from "@/types/ApiResponse";
import { Image } from "@heroui/react";
import Link from "next/link";
import { FC, memo } from "react";

interface CategoryCardProps {
  category: Category;
}

const TINTS = [
  "bg-tint-mint",
  "bg-tint-sky",
  "bg-tint-butter",
  "bg-tint-peach",
  "bg-tint-blush",
  "bg-tint-lilac",
  "bg-tint-grape",
  "bg-tint-sand",
];

const getTint = (slug: string) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TINTS.length;
  return TINTS[index];
};

import { Icon } from "@iconify/react";

/**
 * Category card — slim pill style layout with icon fallback circle container.
 */
const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const link = category?.parent_slug
    ? `/categories/${category.parent_slug}?subcategory=${category.slug}`
    : `/categories/${category.slug}`;

  const tint = getTint(category.slug || category.title || "");
  const count = category.product_count ?? (category as any).products_count;

  const isUrl = (str: string) =>
    str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/");

  const renderIcon = () => {
    const iconStr = category.image || "";
    const imageStr = category.image || "";

    if (iconStr) {
      if (isUrl(iconStr)) {
        return (
          <Image
            src={iconStr}
            alt={category.title}
            className="h-6 w-6 object-contain"
            loading="eager"
            removeWrapper
          />
        );
      } else {
        return <Icon icon={iconStr} className="text-xl text-zinc-950" />;
      }
    }

    if (imageStr) {
      return (
        <Image
          src={imageStr}
          alt={category.title}
          className="h-6 w-6 object-contain"
          loading="eager"
          removeWrapper
        />
      );
    }

    return <Icon icon="solar:widget-2-linear" className="text-xl text-zinc-950" />;
  };

  return (
    <div className="flex flex-col items-center w-full min-w-0 px-1 py-1">
      <Link
        href={link}
        title={category.title}
        onClick={() => trackCategoryView(category?.id?.toString(), category?.title)}
        className={`group relative flex items-center justify-between w-full h-[68px] sm:h-[76px] rounded-3xl px-4 sm:px-5 overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${tint}`}
      >
        <div className="flex flex-col text-left justify-center min-w-0 z-10 max-w-[62%]">
          <span className="block truncate font-display text-sm sm:text-base font-bold text-zinc-900 leading-tight">
            {category.title}
          </span>
          {count !== undefined && (
            <span className="text-[11px] sm:text-xs text-zinc-500 mt-1 font-semibold">
              {count} items
            </span>
          )}
        </div>

        <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950 shadow-sm transition-transform duration-300 group-hover:scale-110 z-10">
          {renderIcon()}
        </div>
      </Link>
    </div>
  );
};

export default memo(CategoryCard);
