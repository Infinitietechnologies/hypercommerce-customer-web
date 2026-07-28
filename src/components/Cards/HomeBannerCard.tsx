import { FC, memo } from "react";
import Link from "next/link";

import { HomeBannerItem } from "@/types/ApiResponse";
import { homeItemHref, homeItemImage } from "@/helpers/homeLayout";

interface HomeBannerCardProps {
  item: HomeBannerItem;
  /** `peek` is a shorter desktop slide; `full` a wide hero. Width is owned by the slider. */
  variant: "peek" | "full";
}

/**
 * Home banner slide. Tall on mobile/tablet (< 1024px), wide on desktop, and
 * serves a mobile-specific image (`mobile_image`) below 1024px when set — a
 * separate desktop/mobile banner artwork wired from the home builder.
 */
const HomeBannerCard: FC<HomeBannerCardProps> = ({ item, variant }) => {
  const desktopSrc = homeItemImage(item);
  const mobileSrc = item.mobile_image || desktopSrc;

  return (
    <Link
      href={homeItemHref(item)}
      title={item.title}
      className={`block w-full overflow-hidden rounded-[22px] shadow-lg aspect-[4/3] ${
        variant === "peek"
          ? "min-[1024px]:aspect-[16/7]"
          : "min-[1024px]:aspect-[21/7]"
      }`}
    >
      <picture className="block h-full w-full">
        <source media="(min-width: 1024px)" srcSet={desktopSrc} />
        <img
          alt={item.title ?? ""}
          src={mobileSrc}
          loading="eager"
          className="h-full w-full object-cover"
        />
      </picture>
    </Link>
  );
};

export default memo(HomeBannerCard);
