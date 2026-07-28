import { FC, useState } from "react";
import { Button, Chip, useDisclosure, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Address } from "@/types/ApiResponse";
import AddressGoogleModal from "../Modals/AddressGoogleModal";
import AddressModal from "../Modals/AddressModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { deleteAddress } from "@/routes/api";
import { useTranslation } from "react-i18next";

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: number | string) => void;
}

const AddressCard: FC<AddressCardProps> = ({ address, onDelete, onEdit }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isOpen: editOpen,
    onOpen: editOnOpen,
    onOpenChange: editOnOpenChange,
  } = useDisclosure();

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Icon icon="solar:home-2-linear" className="w-4 h-4" />;
      case "work":
        return <Icon icon="solar:buildings-2-linear" className="w-4 h-4" />;
      default:
        return <Icon icon="solar:map-point-linear" className="w-4 h-4" />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case "home":
        return "primary";
      case "work":
        return "success";
      default:
        return "default";
    }
  };

  const truncateText = (text: string, maxLength: number) =>
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  const handleDeleteAddress = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await deleteAddress({ id });

      if (res?.success) {
        addToast({
          title: t("address.deleted_title"),
          description: t("address.deleted_description"),
          color: "success",
        });
        onDelete?.(id);
      } else {
        addToast({
          title: t("address.delete_failed_title"),
          description: res?.message || t("address.delete_failed_description"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      addToast({
        title: t("address.unexpected_error_title"),
        description: t("address.unexpected_error_description"),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);

  const openConfirm = (id: number) => {
    setToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setToDeleteId(null);
    setIsConfirmOpen(false);
  };

  const confirmDelete = async () => {
    if (toDeleteId != null) {
      await handleDeleteAddress(toDeleteId);
    }
    closeConfirm();
  };

  const typeLabel = t(
    address.address_type == "home" ? "home_title" : address.address_type,
  );

  return (
    <>
      <div className="flex items-start justify-between gap-3 rounded-medium border border-divider bg-content1 p-4 transition-colors hover:border-primary">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              radius="full"
              color={getAddressTypeColor(address.address_type)}
              variant="flat"
              className="capitalize"
              classNames={{ content: "text-[11px] font-semibold" }}
              startContent={
                <span className="ms-1 flex">
                  {getAddressTypeIcon(address.address_type)}
                </span>
              }
            >
              {typeLabel}
            </Chip>
          </div>

          <div className="mt-2 text-[13.5px] font-bold text-foreground">
            {address.address_line1}
          </div>
          <div className="mt-1 text-xs text-default-500 line-clamp-2">
            {[
              address.address_line2,
              address.landmark && truncateText(address.landmark, 30),
              `${address.city}, ${address.state} ${address.zipcode}`,
              address.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-default-500">
            <Icon icon="solar:phone-linear" width={12} height={12} />
            <span>{address.mobile}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onOpen}
            isDisabled={isLoading}
            aria-label={t("view_map")}
          >
            <Icon icon="solar:map-point-linear" width={16} height={16} />
          </Button>
          <button
            type="button"
            onClick={editOnOpen}
            disabled={isLoading}
            className="px-2 text-[12.5px] font-semibold text-primary-600 disabled:opacity-50"
          >
            {t("edit")}
          </button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={() => openConfirm(address.id as number)}
            isLoading={isLoading}
            aria-label={t("delete")}
          >
            <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
          </Button>
        </div>
      </div>

      <AddressGoogleModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        address={address}
      />
      <AddressModal
        isOpen={editOpen}
        onOpenChange={editOnOpenChange}
        initialData={address}
        onSave={() => {
          onEdit?.(address);
        }}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        title={t("address.delete_confirm_title") || "Delete address"}
        description={
          t("address.delete_confirm_description") ||
          "Are you sure you want to delete this address?"
        }
        alertTitle={t("address.delete_confirm_description")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="danger"
        size="sm"
      />
    </>
  );
};

export default AddressCard;
