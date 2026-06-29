import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { Autoplay } from "swiper/modules";
import { Card, Image } from "@heroui/react";
import { HomeBannerItem, HomeHeroItem } from "@/types/ApiResponse";
import Link from "next/link";
import { useScreenType } from "@/hooks/useScreenType";
import { useTranslation } from "react-i18next";
import { isRTL } from "@/helpers/functionalHelpers";
import { homeItemHref, homeItemImage } from "@/helpers/homeLayout";

type HomeTopSliderProps = {
  // Hero/banner items resolved from the /home-layout section content.
  items?: (HomeHeroItem | HomeBannerItem)[];
  swiperKeyPrefix?: string;
};

const HomeTopSlider: FC<HomeTopSliderProps> = ({
  items = [],
  swiperKeyPrefix = "hs",
}) => {
  const screen = useScreenType();
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  const shouldHide = items.length === 0;
  const canLoop = items.length > 2;

  if (shouldHide) return null;

  return (
    <section id={`home-slider-${swiperKeyPrefix}`} className="mt-4">
      <div className="w-full mb-4">
        <Swiper
          key={rtl ? `rtl-${swiperKeyPrefix}` : `ltr-${swiperKeyPrefix}`}
          dir={rtl ? "rtl" : "ltr"}
          modules={[Autoplay]}
          autoplay={{ delay: 4000 }}
          loop={canLoop}
          spaceBetween={12}
          slidesPerView={1}
          breakpoints={{
            315: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 2 },
          }}
          className="rounded-lg shadow-none"
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <Card
                className="border-none"
                radius="lg"
                isPressable={screen !== "mobile"}
                as={Link}
                shadow="none"
                href={homeItemHref(item)}
              >
                <Image
                  src={homeItemImage(item)}
                  alt={("title" in item && item.title) || ""}
                  loading="eager"
                  radius="lg"
                  className="w-full h-full aspect-409/240 object-cover"
                />
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default HomeTopSlider;
