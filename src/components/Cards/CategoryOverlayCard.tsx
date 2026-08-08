import { FC, memo } from "react";

import { Image } from "@/components/ui";
import Link from "next/link";
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
    onClick={() => trackCategoryView(category?.id?.toString(), category?.title)}
    className="group relative block aspect-square sm:aspect-[4/3] overflow-hidden rounded-3xl border border-zinc-100 bg-white
      transition-all duration-300 hover:border-primary hover:shadow-xl cursor-pointer"
  >
    <Image
      alt={category.title}
      src={category.image || category.banner || ""}
      removeWrapper
      loading="eager"
      className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
    />
    {/* Bottom vignette overlay to make the white badge pop on white image backgrounds */}
    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/[0.04] to-transparent pointer-events-none" />
    <div className="absolute inset-x-3 bottom-3 z-10 flex">
      <span className="max-w-full truncate rounded-full bg-white/90 border border-zinc-200/60 px-3.5 py-1.5 text-xs font-bold text-zinc-900 shadow-md backdrop-blur-md">
        {category.title}
      </span>
    </div>
  </Link>
);

export default memo(CategoryOverlayCard);
