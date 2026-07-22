import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  addToast,
  Alert,
  Spinner,
} from "@heroui/react";
import { ChevronDown, MapPin, LocateFixed, Home, Building } from "lucide-react";
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
        return <Home className="w-4 h-4 text-primary" />;
      case "work":
        return <Building className="w-4 h-4 text-primary" />;
      default:
        return <MapPin className="w-4 h-4 text-default-500" />;
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
      <button id="location-modal-btn" onClick={() => onOpen()} />
      <Button
        disableRipple
        color={
          !isInitialized ? "warning" : selectedLocation ? undefined : "primary"
        }
        variant="flat"
        onPress={onOpen}
        className="p-0 py-0 bg-transparent max-w-full"
        startContent={<MapPin width={16} />}
        endContent={<ChevronDown width={16} />}
        isDisabled={!isInitialized}
        fullWidth
      >
        <span className="truncate text-left flex-1">{getButtonText()}</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        scrollBehavior="inside"
        isDismissable={selectedLocation ? true : false}
        classNames={{
          base: "w-full overflow-hidden",
          body: "px-2 md:px-4",
          header: "p-3 sm:p-4",
        }}
        size="lg"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center">
            <span>
              {t("locationSelector.modalTitle", "Select delivery address")}
            </span>
          </ModalHeader>
          <ModalBody className="pb-6 flex flex-col gap-4">
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
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isBusy}
              className="flex items-center gap-3 w-full text-left disabled:opacity-60"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {locatingId === "current" ? (
                  <Spinner size="sm" color="primary" />
                ) : (
                  <LocateFixed size={18} />
                )}
              </div>
              <span className="text-sm font-semibold text-primary">
                {t("locationSelector.useCurrentLocation", "Use my current location")}
              </span>
            </button>

            <div className="border-t border-dashed border-default-200" />

            {/* Saved addresses */}
            {!isLoggedIn ? (
              <div className="text-center py-6">
                <MapPin className="w-10 h-10 text-default-300 mx-auto mb-3" />
                <p className="text-sm text-default-500 mb-4">
                  {t(
                    "locationSelector.loginPrompt",
                    "Log in to see your saved addresses",
                  )}
                </p>
                <Button color="primary" variant="flat" onPress={openLogin}>
                  {t("login_modal.button", "Login")}
                </Button>
              </div>
            ) : isAddressesLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" color="primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6">
                <MapPin className="w-10 h-10 text-default-300 mx-auto mb-2" />
                <p className="text-sm text-default-500">
                  {t(
                    "locationSelector.noSavedAddresses",
                    "No saved addresses yet",
                  )}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-default-500 uppercase">
                  {t("locationSelector.savedAddresses", "Saved addresses")}
                </p>
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
                      className={`flex items-start gap-3 w-full text-left rounded-xl p-3 border transition-colors disabled:opacity-60 ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-default-200 hover:bg-default-100"
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
                        <span className="text-sm font-medium capitalize">
                          {address.address_type}
                        </span>
                        <span className="text-xs text-default-500 line-clamp-2">
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default LocationSelector;
