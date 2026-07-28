import React, { useState } from "react";
import { getCategories } from "@/routes/api";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import TabButton from "@/components/custom/TabButton";
import SkeletonTabButton from "@/components/custom/SkeletonTabButton";
import { Category } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Mousewheel } from "swiper/modules";
import { isRTL } from "@/helpers/functionalHelpers";

interface Props {
  parentSlug: string;
  selectedSubcategory?: string;
  onSelect?: (slug: string) => void;
  onClear?: () => void;
  className?: string;
}

const PER_PAGE = 12;

const SubcategoryTabs: React.FC<Props> = ({
  parentSlug,
  selectedSubcategory = "",
  onSelect,
  onClear,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  const {
    data: subcategories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useInfiniteData<Category>({
    fetcher: getCategories,
    perPage: PER_PAGE,
    extraParams: { slug: parentSlug, scope_category_slug: parentSlug },
    dataKey: `subcategories-tabs-${parentSlug}`,
    forceFetchOnMount: true,
  });

  const handleClick = (slug: string) => {
    if (slug === "all") {
      onClear?.();
    } else {
      onSelect?.(slug);
    }
  };

  const handleSeeMore = () => {
    if (hasMore && !isLoadingMore) loadMore();
  };

  const updateShadows = (swiper: SwiperType) => {
    const hasOverflow =
      swiper.width <
      swiper.slides.reduce((sum, slide) => sum + slide.offsetWidth, 0);

    if (!hasOverflow) {
      setShowLeftShadow(false);
      setShowRightShadow(false);
      return;
    }

    setShowLeftShadow(!swiper.isBeginning);
    setShowRightShadow(!swiper.isEnd);
  };

  return (
    <div
      className={`relative w-full bg-content1 border-b border-divider sticky top-0 z-20 ${className}`}
      aria-label={t("subcategories")}
    >
      <div className="flex gap-0.5 items-stretch">
        <TabButton
          variant="strip"
          slug="all"
          title={t("all_products")}
          isSelected={!selectedSubcategory}
          onClick={() => handleClick("all")}
        />

        {/* Swiper wrapper — shadows scoped here so they don't cover "All Products" */}
        <div className="relative flex-1 overflow-x-hidden">
          {/* Left shadow — only inside swiper area */}
          {showLeftShadow && (
            <div
              className="absolute left-0 top-0 bottom-0 w-8
              bg-gradient-to-r from-content1 via-content1/80 to-transparent
              pointer-events-none z-10"
            />
          )}

          {/* Right shadow */}
          {showRightShadow && (
            <div
              className="absolute right-0 top-0 bottom-0 w-8
              bg-gradient-to-l from-content1 via-content1/80 to-transparent
              pointer-events-none z-10"
            />
          )}

          <Swiper
            key={rtl ? "rtl-sct" : "ltr-sct"}
            dir={rtl ? "rtl" : "ltr"}
            grabCursor
            slidesPerView="auto"
            slidesOffsetAfter={8}
            modules={[Mousewheel]}
            mousewheel
            spaceBetween={8}
            breakpoints={{
              0: {
                spaceBetween: 2,
              },
              640: {
                spaceBetween: 8,
              },
            }}
            onSwiper={(swiper) => {
              updateShadows(swiper);
            }}
            onSlideChange={updateShadows}
            onResize={updateShadows}
            onProgress={updateShadows}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <SwiperSlide key={i} style={{ width: "auto" }}>
                    <SkeletonTabButton />
                  </SwiperSlide>
                ))
              : subcategories.map((cat) => (
                  <SwiperSlide key={cat.id} style={{ width: "auto" }}>
                    <TabButton
                      variant="strip"
                      slug={cat.slug}
                      title={cat.title}
                      isSelected={selectedSubcategory === cat.slug}
                      category={cat}
                      onClick={() => handleClick(cat.slug)}
                    />
                  </SwiperSlide>
                ))}

            {hasMore && (
              <SwiperSlide style={{ width: "auto" }}>
                <TabButton
                  variant="strip"
                  slug="see-more"
                  title={isLoadingMore ? t("loading") : t("see_more")}
                  isSelected={false}
                  isLoading={isLoadingMore}
                  onClick={handleSeeMore}
                />
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryTabs;
