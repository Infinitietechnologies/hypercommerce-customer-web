import { FC, memo } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { HomeSection, HomeSectionItem } from "@/types/ApiResponse";
import {
  homeItemHref,
  homeItemImage,
  parseBoolSetting,
  getSpacingValueSetting,
  getPaddingValueSetting,
  getContainerWidthClasses,
  getHoverEffectClasses
} from "@/helpers/homeLayout";

interface HomePlayImageGridProps {
  section: HomeSection;
}

const getMobileColSpan = (span: number) => {
  switch (span) {
    case 1: return "col-span-1";
    case 2: return "col-span-2";
    case 3: return "col-span-3";
    case 4: return "col-span-4";
    case 5: return "col-span-5";
    case 6: return "col-span-6";
    case 7: return "col-span-7";
    case 8: return "col-span-8";
    case 9: return "col-span-9";
    case 10: return "col-span-10";
    case 11: return "col-span-11";
    case 12:
    default:
      return "col-span-12";
  }
};

const getDesktopColSpan = (span: number) => {
  switch (span) {
    case 1: return "sm:col-span-1";
    case 2: return "sm:col-span-2";
    case 3: return "sm:col-span-3";
    case 4: return "sm:col-span-4";
    case 5: return "sm:col-span-5";
    case 6: return "sm:col-span-6";
    case 7: return "sm:col-span-7";
    case 8: return "sm:col-span-8";
    case 9: return "sm:col-span-9";
    case 10: return "sm:col-span-10";
    case 11: return "sm:col-span-11";
    case 12:
    default:
      return "sm:col-span-12";
  }
};

interface SpanLayout {
  item: HomeSectionItem;
  span: number;
}

const calculateSpans = (items: HomeSectionItem[], isMobile: boolean): SpanLayout[] => {
  const spanKey = isMobile ? "cols_mobile" : "cols";
  const result: SpanLayout[] = [];
  
  let currentGroup: HomeSectionItem[] = [];
  let currentSum = 0;

  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    
    const autos = currentGroup.filter(it => !it.config?.[spanKey] || it.config[spanKey] === "auto");
    const fixeds = currentGroup.filter(it => it.config?.[spanKey] && it.config[spanKey] !== "auto");
    
    const fixedSum = fixeds.reduce((sum, it) => sum + Number(it.config?.[spanKey] || 0), 0);
    const remaining = 12 - fixedSum;

    if (autos.length > 0) {
      const share = Math.max(1, Math.floor(remaining / autos.length));
      let distributed = 0;
      
      currentGroup.forEach((item, idx) => {
        const isAuto = !item.config?.[spanKey] || item.config[spanKey] === "auto";
        let finalSpan = isAuto ? share : Number(item.config?.[spanKey] || 12);
        
        if (isAuto) {
          distributed += share;
          if (idx === currentGroup.map(g => !g.config?.[spanKey] || g.config[spanKey] === "auto").lastIndexOf(true)) {
            const diff = remaining - distributed;
            if (diff > 0) {
              finalSpan += diff;
            }
          }
        }
        result.push({ item, span: finalSpan });
      });
    } else {
      currentGroup.forEach(item => {
        result.push({ item, span: Number(item.config?.[spanKey] || 12) });
      });
    }
    
    currentGroup = [];
    currentSum = 0;
  };

  items.forEach((item) => {
    const rawVal = item.config?.[spanKey];
    let itemSpan = 12;
    if (rawVal && rawVal !== "auto") {
      itemSpan = Number(rawVal);
    }

    if (rawVal === "auto" || !rawVal) {
      currentGroup.push(item);
    } else {
      if (currentSum + itemSpan > 12) {
        flushGroup();
      }
      currentGroup.push(item);
      currentSum += itemSpan;
    }
  });

  flushGroup();
  return result;
};

const RowSwiperNavigation: FC<{ rIdx: number }> = ({ rIdx }) => {
  return (
    <>
      <Button
        isIconOnly
        size="sm"
        radius="lg"
        aria-label="Previous"
        className={`hb-prev-${rIdx} hidden sm:flex
        absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20
        bg-background border border-default-300 shadow-lg disabled:opacity-50
        transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110`}
      >
        <ChevronLeft size={20} className="text-default-700" />
      </Button>

      <Button
        isIconOnly
        size="sm"
        radius="lg"
        aria-label="Next"
        className={`hb-next-${rIdx} hidden sm:flex
        absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20
        bg-background border border-default-300 shadow-lg disabled:opacity-50
        transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110`}
      >
        <ChevronRight size={20} className="text-default-700" />
      </Button>
    </>
  );
};

interface StorefrontRow {
  row_index: number;
  style: string;
  config: any;
  items: HomeSectionItem[];
}

const HomePlayImageGrid: FC<HomePlayImageGridProps> = ({ section }) => {
  const rowsData = section.content?.rows;
  const resolvedRows: StorefrontRow[] = [];

  if (rowsData && rowsData.length > 0) {
    rowsData.forEach((row: any) => {
      resolvedRows.push({
        row_index: row.row_index ?? 0,
        style: row.style ?? "grid",
        config: row.config ?? {},
        items: row.items ?? [],
      });
    });
  } else {
    // Fallback/backwards compatibility for flat layout payload
    const items = section.content?.items ?? [];
    const groupedRows: HomeSectionItem[][] = [];
    items.forEach((item) => {
      const rIdx = item.config?.row_index !== undefined ? Number(item.config.row_index) : 0;
      if (!groupedRows[rIdx]) {
        groupedRows[rIdx] = [];
      }
      groupedRows[rIdx].push(item);
    });

    groupedRows.forEach((rowItems, rIdx) => {
      if (rowItems && rowItems.length > 0) {
        resolvedRows.push({
          row_index: rIdx,
          style: (section.style as string) || "grid",
          config: section.config ?? {},
          items: rowItems,
        });
      }
    });
  }

  if (!resolvedRows.length) return null;

  return (
    <div className="w-full flex flex-col">
      {resolvedRows.map((row, rIdx) => {
        const rowConfig = row.config;
        const isScroll = row.style === "scroll";

        const gap = getSpacingValueSetting(rowConfig.grid_gap, "12px");
        const padding = getPaddingValueSetting(rowConfig.outer_padding_custom, rowConfig.outer_padding, "16px");
        const rawRadius = getSpacingValueSetting(rowConfig.border_radius, "8px");
        const borderRadius = rawRadius === "full" ? "9999px" : rawRadius;
        
        // Reusable Hover Effects & Breakout Width Classes
        const hoverClasses = getHoverEffectClasses(rowConfig.hover_effect);
        const { wrapperClass, innerClass } = getContainerWidthClasses(rowConfig.container_width);

        if (isScroll) {
          const itemsToShow = Number(rowConfig.items_to_show ?? 2.3);
          const itemsToShowMobile = Number(rowConfig.items_to_show_mobile ?? 1.2);
          const gapVal = rowConfig.grid_gap !== undefined ? Number(rowConfig.grid_gap) : 12;
          const showBullets = parseBoolSetting(rowConfig.show_bullets, true);
          const showScrollButtons = parseBoolSetting(rowConfig.show_scroll_buttons, true);
          const autoScroll = parseBoolSetting(rowConfig.auto_scroll, false);
          const autoScrollTime = Number(rowConfig.auto_scroll_time ?? 3);

          return (
            <div key={rIdx} className={wrapperClass}>
              <div
                className={`relative group ${innerClass}`}
                style={{
                  padding,
                }}
              >
                {showScrollButtons && (
                  <RowSwiperNavigation rIdx={rIdx} />
                )}

                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={gapVal}
                  slidesPerView={itemsToShowMobile}
                  breakpoints={{
                    640: {
                      slidesPerView: itemsToShow,
                    },
                  }}
                  pagination={
                    showBullets
                      ? {
                          clickable: true,
                          bulletClass: "swiper-pagination-bullet !bg-default-500",
                          bulletActiveClass: "swiper-pagination-bullet-active !bg-primary",
                        }
                      : false
                  }
                  navigation={
                    showScrollButtons
                      ? {
                          prevEl: `.hb-prev-${rIdx}`,
                          nextEl: `.hb-next-${rIdx}`,
                        }
                      : false
                  }
                  autoplay={
                    autoScroll
                      ? {
                          delay: autoScrollTime * 1000,
                          disableOnInteraction: false,
                          pauseOnMouseEnter: true,
                        }
                      : false
                  }
                  className="w-full !pb-8"
                >
                  {row.items.map((item, index) => {
                    const desktopSrc = homeItemImage(item);
                    const mobileSrc = item.mobile_image || desktopSrc;
                    const altText = item.config?.alt || item.title || "";
                    const linkHref = homeItemHref(item as any);
                    const hasLink = linkHref && linkHref !== "#";

                    const aspectRatio = item.config?.aspect_ratio || "original";
                    let cssAspectRatio = "auto";
                    if (aspectRatio !== "original") {
                      cssAspectRatio = aspectRatio.replace(":", " / ");
                    }
                    const isOriginal = aspectRatio === "original";

                    const slideContent = (
                      <div
                        className={`w-full overflow-hidden block relative ${isOriginal ? "" : "h-full"} ${hoverClasses}`}
                        style={{
                          aspectRatio: isOriginal ? "auto" : cssAspectRatio,
                          borderRadius,
                        }}
                      >
                        <picture className="block w-full h-full">
                          {desktopSrc && <source media="(min-width: 640px)" srcSet={desktopSrc} />}
                          <img
                            alt={altText}
                            src={mobileSrc || desktopSrc}
                            className="w-full object-cover"
                            style={{
                              borderRadius,
                              height: isOriginal ? "auto" : "100%",
                            }}
                            loading="lazy"
                          />
                        </picture>
                      </div>
                    );

                    return (
                      <SwiperSlide key={item.id ?? index} className="h-auto">
                        {hasLink ? (
                          <Link
                            href={linkHref}
                            className="block w-full h-full"
                            title={item.title ?? undefined}
                          >
                            {slideContent}
                          </Link>
                        ) : (
                          <div className="w-full h-full">{slideContent}</div>
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </div>
          );
        }

        // Render Grid mode
        const desktopLayout = calculateSpans(row.items, false);
        const mobileLayout = calculateSpans(row.items, true);

        const itemStylesMap = row.items.map((item, idx) => {
          const dSpan = desktopLayout.find((l) => l.item.id === item.id || (l.item.id === null && row.items.indexOf(l.item) === idx))?.span ?? 12;
          const mSpan = mobileLayout.find((l) => l.item.id === item.id || (l.item.id === null && row.items.indexOf(l.item) === idx))?.span ?? 12;

          const desktopColSpanClass = getDesktopColSpan(dSpan);
          const mobileColSpanClass = getMobileColSpan(mSpan);

          const aspectRatio = item.config?.aspect_ratio || "original";
          let cssAspectRatio = "auto";
          if (aspectRatio !== "original") {
            cssAspectRatio = aspectRatio.replace(":", " / ");
          }

          return {
            item,
            className: `${mobileColSpanClass} ${desktopColSpanClass} overflow-hidden block relative w-full ${hoverClasses}`,
            cssAspectRatio,
          };
        });

        return (
          <div key={rIdx} className={wrapperClass}>
            <div
              className={`grid grid-cols-12 ${innerClass}`}
              style={{
                padding,
                gap,
              }}
            >
              {itemStylesMap.map(({ item, className, cssAspectRatio }, index) => {
                const desktopSrc = homeItemImage(item);
                const mobileSrc = item.mobile_image || desktopSrc;
                const altText = item.config?.alt || item.title || "";
                const linkHref = homeItemHref(item as any);
                const hasLink = linkHref && linkHref !== "#";

                const isOriginal = item.config?.aspect_ratio === "original" || !item.config?.aspect_ratio;

                const cardContent = (
                  <div
                    className={`w-full relative ${isOriginal ? "" : "h-full"}`}
                    style={{
                      aspectRatio: isOriginal ? "auto" : cssAspectRatio,
                      borderRadius,
                    }}
                  >
                    <picture className="block w-full h-full">
                      {desktopSrc && <source media="(min-width: 640px)" srcSet={desktopSrc} />}
                      <img
                        alt={altText}
                        src={mobileSrc || desktopSrc}
                        className="w-full object-cover"
                        style={{
                          borderRadius,
                          height: isOriginal ? "auto" : "100%",
                        }}
                        loading="lazy"
                      />
                    </picture>
                  </div>
                );

                return hasLink ? (
                  <Link
                    key={item.id ?? index}
                    href={linkHref}
                    className={className}
                    title={item.title ?? undefined}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div key={item.id ?? index} className={className}>
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(HomePlayImageGrid);
