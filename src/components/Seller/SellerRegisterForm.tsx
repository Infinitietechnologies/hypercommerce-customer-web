import { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Input,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Autocomplete,
  AutocompleteItem,
  Image,
  Select,
  SelectItem,
  Skeleton,
  ErrorState,
  toastError,
  toastSuccess,
} from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";
import CountryList from "country-list-with-dial-code-and-flag";
import { getFlagEmoji } from "@/helpers/getters";
import { useTranslation } from "react-i18next";
import LocationAutoComplete from "@/components/Location/LocationAutoComplete";
import type { LocationAutoCompleteRef } from "@/components/Location/types/LocationAutoComplete.types";
import type {
  SellerRegistrationFields,
  SellerRegistrationResponse,
  SellerRegistrationField,
} from "@/types/seller";
import {
  SECTION_KEYS,
  fieldValue,
  validateField,
  appendDynamicFields,
  registrationErrors,
  type DynamicValues,
} from "@/features/seller-onboarding/fields";
import SellerFieldUpload from "@/features/seller-onboarding/components/SellerFieldUpload";

const INITIAL_FORM = {
  sellerName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  landmark: "",
  state: "",
  zipcode: "",
  country: "",
  countryCode: "",
  latitude: "",
  longitude: "",
};
const ACCOUNT_FIELDS = [
  "sellerName",
  "mobile",
  "email",
  "password",
  "confirmPassword",
] as const;
const ADDRESS_FIELDS = [
  "address",
  "city",
  "landmark",
  "state",
  "zipcode",
  "country",
] as const;
type FormValues = typeof INITIAL_FORM;
type Step =
  | "basic"
  | "business"
  | "bank_details"
  | "business_documents"
  | "review";
const COUNTRIES = Array.from(
  new Map(
    ((CountryList.getAll?.() || []) as { name: string; code: string }[]).map(
      (country) => [country.code, { name: country.name, code: country.code }],
    ),
  ).values(),
);

interface Props {
  schema?: SellerRegistrationFields;
  fieldsLoading: boolean;
  fieldsError: boolean;
  onCountryChange: (country: string) => void;
  onRetry: () => void;
  onSubmit: (data: FormData) => Promise<SellerRegistrationResponse>;
  sellerPanelUrl: string;
}

export default function SellerRegisterForm({
  schema,
  fieldsLoading,
  fieldsError,
  onCountryChange,
  onRetry,
  onSubmit,
  sellerPanelUrl,
}: Props) {
  const { t } = useTranslation();
  const locationAutoCompleteRef = useRef<LocationAutoCompleteRef>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const geocodeVersion = useRef(0);
  const submitLock = useRef(false);
  const [step, setStep] = useState<Step>("basic");
  const [formData, setFormData] = useState<FormValues>(INITIAL_FORM);
  const [values, setValues] = useState<DynamicValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reducedMotion = useReducedMotion();
  const steps: Step[] = [
    "basic",
    "business",
    ...SECTION_KEYS.filter(
      (key) => !schema || schema.sections[key].fields.length > 0,
    ),
    "review",
  ];
  const currentIndex = steps.indexOf(step);
  const schemaReady = Boolean(
    schema &&
    schema.country.iso2.toUpperCase() === formData.countryCode &&
    !fieldsError &&
    !fieldsLoading,
  );
  const inputProps = {
    variant: "bordered" as const,
    labelPlacement: "outside" as const,
    radius: "md" as const,
  };
  const copy = (key: string) => t(`pages.sellerRegister.dynamic.${key}`);
  const title = (key: Step) =>
    key === "bank_details" || key === "business_documents"
      ? schema?.sections[key].label || copy(`${key}Title`)
      : key === "basic"
        ? copy("accountTitle")
        : key === "business"
          ? copy("addressTitle")
          : t(`pages.sellerRegister.steps.${key}.title`);
  const description = (key: Step) =>
    key === "bank_details" || key === "business_documents"
      ? copy(`${key}Description`)
      : key === "business"
        ? copy("addressDescription")
        : t(`pages.sellerRegister.steps.${key}.subheading`);

  const changeCountry = (code: string, name: string) => {
    geocodeVersion.current += 1;
    if (code !== formData.countryCode) {
      setValues({});
      setAgreed(false);
      setErrors((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(
            ([key]) => !key.startsWith("dynamic_fields.") && key !== "country",
          ),
        ),
      );
    }
    setFormData((previous) => ({
      ...previous,
      countryCode: code,
      country: name,
    }));
    onCountryChange(code);
  };

  const handleLocationSelect = async (location: {
    latLng: { lat: number; lng: number };
  }) => {
    const version = ++geocodeVersion.current;
    try {
      const result = await new window.google.maps.Geocoder().geocode({
        location: location.latLng,
      });
      if (version !== geocodeVersion.current || !result.results[0]) return;
      const place = result.results[0];
      const part = (type: string) =>
        place.address_components.find((component) =>
          component.types.includes(type),
        );
      const code = part("country")?.short_name.toUpperCase() || "";
      changeCountry(
        code,
        COUNTRIES.find((country) => country.code === code)?.name ||
          part("country")?.long_name ||
          "",
      );
      setFormData((previous) => ({
        ...previous,
        address: place.formatted_address,
        city: part("locality")?.long_name || "",
        state: part("administrative_area_level_1")?.long_name || "",
        zipcode: part("postal_code")?.long_name || "",
        latitude: String(location.latLng.lat),
        longitude: String(location.latLng.lng),
      }));
      locationAutoCompleteRef.current?.setInputValue(place.formatted_address);
    } catch {
      toastError(copy("locationError"));
    }
  };

  const handleInputChange = (name: keyof FormValues, value: string) => {
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };
  const changeField = (
    field: SellerRegistrationField,
    value: string | File,
  ) => {
    setValues((previous) => ({ ...previous, [field.key]: value }));
    setErrors((previous) => ({
      ...previous,
      [`dynamic_fields.${field.key}`]: "",
    }));
  };

  const validateStep = (key: Step) => {
    const result: Record<string, string> = {};
    const required = (field: keyof FormValues) => {
      if (!formData[field].trim())
        result[field] = t("pages.sellerRegister.error.required");
    };
    if (key === "basic" || key === "business") {
      (key === "basic" ? ACCOUNT_FIELDS : ADDRESS_FIELDS).forEach(required);
      (key === "basic" ? ACCOUNT_FIELDS : ADDRESS_FIELDS).forEach((field) => {
        if (
          field !== "password" &&
          field !== "confirmPassword" &&
          formData[field].length > 255
        )
          result[field] = copy("baseMaxLength");
      });
    }
    if (key === "basic") {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        result.email = t("pages.sellerRegister.error.invalidEmail");
      if (
        formData.mobile &&
        (!/^[0-9\s\-+()]+$/.test(formData.mobile) || formData.mobile.length < 7)
      )
        result.mobile = t("pages.sellerRegister.error.invalidMobile");
      if (formData.password && formData.password.length < 8)
        result.password = t("pages.sellerRegister.error.shortPassword");
      if (formData.password !== formData.confirmPassword)
        result.confirmPassword = t(
          "pages.sellerRegister.error.passwordMismatch",
        );
    }
    if (key === "business" && !schemaReady && formData.countryCode)
      result.country = copy("fieldsUnavailable");
    if (
      (key === "bank_details" || key === "business_documents") &&
      schemaReady &&
      schema
    ) {
      schema.sections[key].fields.forEach((field) => {
        const error = validateField(field, fieldValue(field, values));
        if (error)
          result[`dynamic_fields.${field.key}`] =
            error === "required"
              ? t("pages.sellerRegister.error.required")
              : copy(error);
      });
    }
    if (key === "review" && !agreed)
      result.consent = t("pages.sellerRegister.error.consentRequired");
    return result;
  };

  const fieldsForStep = (key: Step) =>
    key === "basic"
      ? [...ACCOUNT_FIELDS]
      : key === "business"
        ? [...ADDRESS_FIELDS]
        : key === "review"
          ? ["consent"]
          : schema?.sections[key].fields.map(
              (field) => `dynamic_fields.${field.key}`,
            ) || [];
  const focusError = (key: Step, nextErrors: Record<string, string>) => {
    setStep(key);
    window.requestAnimationFrame(() => {
      const name = fieldsForStep(key).find((field) => nextErrors[field]);
      const group = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>("[data-field]") || [],
      ).find((element) => element.dataset.field === name);
      const control = group?.matches("input,button,select,textarea")
        ? group
        : group?.querySelector<HTMLElement>(
            'input:not([type="hidden"]),button,select,textarea',
          );
      control?.focus();
      group?.scrollIntoView({
        block: "center",
        behavior: reducedMotion ? "instant" : "smooth",
      });
    });
  };
  const showErrors = (nextErrors: Record<string, string>) => {
    setErrors(nextErrors);
    const first = steps.find((key) =>
      fieldsForStep(key).some((field) => nextErrors[field]),
    );
    if (first) focusError(first, nextErrors);
    toastError(
      t("pages.sellerRegister.toast.validationErrorTitle"),
      t("pages.sellerRegister.toast.validationErrorDesc"),
    );
  };
  const goNext = () => {
    const nextErrors = validateStep(step);
    if (Object.keys(nextErrors).length) return showErrors(nextErrors);
    setErrors({});
    geocodeVersion.current += 1;
    setStep(steps[currentIndex + 1]);
  };

  const handleSubmit = async () => {
    if (submitLock.current) return;
    const nextErrors = Object.assign({}, ...steps.map(validateStep));
    if (Object.keys(nextErrors).length) return showErrors(nextErrors);
    if (!schemaReady || !schema) return;
    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "confirmPassword" && key !== "countryCode")
          data.append(key === "sellerName" ? "name" : key, value);
      });
      data.set("country", schema.country.name);
      data.append("country_iso2", formData.countryCode);
      appendDynamicFields(data, schema, values);
      const response = await onSubmit(data);
      if (response.success) {
        setFormData(INITIAL_FORM);
        setValues({});
        setErrors({});
        setAgreed(false);
        setStep("basic");
        onCountryChange("");
        toastSuccess(
          t("pages.sellerRegister.toast.successTitle"),
          t("pages.sellerRegister.toast.successDesc"),
        );
        window.setTimeout(() => {
          window.open(sellerPanelUrl, "_blank", "noopener,noreferrer");
        }, 2000);
      } else {
        const serverErrors = registrationErrors(response);
        if (Object.keys(serverErrors).length) showErrors(serverErrors);
        toastError(
          t("pages.sellerRegister.toast.errorTitle"),
          response.message || copy("submitError"),
        );
      }
    } catch {
      toastError(
        t("pages.sellerRegister.toast.errorTitle"),
        copy("submitError"),
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const renderField = (field: SellerRegistrationField) => {
    const name = `dynamic_fields.${field.key}`;
    const value = fieldValue(field, values);
    const label = field.required
      ? field.label
      : `${field.label} (${copy("optional")})`;
    return (
      <div key={field.key} data-field={name} className="min-w-0">
        {field.type === "image" ? (
          <SellerFieldUpload
            field={field}
            file={typeof value === "string" ? undefined : value}
            error={errors[name]}
            onChange={(file) => changeField(field, file || "")}
          />
        ) : field.type === "select" ? (
          <Select
            {...inputProps}
            label={label}
            placeholder={field.placeholder || " "}
            isRequired={field.required}
            selectedKeys={value === "" ? [] : [String(value)]}
            onSelectionChange={(keys) =>
              changeField(field, String(Array.from(keys)[0] || ""))
            }
            isInvalid={Boolean(errors[name])}
            errorMessage={errors[name]}
          >
            {field.options.map((option) => (
              <SelectItem key={option}>{option}</SelectItem>
            ))}
          </Select>
        ) : (
          <Input
            {...inputProps}
            label={label}
            placeholder={field.placeholder || " "}
            isRequired={field.required}
            type="text"
            inputMode={field.type === "number" ? "decimal" : "text"}
            value={String(value)}
            onValueChange={(value) => changeField(field, value)}
            isInvalid={Boolean(errors[name])}
            errorMessage={errors[name]}
          />
        )}
      </div>
    );
  };
  const reviewRow = (label: string, value: string) => (
    <div key={label} className="min-w-0">
      <dt className="text-xs text-foreground/60">{label}</dt>
      <dd className="break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );

  return (
    <Card
      id="seller-register"
      className="w-full border border-divider shadow-sm"
      ref={rootRef}
    >
      <CardBody className="p-0">
        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav
            aria-label={t("pages.sellerRegister.pageTitle")}
            className="min-w-0 p-4 lg:p-6"
          >
            <div className="rounded-large border border-divider bg-primary-50 p-4 lg:h-full">
              <h2 className="text-lg font-bold">
                {t("pages.sellerRegister.pageTitle")}
              </h2>
              <ol className="mt-4 flex gap-3 overflow-x-auto lg:flex-col">
                {steps.map((key, index) => (
                  <li
                    key={key}
                    aria-current={step === key ? "step" : undefined}
                    className="flex min-w-24 shrink-0 gap-2 lg:py-2"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step === key ? "bg-primary text-primary-foreground" : "border border-divider bg-content1"}`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`text-sm ${step === key ? "font-bold" : "text-foreground/60"}`}
                    >
                      {title(key)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
          <div className="min-w-0 p-4 lg:p-6 lg:ps-0">
            <h3 className="text-xl font-bold">{title(step)}</h3>
            <p className="mt-1 text-sm text-foreground/60">
              {description(step)}
            </p>
            <Divider className="my-5" />
            <fieldset disabled={isSubmitting} className="min-w-0">
              <motion.div
                key={step}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}
              >
                {step === "basic" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      {...inputProps}
                      className="md:col-span-2"
                      name="sellerName"
                      data-field="sellerName"
                      label={t("pages.sellerRegister.form.sellerName")}
                      placeholder={t(
                        "pages.sellerRegister.placeholder.sellerName",
                      )}
                      value={formData.sellerName}
                      onValueChange={(v) => handleInputChange("sellerName", v)}
                      isInvalid={!!errors.sellerName}
                      errorMessage={errors.sellerName}
                      isRequired
                    />
                    <Input
                      {...inputProps}
                      name="mobile"
                      data-field="mobile"
                      label={t("pages.sellerRegister.form.mobile")}
                      placeholder={t("pages.sellerRegister.placeholder.mobile")}
                      value={formData.mobile}
                      onValueChange={(v) => {
                        if (/^\d*$/.test(v)) handleInputChange("mobile", v);
                      }}
                      isInvalid={!!errors.mobile}
                      errorMessage={errors.mobile}
                      isRequired
                      type="tel"
                    />
                    <Input
                      {...inputProps}
                      name="email"
                      data-field="email"
                      label={t("pages.sellerRegister.form.email")}
                      placeholder={t("pages.sellerRegister.placeholder.email")}
                      value={formData.email}
                      onValueChange={(v) => handleInputChange("email", v)}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email}
                      isRequired
                      type="email"
                    />
                    <Input
                      {...inputProps}
                      name="password"
                      data-field="password"
                      label={t("pages.sellerRegister.form.password")}
                      placeholder=" "
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onValueChange={(v) => handleInputChange("password", v)}
                      isInvalid={!!errors.password}
                      errorMessage={errors.password}
                      isRequired
                      endContent={
                        <button
                          type="button"
                          aria-label={t(
                            "pages.sellerRegister.button.togglePassword",
                          )}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-foreground/50" />
                          ) : (
                            <Eye className="w-4 h-4 text-foreground/50" />
                          )}
                        </button>
                      }
                    />
                    <Input
                      {...inputProps}
                      name="confirmPassword"
                      data-field="confirmPassword"
                      label={t("pages.sellerRegister.form.confirmPassword")}
                      placeholder=" "
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onValueChange={(v) =>
                        handleInputChange("confirmPassword", v)
                      }
                      isInvalid={!!errors.confirmPassword}
                      errorMessage={errors.confirmPassword}
                      isRequired
                      endContent={
                        <button
                          type="button"
                          aria-label={t(
                            "pages.sellerRegister.button.togglePassword",
                          )}
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-foreground/50" />
                          ) : (
                            <Eye className="w-4 h-4 text-foreground/50" />
                          )}
                        </button>
                      }
                    />
                  </div>
                )}

                {step === "business" && (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        {...inputProps}
                        className="md:col-span-2"
                        name="address"
                        data-field="address"
                        label={t("pages.sellerRegister.form.address")}
                        placeholder={t(
                          "pages.sellerRegister.placeholder.address",
                        )}
                        value={formData.address}
                        onValueChange={(v) => handleInputChange("address", v)}
                        isInvalid={!!errors.address}
                        errorMessage={errors.address}
                        isRequired
                      />
                      <Input
                        {...inputProps}
                        name="city"
                        data-field="city"
                        label={t("pages.sellerRegister.form.city")}
                        placeholder={t("pages.sellerRegister.placeholder.city")}
                        value={formData.city}
                        onValueChange={(v) => handleInputChange("city", v)}
                        isInvalid={!!errors.city}
                        errorMessage={errors.city}
                        isRequired
                      />
                      <Input
                        {...inputProps}
                        name="landmark"
                        data-field="landmark"
                        label={t("pages.sellerRegister.form.landmark")}
                        placeholder={t(
                          "pages.sellerRegister.placeholder.landmark",
                        )}
                        value={formData.landmark}
                        onValueChange={(v) => handleInputChange("landmark", v)}
                        isInvalid={!!errors.landmark}
                        errorMessage={errors.landmark}
                        isRequired
                      />
                      <Input
                        {...inputProps}
                        name="state"
                        data-field="state"
                        label={t("pages.sellerRegister.form.state")}
                        placeholder={t(
                          "pages.sellerRegister.placeholder.state",
                        )}
                        value={formData.state}
                        onValueChange={(v) => handleInputChange("state", v)}
                        isInvalid={!!errors.state}
                        errorMessage={errors.state}
                        isRequired
                      />
                      <Input
                        {...inputProps}
                        name="zipcode"
                        data-field="zipcode"
                        label={t("pages.sellerRegister.form.zipcode")}
                        placeholder={t(
                          "pages.sellerRegister.placeholder.zipcode",
                        )}
                        value={formData.zipcode}
                        onValueChange={(v) => handleInputChange("zipcode", v)}
                        isInvalid={!!errors.zipcode}
                        errorMessage={errors.zipcode}
                        isRequired
                      />
                      <Autocomplete
                        variant="bordered"
                        labelPlacement="outside"
                        radius="md"
                        inputProps={{ classNames: { errorMessage: "text-xs" } }}
                        data-field="country"
                        label={t("pages.sellerRegister.form.country")}
                        placeholder={t(
                          "pages.sellerRegister.placeholder.country",
                        )}
                        defaultItems={COUNTRIES}
                        selectedKey={formData.countryCode || null}
                        onSelectionChange={(key) => {
                          const code = (key as string) || "";
                          changeCountry(
                            code,
                            COUNTRIES.find((c) => c.code === code)?.name || "",
                          );
                          setErrors((prev) => ({ ...prev, country: "" }));
                        }}
                        isInvalid={!!errors.country}
                        errorMessage={errors.country}
                        isRequired
                      >
                        {(country) => (
                          <AutocompleteItem
                            key={country.code}
                            textValue={country.name}
                            startContent={
                              <Image
                                src={getFlagEmoji(country.code)}
                                alt=""
                                radius="none"
                                removeWrapper
                                className="w-5 h-3.5 object-cover"
                              />
                            }
                          >
                            {country.name}
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">
                        {t("pages.sellerRegister.selectOnMap")}
                      </p>
                      <LocationAutoComplete
                        ref={locationAutoCompleteRef}
                        onLocationSelect={handleLocationSelect}
                        initialLocation={null}
                      />
                    </div>
                  </div>
                )}
                {step === "business" && formData.countryCode && (
                  <div className="mt-5" aria-live="polite">
                    {fieldsLoading ? (
                      <div
                        aria-busy="true"
                        aria-label={copy("loading")}
                        className="grid gap-3"
                      >
                        <p className="text-sm text-foreground/60">
                          {copy("loading")}
                        </p>
                        <Skeleton className="h-12 w-full rounded-medium" />
                      </div>
                    ) : fieldsError || !schema ? (
                      <ErrorState
                        title={copy("loadError")}
                        description={copy("loadErrorDescription")}
                        retryLabel={copy("retry")}
                        onRetry={onRetry}
                      />
                    ) : (
                      <p className="text-sm text-foreground/60">
                        {copy("countryHint")}
                      </p>
                    )}
                  </div>
                )}
                {(step === "bank_details" || step === "business_documents") &&
                  schema && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {schema.sections[step].fields.map(renderField)}
                    </div>
                  )}
                {step === "review" && (
                  <div className="flex flex-col gap-6">
                    {steps
                      .filter((key) => key !== "review")
                      .map((key) => (
                        <section key={key}>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h4 className="text-sm font-bold">{title(key)}</h4>
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() => setStep(key)}
                              aria-label={`${t("pages.sellerRegister.button.edit")} ${title(key)}`}
                            >
                              {t("pages.sellerRegister.button.edit")}
                            </Button>
                          </div>
                          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {key === "basic"
                              ? ["sellerName", "email", "mobile"].map((field) =>
                                  reviewRow(
                                    t(`pages.sellerRegister.form.${field}`),
                                    formData[field as keyof FormValues],
                                  ),
                                )
                              : key === "business"
                                ? ADDRESS_FIELDS.map((field) =>
                                    reviewRow(
                                      t(`pages.sellerRegister.form.${field}`),
                                      formData[field],
                                    ),
                                  )
                                : schema?.sections[
                                    key as "bank_details" | "business_documents"
                                  ].fields.map((field) => {
                                    const value = fieldValue(field, values);
                                    return reviewRow(
                                      field.label,
                                      typeof value === "string"
                                        ? value
                                        : value.name,
                                    );
                                  })}
                          </dl>
                        </section>
                      ))}
                    <div data-field="consent">
                      <Checkbox
                        isSelected={agreed}
                        onValueChange={(value) => {
                          setAgreed(value);
                          setErrors((previous) => ({
                            ...previous,
                            consent: "",
                          }));
                        }}
                        isInvalid={Boolean(errors.consent)}
                        aria-describedby={
                          errors.consent ? "seller-consent-error" : undefined
                        }
                      >
                        {t("pages.sellerRegister.review.consent")}
                      </Checkbox>
                      {errors.consent && (
                        <p
                          id="seller-consent-error"
                          role="alert"
                          className="mt-1 text-xs text-danger"
                        >
                          {errors.consent}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </fieldset>
            <Divider className="my-6" />
            <div className="flex items-center justify-between gap-3">
              {currentIndex > 0 ? (
                <Button
                  variant="light"
                  isDisabled={isSubmitting}
                  onPress={() => {
                    geocodeVersion.current += 1;
                    setErrors({});
                    setStep(steps[currentIndex - 1]);
                  }}
                >
                  {t("pages.sellerRegister.button.back")}
                </Button>
              ) : (
                <span />
              )}
              <Button
                color="primary"
                isLoading={isSubmitting}
                isDisabled={isSubmitting || (step !== "basic" && !schemaReady)}
                onPress={step === "review" ? handleSubmit : goNext}
              >
                {step === "review"
                  ? t("pages.sellerRegister.button.submitApplication")
                  : title(steps[currentIndex + 1])}
              </Button>
            </div>
            {step === "basic" && (
              <p className="mt-4 text-center text-xs text-foreground/60">
                {t("pages.sellerRegister.haveAccount")}{" "}
                <a
                  href={sellerPanelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary"
                >
                  {t("pages.sellerRegister.signIn")}
                </a>
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
