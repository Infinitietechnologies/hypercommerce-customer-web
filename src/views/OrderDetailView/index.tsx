import type {
  Order,
  OrderItem,
} from "@/types/ApiResponse";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import {
  Button,
  Card,
  Chip,
  Link,
  Sheet,
  useDisclosure,
  toastError,
  toastSuccess,
} from "@/components/ui";
import { reorderOrder } from "@/routes/api";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHead from "@/SEO/PageHead";
import { useCurrency } from "@/components/Functional/Price";
import { getFormattedDate } from "@/helpers/getters";
import { orderStatusColorMap } from "@/config/constants";
import CancelItemSheet from "./CancelItemSheet";
import RatingModal from "@/components/Modals/RatingModal";
import OrderItemReviewCard from "@/components/Modals/OrderItemReviewCard";
import OrderAttachments from "./OrderAttachments";
import ShippingInfo from "./ShippingInfo";
import DeliveryInfo from "./DeliveryInfo";
import ReturnSheet from "./ReturnSheet";
import { deliveryTimeline, deliveryMilestones, flattenTimeline, getItemTimeline } from "./timeline";
import OrderTimeline from "./OrderTimeline";
import { timelineLabels } from "./timeline";
import ItemAdjustmentDetails from "./ItemAdjustmentDetails";
import ItemQuantityDetails from "./ItemQuantityDetails";
import OrderSummaryCard from "./OrderSummaryCard";

interface OrderDetailPageViewProps {
  order: Order;
}

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                       */
/* -------------------------------------------------------------------------- */

function Thumb({ item, size = 64 }: { item: OrderItem; size?: number }) {  const img = item.product?.image || item.variant?.image || null;
  return (
    <div
      className="shrink-0 overflow-hidden rounded-medium bg-primary-50 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <span className="line-clamp-2 px-1 text-center text-[10px] font-medium text-primary-600">
          {item.product?.name || item.title}
        </span>
      )}
    </div>
  );
}

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-default-500">{label}</span>
      <span className="font-medium text-foreground text-end">{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const OrderDetailPageView: React.FC<OrderDetailPageViewProps> = ({ order }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatWith } = useCurrency();

  const formatPrice = (amount: number | string | null | undefined) =>
    formatWith(amount, order.currency_symbol, order.format);

  const items = useMemo(() => order.items ?? [], [order.items]);

  const selectedId = Number(router.query.item) || items[0]?.id;
  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  // Swap items WITHOUT a network call — everything is already in the payload.
  const selectItem = (id: number) =>
    router.push(
      { pathname: router.pathname, query: { ...router.query, item: id } },
      undefined,
      { shallow: true, scroll: true },
    );

  const [reordering, setReordering] = useState(false);
  const timelineSheet = useDisclosure();
  const cancelSheet = useDisclosure();
  const returnSheet = useDisclosure();
  const ratingSheet = useDisclosure();

  const handleReorder = async () => {
    setReordering(true);
    try {
      const res = await reorderOrder(order.id);
      if (res.success) {
        toastSuccess(t("pages.order.reorderSuccess", "Items added to your cart"));
        router.push("/cart");
      } else {
        toastError(res.message || t("pages.order.reorderFailed", "Couldn't reorder"));
      }
    } catch {
      toastError(t("pages.order.reorderFailed", "Couldn't reorder"));
    } finally {
      setReordering(false);
    }
  };

  if (!selected) {
    return (
      <>
        <PageHead pageTitle={`${t("order")} #${order?.id || ""}`} />
        <div className="p-8 text-center text-default-500">
          {t("pages.order.notFound")}
        </div>
      </>
    );
  }

  const activeReturn = selected.returns?.find(
    (r) => r.return_status !== "cancelled" && r.return_status !== "declined",
  );
  const allSteps = getItemTimeline(selected, order.refunds, (key) => t(key, { defaultValue: timelineLabels[key] || key }), order.payment_method);
  const deliverySteps = deliveryTimeline(allSteps, selected);
  const mainSteps = selected.tracking?.milestones ?? deliveryMilestones(deliverySteps);
  const showQuantity = selected.quantity_summary?.ordered !== 1;
  const timelineEvents = selected.tracking?.history ?? flattenTimeline(deliverySteps);
  const currentStatus = selected.customer_status;
  const addons = selected.addons ?? [];
  const attachments = selected.attachments ?? [];

  const savings =
    Number(order.promo_discount || 0) + Number(order.gift_card_discount || 0);

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/orders", label: t("myOrders") },
          { href: "#", label: `${t("order")} #${order.id}` },
        ]}
      />
      <PageHead pageTitle={`${t("order")} #${order?.id || ""}`} />

      {/* Back + order id */}
      <div className="mb-4 flex items-center gap-3">
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={() => router.push("/my-account/orders")}
          aria-label={t("pages.order.backToList")}
        >
          <Icon icon="solar:arrow-left-linear" className="h-4 h-4" width={18} height={18} />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight">
            {t("pages.order.details")}
          </h1>
          <p className="text-xs text-default-500">
            {t("orderId", { id: order.id })} · {getFormattedDate(order.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* MAIN — selected item */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Hero */}
          <Card shadow="none" radius="lg" className="border border-divider">
            <div className="flex gap-4 p-4">
              {selected.product?.slug ? (
                <Link href={`/products/${selected.product.slug}`} className="shrink-0">
                  <Thumb item={selected} size={72} />
                </Link>
              ) : (
                <Thumb item={selected} size={72} />
              )}
              <div className="min-w-0 flex-1">
                {selected.product?.brand && (
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-default-500">
                    {selected.product.brand}
                  </div>
                )}
                {selected.product?.slug ? (
                  <Link
                    href={`/products/${selected.product.slug}`}
                    className="block font-semibold text-foreground line-clamp-2 hover:text-primary-600"
                  >
                    {selected.product?.name || selected.title}
                  </Link>
                ) : (
                  <div className="font-semibold text-foreground line-clamp-2">
                    {selected.product?.name || selected.title}
                  </div>
                )}
                {selected.variant_title && (
                  <div className="text-xs text-default-500 mt-0.5">
                    {selected.variant_title}
                  </div>
                )}
                <div className="text-xs text-default-500 mt-0.5">
                  {selected.quantity_summary?.ordered != null
                    ? `${t("orderQuantities.ordered", "Quantity ordered")}: ${selected.quantity_summary.ordered}`
                    : `${t("qty")}: ${selected.quantity}`}
                </div>
                <ItemQuantityDetails item={selected} />
                <div className="mt-1 text-sm font-bold">
                  {formatPrice(selected.subtotal)}
                </div>
                {addons.length > 0 && (
                  <div className="mt-2 border-t border-divider pt-2">
                    <div className="text-[10px] font-bold uppercase text-default-500">
                      {t("addons") || "Add-ons"}
                    </div>
                    <ul className="mt-0.5 space-y-0.5">
                      {addons.map((a) => (
                        <li key={a.id} className="text-[11px] text-default-500">
                          {(a.group?.title ? `${a.group.title}: ` : "") +
                            (a.item?.title ?? "")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="mt-2 border-t border-divider pt-2">
                    <div className="text-[10px] font-bold uppercase text-default-500">
                      {t("attachments")}
                    </div>
                    <OrderAttachments attachments={attachments} />
                  </div>
                )}
              </div>
              <Chip
                size="sm"
                radius="full"
                variant="flat"
                color={orderStatusColorMap(currentStatus?.code)}
                classNames={{ content: "text-[11px] font-semibold" }}
              >
                {selected.tracking?.status.label || currentStatus?.label || selected.status_label}
              </Chip>
            </div>
          {/* Main-status timeline (short) + view full */}
          {mainSteps.length > 0 && (
            <section className="border-t border-divider p-4">
              {currentStatus && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {selected.tracking?.status.label || [...mainSteps].reverse().find((step) => step.done)?.label || currentStatus.label}
                    </div>
                    {showQuantity && <div className="text-xs text-default-500">{t("orderUpdates.deliveryQuantity", { count: selected.quantity_summary?.current ?? selected.quantity, defaultValue: "Delivery · Qty: {{count}}" })}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={timelineSheet.onOpen}
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-600"
                  >
                    {t("pages.order.seeAllUpdates", "See all updates")}
                    <Icon icon="solar:alt-arrow-right-linear" width={14} height={14} />
                  </button>
                </div>
              )}
              <OrderTimeline key={selected.id} steps={mainSteps} showQuantity={showQuantity} />
              {selected.tracking?.exceptions.map((exception) => <p key={exception.code} role="status" className={`mt-3 rounded-small p-3 text-xs ${exception.tone === "danger" ? "bg-danger-50 text-danger" : "bg-warning-50 text-warning-700"}`}>{exception.label}</p>)}
            </section>
          )}

          {/* Refund / return */}
          <div className="px-4 pb-4"><ItemAdjustmentDetails item={selected} refunds={order.refunds} steps={allSteps} formatPrice={formatPrice} /></div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              size="md"
              variant="bordered"
              startContent={<Icon icon="solar:chat-round-dots-linear" />}
              onPress={() => router.push(`/my-account/support?order=${order.id}`)}
            >
              {t("supportChat.getHelp")}
            </Button>
            <Button
              size="md"
              color="primary"
              startContent={<Icon icon="solar:refresh-circle-linear" />}
              isLoading={reordering}
              onPress={handleReorder}
            >
              {t("pages.order.reorder", "Reorder")}
            </Button>
            {selected.can_cancel && (
              <Button
                size="md"
                variant="bordered"
                startContent={<Icon icon="solar:close-circle-linear" />}
                onPress={cancelSheet.onOpen}
              >
                {t("cancel")}
              </Button>
            )}
            {selected.can_return && !activeReturn && (
              <Button
                size="md"
                variant="bordered"
                startContent={<Icon icon="solar:refresh-linear" />}
                onPress={returnSheet.onOpen}
              >
                {t("return")}
              </Button>
            )}
            {selected.customer_status?.code === "delivered" && !selected.is_user_review_given && (
              <Button
                size="md"
                variant="bordered"
                startContent={<Icon icon="solar:star-linear" />}
                onPress={ratingSheet.onOpen}
              >
                {t("pages.order.rateProduct", "Rate this product")}
              </Button>
            )}
            {selected.is_user_review_given && (
              <OrderItemReviewCard
                userReview={selected.user_review}
                onUpdated={() => router.replace(router.asPath)}
              />
            )}
            {order.invoice && order.status !== "cancelled" && (
              <Button
                size="md"
                variant="bordered"
                startContent={<Icon icon="solar:download-minimalistic-linear" />}
                onPress={() => window.open(order.invoice, "_blank")}
              >
                {t("invoice")}
              </Button>
            )}
          </div>

          <OrderSummaryCard order={order} formatPrice={formatPrice} />

          {/* Payment + sold by */}
          <Card shadow="none" radius="lg" className="border border-divider p-4 space-y-1">
            <LabelValue
              label={t("paymentMethod")}
              value={(order.payment_method || "-").toUpperCase()}
            />
            {order.payment_status && (
              <div className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="text-default-500">{t("paymentStatus")}</span>
                <Chip
                  size="sm"
                  radius="full"
                  variant="flat"
                  color={
                    order.payment_status === "completed"
                      ? "success"
                      : order.payment_status === "pending"
                        ? "warning"
                        : order.payment_status === "refunded" ||
                            order.payment_status === "partially_refunded"
                          ? "secondary"
                          : "danger"
                  }
                  classNames={{ content: "text-[11px] font-semibold capitalize" }}
                >
                  {order.payment_status.replace(/_/g, " ")}
                </Chip>
              </div>
            )}
            {selected.seller_name && (
              <LabelValue
                label={t("soldBySection.sellerLabel", "Sold by")}
                value={selected.seller_name}
              />
            )}
            {savings > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-medium bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
                <Icon icon="solar:tag-price-bold" width={16} height={16} />
                {t("pages.order.youSaved", "You saved")} {formatPrice(savings)}{" "}
                {t("pages.order.onThisOrder", "on this order")}
              </div>
            )}
          </Card>
        </div>

        {/* SIDE — item switcher + address + meta (below on mobile) */}
        <div className="flex flex-col gap-4 min-w-0">
          {items.length > 1 && (
            <Card shadow="none" radius="lg" className="border border-divider p-4">
              <div className="mb-3 text-sm font-semibold">
                {t("pages.order.otherItems", "Other items in this order")}
              </div>
              <div className="flex flex-col gap-2">
                {items.map((it) => {
                  const active = it.id === selected.id;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => selectItem(it.id)}
                      className={`flex items-center gap-3 rounded-medium border p-2 text-start transition-colors ${
                        active
                          ? "border-primary bg-primary-50"
                          : "border-divider hover:border-primary"
                      }`}
                    >
                      <Thumb item={it} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium line-clamp-1">
                          {it.product?.name || it.title}
                        </div>
                        <div className="text-[11px] text-default-500">
                          {it.customer_status?.label || it.status_label} ·{" "}
                          {formatPrice(it.subtotal)}
                        </div>
                      </div>
                      {active && (
                        <Icon icon="solar:check-circle-bold" className="text-primary-600" width={18} height={18} />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <ShippingInfo order={order} />

          <DeliveryInfo order={order} />

          <Card shadow="none" radius="lg" className="border border-divider p-4 space-y-1">
            <div className="mb-1 text-sm font-semibold">
              {t("pages.order.orderDetails", "Order details")}
            </div>
            <LabelValue
              label={t("pages.order.orderedOn", "Ordered on")}
              value={getFormattedDate(order.created_at)}
            />
            <LabelValue label={t("order_id")} value={`#${order.id}`} />
          </Card>

          {order.order_note && (
            <Card shadow="none" radius="lg" className="border border-divider p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Icon icon="solar:notes-linear" width={16} height={16} className="text-primary-600" />
                {t("orderNote", "Order note")}
              </div>
              <p className="text-sm text-default-500">{order.order_note}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Full timeline sheet */}
      <Sheet
        isOpen={timelineSheet.isOpen}
        onClose={timelineSheet.onClose}
        title={t("pages.order.trackingTitle", "Order updates")}
        size="lg"
      >
        <div className="pb-2">
          {timelineEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-default-500">
              {t("pages.order.noUpdates", "No updates yet.")}
            </p>
          ) : (
            timelineSheet.isOpen && <div className="space-y-4">
              {selected.tracking && <p className="text-sm font-semibold">{selected.tracking.status.label}</p>}
              <OrderTimeline key={selected.id} events={timelineEvents} formatPrice={formatPrice} showQuantity={showQuantity} />
              {selected.tracking?.exceptions.map((exception) => <p key={exception.code} role="status" className={`rounded-small p-3 text-xs ${exception.tone === "danger" ? "bg-danger-50 text-danger" : "bg-warning-50 text-warning-700"}`}>{exception.label}</p>)}
              <ItemAdjustmentDetails item={selected} refunds={order.refunds} steps={allSteps} formatPrice={formatPrice} />
            </div>
          )}
        </div>
      </Sheet>

      {/* Mutations reuse the existing sheets/modals (services already wired). */}
      <CancelItemSheet
        key={selected.id}
        isOpen={cancelSheet.isOpen}
        onClose={cancelSheet.onClose}
        item={selected}
        onDone={() => { cancelSheet.onClose(); router.replace(router.asPath); }}
      />
      <ReturnSheet
        key={`return-${selected.id}`}
        isOpen={returnSheet.isOpen}
        onClose={returnSheet.onClose}
        item={selected}
        onDone={() => router.replace(router.asPath)}
      />
      {selected.product_id && (
        <RatingModal
          isOpen={ratingSheet.isOpen}
          onClose={ratingSheet.onClose}
          productId={selected.product_id}
          orderItemId={selected.id}
          onSuccess={() => router.replace(router.asPath)}
          type="product"
        />
      )}
    </>
  );
};

export default OrderDetailPageView;
