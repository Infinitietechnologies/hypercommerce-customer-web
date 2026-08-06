import { sanitizeHtml } from "@/helpers/sanitizeHtml";
import React, { useState } from "react";
import { Avatar, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Store } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";

interface StoreProfileProps {
  store: Store;
}

const InfoRow = ({
  icon,
  children,
  href,
}: {
  icon: string;
  children: React.ReactNode;
  href?: string;
}) => {
  const inner = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-content1 text-foreground/60">
        <Icon icon={icon} className="text-base" />
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </>
  );

  const className =
    "flex items-center gap-2.5 rounded-xl bg-content2 px-3 py-2.5 text-sm text-foreground/70";

  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`${className} transition-colors hover:text-foreground`}
    >
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
};

const StoreProfile: React.FC<StoreProfileProps> = ({ store }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<{ src: string }[]>([]);

  const ratingNum = parseFloat(store.avg_store_rating);
  const rating = Number.isFinite(ratingNum) ? ratingNum.toFixed(1) : "0.0";
  const hasRating = (store.total_store_feedback ?? 0) > 0 && ratingNum > 0;
  const lat = store.latitude;
  const lng = store.longitude;
  const isOpen = store.status?.is_open;

  const openLightbox = (clicked: "banner" | "avatar") => {
    const banner = store.banner || "/images/roof.png";
    const avatar = store.logo || "/images/roof.png";
    setSlides(
      clicked === "avatar"
        ? [{ src: avatar }, { src: banner }]
        : [{ src: banner }, { src: avatar }],
    );
    setOpen(true);
  };

  return (
    <div className="w-full overflow-hidden rounded-large border border-divider bg-content1">
      <Lightbox open={open} close={() => setOpen(false)} slides={slides} />

      {/* Banner */}
      <div
        className="relative aspect-[3/1] max-h-[300px] w-full cursor-pointer bg-content2"
        onClick={() => openLightbox("banner")}
      >
        <Image
          src={store.banner || "/images/roof.png"}
          alt={`${store.name} banner`}
          className="absolute inset-0 h-full w-full object-cover"
          removeWrapper
          radius="none"
        />
      </div>

      {/* Body */}
      <div className="relative px-4 pb-6 sm:px-6">
        <div className="relative z-20 -mt-10 sm:-mt-12">
          <Avatar
            isBordered
            src={store.logo}
            alt={store.name}
            radius="lg"
            className="h-20 w-20 cursor-pointer border-4 border-content1 bg-content1 sm:h-24 sm:w-24"
            onClick={() => openLightbox("avatar")}
          />
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {store.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {store.is_recommended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    <Icon icon="solar:medal-ribbon-star-bold" className="text-sm" />
                    {t("recommended")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-content2 px-2.5 py-1 text-[11px] font-medium text-foreground/70">
                  <Icon icon="solar:box-linear" className="text-sm" />
                  {t("products_count", { count: store.product_count })}
                </span>
                {isOpen != null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      isOpen
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOpen ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {isOpen
                      ? t("store.open", { defaultValue: "Open" })
                      : t("store.closed", { defaultValue: "Closed" })}
                  </span>
                )}
              </div>
            </div>

            {hasRating && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-bold text-foreground">
                <Icon icon="solar:star-bold" className="text-base text-rating-star" />
                {rating}
                <span className="text-xs font-medium text-foreground/50">
                  ({store.total_store_feedback})
                </span>
              </span>
            )}
          </div>

          {store.description && (
            <div
              className="html-content max-w-3xl text-sm leading-relaxed text-foreground/60"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(store.description) }}
            />
          )}

          {/* Info */}
          {(store.timing ||
            store.address ||
            store.contact_number ||
            store.contact_email) && (
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {store.timing && (
                <InfoRow icon="solar:clock-circle-linear">{store.timing}</InfoRow>
              )}
              {store.address && (
                <InfoRow
                  icon="solar:map-point-linear"
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                >
                  {store.address}
                </InfoRow>
              )}
              {store.contact_number && (
                <InfoRow
                  icon="solar:phone-linear"
                  href={`tel:${store.contact_number}`}
                >
                  {store.contact_number}
                </InfoRow>
              )}
              {store.contact_email && (
                <InfoRow
                  icon="solar:letter-linear"
                  href={`mailto:${store.contact_email}`}
                >
                  {store.contact_email}
                </InfoRow>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
