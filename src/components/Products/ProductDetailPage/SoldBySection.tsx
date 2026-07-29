import { Product } from "@/types/ApiResponse";
import { Avatar, Link } from "@/components/ui";
import { Icon } from "@iconify/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import RatingStars from "@/components/RatingStars";

const SoldBySection: FC<{ product: Product }> = ({ product }) => {
  const { t } = useTranslation();
  const { seller, variants, seller_ratings } = product || {};
  const defaultVariant = variants?.[0];
  const rating = Number(seller_ratings?.average_rating) || 0;
  const totalReviews = seller_ratings?.total_reviews || 0;

  return (
    <div className="w-full rounded-2xl border border-divider bg-content1 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar
          size="lg"
          name={seller || t("soldBySection.noLogo")}
          radius="lg"
          className="shrink-0 bg-primary-50 text-primary-600"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              {seller || t("soldBySection.noSellerInfo")}
            </h3>
            {rating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-1.5 py-0.5 text-xs font-bold text-primary-600">
                <Icon icon="solar:star-bold" className="text-[12px]" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>

          {rating > 0 && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <RatingStars rating={rating} size={14} />
              </span>
              {totalReviews > 0 && (
                <span className="text-xs text-foreground/50">
                  {`( ${totalReviews} ${t("reviews")} )`}
                </span>
              )}
            </div>
          )}

          {defaultVariant?.store_slug && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">
                {t("soldBySection.storeLabel")}
              </span>
              <Link
                href={`/stores/${defaultVariant.store_slug}`}
                className="text-xs font-medium text-primary-600"
                title={defaultVariant.store_name}
              >
                {defaultVariant.store_name}
              </Link>
            </div>
          )}
        </div>

        {defaultVariant?.store_slug && (
          <Link
            href={`/stores/${defaultVariant.store_slug}`}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-divider px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary-600"
          >
            <Icon icon="solar:shop-2-linear" className="text-lg" />
            {t("soldBySection.visitStore", "Visit Store")}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SoldBySection;
