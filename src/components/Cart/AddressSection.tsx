import { Button, useDisclosure } from "@heroui/react";
import { MapPin, Plus, ChevronDown } from "lucide-react";
import { FC, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import useSWR, { mutate } from "swr";
import { setSelectedAddress } from "@/lib/redux/slices/checkoutSlice";
import AddressSelectionModal from "../Modals/AddressSelectionModal";
import { getAddresses } from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import { useTranslation } from "react-i18next";
import { Address } from "@/types/ApiResponse";
import { resolveMarketForCountry } from "@/helpers/market";

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
  const userName = useSelector((state: RootState) => state.auth.user?.name);

  const [tempSelectedId, setTempSelectedId] = useState<string>("");
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isInitialMount = useRef(true);

  const initialDataKey = useMemo(
    () => ["/cart-addresses/initial", zone_id] as const,
    [zone_id],
  );

  const { data: initialData, isLoading: initialLoading } = useSWR(
    initialDataKey,
    async () => {
      const response = await getAddresses({ page: 1, per_page: 1 });
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch addresses");
      }
      return {
        addresses: response.data.data || [],
        total: response.data.total || 0,
      };
    },
  );

  const total = initialData?.total || 0;
  const initialFetchDone = !!initialData;

  const fetchAddressesData = useCallback(
    async (page: number, perPage: number = 10) => {
      const response = await getAddresses({ page, per_page: perPage });
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch addresses");
      }

      const data = response.data;
      let addressesArray: Address[] = [];

      if (data && typeof data === "object" && "data" in data) {
        const nestedData = (data as any).data;
        if (Array.isArray(nestedData)) {
          addressesArray = nestedData;
        } else if (nestedData && typeof nestedData === "object") {
          addressesArray = Object.values(nestedData);
        }
      } else if (Array.isArray(data)) {
        addressesArray = data;
      }

      return addressesArray;
    },
    [],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      dispatch(setSelectedAddress(null));
      isInitialMount.current = false;
    }
  }, [dispatch]);

  const handleReset = useCallback(async () => {
    setAllAddresses([]);
    setCurrentPage(1);
    setTempSelectedId("");

    await mutate(
      (key) =>
        Array.isArray(key) &&
        typeof key[0] === "string" &&
        key[0].includes("/cart-addresses"),
      undefined,
      { revalidate: true },
    );
  }, []);

  const handleSelectAddressClick = useCallback(async () => {
    setTempSelectedId(selectedAddress?.id?.toString() || "");
    onOpen();

    if (allAddresses.length === 0 && total > 0) {
      setIsAddressesLoading(true);
      try {
        const addresses = await fetchAddressesData(1);
        setAllAddresses(addresses);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching initial addresses:", error);
      } finally {
        setIsAddressesLoading(false);
      }
    }
  }, [allAddresses.length, total, selectedAddress, onOpen, fetchAddressesData]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || allAddresses.length >= total) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const addresses = await fetchAddressesData(nextPage);
      setAllAddresses((prev) => [...prev, ...addresses]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more addresses:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, allAddresses.length, total, currentPage, fetchAddressesData]);

  const handleModalSelection = useCallback((addressId: string) => {
    setTempSelectedId(addressId);
  }, []);

  const handleConfirmSelection = useCallback(async () => {
    if (!tempSelectedId) return;
    const selectedAddr = allAddresses.find(
      (addr) => addr.id.toString() === tempSelectedId,
    );
    if (!selectedAddr) return;
    dispatch(setSelectedAddress(selectedAddr));
    onOpenChange();
    // The delivery address is authoritative for the market on checkout: switch
    // currency to the address's country, then recompute the cart in that market.
    await resolveMarketForCountry(selectedAddr.country_code);
    await updateCartData(false, false, selectedAddr.id?.toString() || "");
  }, [tempSelectedId, allAddresses, dispatch, onOpenChange]);

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

  const isLoading = initialLoading || isAddressesLoading;

  const fullAddress = selectedAddress
    ? [
        selectedAddress.address_line1,
        selectedAddress.address_line2,
        selectedAddress.landmark,
        selectedAddress.city,
        selectedAddress.state,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <>
      <div className="w-full rounded-large border border-divider bg-content1 p-4">
        {selectedAddress ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {t("address.deliverTo", { defaultValue: "Deliver To" })} :{" "}
                  {userName ? `${userName}, ` : ""}
                  {selectedAddress.zipcode}
                </span>
                <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
                  {selectedAddress.address_type}
                </span>
              </div>
              <p className="text-xs text-foreground/60">{fullAddress}</p>
              {selectedAddress.mobile && (
                <p className="text-xs text-foreground/60">
                  {selectedAddress.mobile}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="font-semibold text-[12px]"
                onPress={handleSelectAddressClick}
                isLoading={isLoading}
              >
                {t("change", { defaultValue: "Change" })}
              </Button>
              <Button
                size="sm"
                variant="light"
                color="primary"
                className="font-semibold text-[12px]"
                startContent={<Plus className="h-3.5 w-3.5" />}
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

            {initialFetchDone && total === 0 ? (
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
                className="text-xs"
                onPress={onAddAddressModalOpen}
              >
                {t("address.addNew")}
              </Button>
              <Button
                size="sm"
                variant="bordered"
                color="primary"
                className="text-xs"
                onPress={handleSelectAddressClick}
                startContent={<MapPin className="h-4 w-4" />}
                endContent={<ChevronDown className="h-4 w-4" />}
                isDisabled={!initialFetchDone || total === 0}
                isLoading={isLoading}
              >
                {!initialFetchDone
                  ? t("address.loading")
                  : total === 0
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
        addresses={allAddresses}
        selectedAddressId={selectedAddress?.id?.toString() || null}
        tempSelectedId={tempSelectedId}
        handleModalSelection={handleModalSelection}
        handleConfirmSelection={handleConfirmSelection}
        getAddressTypeIcon={getAddressTypeIcon}
        getAddressTypeColor={getAddressTypeColor}
        isLoading={isAddressesLoading}
        totalAddresses={total}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </>
  );
};

export default AddressSection;
