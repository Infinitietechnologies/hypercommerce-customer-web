import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import { Link } from "@/components/ui";
import HomeResponsiveImage from "@/components/Home/HomeResponsiveImage";
import { HomeSectionItem } from "@/types/ApiResponse";
import { homeItemHref, homeItemImage } from "@/helpers/homeLayout";

interface HomeHeroSliderProps {
  items: HomeSectionItem[];
  priority?: boolean;
}

/**
 * Hero section — a full-width autoplay slider of linked hero items, each an
 * image with an optional title overlay. (Source: /redesign hero layout.)
 */
const HomeHeroSlider: FC<HomeHeroSliderProps> = ({
  items,
  priority = false,
}) => {
  if (!items.length) return null;

  return (
    <Swiper
      autoplay={{
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      loop={items.length > 1}
      modules={[Autoplay]}
      slidesPerView={1}
      spaceBetween={12}
    >
      {items.map((item, index) => {
        const desktopSrc = homeItemImage(item);
        const mobileSrc = item.mobile_image || desktopSrc;

        return (
          <SwiperSlide key={item.id}>
            <Link
              href={homeItemHref(item)}
              title={item.title}
              className="relative block aspect-home-banner-mobile w-full overflow-hidden rounded-xlarge shadow-lg md:aspect-home-banner"
            >
              <HomeResponsiveImage
                alt={item.title ?? ""}
                className="h-full w-full object-cover"
                desktopSrc={desktopSrc}
                loading={priority && index === 0 ? "eager" : "lazy"}
                mobileSrc={mobileSrc}
              />
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
