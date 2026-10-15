import { Button, ErrorState, Skeleton, useDisclosure } from "@/components/ui";
import { MapPin, Plus, ChevronDown } from "lucide-react";
import { FC, useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { setSelectedAddress } from "@/lib/redux/slices/checkoutSlice";
import AddressSelectionModal from "../Modals/AddressSelectionModal";
import { updateCartData } from "@/helpers/updators";
import { useTranslation } from "react-i18next";
import { resolveMarketForCountry } from "@/helpers/market";
import { useCheckoutAddresses } from "@/features/checkout/hooks/useCheckoutAddresses";
import {
  chooseCheckoutAddress,
  getLastCheckoutAddressId,
  rememberCheckoutAddress,
} from "@/helpers/checkoutAddress";

type AddressSectionProps = {
  onAddAddressModalOpen: () => void;
};

const AddressSection: FC<AddressSectionProps> = ({ onAddAddressModalOpen }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();
  const { cartData } = useSelector((state: RootState) => state.cart);
  const zone_id = cartData?.delivery_zone?.zone_id || "";

  const dispatch = useDispatch();
  const selectedAddress = useSelector(
    (state: RootState) => state.checkout.selectedAddress,
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.name;
  const userId = user?.id ?? null;

  const [tempSelectedId, setTempSelectedId] = useState<string>("");
  const syncedAddressId = useRef<number | null>(null);
  const initialSelectionCleared = useRef(false);
  const {
    data: addressData,
    error: addressError,
    isLoading: isAddressesLoading,
    mutate: reloadAddresses,
  } = useCheckoutAddresses(userId, zone_id);
  const allAddresses = addressData?.addresses;
  const total = addressData?.total ?? 0;

  const syncCartForAddress = useCallback(
    async (addressId: number, countryCode: string) => {
      await resolveMarketForCountry(countryCode);
      await updateCartData(false, false, addressId.toString());
    },
    [],
  );

  const handleReset = useCallback(async () => {
    setTempSelectedId("");
    await reloadAddresses();
  }, [reloadAddresses]);

  useEffect(() => {
    if (initialSelectionCleared.current) return;
    initialSelectionCleared.current = true;
    if (selectedAddress?.user_id === userId) {
      rememberCheckoutAddress(userId, selectedAddress.id);
    }
    if (selectedAddress) dispatch(setSelectedAddress(null));
  }, [selectedAddress, userId, dispatch]);

  useEffect(() => {
    if (!allAddresses) return;

    const current = chooseCheckoutAddress(
      allAddresses,
      selectedAddress?.user_id === userId ? selectedAddress.id : null,
      getLastCheckoutAddressId(userId),
    );

    if (!current) {
      if (selectedAddress) dispatch(setSelectedAddress(null));
      syncedAddressId.current = null;
      return;
    }

    const addressChanged =
      JSON.stringify(current) !== JSON.stringify(selectedAddress);
    if (addressChanged) {
      dispatch(setSelectedAddress(current));
    }

    if (syncedAddressId.current !== current.id || addressChanged) {
      syncedAddressId.current = current.id;
      rememberCheckoutAddress(userId, current.id);
      void syncCartForAddress(current.id, current.country_code);
    }
  }, [allAddresses, selectedAddress, userId, dispatch, syncCartForAddress]);

  const handleSelectAddressClick = useCallback(() => {
    setTempSelectedId(selectedAddress?.id?.toString() || "");
    onOpen();
  }, [selectedAddress, onOpen]);

  const handleModalSelection = useCallback((addressId: string) => {
    setTempSelectedId(addressId);
  }, []);

  const handleConfirmSelection = useCallback(async () => {
    if (!tempSelectedId || !allAddresses) return;
    const selectedAddr = allAddresses.find(
      (addr) => addr.id.toString() === tempSelectedId,
    );
    if (!selectedAddr) return;
    syncedAddressId.current = selectedAddr.id;
    dispatch(setSelectedAddress(selectedAddr));
    rememberCheckoutAddress(userId, selectedAddr.id);
    onOpenChange();
    await syncCartForAddress(selectedAddr.id, selectedAddr.country_code);
  }, [
    tempSelectedId,
    allAddresses,
    dispatch,
    onOpenChange,
    userId,
    syncCartForAddress,
  ]);

  const getAddressTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "success" as const;
      case "work":
        return "primary" as const;
      case "other":
        return "default" as const;
      default:
        return "default" as const;
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "🏠";
      case "work":
        return "🏢";
      case "other":
        return "📍";
      default:
        return "📍";
    }
  };

  const isLoading = isAddressesLoading;
  const displayAddress = allAddresses?.find(
    (address) => address.id === selectedAddress?.id,
  );

  const fullAddress = displayAddress
    ? [
        displayAddress.address_line1,
        displayAddress.address_line2,
        displayAddress.landmark,
        displayAddress.city,
        displayAddress.state,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <>
      <div className="w-full rounded-large border border-divider bg-content1 p-4">
        {addressError && !addressData ? (
          <ErrorState
            title={t("addressSelection.empty.failed")}
            retryLabel={t("retry")}
            onRetry={() => void reloadAddresses()}
            className="min-h-0 py-4"
          />
        ) : !addressData ? (
          <Skeleton className="h-24 w-full" />
        ) : displayAddress ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {t("address.deliverTo", { defaultValue: "Deliver To" })} :{" "}
                  {userName ? `${userName}, ` : ""}
                  {displayAddress.zipcode}
                </span>
                <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
                  {displayAddress.address_type}
                </span>
              </div>
              <p className="text-xs text-foreground/60">{fullAddress}</p>
              {displayAddress.mobile && (
                <p className="text-xs text-foreground/60">
                  {displayAddress.mobile}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="h-9 px-4 text-xs font-semibold"
                onPress={handleSelectAddressClick}
                isLoading={isLoading}
              >
                {t("change", { defaultValue: "Change" })}
              </Button>
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="h-9 px-4 text-xs font-semibold"
                startContent={<Plus className="h-4 w-4" />}
                onPress={onAddAddressModalOpen}
              >
                {t("address.addNew")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("address.deliveryAddress")}
                </h3>
                <p className="text-xs text-foreground/50">
                  {t("address.chooseLocation")}
                </p>
              </div>
            </div>

            {total === 0 ? (
              <p className="text-sm text-foreground/60">
                {t("pages.addresses.noAddresses")}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Plus className="h-4 w-4" />}
                className="h-9 px-4 text-xs font-semibold"
                onPress={onAddAddressModalOpen}
              >
                {t("address.addNew")}
              </Button>
              <Button
                size="sm"
                variant="bordered"
                color="primary"
                className="h-9 px-4 text-xs font-semibold"
                onPress={handleSelectAddressClick}
                startContent={<MapPin className="h-4 w-4" />}
                endContent={<ChevronDown className="h-4 w-4" />}
                isDisabled={total === 0}
                isLoading={isLoading}
              >
                {total === 0
                  ? t("address.noAddresses")
                  : t("address.selectAddress")}
              </Button>
            </div>
          </div>
        )}

        {/* Hidden reset trigger — clicked by AddressModal onSave. */}
        <button
          id="reset-cart-addresses"
          className="hidden"
          onClick={handleReset}
          disabled={isLoading}
        >
          {t("reset")}
        </button>
      </div>

      <AddressSelectionModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onAddNew={onAddAddressModalOpen}
        addresses={allAddresses ?? []}
        selectedAddressId={selectedAddress?.id?.toString() || null}
        tempSelectedId={tempSelectedId}
        handleModalSelection={handleModalSelection}
        handleConfirmSelection={handleConfirmSelection}
        getAddressTypeIcon={getAddressTypeIcon}
        getAddressTypeColor={getAddressTypeColor}
        isLoading={isAddressesLoading}
        totalAddresses={total}
      />
    </>
  );
};

export default AddressSection;
