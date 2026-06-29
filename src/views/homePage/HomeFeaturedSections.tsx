import { FC, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import ProductCard from "@/components/Cards/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { Boxes } from "lucide-react";
import { HomeSection } from "@/types/ApiResponse";
import Link from "next/link";
import { isRTL } from "@/helpers/functionalHelpers";
import SwiperNavigation from "@/components/SwiperNavigation";

interface HomeFeaturedSectionsProps {
  // A single home-layout section of type "products".
  section: HomeSection;
}

const encodeUrl = (url: string) =>
  url.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\s/g, "%20");

const HomeFeaturedSections: FC<HomeFeaturedSectionsProps> = ({ section }) => {
  const { t, i18n } = useTranslation();

  const products = section.content?.products ?? [];
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  if (products.length === 0) return null;

  const bgImage =
    section.background_image || section.card_background_image || "";
  const hasBackground = Boolean(bgImage);
  const backgroundStyle = hasBackground
    ? {
        backgroundImage: `url("${encodeUrl(bgImage)}")`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }
    : {};

  const carousel = (
    <div className="relative group">
      <SwiperNavigation prevRef={prevRef} nextRef={nextRef} rtl={rtl} />

      <Swiper
        key={rtl ? `rtl-hfs-${section.id}` : `ltr-hfs-${section.id}`}
        dir={rtl ? "rtl" : "ltr"}
        slidesPerView={2}
        spaceBetween={4}
        breakpoints={{
          640: { slidesPerView: 3, spaceBetween: 12 },
          1024: { slidesPerView: 4, spaceBetween: 12 },
          1280: { slidesPerView: 5, spaceBetween: 12 },
          1440: { slidesPerView: 7, spaceBetween: 12 },
        }}
        lazyPreloadPrevNext={0}
        modules={[Navigation]}
        onBeforeInit={(swiper) => {
          const nav = swiper.params.navigation;
          if (nav && typeof nav !== "boolean") {
            nav.prevEl = prevRef.current;
            nav.nextEl = nextRef.current;
          }
        }}
        navigation={true}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <div className="py-0.5">
              <ProductCard product={product} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );

  return (
    <section id={`featured-section-${section.id}`}>
      <div className="w-full mb-4">
        <div className="mb-8">
          {!hasBackground ? (
            <>
              <div className="flex justify-between w-full items-center mb-6">
                <SectionHeading
                  title={section.title || ""}
                  description=""
                  icon={<Boxes size={16} className="text-white" />}
                />
                <Link
                  href="/products"
                  className="text-xs sm:text-sm"
                  title={t("see_all")}
                >
                  {t("see_all")}
                </Link>
              </div>
              {carousel}
            </>
          ) : (
            <div className="relative pt-5">
              <div
                className="rounded-xl overflow-hidden absolute top-0 left-0 right-0 aspect-2/1 md:aspect-5/1"
                style={backgroundStyle}
              />
              <div className="relative px-1 sm:px-6 pt-[2%] pb-2">
                <div className="flex justify-between w-full items-center mb-6">
                  <div>
                    <SectionHeading
                      title={section.title || ""}
                      description=""
                      icon={<Boxes size={16} className="text-white" />}
                    />
                  </div>
                  <Link
                    href="/products"
                    title={t("see_all")}
                    className="inline-flex items-center justify-center bg-gray-100 dark:bg-content1 px-2 py-1 text-xs font-medium rounded-xl border-gray-100 dark:border-default-100 transition hover:opacity-80"
                  >
                    {t("see_all")}
                  </Link>
                </div>
                {carousel}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedSections;
