import { FC } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import { Order } from "@/types/ApiResponse";
import { MapPin, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

// Delivery-boy live GPS tracking was removed in the hyperlocal -> hypercommerce
// migration. Tracking is now shipment-based; this modal shows the current order
// status and shipping address without the removed live-location feature.
const TrackOrderModal: FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { t } = useTranslation();

  const getStatusColor = (
    status: string,
  ):
    | "success"
    | "warning"
    | "danger"
    | "default"
    | "primary"
    | "secondary"
    | undefined =>
    (
      ({
        delivered: "success",
        out_for_delivery: "warning",
        cancelled: "danger",
      }) as const
    )[status] || "default";

  const formatStatus = (status: string) =>
    status
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      scrollBehavior="inside"
      classNames={{ base: "max-h-[85vh]" }}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center px-4">
          <div>
            <h2 className="text-lg font-semibold">{t("trackOrder")}</h2>
            <p className="text-xs text-foreground/70">
              {t("trackOrderModal.orderNumber", { slug: order.id })}
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="p-4 space-y-3">
          <Card>
            <CardBody className="p-3 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-foreground/70">
                      {t("trackOrderModal.orderStatus")}
                    </p>
                    <Chip
                      size="sm"
                      color={getStatusColor(order.status || "")}
                      variant="flat"
                      className="text-[11px]"
                    >
                      {formatStatus(order.status)}
                    </Chip>
                  </div>
                </div>
                {order.estimated_delivery_time ? (
                  <div className="text-end text-xs">
                    <p className="text-foreground/70">
                      {t("estimatedDelivery")}
                    </p>
                    <p className="font-semibold">
                      {order.estimated_delivery_time} {t("mins")}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-3 gap-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <p className="font-medium text-sm">
                  {t("address.deliveryAddress")}
                </p>
              </div>
              <p className="text-xs text-foreground/70 mt-1">
                {order.shipping_address_1}
              </p>
              <p className="text-[11px] text-foreground/50">
                {order.shipping_city}, {order.shipping_state}
              </p>
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TrackOrderModal;
