import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import RatingModal from "@/components/Modals/RatingModal";
import ReturnOrderItemModal from "@/components/Modals/ReturnOrderItemModal";
import { orderStatusColorMap } from "@/config/constants";
import { formatString } from "@/helpers/validator";
import { getFormattedDate, getOrderStatusBtnConfig } from "@/helpers/getters";
import UserLayout from "@/layouts/UserLayout";
import { Order, OrderItem } from "@/types/ApiResponse";
import { Button, Chip, useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import OrderSummary from "./OrderSummary";
import PaymentInfo from "./PaymentInfo";
import DeliveryInfo from "./DeliveryInfo";
import ShippingInfo from "./ShippingInfo";
import OrderItems from "./OrderItems";
import OrderNote from "./OrderNote";
import SellerFeedbacks from "./SellerFeedbacks";
import PageHead from "@/SEO/PageHead";
import CancelOrderItemModal from "@/components/Modals/CancelOrderItemModal";
import { reorderOrder } from "@/routes/api";
import { addToast } from "@heroui/react";
import { updateCartData } from "@/helpers/updators";

interface OrderDetailPageViewProps {
  order: Order;
}

// OrderDetailPageView component
const OrderDetailPageView: React.FC<OrderDetailPageViewProps> = ({ order }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    isOpen: isOpenProductReview,
    onClose: onProductReviewClose,
    onOpen: onProductReviewOpen,
  } = useDisclosure();

  const {
    isOpen: isCancelOpen,
    onClose: onCancelClose,
    onOpen: onCancelOpen,
  } = useDisclosure();

  const buttonConfig = getOrderStatusBtnConfig(order.status);

  // Prefer the customer-friendly headline; fall back to the raw status label.
  const orderStatusHeadline =
    order.customer_status?.label ||
    order.status_label ||
    formatString(order?.status);

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<{
    sellerId: number | string;
    sellerName?: string;
    itemsID?: string[];
    existingReview?: {
      id?: number | string;
      rating?: number;
      title?: string;
      comment?: string;
      review_images?: string[];
    } | null;
  } | null>(null);

  const {
    isOpen: isSellerReviewOpen,
    onOpen: onSellerReviewOpen,
    onClose: onSellerReviewClose,
  } = useDisclosure();

  const {
    isOpen: isReturnOpen,
    onOpen: onReturnOpen,
    onClose: onReturnClose,
  } = useDisclosure();

  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const response = await reorderOrder(order.id);
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

  const handleProductReview = (item: OrderItem) => {
    setSelectedItem(item);
    onProductReviewOpen();
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/orders", label: t("myOrders") },
          { href: "#", label: `${t("order")} #${order.id}` },
        ]}
      />
      <PageHead pageTitle={`${t("order")} #${order?.id || ""}`} />

      <UserLayout activeTab="orders">
        <div className="w-full mx-auto">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="flat"
                color="default"
                size="sm"
                onPress={() => router.push("/my-account/orders")}
              >
                <Icon icon="solar:arrow-left-linear" className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-sm font-semibold text-foreground">
                    {t("order")} #{order.id}
                  </h1>
                </div>
                <p className="text-xs text-default-500">
                  {t("placedOn")} {getFormattedDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Chip
                color={orderStatusColorMap(order?.status)}
                variant="flat"
                size="sm"
                radius="sm"
                className="text-xs h-8 cursor-pointer"
                title={orderStatusHeadline}
              >
                {orderStatusHeadline}
              </Chip>

              {order.status !== "cancelled" && (
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Icon icon="solar:download-minimalistic-linear" className="w-4 h-4" />}
                  onPress={() => {
                    if (order.invoice) {
                      window.open(order.invoice, "_blank");
                    }
                  }}
                  title={t("invoice")}
                  className="text-xs"
                >
                  {t("invoice")}
                </Button>
              )}

              {order.status === "delivered" && buttonConfig.reorder && (
                <Button
                  color="primary"
                  variant="bordered"
                  size="sm"
                  startContent={<Icon icon="solar:refresh-linear" className="w-4 h-4" />}
                  onPress={handleReorder}
                  isLoading={isReordering}
                  title={t("reorder")}
                  className="text-xs"
                >
                  {t("reorder")}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Items & Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Items */}
              <OrderItems
                order={order}
                handleProductReview={handleProductReview}
                onReturnOpen={
                  buttonConfig.returnOrder ? onReturnOpen : undefined
                }
                onCancelOpen={
                  buttonConfig.cancelOrder ? onCancelOpen : undefined
                }
              />

              {/* Shipping Address */}
              <ShippingInfo order={order} />

              {/* Order Note */}
              <OrderNote order={order} />

              {/* Seller Feedbacks (grouped) */}
              {buttonConfig.review && (
                <SellerFeedbacks
                  seller_feedbacks={order.seller_feedbacks}
                  items={order.items}
                  onOpenReview={({
                    sellerId,
                    sellerName,
                    existingReview,
                    itemsID,
                  }) => {
                    setSelectedSeller({
                      sellerId,
                      sellerName,
                      existingReview,
                      itemsID,
                    });
                    onSellerReviewOpen();
                  }}
                />
              )}
            </div>

            {/* Right Column - Order Summary & Actions */}
            <div className="space-y-4">
              {/* Order Summary */}
              <OrderSummary order={order} />

              {/* Payment Information */}
              <PaymentInfo order={order} />

              {/* Delivery Information */}
              <DeliveryInfo order={order} />
            </div>
          </div>
        </div>
        {/* Rating Modal */}
        {selectedItem && (
          <RatingModal
            isOpen={isOpenProductReview}
            onClose={() => {
              onProductReviewClose();
              setSelectedItem(null);
            }}
            productId={selectedItem.product_id}
            orderItemId={selectedItem.id}
            onSuccess={() => {}}
            type="product"
          />
        )}
        {/* Seller Rating Modal */}
        {selectedSeller && (
          <RatingModal
            isOpen={isSellerReviewOpen}
            onClose={() => {
              onSellerReviewClose();
              setSelectedSeller(null);
            }}
            type="seller"
            orderId={order.id}
            sellerId={selectedSeller.sellerId}
            sellerName={selectedSeller.sellerName}
            existingReview={selectedSeller.existingReview}
            onSuccess={() => {}}
            orderItemId={selectedSeller?.itemsID?.[0] || "0"}
          />
        )}
        {/* Return Order Items Modal */}
        {buttonConfig.returnOrder && (
          <ReturnOrderItemModal
            isOpen={isReturnOpen}
            onClose={onReturnClose}
            order={order}
          />
        )}
        <CancelOrderItemModal
          isOpen={isCancelOpen}
          onClose={onCancelClose}
          order={order}
          onItemCancelled={onCancelClose}
        />
      </UserLayout>
    </>
  );
};

export default OrderDetailPageView;
