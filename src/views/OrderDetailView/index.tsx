import type {
  Order,
  OrderItem,
  TimelineEvent,
  TimelineStep,
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
import CancelOrderItemModal from "@/components/Modals/CancelOrderItemModal";
import RatingModal from "@/components/Modals/RatingModal";
import ShippingInfo from "./ShippingInfo";
import ReturnSheet from "./ReturnSheet";
import { flattenTimeline } from "./timeline";

/** Amber/success/grey dot for a main tracker step. */
function stepTone(step: TimelineStep): { dot: string; line: string } {
  const exception = step.events?.some((e) => e.is_exception && e.done);
  if (exception) return { dot: "bg-warning border-warning", line: "bg-warning" };
  if (step.marker === "current")
    return { dot: "bg-primary border-primary", line: "bg-success" };
  if (step.done) return { dot: "bg-success border-success", line: "bg-success" };
  return { dot: "bg-content1 border-default-300", line: "bg-default-200" };
}

/** Compact horizontal main-status timeline (steps only). */
function StepTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="rd-hscroll flex items-start gap-0 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((s, i) => {
        const tone = stepTone(s);
        return (
          <div
            key={`${s.key}-${i}`}
            className="relative flex min-w-[92px] flex-1 flex-col items-center text-center"
          >
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-[6px] h-0.5 w-full ${
                  s.done ? tone.line : "bg-default-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 ${tone.dot}`}
            />
            <span className="mt-1.5 px-1 text-[11px] font-semibold leading-tight">
              {s.label || s.key}
            </span>
            {s.at && (
              <span className="text-[10px] text-default-500">
                {getFormattedDate(s.at)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
      <span className="font-medium text-foreground text-right">{value}</span>
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

  const [breakupOpen, setBreakupOpen] = useState(false);
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
  const allSteps = selected.timeline ?? [];
  const confirmedDone =
    allSteps.find((s) => s.key === "confirmed")?.done ?? false;
  // Short view = main statuses only. Regular: confirmed→shipped→delivered;
  // cancel+unpaid: placed→cancelled; cancel-after-pay: confirmed→cancelled→refunded.
  const mainSteps = allSteps.filter((s) => {
    if (s.key === "preparing") return false;
    if (s.key === "placed") return !confirmedDone;
    if (s.key === "confirmed") return confirmedDone;
    return ["shipped", "delivered", "cancelled", "returned", "refunded"].includes(
      s.key,
    );
  });
  const timelineEvents = flattenTimeline(selected.timeline);
  const currentStatus = selected.customer_status;
  const addons = selected.addons ?? [];

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
                  {t("qty") || "Qty"}: {selected.quantity}
                </div>
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
              </div>
              <Chip
                size="sm"
                radius="full"
                variant="flat"
                color={orderStatusColorMap(currentStatus?.code)}
                classNames={{ content: "text-[11px] font-semibold" }}
              >
                {currentStatus?.label || selected.status_label}
              </Chip>
            </div>
          </Card>

          {/* Main-status timeline (short) + view full */}
          {mainSteps.length > 0 && (
            <Card shadow="none" radius="lg" className="border border-divider p-4">
              {currentStatus && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {currentStatus.label}
                    </div>
                    {currentStatus.description && (
                      <div className="text-xs text-default-500 line-clamp-1">
                        {currentStatus.description}
                      </div>
                    )}
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
              <StepTimeline steps={mainSteps} />
            </Card>
          )}

          {/* Refund / return */}
          {activeReturn && (
            <Card shadow="none" radius="lg" className="border border-divider overflow-hidden">
              <div className="flex items-center gap-2 bg-success-50 px-4 py-3">
                <Icon icon="solar:box-bold" className="text-success" width={18} height={18} />
                <div>
                  <div className="text-sm font-semibold text-success-700">
                    {activeReturn.customer_status?.label ||
                      t("pages.order.refund", "Refund")}
                  </div>
                  {activeReturn.refund_processed_at && (
                    <div className="text-[11px] text-success-700/80">
                      {getFormattedDate(activeReturn.refund_processed_at)}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-1">
                <LabelValue
                  label={t("pages.order.refundAmount", "Total refund amount")}
                  value={formatPrice(activeReturn.refund_amount)}
                />
                {order.payment_method && (
                  <LabelValue
                    label={t("pages.order.refundedTo", "Refunded to")}
                    value={order.payment_method.toUpperCase()}
                  />
                )}
                {activeReturn.reason && (
                  <LabelValue
                    label={t("pages.order.reason", "Reason")}
                    value={activeReturn.reason}
                  />
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
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
            {selected.status === "delivered" && !selected.is_user_review_given && (
              <Button
                size="md"
                variant="bordered"
                startContent={<Icon icon="solar:star-linear" />}
                onPress={ratingSheet.onOpen}
              >
                {t("pages.order.rateProduct", "Rate this product")}
              </Button>
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

          {/* Price breakup */}
          <Card shadow="none" radius="lg" className="border border-divider">
            <button
              type="button"
              onClick={() => setBreakupOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 p-4"
            >
              <span className="text-sm font-semibold">
                {t("pages.order.totalItemPrice", "Total item price")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold">
                  {formatPrice(selected.subtotal)}
                </span>
                <Icon
                  icon={breakupOpen ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
                  width={16}
                  height={16}
                  className="text-default-500"
                />
              </span>
            </button>
            {breakupOpen && (
              <div className="border-t border-divider p-4 space-y-1">
                <LabelValue label={t("subtotal")} value={formatPrice(order.subtotal)} />
                <LabelValue
                  label={t("deliveryCharge")}
                  value={formatPrice(order.delivery_charge)}
                />
                {Number(order.platform_fee) > 0 && (
                  <LabelValue
                    label={t("checkout.platformFee", { defaultValue: "Platform fee" })}
                    value={formatPrice(order.platform_fee)}
                  />
                )}
                {Number(order.cod_fee) > 0 && (
                  <LabelValue
                    label={t("checkout.codFee", { defaultValue: "COD fee" })}
                    value={formatPrice(order.cod_fee)}
                  />
                )}
                {Number(order.promo_discount) > 0 && (
                  <LabelValue
                    label={t("discountAmount")}
                    value={`- ${formatPrice(order.promo_discount)}`}
                  />
                )}
                {Number(order.gift_card_discount) > 0 && (
                  <LabelValue
                    label={t("giftCardApplied")}
                    value={`- ${formatPrice(order.gift_card_discount)}`}
                  />
                )}
                {Number(order.wallet_balance) > 0 && (
                  <LabelValue
                    label={t("walletAmountUsed")}
                    value={`- ${formatPrice(order.wallet_balance)}`}
                  />
                )}
                <div className="mt-2 flex items-center justify-between border-t border-divider pt-2">
                  <span className="text-sm font-bold">
                    {t("finalTotal") || "Order total"}
                  </span>
                  <span className="text-base font-bold text-primary-600">
                    {formatPrice(order.final_total)}
                  </span>
                </div>
              </div>
            )}
          </Card>

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
                      className={`flex items-center gap-3 rounded-medium border p-2 text-left transition-colors ${
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

          <Card shadow="none" radius="lg" className="border border-divider p-4 space-y-1">
            <div className="mb-1 text-sm font-semibold">
              {t("pages.order.orderDetails", "Order details")}
            </div>
            <LabelValue
              label={t("pages.order.orderedOn", "Ordered on")}
              value={getFormattedDate(order.created_at)}
            />
            <LabelValue label={t("order_id")} value={`#${order.id}`} />
            {order.shipping_phone && (
              <LabelValue
                label={t("pages.order.updatesSentTo", "Updates sent to")}
                value={order.shipping_phone}
              />
            )}
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
            <ol className="relative ms-2">
              {timelineEvents.map((ev: TimelineEvent, i: number) => {
                const done = ev.done;
                const dot = ev.is_exception
                  ? "bg-warning border-warning"
                  : done
                    ? "bg-success border-success"
                    : "bg-content1 border-default-300";
                const line = i < timelineEvents.length - 1;
                return (
                  <li key={`${ev.code}-${i}`} className="relative ps-6 pb-5">
                    {line && (
                      <span
                        className={`absolute left-[5px] top-3 h-full w-0.5 ${
                          done ? "bg-success" : "bg-default-200"
                        }`}
                      />
                    )}
                    <span
                      className={`absolute left-0 top-1 h-3 w-3 rounded-full border-2 ${dot}`}
                    />
                    <div className="text-sm font-semibold text-foreground">
                      {ev.label}
                    </div>
                    {ev.at && (
                      <div className="text-xs text-default-500">
                        {getFormattedDate(ev.at)}
                      </div>
                    )}
                    {ev.meta?.tracking_id && (
                      <div className="mt-0.5 text-xs text-default-500">
                        {ev.meta.courier ? `${ev.meta.courier} · ` : ""}
                        {ev.meta.tracking_id}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Sheet>

      {/* Mutations reuse the existing sheets/modals (services already wired). */}
      <CancelOrderItemModal
        isOpen={cancelSheet.isOpen}
        onClose={cancelSheet.onClose}
        order={order}
        onItemCancelled={cancelSheet.onClose}
      />
      <ReturnSheet
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
          onSuccess={() => {}}
          type="product"
        />
      )}
    </>
  );
};

export default OrderDetailPageView;
