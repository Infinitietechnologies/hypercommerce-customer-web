import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";

import BlogCard from "@/features/blogs/components/BlogCard";
import type { BlogSummary } from "@/types/blogs";

interface FeaturedBlogCarouselProps {
  blogs: BlogSummary[];
}

const FeaturedBlogCarousel = ({ blogs }: FeaturedBlogCarouselProps) => {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const swiper = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = blogs.length > 1;

  return (
    <section aria-labelledby="featured-blog-heading" className="mb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="featured-blog-heading" className="text-2xl font-bold text-foreground">
          {t("blogs.featured")}
        </h2>
        {hasMultiple ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="me-2 text-xs font-semibold tabular-nums text-default-500" aria-live="polite">
              {new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 }).format(activeIndex + 1)}
              <span className="px-1 text-default-400">/</span>
              {new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 }).format(blogs.length)}
            </span>
            <button type="button" aria-label={t("blogs.previousFeatured")}
              onClick={() => swiper.current?.slidePrev()}
              className="flex size-10 items-center justify-center rounded-full border border-divider bg-content1 text-foreground transition-colors hover:bg-content2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              <Icon aria-hidden="true" icon="solar:arrow-left-linear" className="size-4 rtl:rotate-180" />
            </button>
            <button type="button" aria-label={t("blogs.nextFeatured")}
              onClick={() => swiper.current?.slideNext()}
              className="flex size-10 items-center justify-center rounded-full border border-divider bg-content1 text-foreground transition-colors hover:bg-content2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              <Icon aria-hidden="true" icon="solar:arrow-right-linear" className="size-4 rtl:rotate-180" />
            </button>
          </div>
        ) : null}
      </div>
      {hasMultiple ? (
        <Swiper
          dir={i18n.dir()}
          key={i18n.dir()}
          loop
          slidesPerView={1}
          spaceBetween={16}
          speed={reduceMotion ? 0 : 400}
          onSwiper={(instance) => { swiper.current = instance; }}
          onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
        >
          {blogs.map((blog) => (
            <SwiperSlide key={blog.id} className="h-auto">
              <BlogCard blog={blog} featured />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : <BlogCard blog={blogs[0]} featured />}
      {hasMultiple ? (
        <div className="mt-4 flex justify-center gap-1.5" aria-label={t("blogs.featuredNavigation")}>
          {blogs.map((blog, index) => (
            <button key={blog.id} type="button" aria-label={t("blogs.goToFeatured", { count: index + 1 })}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => swiper.current?.slideToLoop(index)}
              className="flex h-9 min-w-9 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              <span className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-6 bg-foreground" : "w-1.5 bg-default-300"}`} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default FeaturedBlogCarousel;
