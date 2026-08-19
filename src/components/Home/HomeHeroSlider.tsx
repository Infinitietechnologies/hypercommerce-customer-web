import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import { Link } from "@/components/ui";
import { HomeSectionItem } from "@/types/ApiResponse";
import { homeItemHref, homeItemImage } from "@/helpers/homeLayout";

interface HomeHeroSliderProps {
  items: HomeSectionItem[];
}

/**
 * Hero section — a full-width autoplay slider of linked hero items, each an
 * image with an optional title overlay. (Source: /redesign hero layout.)
 */
const HomeHeroSlider: FC<HomeHeroSliderProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <Swiper
      autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
      loop={items.length > 1}
      modules={[Autoplay]}
      slidesPerView={1}
      spaceBetween={12}
    >
      {items.map((item) => {
        const desktopSrc = homeItemImage(item);
        const mobileSrc = item.mobile_image || desktopSrc;

        return (
          <SwiperSlide key={item.id}>
            <Link
              href={homeItemHref(item)}
              title={item.title}
              className="relative block aspect-[21/8] w-full overflow-hidden rounded-[22px] shadow-lg"
            >
              <picture className="block h-full w-full">
                {desktopSrc ? (
                  <source media="(min-width: 769px)" srcSet={desktopSrc} />
                ) : null}
                <img
                  alt={item.title ?? ""}
                  src={mobileSrc}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              </picture>
              {item.title ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent to-55%" />
                  <span className="absolute bottom-5 start-6 z-10 text-xl font-bold text-white sm:text-2xl">
                    {item.title}
                  </span>
                </>
              ) : null}
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default HomeHeroSlider;
