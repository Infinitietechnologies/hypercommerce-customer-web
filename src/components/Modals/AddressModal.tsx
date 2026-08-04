import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Button,
  Autocomplete,
  AutocompleteItem,
  Spinner,
  toast as addToast,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import { FC, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Address } from "@/types/ApiResponse";
import { AddressParams } from "@/types/params";
import { GeoCity, GeoCountry } from "@/types/geo";
import {
  addAddress,
  editAddress,
  getGeoCountries,
  searchGeoCities,
  resolvePincode,
} from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { staticLat, staticLng } from "@/config/constants";

interface AddressModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave?: (addressData: AddressParams) => void;
  initialData?: Partial<Address>;
}

type AddressFormData = {
  id: string | number;
  address_line1: string;
  address_line2: string;
  city: string;
  landmark: string;
  state: string;
  zipcode: string;
  mobile: string;
  address_type: "home" | "office" | "other";
  country: string;
  country_code: string;
};

// Wait for the global Google Maps loader (mounted in layouts/default.tsx).
// Used only to reverse-geocode "use my current location" — no map is rendered.
const waitForGoogleMaps = (timeout = 5000): Promise<boolean> =>
  new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (typeof window.google?.maps?.importLibrary === "function") {
        resolve(true);
      } else if (Date.now() - start > timeout) {
        resolve(false);
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });

type ReverseGeocode = {
  formatted: string;
  countryCode?: string;
  postalCode?: string;
  city?: string;
};

const reverseGeocode = async (latLng: {
  lat: number;
  lng: number;
}): Promise<ReverseGeocode | null> => {
  const loaded = await waitForGoogleMaps();
  if (!loaded) return null;
  try {
    const { Geocoder } = (await window.google.maps.importLibrary(
      "geocoding",
    )) as google.maps.GeocodingLibrary;
    const geocoder = new Geocoder();
    const result = await geocoder.geocode({ location: latLng });
    const place = result?.results?.[0];
    if (!place) return null;
    let countryCode: string | undefined;
    let postalCode: string | undefined;
    let city: string | undefined;
    for (const c of place.address_components) {
      const type = c.types[0];
      if (type === "country") countryCode = c.short_name;
      else if (type === "postal_code") postalCode = c.long_name;
      else if (type === "locality") city = c.long_name;
    }
    return { formatted: place.formatted_address, countryCode, postalCode, city };
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return null;
  }
};

const emptyForm = (initialData?: Partial<Address>): AddressFormData => ({
  id: initialData?.id || "",
  address_line1: initialData?.address_line1 || "",
  address_line2: initialData?.address_line2 || "",
  city: initialData?.city || "",
  landmark: initialData?.landmark || "",
  state: initialData?.state || "",
  zipcode: initialData?.zipcode || "",
  mobile: initialData?.mobile || "",
  address_type: (initialData?.address_type as "home" | "office" | "other") || "home",
  country: initialData?.country || "",
  country_code: initialData?.country_code || "",
});

const AddressModal: FC<AddressModalProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  initialData,
}) => {
  const { defaultLocation, demoMode } = useSettings();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(() =>
    emptyForm(initialData),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Coordinates are only sent when captured via "use my current location".
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialData?.latitude && initialData?.longitude
      ? { lat: initialData.latitude, lng: initialData.longitude }
      : null,
  );

  // Countries directory (drives which fields show: city vs zipcode search).
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  // City-type search state
  const [citySearch, setCitySearch] = useState(initialData?.city || "");
  const debouncedCity = useDebouncedValue(citySearch, 350);
  const [cityResults, setCityResults] = useState<GeoCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  // Zipcode-type search state
  const [zipInput, setZipInput] = useState(initialData?.zipcode || "");
  const debouncedZip = useDebouncedValue(zipInput, 400);
  const [pincodeCities, setPincodeCities] = useState<string[]>(
    initialData?.city ? [initialData.city] : [],
  );
  const [zipLoading, setZipLoading] = useState(false);

  const [locating, setLocating] = useState(false);

  // Skip the reactive lookups on the very first run after a programmatic set
  // (edit prefill / current-location autofill) so we don't clobber the values.
  const skipCityLookup = useRef(!!initialData?.city);
  const skipZipLookup = useRef(!!initialData?.zipcode);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.iso2 === formData.country_code) || null,
    [countries, formData.country_code],
  );
  const singleCountry = countries.length === 1;
  const countryType = selectedCountry?.type;

  const setField = useCallback(
    (field: keyof AddressFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
    },
    [],
  );

  // Re-sync the form from initialData each time the modal opens (edit reuses a
  // mounted instance; add starts clean). Skip the first auto-lookup so prefilled
  // city/zipcode values are not clobbered.
  useEffect(() => {
    if (!isOpen) return;
    setFormData(emptyForm(initialData));
    setCitySearch(initialData?.city || "");
    setCityResults([]);
    setZipInput(initialData?.zipcode || "");
    setPincodeCities(initialData?.city ? [initialData.city] : []);
    setLocation(
      initialData?.latitude && initialData?.longitude
        ? { lat: initialData.latitude, lng: initialData.longitude }
        : null,
    );
    setErrors({});
    skipCityLookup.current = !!initialData?.city;
    skipZipLookup.current = !!initialData?.zipcode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load the countries directory whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setCountriesLoading(true);
    getGeoCountries()
      .then((res) => {
        if (!active) return;
        const list = res.success && Array.isArray(res.data) ? res.data : [];
        setCountries(list);
        // Auto-select when there is exactly one country, or none is chosen yet.
        setFormData((prev) => {
          if (prev.country_code && list.some((c) => c.iso2 === prev.country_code)) {
            return prev;
          }
          if (list.length === 1) {
            return { ...prev, country: list[0].name, country_code: list[0].iso2 };
          }
          return prev;
        });
      })
      .finally(() => active && setCountriesLoading(false));
    return () => {
      active = false;
    };
  }, [isOpen]);

  // City lookup (city-type countries).
  useEffect(() => {
    if (skipCityLookup.current) {
      skipCityLookup.current = false;
      return;
    }
    // An empty query returns the backend's default list (20 cities), so the
    // dropdown is populated as soon as a city-type country is active.
    const q = debouncedCity.trim();
    // Bail out — and clear any spinner left over from a previous country's
    // in-flight lookup — when this is no longer a city country, or the debounced
    // value has not yet caught up to the live input (e.g. right after a country
    // reset clears the field).
    if (
      countryType !== "city" ||
      !formData.country_code ||
      debouncedCity !== citySearch
    ) {
      setCityLoading(false);
      return;
    }
    let active = true;
    setCityLoading(true);
    searchGeoCities(formData.country_code, q)
      .then((res) => {
        if (!active) return;
        setCityResults(res.success && Array.isArray(res.data) ? res.data : []);
      })
      .finally(() => active && setCityLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCity, countryType, formData.country_code]);

  const applyPincode = useCallback(
    (
      cities: string[],
      geo: { country_name: string; country_iso2: string; state_name: string },
    ) => {
      const list = Array.isArray(cities) ? cities : [];
      setPincodeCities(list);
      setFormData((prev) => ({
        ...prev,
        state: geo.state_name || prev.state,
        country: geo.country_name || prev.country,
        country_code: geo.country_iso2 || prev.country_code,
        city:
          list.length === 1
            ? list[0]
            : list.includes(prev.city)
              ? prev.city
              : "",
      }));
      setErrors((prev) => ({ ...prev, state: "", city: "" }));
    },
    [],
  );

  // Pincode lookup (zipcode-type countries).
  useEffect(() => {
    if (skipZipLookup.current) {
      skipZipLookup.current = false;
      return;
    }
    const code = debouncedZip.trim();
    // Bail out — and clear any spinner left over from a previous country's
    // in-flight lookup — when this is no longer a zipcode country, the field is
    // empty/too short, or the debounced value has not yet caught up to the live
    // input (e.g. right after switching country resets the field to "").
    if (
      countryType !== "zipcode" ||
      !formData.country_code ||
      code.length < 3 ||
      debouncedZip !== zipInput
    ) {
      setZipLoading(false);
      return;
    }
    let active = true;
    setZipLoading(true);
    resolvePincode(formData.country_code, code)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          applyPincode(res.data.cities, {
            country_name: res.data.country_name,
            country_iso2: res.data.country_iso2,
            state_name: res.data.state_name,
          });
        }
      })
      .finally(() => active && setZipLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedZip, countryType, formData.country_code]);

  const handleCountryChange = (iso2: string) => {
    const country = countries.find((c) => c.iso2 === iso2);
    setCitySearch("");
    setCityResults([]);
    setCityLoading(false);
    setZipInput("");
    setPincodeCities([]);
    setZipLoading(false);
    setFormData((prev) => ({
      ...prev,
      country: country?.name || "",
      country_code: iso2,
      state: "",
      city: "",
      zipcode: "",
    }));
  };

  const handleCitySelect = (cityName: string) => {
    const match = cityResults.find((c) => c.name === cityName);
    if (!match) {
      setField("city", cityName);
      return;
    }
    skipCityLookup.current = true;
    setCitySearch(match.name);
    setFormData((prev) => ({
      ...prev,
      city: match.name,
      state: match.state_name || match.state_code || prev.state,
      country: match.country_name || prev.country,
      country_code: match.country_iso2 || prev.country_code,
    }));
    setErrors((prev) => ({ ...prev, city: "", state: "" }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast({
        title: t("address.location.unsupported"),
        color: "danger",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(latLng);
        const geo = await reverseGeocode(latLng);
        if (geo) {
          setFormData((prev) => ({
            ...prev,
            address_line1: prev.address_line1 || geo.formatted,
          }));

          const country = geo.countryCode
            ? countries.find(
                (c) => c.iso2.toUpperCase() === geo.countryCode!.toUpperCase(),
              )
            : undefined;

          if (country) {
            setFormData((prev) => ({
              ...prev,
              country: country.name,
              country_code: country.iso2,
            }));

            if (country.type === "zipcode" && geo.postalCode) {
              skipZipLookup.current = true;
              setZipInput(geo.postalCode);
              setField("zipcode", geo.postalCode);
              const res = await resolvePincode(country.iso2, geo.postalCode);
              if (res.success && res.data) {
                const list = res.data.cities || [];
                const preferred =
                  geo.city && list.includes(geo.city) ? geo.city : list[0] || "";
                setPincodeCities(list);
                setFormData((prev) => ({
                  ...prev,
                  state: res.data!.state_name || prev.state,
                  country: res.data!.country_name || prev.country,
                  country_code: res.data!.country_iso2 || prev.country_code,
                  city: preferred,
                }));
              }
            } else if (country.type === "city" && geo.city) {
              skipCityLookup.current = true;
              setCitySearch(geo.city);
              const res = await searchGeoCities(country.iso2, geo.city);
              const list = res.success && Array.isArray(res.data) ? res.data : [];
              setCityResults(list);
              const match =
                list.find(
                  (c) => c.name.toLowerCase() === geo.city!.toLowerCase(),
                ) || list[0];
              if (match) {
                setFormData((prev) => ({
                  ...prev,
                  city: match.name,
                  state: match.state_name || match.state_code || prev.state,
                  country: match.country_name || prev.country,
                  country_code: match.country_iso2 || prev.country_code,
                }));
              }
            }
          } else if (geo.countryCode) {
            addToast({
              title: t("address.location.countryUnavailable"),
              color: "warning",
            });
          }
        }
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocating(false);
        addToast({
          title:
            error.code === error.PERMISSION_DENIED
              ? t("address.location.denied")
              : t("address.location.failed"),
          color: "danger",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.country_code.trim())
      newErrors.country_code = t("validation.required");
    if (!formData.address_line1.trim())
      newErrors.address_line1 = t("validation.required");
    if (!formData.city.trim()) newErrors.city = t("validation.required");
    if (!formData.state.trim()) newErrors.state = t("validation.required");
    if (countryType === "zipcode" && !formData.zipcode.trim())
      newErrors.zipcode = t("validation.required");
    if (!formData.mobile.trim()) {
      newErrors.mobile = t("validation.mobileRequired");
    } else if (!/^\d+$/.test(formData.mobile.replace(/\s+/g, ""))) {
      newErrors.mobile = t("validation.mobileInvalid");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      if (!validateForm()) {
        addToast({
          title: t("address.toast.save_failed"),
          description: t("validation.fillRequired"),
          color: "warning",
        });
        return;
      }

      // Coordinates: only sent when captured; omitted otherwise.
      const coords =
        location != null
          ? demoMode
            ? {
                latitude: defaultLocation?.lat ?? staticLat,
                longitude: defaultLocation?.lng ?? staticLng,
              }
            : { latitude: location.lat, longitude: location.lng }
          : {};

      const addressData = { ...formData, ...coords };

      const response = initialData
        ? await editAddress(addressData)
        : await addAddress(addressData);

      if (response?.success) {
        addToast({
          title: initialData
            ? t("address.toast.updateSuccess")
            : t("address.toast.addSuccess"),
          color: "success",
        });
        onSave?.(addressData);
        onOpenChange(false);
      } else {
        let errorDescription = response?.message || t("address.toast.error");
        if (response?.data && typeof response.data === "object") {
          const fieldErrors = Object.values(response.data)
            .map((e) => (Array.isArray(e) ? e.join(", ") : String(e)))
            .filter(Boolean)
            .join(". ");
          if (fieldErrors) errorDescription = fieldErrors;
        }
        addToast({
          title: response?.message || t("address.toast.save_failed"),
          description:
            errorDescription !== response?.message ? errorDescription : undefined,
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Save error:", error);
      addToast({
        title: t("address.toast.error"),
        description: error?.message || undefined,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(emptyForm());
    setLocation(null);
    setCitySearch("");
    setCityResults([]);
    setZipInput("");
    setPincodeCities([]);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="max-w-2xl"
      scrollBehavior="inside"
      isDismissable={!isLoading}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5">
          <span className="text-lg font-bold">
            {initialData ? t("address.update") : t("address.addNew")}
          </span>
          <span className="text-xs font-normal text-foreground/50">
            {t("address.subtitle", "Tell us where to deliver your order")}
          </span>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5 pb-2">
          {/* Section: delivery location */}
          <section className="flex flex-col gap-3 rounded-large border border-divider bg-content2/40 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
              <Icon icon="solar:map-point-bold" className="text-sm text-primary" />
              {t("address.sections.location", "Delivery location")}
            </div>

            {/* Use my current location */}
            <Button
              variant="bordered"
              color="primary"
              className="h-11 w-full justify-center gap-2 border-dashed font-semibold"
              onPress={handleUseCurrentLocation}
              isLoading={locating}
              isDisabled={countriesLoading || isLoading}
              startContent={
                !locating && (
                  <Icon icon="solar:gps-bold" className="text-lg" />
                )
              }
            >
              {locating
                ? t("address.location.detecting")
                : t("address.location.useCurrent")}
            </Button>

            {/* Country — hidden and auto-selected when there is only one. */}
            {!singleCountry && (
              <Select
                label={t("address.labels.country")}
                labelPlacement="outside"
                variant="bordered"
                placeholder={t("address.placeholders.selectCountry", "Select country")}
                selectedKeys={
                  formData.country_code ? [formData.country_code] : []
                }
                onSelectionChange={(keys) =>
                  handleCountryChange(Array.from(keys)[0] as string)
                }
                isLoading={countriesLoading}
                isInvalid={!!errors.country_code}
                errorMessage={errors.country_code}
                isRequired
                isDisabled={isLoading}
              >
                {countries.map((c) => (
                  <SelectItem key={c.iso2} textValue={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </Select>
            )}

            {/* City-type: search a city → auto-fills state + country. */}
            {countryType === "city" && (
              <Autocomplete
                label={t("address.labels.city")}
                labelPlacement="outside"
                variant="bordered"
                placeholder={t("address.placeholders.searchCity")}
                inputValue={citySearch}
                onInputChange={setCitySearch}
                onSelectionChange={(key) =>
                  key != null && handleCitySelect(String(key))
                }
                items={cityResults}
                isLoading={cityLoading}
                isInvalid={!!errors.city}
                errorMessage={errors.city}
                isRequired
                isDisabled={isLoading}
                allowsCustomValue
                allowsEmptyCollection
                menuTrigger="focus"
              >
                {(city: GeoCity) => (
                  <AutocompleteItem key={city.name} textValue={city.name}>
                    <div className="flex flex-col">
                      <span className="text-sm">{city.name}</span>
                      <span className="text-xs text-foreground/50">
                        {[city.state_name, city.country_name]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>
            )}

            {/* Zipcode-type: enter a pincode → resolves country/state + cities. */}
            {countryType === "zipcode" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label={t("address.labels.zipcode")}
                  labelPlacement="outside"
                  variant="bordered"
                  placeholder={t("address.placeholders.searchZipcode")}
                  value={zipInput}
                  onChange={(e) => {
                    setZipInput(e.target.value);
                    setField("zipcode", e.target.value);
                  }}
                  isInvalid={!!errors.zipcode}
                  errorMessage={errors.zipcode}
                  isRequired
                  isReadOnly={isLoading || !formData.country_code}
                  endContent={
                    zipLoading ? (
                      <Spinner size="sm" color="primary" />
                    ) : undefined
                  }
                  classNames={{ errorMessage: "text-xs" }}
                />
                {pincodeCities.length > 0 && (
                  <Select
                    label={t("address.labels.city")}
                    labelPlacement="outside"
                    variant="bordered"
                    placeholder={t("address.placeholders.selectCity", "Select city")}
                    selectedKeys={formData.city ? [formData.city] : []}
                    onSelectionChange={(keys) =>
                      setField("city", Array.from(keys)[0] as string)
                    }
                    isInvalid={!!errors.city}
                    errorMessage={errors.city}
                    isRequired
                    isDisabled={isLoading}
                  >
                    {pincodeCities.map((city) => (
                      <SelectItem key={city} textValue={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {/* State — always auto-filled, never typed manually. */}
            <Input
              label={t("address.labels.state")}
              labelPlacement="outside"
              variant="bordered"
              value={formData.state}
              isReadOnly
              isInvalid={!!errors.state}
              errorMessage={errors.state}
              placeholder={t("address.placeholders.stateAuto")}
              startContent={
                <Icon
                  icon="solar:map-linear"
                  className="text-base text-foreground/40"
                />
              }
              classNames={{ errorMessage: "text-xs" }}
            />
          </section>

          {/* Section: address details */}
          <section className="flex flex-col gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
              {t("address.sections.details", "Address details")}
            </div>

            <Input
              label={t("address.labels.addressLine1")}
              labelPlacement="outside"
              variant="bordered"
              placeholder={t("address.placeholders.addressLine1", "House / flat, street")}
              value={formData.address_line1}
              onChange={(e) => setField("address_line1", e.target.value)}
              isInvalid={!!errors.address_line1}
              errorMessage={errors.address_line1}
              isRequired
              isReadOnly={isLoading}
              classNames={{ errorMessage: "text-xs" }}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={t("address.labels.addressLine2")}
                labelPlacement="outside"
                variant="bordered"
                placeholder={t("address.placeholders.addressLine2", "Area, colony (optional)")}
                value={formData.address_line2}
                onChange={(e) => setField("address_line2", e.target.value)}
                isReadOnly={isLoading}
              />
              <Input
                label={t("address.labels.landmark")}
                labelPlacement="outside"
                variant="bordered"
                placeholder={t("address.placeholders.landmark", "Nearby landmark (optional)")}
                value={formData.landmark}
                onChange={(e) => setField("landmark", e.target.value)}
                isReadOnly={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={t("address.labels.mobile")}
                labelPlacement="outside"
                variant="bordered"
                placeholder={t("address.placeholders.mobile", "10-digit mobile number")}
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!isNaN(Number(value))) setField("mobile", value);
                }}
                isInvalid={!!errors.mobile}
                errorMessage={errors.mobile}
                isRequired
                isReadOnly={isLoading}
                startContent={
                  <Icon
                    icon="solar:phone-linear"
                    className="text-base text-foreground/40"
                  />
                }
                classNames={{ errorMessage: "text-xs" }}
              />
              <Select
                label={t("address.labels.addressType")}
                labelPlacement="outside"
                variant="bordered"
                selectedKeys={[formData.address_type]}
                onSelectionChange={(keys) =>
                  setField(
                    "address_type",
                    Array.from(keys)[0] as "home" | "office" | "other",
                  )
                }
                isDisabled={isLoading}
              >
                <SelectItem key="home" textValue={t("home_title")}>
                  {t("home_title")}
                </SelectItem>
                <SelectItem key="office" textValue={t("office")}>
                  {t("office")}
                </SelectItem>
                <SelectItem key="other" textValue={t("other")}>
                  {t("other")}
                </SelectItem>
              </Select>
            </div>
          </section>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button color="primary" onPress={handleSave} isLoading={isLoading}>
            {initialData ? t("address.update") : t("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddressModal;
