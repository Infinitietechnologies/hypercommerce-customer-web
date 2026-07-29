import { FC } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Chip, Image } from "@/components/ui";
import { OrderListItem } from "@/types/ApiResponse";
import { getFormattedDate } from "@/helpers/getters";
import { orderStatusColorMap } from "@/config/constants";
import { useCurrency } from "@/components/Functional/Price";

interface OrderCardProps {
  /** One flat order ITEM (the list endpoint is now per-item). */
  item: OrderListItem;
  /** Retained for API compatibility; the row has no inline mutations. */
  onChanged?: () => void;
}

/**
 * Order list row — amber redesign. A single clickable row (image · order id +
 * date · status · total), matching the `/redesign/account?tab=orders` pane.
 * Inline actions (reorder / cancel / return) live on the order detail screen.
 */
const OrderCard: FC<OrderCardProps> = ({ item }) => {
  const { formatWith } = useCurrency();
  const { t } = useTranslation();

  // Amounts are stored in the ORDER's own currency, so format with the order's
  // symbol + format rules (not the shopper's currently-selected market).
  const formatPrice = (amount: number | string | null | undefined) =>
    formatWith(
      amount,
      item.order?.currency_symbol ?? undefined,
      item.order?.format,
    );

  const statusLabel = item.customer_status?.label || item.status_label;
  const orderSlug = item.order?.slug || item.slug;
  const productImage = item.product?.image || item.variant?.image || null;
  const productName = item.product?.name || item.title;
  const orderDate = getFormattedDate(item.order?.order_date || item.created_at);

  return (
    <Link
      href={`/my-account/orders/${orderSlug}?item=${item.id}`}
      className="flex items-center gap-3.5 rounded-medium border border-divider bg-content1 p-3.5 shadow-sm transition-all hover:border-primary hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-medium bg-primary-50 flex items-center justify-center">
        {productImage ? (
          <Image
            src={productImage}
            alt={productName || t("na")}
            radius="none"
            className="h-14 w-14 object-cover"
            classNames={{ wrapper: "h-14 w-14" }}
          />
        ) : (
          <span className="line-clamp-2 px-1 text-center text-[10px] font-medium text-primary-600">
            {productName || t("na")}
          </span>
        )}
      </div>

      {/* Order id + date + product */}
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold truncate text-foreground">
          {t("orderId", { id: item.order_id })}
        </div>
        <div className="text-xs text-default-500 truncate">
          {orderDate}
          {productName ? ` · ${productName}` : ""}
        </div>
        {item.store?.name && (
          <div className="text-[11px] text-default-400 truncate">
            {item.store.name}
          </div>
        )}
      </div>

      {/* Status */}
      <Chip
        size="sm"
        radius="full"
        variant="flat"
        color={orderStatusColorMap(item.customer_status?.code)}
        classNames={{ content: "text-[11px] font-semibold" }}
        title={statusLabel}
      >
        {statusLabel}
      </Chip>

      {/* Total */}
      <div className="min-w-[70px] shrink-0 text-right text-sm font-bold text-foreground">
        {formatPrice(item.subtotal)}
      </div>
    </Link>
  );
};

export default OrderCard;
