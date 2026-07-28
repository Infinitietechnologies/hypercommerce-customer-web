import { FC, ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, Pagination } from "swiper/modules";
import type { SwiperOptions } from "swiper/types";

import { useTranslation } from "react-i18next";
import { isRTL } from "@/helpers/functionalHelpers";

interface CardSliderProps {
  slides: ReactNode[];
  /** number → fixed columns; "auto" → each slide sized by its own width. */
  slidesPerView?: number | "auto";
  spaceBetween?: number;
  breakpoints?: SwiperOptions["breakpoints"];
  autoplay?: boolean;
  loop?: boolean;
  pagination?: boolean;
  centeredSlides?: boolean;
  /** Applied to each SwiperSlide (e.g. a fixed width for an "auto" rail). */
  slideClassName?: string;
  className?: string;
}

/**
 * The storefront's one horizontal slider — a Swiper rail replacing raw
 * side-scroll everywhere (product rails, banners). Banners pass
 * `autoplay`/`loop`/`pagination`; product rails use `slidesPerView="auto"`.
 */
const CardSlider: FC<CardSliderProps> = ({
  slides,
  slidesPerView = "auto",
  spaceBetween = 16,
  breakpoints,
  autoplay = false,
  loop = false,
  pagination = false,
  centeredSlides = false,
  slideClassName = "",
  className = "",
}) => {
  const { i18n } = useTranslation();
  const rtl = isRTL(i18n.resolvedLanguage || i18n.language);

  return (
    <Swiper
      key={rtl ? "rtl" : "ltr"}
      dir={rtl ? "rtl" : "ltr"}
      className={className}
      modules={[Autoplay, FreeMode, Pagination]}
      slidesPerView={slidesPerView}
      spaceBetween={spaceBetween}
      breakpoints={breakpoints}
      centeredSlides={centeredSlides}
      freeMode={slidesPerView === "auto"}
      loop={loop && slides.length > 1}
      pagination={pagination ? { clickable: true } : false}
      autoplay={
        autoplay
          ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
          : false
      }
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i} className={`!h-auto ${slideClassName}`}>
          {slide}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default CardSlider;
