import { Product } from "@/types/ApiResponse";
import { Card, CardHeader, Avatar, Link } from "@/components/ui";
import { Icon } from "@iconify/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

const SoldBySection: FC<{ product: Product }> = ({ product }) => {
  const { t } = useTranslation();
  const { seller, variants, seller_ratings } = product || {};
  const defaultVariant = variants?.[0];
  const seller_rating = seller_ratings?.average_rating || 0;

  return (
    <Card className="w-full border border-divider" shadow="none">
      <CardHeader className="flex items-center gap-3">
        <Avatar
          size="lg"
          name={seller || t("soldBySection.noLogo")}
          radius="lg"
          className="bg-primary-100 text-primary-600"
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {seller || t("soldBySection.noSellerInfo")}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary-100 px-1.5 py-0.5 text-xs font-bold text-primary-600">
              <Icon icon="solar:star-bold" className="text-[12px]" />
              {!isNaN(Number(seller_rating))
                ? Number(seller_rating).toFixed(1)
                : ""}
            </span>
          </div>

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
      </CardHeader>
    </Card>
  );
};

export default SoldBySection;
