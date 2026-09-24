import { FC } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

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

  const refundLabel = item.refund
    ? item.refund.status === "issued"
      ? t("orderRefunds.completed", "Refund completed")
      : item.refund.status === "failed"
        ? t("orderRefunds.status.failed", "Refund needs attention")
        : t("orderRefunds.initiated", "Refund initiated")
    : null;
  const statusLabel = item.customer_status?.label || item.status_label;
  const statusColor = orderStatusColorMap(item.customer_status?.code);
  const refundColor = item.refund?.status === "issued"
    ? "success"
    : item.refund?.status === "failed"
      ? "danger"
      : "primary";
  const refundSurface = item.refund?.status === "issued"
    ? "bg-success-50"
    : item.refund?.status === "failed"
      ? "bg-danger-50"
      : "bg-primary-50";
  const orderSlug = item.order?.slug || item.slug;
  const productImage = item.product?.image || item.variant?.image || null;
  const productName = item.product?.name || item.title;
  const orderDate = getFormattedDate(item.order?.order_date || item.created_at);

  return (
    <Link
      href={`/my-account/orders/${orderSlug}?item=${item.id}`}
      className="block rounded-medium border border-divider bg-content1 p-3.5 transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex items-center gap-3.5">
        {/* Thumbnail */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-medium bg-primary-50">
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
          <div className="truncate text-[13.5px] font-semibold text-foreground">
            {t("orderId", { id: item.order_id })}
          </div>
          <div className="truncate text-xs text-default-500">
            {orderDate}
            {productName ? ` · ${productName}` : ""}
          </div>
          {item.store?.name && (
            <div className="truncate text-[11px] text-default-400">
              {item.store.name}
            </div>
          )}
          {item.is_user_review_given && item.user_review?.rating && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-warning-600">
              <Icon icon="solar:star-bold" width={13} height={13} />
              <span>{item.user_review.rating}/5</span>
              {item.user_review.title && (
                <span className="truncate font-normal text-default-500">· {item.user_review.title}</span>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <Chip
          size="sm"
          radius="full"
          variant="flat"
          color={statusColor}
          classNames={{ content: "text-[11px] font-semibold" }}
          title={statusLabel}
        >
          {statusLabel}
        </Chip>

        {/* Total */}
        <div className="min-w-[70px] shrink-0 text-end text-sm font-bold text-foreground">
          {formatPrice(item.subtotal)}
        </div>
      </div>

      {item.refund && refundLabel && (
        <div className={`mt-3 flex items-center gap-3 rounded-medium px-3 py-2.5 ${refundSurface}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-content1 text-primary shadow-sm">
            <Icon icon="solar:wallet-money-bold-duotone" width={20} height={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground">{refundLabel}</div>
            <div className="truncate text-[11px] text-default-500">
              {t(`orderRefunds.method.${item.refund.method || "manual"}`)}
              {(item.refund.issued_at || item.refund.created_at) && (
                <> · {getFormattedDate(item.refund.issued_at || item.refund.created_at)}</>
              )}
            </div>
          </div>
          <div className="text-end">
            <div className="text-sm font-bold text-foreground">
              {formatPrice(item.refund.amount)}
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};

export default OrderCard;
