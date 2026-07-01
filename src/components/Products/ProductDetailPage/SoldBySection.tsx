import { Product } from "@/types/ApiResponse";
import { Card, CardHeader, Avatar } from "@heroui/react";
import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react"; // ⭐ Lucide icon

const SoldBySection: FC<{ product: Product }> = ({ product }) => {
  const { t } = useTranslation();
  const { seller, variants, seller_ratings } = product || {};
  const defaultVariant = variants?.[0];
  const seller_rating = seller_ratings?.average_rating || 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-3">
        <Avatar
          size="lg"
          src="https://placehold.co/600x400/000000/FFFFFF.png?text=Seller"
          name={seller || t("soldBySection.noLogo")}
          radius="lg"
        />
        <div className="flex flex-col">
          <div className="flex gap-2 justify-start items-center">
            <h3 className="text-medium font-semibold">
              {seller || t("soldBySection.noSellerInfo")}
            </h3>

            {/* Seller rating */}
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">
                {!isNaN(Number(seller_rating))
                  ? Number(seller_rating).toFixed(1)
                  : ""}
              </span>
            </div>
          </div>

          {/* Store link */}
          {defaultVariant?.store_slug && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-foreground/50">
                {t("soldBySection.storeLabel")}
              </span>
              <Link
                href={`/stores/${defaultVariant.store_slug}`}
                className="text-xs text-foreground/50"
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
