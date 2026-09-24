import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import { Button, Card, CardBody } from "@/components/ui";
import { OrderItem, SellerFeedbackItem } from "@/types/ApiResponse";

type ExistingReview = {
  id?: number | string;
  rating?: number;
  title?: string;
  comment?: string;
  review_images?: string[];
};

interface SellerFeedbacksProps {
  seller_feedbacks: SellerFeedbackItem[] | undefined | null;
  item: OrderItem;
  onOpenReview: (payload: {
    sellerId: number | string;
    sellerName?: string;
    existingReview?: ExistingReview;
    itemsID?: string[];
  }) => void;
}

const SellerFeedbacks: React.FC<SellerFeedbacksProps> = ({
  seller_feedbacks,
  item,
  onOpenReview,
}) => {
  const { t } = useTranslation();
  const wasDelivered =
    ["delivered", "return_requested", "returned", "refunded"].includes(
      item.customer_status?.code,
    ) ||
    item.shipments?.some(
      (shipment) =>
        shipment.customer_status === "delivered" || shipment.status === "delivered",
    );
  const seller = seller_feedbacks?.find(
    (entry) => String(entry.seller_id) === String(item.seller_id),
  );

  if (!wasDelivered || !seller) return null;

  const feedback = seller.feedback && !Array.isArray(seller.feedback)
    ? seller.feedback
    : undefined;
  const isGiven = seller.is_feedback_given && Boolean(feedback);

  return (
    <Card shadow="none" radius="lg" className="border border-divider">
      <CardBody className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
              <Icon icon="solar:shop-bold-duotone" width={22} height={22} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {t("sellerFeedbackTitle", "Seller feedback")}
              </div>
              <div className="truncate text-xs text-default-500">
                {item.seller_name || `${t("seller")} #${seller.seller_id}`}
                {item.title ? ` · ${item.title}` : ""}
              </div>
              {isGiven && feedback ? (
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-warning-600">
                    <Icon icon="solar:star-bold" width={14} height={14} />
                    {feedback.rating}/5
                  </span>
                  {(feedback.title || feedback.description) && (
                    <span className="truncate text-default-500">
                      · {feedback.title || feedback.description}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-xs text-default-500">
                  {t("pages.order.sellerFeedbackPrompt", "How was your experience with this seller?")}
                </div>
              )}
            </div>
          </div>

          <Button
            size="md"
            variant={isGiven ? "bordered" : "flat"}
            color="primary"
            className="shrink-0 font-semibold sm:min-w-[132px]"
            startContent={
              <Icon
                icon={isGiven ? "solar:pen-linear" : "solar:star-bold"}
                width={17}
                height={17}
              />
            }
            onPress={() =>
              onOpenReview({
                sellerId: seller.seller_id,
                sellerName: item.seller_name,
                existingReview: feedback
                  ? {
                      id: feedback.id,
                      rating: feedback.rating,
                      title: feedback.title,
                      comment: feedback.description,
                      review_images: [],
                    }
                  : undefined,
                itemsID: [item.id.toString()],
              })
            }
          >
            {isGiven ? t("updateReview") : t("reviewSeller")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default SellerFeedbacks;
