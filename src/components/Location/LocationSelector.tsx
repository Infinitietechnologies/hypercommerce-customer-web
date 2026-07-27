import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Divider,
  Sheet,
  useDisclosure,
  toast as addToast,
  Alert,
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
import { RootState } from "@/lib/redux/store";
import { Address } from "@/types/ApiResponse";

type SelectedLocation = {
  placeName: string;
  latLng: { lat: number; lng: number };
  placeDescription: string;
};

const LocationSelector = () => {
  const { defaultLocation, demoMode, systemSettings } = useSettings();
  const { t } = useTranslation();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  const [selectedLatLng, setSelectedLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(defaultLocation);
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
        const userLocation = getCookie("userLocation") as UserLocation;

        if (userLocation && userLocation.lat && userLocation.lng) {
          const locationData: SelectedLocation = {
            placeName: userLocation.placeName || "Selected Location",
            latLng: { lat: userLocation.lat, lng: userLocation.lng },
            placeDescription: userLocation.placeDescription || "",
          };

          setSelectedLatLng(locationData.latLng);
          setSelectedLocation(locationData);
        }
      } catch (error) {
        console.error("Error initializing location from cookie:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLocation();
  }, []);

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

    setSelectedLatLng(finalLatLng);
    setSelectedLocation(finalLocation);

    const userLocation: UserLocation = {
      lat: finalLatLng.lat,
      lng: finalLatLng.lng,
      placeName: finalLocation.placeName,
      placeDescription: finalLocation.placeDescription,
    };
    setCookie<UserLocation>("userLocation", userLocation);

    await resolveMarket(countryCode);
    onLocationChange();

    onClose();
    addToast({ title: "Location confirmed successfully", color: "success" });
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
    );
    setLocatingId(null);
  };

  const handleCloseModal = () => {
    if (selectedLocation) {
      onClose();
    } else {
      addToast({
        color: "danger",
        title: "Please select a location to continue !",
      });
    }
  };

  const openLogin = () => {
    onClose();
    document.getElementById("login-btn")?.click();
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "home":
        return (
          <Icon icon="solar:home-2-linear" className="text-lg text-primary" />
        );
      case "work":
        return (
          <Icon
            icon="solar:buildings-2-linear"
            className="text-lg text-primary"
          />
        );
      default:
        return (
          <Icon
            icon="solar:map-point-linear"
            className="text-lg text-default-500"
          />
        );
    }
  };

  // Header button label
  const getButtonText = () => {
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
      <button
        type="button"
        onClick={onOpen}
        disabled={!isInitialized}
        className="flex max-w-full items-center gap-2 min-[1024px]:w-auto shrink-0 text-left transition-colors disabled:opacity-60
          rounded-medium border border-divider bg-content1 px-3.5 h-11 shadow-sm hover:border-primary"
      >
        <Icon
          icon="solar:map-point-bold"
          className="text-lg text-primary-600 shrink-0"
        />
        <span className="leading-tight min-w-0 flex-1 min-[1024px]:flex-none">
          <span className="block text-xxs font-semibold text-default-500">
            {t("locationSelector.deliverTo")}
          </span>
          <span className="block text-compact font-semibold truncate min-[1024px]:max-w-[150px]">
            {getButtonText()}
          </span>
        </span>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className="text-base text-default-400 shrink-0"
        />
      </button>

      <Sheet
        isOpen={isOpen}
        onClose={handleCloseModal}
        isDismissable={selectedLocation ? true : false}
        classNames={{
          base: "w-full overflow-hidden",
          body: "px-2 md:px-4 pb-6 flex flex-col gap-4",
          header: "flex flex-col gap-1 items-start p-3 sm:p-4",
        }}
        size="lg"
        backdrop="blur"
        title={
          <>
            <span className="text-lg font-extrabold">
              {t("locationSelector.modalTitle", "Select delivery address")}
            </span>
            <span className="text-sm font-normal text-default-500">
              {t("locationSelector.modalSubtitle")}
            </span>
          </>
        }
      >
        <>
            {demoMode && (
              <Alert
                color="warning"
                title={
                  systemSettings?.customerLocationDemoModeMessage
                    ? systemSettings?.customerLocationDemoModeMessage
                    : "Demo mode is enabled. Location will default automatically."
                }
                variant="faded"
                classNames={{
                  title: "text-xs",
                  base: "py-2",
                  alertIcon: "w-5",
                  iconWrapper: "w-5 h-5",
                }}
              />
            )}

            {/* Use my current location */}
            <Button
              onPress={handleUseCurrentLocation}
              isDisabled={isBusy}
              isLoading={locatingId === "current"}
              variant="flat"
              color="primary"
              startContent={
                locatingId !== "current" && (
                  <Icon icon="solar:gps-linear" className="text-xl" />
                )
              }
              className="justify-start font-bold h-12"
            >
              {locatingId === "current"
                ? t("locationSelector.detecting")
                : t(
                    "locationSelector.useCurrentLocation",
                    "Use my current location",
                  )}
            </Button>

            {/* Saved addresses */}
            <div className="flex items-center gap-3">
              <Divider className="flex-1" />
              <span className="text-xs font-bold uppercase tracking-wider text-default-400">
                {t("locationSelector.savedAddresses", "Saved addresses")}
              </span>
              <Divider className="flex-1" />
            </div>

            {!isLoggedIn ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-large bg-primary-100/60 grid place-items-center mx-auto mb-3">
                  <Icon
                    icon="solar:map-point-linear"
                    className="text-3xl text-primary-600"
                  />
                </div>
                <p className="text-sm text-default-500 mb-4">
                  {t(
                    "locationSelector.loginPrompt",
                    "Log in to see your saved addresses",
                  )}
                </p>
                <Button
                  className="font-bold"
                  color="primary"
                  variant="flat"
                  onPress={openLogin}
                >
                  {t("login_modal.sign_in")}
                </Button>
              </div>
            ) : isAddressesLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" color="primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-large bg-primary-100/60 grid place-items-center mx-auto mb-3">
                  <Icon
                    icon="solar:map-point-linear"
                    className="text-3xl text-primary-600"
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
              <div className="flex flex-col gap-2">
                {addresses.map((address) => {
                  const isSelected =
                    selectedLatLng?.lat === address.latitude &&
                    selectedLatLng?.lng === address.longitude;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => handleSelectAddress(address)}
                      disabled={isBusy}
                      className={`flex items-start gap-3 w-full text-left rounded-xl px-3 py-3 border bg-content2 transition-colors disabled:opacity-60 ${
                        isSelected
                          ? "border-primary"
                          : "border-divider hover:border-primary/60"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {locatingId === address.id.toString() ? (
                          <Spinner size="sm" color="primary" />
                        ) : (
                          getAddressTypeIcon(address.address_type)
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold capitalize">
                          {address.address_type}
                        </span>
                        <span className="text-xs text-default-500 mt-0.5 line-clamp-2">
                          {address.address_line1}
                          {address.address_line2 &&
                            `, ${address.address_line2}`}
                          , {address.city}, {address.state} {address.zipcode}
                        </span>
                      </div>
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
