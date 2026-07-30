import React, { memo } from "react";
import { Avatar, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Store } from "@/types/ApiResponse";

interface StoreCardProps {
  store: Store;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const { t } = useTranslation();

  const ratingNum = parseFloat(store.avg_store_rating);
  const rating = Number.isFinite(ratingNum) ? ratingNum.toFixed(1) : "0.0";
  const hasRating = (store.total_store_feedback ?? 0) > 0 && ratingNum > 0;

  const distanceNum = Number(store.distance);
  const distanceLabel =
    Number.isFinite(distanceNum) && distanceNum > 0
      ? distanceNum < 1
        ? `${(distanceNum * 1000).toFixed(0)} m`
        : `${distanceNum.toFixed(1)} km`
      : null;

  return (
    <Link href={`/stores/${store.slug}`} title={store.name} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-large border border-divider bg-content1 transition-all duration-200 hover:border-default-300 hover:shadow-md">
        {/* Banner */}
        <div className="relative aspect-[16/9] w-full bg-content2">
          <Image
            src={store.banner || "/images/roof.png"}
            alt={store.name}
            className="absolute inset-0 h-full w-full object-cover"
            removeWrapper
            radius="none"
            loading="eager"
          />

          {store.is_recommended && (
            <span className="absolute left-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
              <Icon icon="solar:medal-ribbon-star-bold" className="text-xs" />
              {t("recommended")}
            </span>
          )}

          {hasRating && (
            <span className="absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-md bg-content1 px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow-sm">
              <Icon icon="solar:star-bold" className="text-xs text-rating-star" />
              {rating}
              <span className="font-medium text-foreground/40">
                ({store.total_store_feedback})
              </span>
            </span>
          )}

          {/* Logo avatar */}
          <div className="absolute -bottom-5 left-3 z-20">
            <Avatar
              isBordered
              src={store.logo}
              alt={store.name}
              radius="lg"
              className="h-12 w-12 border-2 border-content1 bg-content1 sm:h-14 sm:w-14"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-7">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
            {store.name}
          </h3>

          {(store.product_count != null || store.status?.is_open != null) && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {store.product_count != null && (
                <span className="inline-flex items-center gap-1 rounded-md bg-content2 px-1.5 py-0.5 font-medium text-foreground/70">
                  <Icon icon="solar:box-linear" className="text-[11px]" />
                  {t("products_count", { count: store.product_count })}
                </span>
              )}
              {store.status?.is_open != null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${
                    store.status.is_open
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full ${
                      store.status.is_open ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {store.status.is_open
                    ? t("store.open", { defaultValue: "Open" })
                    : t("store.closed", { defaultValue: "Closed" })}
                </span>
              )}
            </div>
          )}

          {store.address && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1 text-[11px] text-foreground/60">
                <Icon icon="solar:map-point-linear" className="shrink-0 text-xs" />
                <span className="truncate">{store.address}</span>
              </span>

              {distanceLabel && (
                <span className="shrink-0 rounded-md bg-content2 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                  {distanceLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default memo(StoreCard);
