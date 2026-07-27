import { FC, memo } from "react";

import { Image, Link } from "@/components/ui";
import { HomeBannerItem } from "@/types/ApiResponse";
import { homeItemHref, homeItemImage } from "@/helpers/homeLayout";

interface HomeBannerCardProps {
  item: HomeBannerItem;
  /** `peek` is a shorter 16:7 slide; `full` a 21:7 hero. Width is owned by the slider. */
  variant: "peek" | "full";
}

/**
 * Home banner slide — image link, sized by its aspect ratio (the parent slider
 * owns the width). No hover treatment. (Source: /redesign cards `BannerCard`.)
 */
const HomeBannerCard: FC<HomeBannerCardProps> = ({ item, variant }) => (
  <Link
    href={homeItemHref(item)}
    title={item.title}
    className={`block w-full overflow-hidden rounded-[22px] shadow-lg ${
      variant === "peek" ? "aspect-[16/7]" : "aspect-[21/7]"
    }`}
  >
    <Image
      alt={item.title ?? ""}
      src={homeItemImage(item)}
      removeWrapper
      loading="eager"
      className="h-full w-full object-cover"
    />
  </Link>
);

export default memo(HomeBannerCard);
