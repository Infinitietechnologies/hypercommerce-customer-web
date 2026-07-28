import { FC, useState } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Image,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { OrderListItem } from "@/types/ApiResponse";
import { getFormattedDate } from "@/helpers/getters";
import { orderStatusColorMap } from "@/config/constants";
import { useCurrency } from "@/components/Functional/Price";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import { cancelOrderItem, reorderOrder } from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

interface OrderCardProps {
  /** One flat order ITEM (the list endpoint is now per-item). */
  item: OrderListItem;
  /** Called after a successful cancel so the parent can revalidate. */
  onChanged?: () => void;
}

const OrderCard: FC<OrderCardProps> = ({ item, onChanged }) => {
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    isOpen: isCancelOpen,
    onClose: onCancelClose,
    onOpen: onCancelOpen,
  } = useDisclosure();

  // Prefer the customer-friendly headline; fall back to the raw status label.
  const statusLabel = item.customer_status?.label || item.status_label;
  const orderSlug = item.order?.slug || item.slug;
  const productImage = item.product?.image || item.variant?.image || null;
  const productName = item.product?.name || item.title;
  const isDelivered = item.status === "delivered";

  const handleReorder = async () => {
    if (!item.order_id) return;
    try {
      setIsReordering(true);
      const response = await reorderOrder(item.order_id);
      if (response.success) {
        addToast({
          title:
            t("pages.ordersPage.reorderSuccess") || "Reordered successfully",
          color: "success",
        });
        await updateCartData(true, true);
      } else {
        addToast({
          title:
            response.message ||
            t("pages.ordersPage.reorderFailed") ||
            "Reorder failed",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Reorder error:", error);
      addToast({
        title:
          t("pages.ordersPage.reorderFailed") ||
          "An error occurred during reorder",
        color: "danger",
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleCancelItem = async () => {
    try {
      setIsCancelling(true);
      const res = await cancelOrderItem({ orderItemId: String(item.id) });
      if (res.success) {
        addToast({
          title: t("cancel_item_success_title") || t("success"),
          description: res.message || t("cancel_item_success_msg"),
          color: "success",
        });
        onCancelClose();
        onChanged?.();
      } else {
        addToast({
          title: res.message || t("cancel_item_failed") || "Cancel failed",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Cancel error:", error);
      addToast({
        title: t("cancel_item_failed") || "Cancel failed",
        color: "danger",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Card shadow="sm" radius="md" className="border border-divider">
        <CardHeader className="flex flex-col justify-between w-full">
          <div className="flex items-start justify-between mb-3 w-full gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="p-2 bg-primary-100 rounded-medium shrink-0">
                <Icon icon="solar:box-linear" width={16} height={16} className="text-primary-600" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <h3 className="font-semibold text-sm sm:text-medium text-foreground whitespace-nowrap">
                    {t("orderId", { id: item.order_id })}
                  </h3>
                  <Chip
                    size="sm"
                    radius="sm"
                    variant="flat"
                    color={orderStatusColorMap(item.status)}
                    classNames={{
                      content: "text-xxs",
                      base: "p-0 hover:cursor-pointer shrink-0 max-w-full",
                    }}
                    title={statusLabel}
                  >
                    <span className="truncate">{statusLabel}</span>
                  </Chip>
                </div>

                {item.store?.name && (
                  <div className="flex gap-1 items-center min-w-0">
                    <Icon icon="solar:shop-linear" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-foreground/50 shrink-0" />
                    <Link
                      href={
                        item.store?.slug ? `/stores/${item.store.slug}` : "#"
                      }
                      title={item.store.name}
                      className="text-xxs text-foreground/50 truncate hover:cursor-pointer hover:text-primary"
                    >
                      {item.store.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {isDelivered && (
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  className="min-w-8 h-8 w-8"
                  isIconOnly
                  onPress={handleReorder}
                  isLoading={isReordering}
                  title={t("reorder")}
                >
                  <Icon icon="solar:refresh-linear" className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <Divider className="mb-2 opacity-50" />

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <Icon icon="solar:calendar-linear" className="w-4 h-4 text-foreground/50" />
              <div>
                <p className="text-xxs sm:text-xs text-foreground/50">
                  {t("date")}
                </p>
                <p className="text-xxs sm:text-xs font-medium text-foreground">
                  {getFormattedDate(item.order?.order_date || item.created_at)}
                </p>
              </div>
            </div>

            {item.seller_name && (
              <div className="min-w-0 text-right">
                <p className="text-xxs sm:text-xs text-foreground/50">
                  {t("soldBySection.sellerLabel") || t("seller") || "Seller"}
                </p>
                <p
                  className="text-xxs sm:text-xs font-medium text-foreground truncate max-w-[140px]"
                  title={item.seller_name}
                >
                  {item.seller_name}
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="pb-1 overflow-hidden">
          <div className="flex justify-between items-center py-1.5 px-2.5 bg-content2 rounded-medium">
            <div className="flex items-center flex-1 min-w-0 space-x-2">
              {productImage ? (
                <Image
                  loading="lazy"
                  src={productImage}
                  alt={productName || "Not Available"}
                  className="w-11 h-11 rounded-lg object-contain cursor-pointer"
                  radius="none"
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <div className="w-11 h-11 rounded-medium bg-content3 flex items-center justify-center text-[10px] text-default-500">
                  {t("na")}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-xs mb-0.5">
                  <Link
                    title={productName || ""}
                    href={
                      item.product?.slug
                        ? `/products/${item.product.slug}`
                        : "#"
                    }
                    className="block truncate overflow-hidden text-ellipsis max-w-full hover:text-primary"
                  >
                    {productName || t("na")}
                  </Link>

                  {item.variant_title && (
                    <div
                      title={item.variant_title}
                      className="block truncate overflow-hidden text-ellipsis max-w-full text-xxs text-foreground/50"
                    >
                      {item.variant_title}
                    </div>
                  )}
                </h3>
                <p className="text-xs text-foreground/50">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-foreground/60 ml-2 shrink-0">
              {formatPrice(item.subtotal)}
            </p>
          </div>
        </CardBody>

        <CardFooter className="grid grid-cols-6 gap-2 w-full pt-3">
          <Button
            size="sm"
            variant="bordered"
            as={Link}
            href={`/my-account/orders/${orderSlug}`}
            startContent={<Icon icon="solar:eye-linear" className="w-3 h-3" />}
            className="text-xs font-medium w-full col-span-3"
            title={t("details")}
          >
            {t("details")}
          </Button>

          {item.can_cancel && (
            <Button
              size="sm"
              variant="bordered"
              startContent={<Icon icon="solar:close-circle-linear" className="w-3 h-3" />}
              className="text-xs font-medium w-full col-span-3"
              onPress={onCancelOpen}
              title={t("cancel")}
            >
              {t("cancel")}
            </Button>
          )}

          {item.return_eligible && (
            <Button
              size="sm"
              variant="bordered"
              as={Link}
              href={`/my-account/orders/${orderSlug}`}
              startContent={<Icon icon="solar:refresh-linear" className="w-3 h-3" />}
              className="text-xs font-medium w-full col-span-3"
              title={t("return")}
            >
              {t("return")}
            </Button>
          )}
        </CardFooter>
      </Card>

      <ConfirmationModal
        isOpen={isCancelOpen}
        onClose={onCancelClose}
        onConfirm={handleCancelItem}
        title={t("cancel") || "Cancel item"}
        description={productName || item.title}
        confirmText={t("cancel") || "Cancel"}
        cancelText={t("close") || "Close"}
        variant="danger"
        isDismissable={!isCancelling}
      />

      {productImage && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: productImage }]}
        />
      )}
    </>
  );
};

export default OrderCard;
