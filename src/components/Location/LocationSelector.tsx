import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Divider,
  Sheet,
  useDisclosure,
  toast as addToast,
  Spinner,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import { UserLocation } from "./types/LocationAutoComplete.types";
import { getCookie, setCookie } from "@/lib/cookies";
import { geoDetectForCountry, switchMarket, getAddresses } from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import { onLocationChange } from "@/helpers/events";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";
import { staticLat, staticLng } from "@/config/constants";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { RootState } from "@/lib/redux/store";
import { Address } from "@/types/ApiResponse";
import { MapPin } from "lucide-react";
import clsx from "clsx";

type SelectedLocation = {
  placeName: string;
  latLng: { lat: number; lng: number };
  placeDescription: string;
};

type PersistedLocation = UserLocation & {
  addressId?: number;
};

interface LocationSelectorProps {
  variant?: "desktop" | "mobile" | "showcase";
  tone?: "light" | "dark" | "inherit";
  showLabel?: boolean;
}

const LocationSelector = ({
  variant = "desktop",
  tone = "light",
  showLabel = false,
}: LocationSelectorProps) => {
  const { defaultLocation, demoMode } = useSettings();
  const { t } = useTranslation();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const router = useRouter();
  // On checkout the delivery address drives the market, so the header selector
  // is shown locked (read-only) reflecting the selected address's location.
  const checkoutSelectedAddress = useSelector(
    (state: RootState) => state.checkout.selectedAddress,
  );
  const isCheckoutLocked =
    router.pathname === "/cart/checkout" && !!checkoutSelectedAddress;

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Saved addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [locatingId, setLocatingId] = useState<string | null>(null); // "current" or address id

  // Initialize component with cookie data
  useEffect(() => {
    const initializeLocation = () => {
      try {
        const userLocation = getCookie("userLocation") as PersistedLocation;

        if (userLocation && userLocation.lat && userLocation.lng) {
          const locationData: SelectedLocation = {
            placeName: userLocation.placeName || "Selected Location",
            latLng: { lat: userLocation.lat, lng: userLocation.lng },
            placeDescription: userLocation.placeDescription || "",
          };

          setSelectedLocation(locationData);
          setSelectedAddressId(userLocation.addressId ?? null);
        }
      } catch (error) {
        console.error("Error initializing location from cookie:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLocation();
  }, []);

  // Auto-resolve a location + market on first load so the storefront never
  // renders empty behind a "Select location" prompt. Priority:
  //   • demo mode          → always the configured default-market location
  //                          (never the client's GPS)
  //   • client GPS granted → the precise device location + its market
  //   • otherwise          → fall back to the default-market location
  // Runs once, and only when there is no saved `userLocation` cookie yet.
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (!isInitialized || bootstrappedRef.current) return;

    const existing = getCookie("userLocation") as UserLocation | null;
    if (existing && existing.lat && existing.lng) return; // already chosen
    bootstrappedRef.current = true;

    const applyDefaultMarket = () =>
      commitLocation(
        {
          lat: defaultLocation?.lat || staticLat,
          lng: defaultLocation?.lng || staticLng,
        },
        demoMode
          ? "Bhuj ,Gujrat ,India"
          : t("locationSelector.defaultArea", "Default location"),
        undefined,
        "",
        { silent: true },
      );

    // Demo mode always uses the default market location — never the client GPS.
    if (demoMode) {
      applyDefaultMarket();
      return;
    }

    const resolveClientLocation = () => {
      if (!navigator.geolocation) {
        applyDefaultMarket();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const { placeName, countryCode } = await geocodeLatLng(latLng);
          await commitLocation(
            latLng,
            placeName ||
              t("locationSelector.currentLocation", "Current Location"),
            countryCode,
            "",
            { silent: true },
          );
        },
        () => applyDefaultMarket(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    };

    // Only read the device location when permission is ALREADY granted — never
    // force a permission prompt on load. Users can still pick "Use my current
    // location" from the sheet to grant it explicitly.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) =>
          status.state === "granted"
            ? resolveClientLocation()
            : applyDefaultMarket(),
        )
        .catch(() => applyDefaultMarket());
    } else {
      applyDefaultMarket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, demoMode]);

  // Fetch saved addresses when the modal opens (logged-in users only)
  const fetchAddresses = useCallback(async () => {
    setIsAddressesLoading(true);
    try {
      const response = await getAddresses({ page: 1, per_page: 50 });
      if (response.success) {
        setAddresses(response.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setIsAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchAddresses();
    }
  }, [isOpen, isLoggedIn, fetchAddresses]);

  // Helper: wait for the Google Maps bootstrap loader (used only for
  // reverse-geocode + market resolve). The inline loader exposes
  // `importLibrary` first; the Geocoder class is loaded on demand from it.
  const waitForGoogleMaps = (timeout = 5000): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkGoogleMaps = () => {
        if (typeof window.google?.maps?.importLibrary === "function") {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkGoogleMaps, 200);
        }
      };
      checkGoogleMaps();
    });
  };

  // Single geocode call that returns BOTH the place name and the country code.
  // (Firing two separate geocode calls at once trips Google's rate limit and
  // makes the place-name lookup fail, so we do it once and reuse the result.)
  const geocodeLatLng = async (latLng: {
    lat: number;
    lng: number;
  }): Promise<{ placeName: string | null; countryCode?: string }> => {
    const isLoaded = await waitForGoogleMaps();
    if (!isLoaded) return { placeName: null, countryCode: undefined };
    try {
      const { Geocoder } = (await window.google.maps.importLibrary(
        "geocoding",
      )) as google.maps.GeocodingLibrary;
      const geocoder = new Geocoder();
      const result = await geocoder.geocode({ location: latLng });
      const placeName = result?.results[0]?.formatted_address || null;
      const countryComp = result?.results
        ?.flatMap((r) => r.address_components || [])
        .find((c) => c.types.includes("country"));
      return { placeName, countryCode: countryComp?.short_name }; // ISO2, e.g. "IN"
    } catch (error) {
      console.error("Error geocoding location:", error);
      return { placeName: null, countryCode: undefined };
    }
  };

  // Resolve + switch the market for a country (currency/catalogue follow it).
  const resolveMarket = async (countryCode?: string) => {
    try {
      const res = await geoDetectForCountry(countryCode);
      const market = res?.data?.suggested_market;

      if (market?.code) {
        setCookie<string>("market", market.code);
        await switchMarket(market.code);
        await mutate("/settings");
      }
    } catch (err) {
      console.error("[LocationSelector] market resolve failed:", err);
    }
  };

  // Commit a chosen location: persist cookie, resolve market, refresh catalogue.
  const commitLocation = async (
    latLng: { lat: number; lng: number },
    placeName: string,
    countryCode?: string,
    placeDescription = "",
    options: { silent?: boolean; addressId?: number } = {},
  ) => {
    // In demo mode the location is always forced to the default.
    const finalLatLng = demoMode
      ? {
          lat: defaultLocation?.lat || staticLat,
          lng: defaultLocation?.lng || staticLng,
        }
      : latLng;

    const finalLocation: SelectedLocation = demoMode
      ? {
          placeName: "Bhuj ,Gujrat ,India",
          latLng: finalLatLng,
          placeDescription: "",
        }
      : { placeName, latLng: finalLatLng, placeDescription };

    setSelectedLocation(finalLocation);
    setSelectedAddressId(options.addressId ?? null);

    const userLocation: PersistedLocation = {
      lat: finalLatLng.lat,
      lng: finalLatLng.lng,
      placeName: finalLocation.placeName,
      placeDescription: finalLocation.placeDescription,
      addressId: options.addressId,
      // ISO2 (e.g. "IN") — powers country-based product delivery ETA.
      countryCode: countryCode ? countryCode.toUpperCase() : undefined,
    };
    setCookie<PersistedLocation>("userLocation", userLocation);

    await resolveMarket(countryCode);
    onLocationChange();

    // Silent auto-bootstrap (first load, no saved location) must not pop a
    // toast or touch the — already closed — sheet.
    if (!options.silent) {
      onClose();
      addToast({ title: "Location confirmed successfully", color: "success" });
    }
  };

  // "Use my current location" — browser geolocation.
  const handleUseCurrentLocation = () => {
    if (demoMode) {
      commitLocation(
        {
          lat: defaultLocation?.lat || staticLat,
          lng: defaultLocation?.lng || staticLng,
        },
        "Bhuj ,Gujrat ,India",
      );
      return;
    }

    if (!navigator.geolocation) {
      addToast({
        title: "Geolocation is not supported by your browser",
        color: "danger",
      });
      return;
    }

    setLocatingId("current");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        // One geocode gives us the readable address AND the country code.
        const { placeName, countryCode } = await geocodeLatLng(latLng);
        await commitLocation(
          latLng,
          placeName ||
            t("locationSelector.currentLocation", "Current Location"),
          countryCode,
        );
        setLocatingId(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocatingId(null);
        addToast({
          title:
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied. Please allow access."
              : "Unable to fetch your current location",
          color: "danger",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Pick one of the saved addresses.
  const handleSelectAddress = async (address: Address) => {
    setLocatingId(address.id.toString());
    const placeName = [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.zipcode,
    ]
      .filter(Boolean)
      .join(", ");
    // Use the address's stored country code so the market resolves reliably
    // (no geocoding round-trip needed).
    await commitLocation(
      { lat: address.latitude, lng: address.longitude },
      placeName,
      address.country_code,
      "",
      { addressId: address.id },
    );
    setLocatingId(null);
  };

  const handleCloseModal = () => {
    // A market is always active by default, so closing without an explicit
    // location pick is fine — never block the user with a validation error.
    onClose();
  };

  const openLogin = () => {
    onClose();
    document.getElementById("login-btn")?.click();
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "home":
        return (
          <Icon
            icon="solar:home-2-linear"
            className="text-xl text-default-500"
          />
        );
      case "work":
        return (
          <Icon
            icon="solar:buildings-2-linear"
            className="text-xl text-default-500"
          />
        );
      default:
        return (
          <Icon
            icon="solar:map-point-linear"
            className="text-xl text-default-500"
          />
        );
    }
  };

  // Header button label
  const getButtonText = () => {
    if (isCheckoutLocked && checkoutSelectedAddress) {
      const parts = [
        checkoutSelectedAddress.city,
        checkoutSelectedAddress.state,
      ]
        .filter(Boolean)
        .join(", ");
      const text = parts || checkoutSelectedAddress.address_line1 || "";
      return text.length > 30 ? `${text.substring(0, 30)}...` : text;
    }
    if (!isInitialized) return t("locationSelector.getting");
    if (selectedLocation) {
      const displayText = selectedLocation.placeDescription
        ? `${selectedLocation.placeName}, ${selectedLocation.placeDescription}`
        : selectedLocation.placeName;
      return displayText.length > 30
        ? `${displayText.substring(0, 30)}...`
        : displayText;
    }
    return t("locationSelector.selectLocation");
  };

  const isBusy = locatingId !== null;

  return (
    <div>
      {variant === "showcase" ? (
        <button
          type="button"
          onClick={isCheckoutLocked ? undefined : onOpen}
          disabled={!isInitialized || isCheckoutLocked}
          className={clsx(
            "hidden min-w-0 cursor-pointer items-center gap-2 ps-2 text-start min-[1024px]:flex",
            tone === "light"
              ? "text-white"
              : tone === "inherit"
                ? "text-current"
                : "text-foreground",
          )}
        >
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            {showLabel ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                {t("nav.deliverTo", "Deliver to")}
              </span>
            ) : null}
            <span className="max-w-48 truncate text-sm font-bold">
              {getButtonText()}
            </span>
          </span>
          <Icon
            icon="solar:alt-arrow-down-linear"
            className="shrink-0 text-sm opacity-60"
          />
        </button>
      ) : variant === "desktop" ? (
        <button
          type="button"
          onClick={isCheckoutLocked ? undefined : onOpen}
          disabled={!isInitialized || isCheckoutLocked}
          className={clsx(
            "hidden min-w-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs transition-colors hover:border-primary/60 min-[1024px]:flex",
            tone === "light"
              ? "border-white/15 text-ink-foreground"
              : tone === "inherit"
                ? "border-divider bg-white/90 text-current"
                : "border-divider bg-content1/90 text-foreground",
          )}
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate opacity-80">{getButtonText()}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={isCheckoutLocked ? undefined : onOpen}
          disabled={!isInitialized || isCheckoutLocked}
          className={clsx(
            "flex h-8 w-full max-w-full min-w-0 cursor-pointer items-center gap-1.5 px-0 text-start text-xs font-semibold transition-opacity hover:opacity-75",
            tone === "light"
              ? "text-white"
              : tone === "inherit"
                ? "text-current"
                : "text-foreground",
          )}
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="max-w-44 truncate leading-none">
            {getButtonText()}
          </span>
          <Icon
            icon="solar:alt-arrow-down-linear"
            className="h-3.5 w-3.5 shrink-0 opacity-70"
          />
        </button>
      )}

      <Sheet
        isOpen={isOpen}
        onClose={handleCloseModal}
        isDismissable
        classNames={{
          base: "w-full overflow-hidden bg-content1",
          body: "px-4 pb-6 pt-2 flex flex-col gap-3",
          header: "items-start border-b border-divider px-4 pb-4 pt-3 sm:px-5",
        }}
        size="lg"
        backdrop="blur"
        title={
          <span className="text-xl font-extrabold text-foreground">
            {t("locationSelector.modalTitle", "Select delivery location")}
          </span>
        }
      >
        <>
          <p className="text-sm leading-5 text-default-500">
            {t(
              "locationSelector.modalSubtitle",
              "Choose a saved address or use your current location.",
            )}
          </p>

          <Button
            onPress={handleUseCurrentLocation}
            isDisabled={isBusy}
            isLoading={locatingId === "current"}
            variant="light"
            color="default"
            startContent={
              locatingId !== "current" && (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-medium bg-content2">
                  <Icon
                    icon="solar:gps-linear"
                    className="text-xl text-foreground"
                  />
                </span>
              )
            }
            endContent={
              locatingId !== "current" && (
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="ms-auto text-lg text-default-400 rtl:rotate-180"
                />
              )
            }
            className="h-auto min-h-16 w-full justify-start rounded-large px-2 py-2 text-start text-foreground hover:bg-content2"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-sm font-bold">
                {locatingId === "current"
                  ? t("locationSelector.detecting")
                  : t(
                      "locationSelector.useCurrentLocation",
                      "Use current location",
                    )}
              </span>
              <span className="text-xs font-normal text-default-500">
                {t(
                  "locationSelector.deliveryAreaHint",
                  "See delivery availability for your area",
                )}
              </span>
            </span>
          </Button>

          <Divider className="my-1" />
          <h3 className="text-sm font-bold text-default-500">
            {t("locationSelector.savedAddresses", "Saved addresses")}
          </h3>

          {!isLoggedIn ? (
            <div className="rounded-large border border-divider bg-content2/50 px-4 py-6 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-large bg-content1">
                <Icon
                  icon="solar:map-point-linear"
                  className="text-2xl text-default-500"
                />
              </div>
              <p className="mb-4 text-sm text-default-500">
                {t(
                  "locationSelector.loginPrompt",
                  "Log in to see your saved addresses",
                )}
              </p>
              <Button
                className="mx-auto font-bold"
                color="primary"
                variant="solid"
                onPress={openLogin}
              >
                {t("login_modal.sign_in")}
              </Button>
            </div>
          ) : isAddressesLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Spinner size="lg" color="current" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-large border border-divider bg-content2/50 px-4 py-6 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-large bg-content1">
                <Icon
                  icon="solar:map-point-linear"
                  className="text-2xl text-default-500"
                />
              </div>
              <p className="text-sm text-default-500">
                {t(
                  "locationSelector.noSavedAddresses",
                  "No saved addresses yet",
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => handleSelectAddress(address)}
                    disabled={isBusy}
                    className={`flex w-full items-center gap-3 rounded-large border bg-content1 p-3 text-start shadow-sm transition-colors disabled:opacity-60 ${
                      isSelected
                        ? "border-primary bg-primary-50"
                        : "border-divider hover:border-default-400"
                    }`}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-medium bg-content2">
                      {locatingId === address.id.toString() ? (
                        <Spinner size="sm" color="current" />
                      ) : (
                        getAddressTypeIcon(address.address_type)
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-bold capitalize">
                        {address.address_type}
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-default-500">
                        {address.address_line1}
                        {address.address_line2 &&
                          `, ${address.address_line2}`}, {address.city},{" "}
                        {address.state} {address.zipcode}
                      </span>
                    </div>
                    <Icon
                      icon={
                        isSelected
                          ? "solar:check-circle-bold"
                          : "solar:alt-arrow-right-linear"
                      }
                      className={clsx(
                        "shrink-0 text-lg rtl:rotate-180",
                        isSelected ? "text-primary" : "text-default-400",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </>
      </Sheet>
    </div>
  );
};

export default LocationSelector;
