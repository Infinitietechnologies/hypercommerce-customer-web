import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Spinner } from "@heroui/react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { WishlistItem } from "@/types/ApiResponse";

interface WishlistProductCardProps {
  item: WishlistItem;
  removing: boolean;
  onRemove: () => void;
}

const WishlistProductCard: React.FC<WishlistProductCardProps> = ({
  item,
  removing,
  onRemove,
}) => {
  const { formatPrice } = useSettings();
  const { t } = useTranslation();
  const price = item.variant?.price;

  return (
    <div className="group relative overflow-hidden rounded-large border border-divider bg-content1 shadow-sm transition-colors hover:border-primary">
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label={t("delete")}
        className="absolute end-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-content1/90 text-danger shadow-sm backdrop-blur transition-transform hover:scale-105 disabled:opacity-60"
      >
        {removing ? (
          <Spinner size="sm" color="danger" />
        ) : (
          <Icon icon="solar:heart-bold" width={16} height={16} />
        )}
      </button>

      <Link href={`/products/${item.product.slug}`} className="block">
        <div className="aspect-square bg-default-100">
          {item.product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.product.image}
              alt={item.product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon icon="solar:box-linear" width={28} height={28} className="text-default-300" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          <div className="line-clamp-2 min-h-[2.4em] text-[12.5px] font-medium text-foreground">
            {item.product.title}
          </div>
          {price != null && (
            <div className="mt-1 text-sm font-bold text-foreground">
              {formatPrice(price)}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default WishlistProductCard;
