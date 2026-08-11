import { useState, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  addToast,
} from "@heroui/react";
import {
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  X,
  Pencil,
} from "lucide-react";
import { sellerRegister } from "@/routes/api";
import CountryList from "country-list-with-dial-code-and-flag";
import { getFlagEmoji } from "@/helpers/getters";
import { useTranslation } from "react-i18next";
import LocationAutoComplete from "@/components/Location/LocationAutoComplete";
import type { LocationAutoCompleteRef } from "@/components/Location/types/LocationAutoComplete.types";

interface FormData {
  sellerName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  landmark: string;
  state: string;
  zipcode: string;
  country: string;
  countryCode: string;
  latitude: string;
  longitude: string;
  bankName: string;
  bankBranchCode: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  bankAccountType: string;
}

interface FileData {
  businessLicense: File | null;
  articlesOfIncorporation: File | null;
  nationalId: File | null;
  authorizedSignature: File | null;
  addressProof: File | null;
  voidedCheck: File | null;
}

// Allowed image MIME types
const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
// Bank proofs also accept a PDF (panel rule: mimes:pdf,jpg,jpeg,png,webp)
const validProofTypes = [...validImageTypes, "application/pdf"];

const STEP_KEYS = ["basic", "business", "documents", "review"] as const;

const DOC_FIELDS: (keyof FileData)[] = [
  "businessLicense",
  "articlesOfIncorporation",
  "nationalId",
  "authorizedSignature",
  "addressProof",
  "voidedCheck",
];

const allowedTypesFor = (name: keyof FileData) =>
  name === "addressProof" || name === "voidedCheck"
    ? validProofTypes
    : validImageTypes;

const BANK_TEXT_FIELDS = [
  "bankName",
  "bankBranchCode",
  "accountHolderName",
  "accountNumber",
  "routingNumber",
] as const;

const BANK_ACCOUNT_TYPES = ["checking", "savings"] as const;

const COUNTRIES: { name: string; code: string }[] = Array.from(
  new Map(
    ((CountryList.getAll?.() || []) as { name: string; code: string }[]).map(
      (country) => [country.code, { name: country.name, code: country.code }]
    )
  ).values()
);

export default function SellerRegisterForm() {
  const locationAutoCompleteRef = useRef<LocationAutoCompleteRef>(null);
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const stepShift = prefersReducedMotion ? 0 : 12;
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [previews, setPreviews] = useState<
    Partial<Record<keyof FileData, string>>
  >({});
  const [files, setFiles] = useState<FileData>({
    businessLicense: null,
    articlesOfIncorporation: null,
    nationalId: null,
    authorizedSignature: null,
    addressProof: null,
    voidedCheck: null,
  });
  const [formData, setFormData] = useState<FormData>({
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
    bankName: "",
    bankBranchCode: "",
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    bankAccountType: "",
  });

  const resetState = () => {
    setFormData({
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
      bankName: "",
      bankBranchCode: "",
      accountHolderName: "",
      accountNumber: "",
      routingNumber: "",
      bankAccountType: "",
    });
    setFiles({
      businessLicense: null,
      articlesOfIncorporation: null,
      nationalId: null,
      authorizedSignature: null,
      addressProof: null,
      voidedCheck: null,
    });
    setErrors({});
    Object.values(previews).forEach(
      (url) => url && URL.revokeObjectURL(url as string)
    );
    setPreviews({});
    setAgreed(false);
    setStep(0);
    if (locationAutoCompleteRef.current) {
      locationAutoCompleteRef.current.setInputValue("");
    }
  };

  const handleLocationSelect = async (locationData: {
    placeName: string;
    latLng: { lat: number; lng: number };
    placeDescription: string;
  }) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: locationData.latLng });

      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        let city = "";
        let state = "";
        let country = "";
        let zipcode = "";
        let countryCode = "";

        for (const component of place.address_components) {
          const componentType = component.types[0];

          switch (componentType) {
            case "locality":
              city = component.long_name;
              break;
            case "administrative_area_level_1":
              state = component.long_name;
              break;
            case "country":
              country = component.long_name;
              countryCode = component.short_name;
              break;
            case "postal_code":
              zipcode = component.long_name;
              break;
          }
        }

        const addressLine1 = place.formatted_address;

        setFormData((prev) => ({
          ...prev,
          address: addressLine1,
          city,
          state,
          zipcode,
          country,
          countryCode: countryCode,
          latitude: locationData.latLng.lat.toString(),
          longitude: locationData.latLng.lng.toString(),
        }));

        if (locationAutoCompleteRef.current) {
          locationAutoCompleteRef.current.setInputValue(
            place.formatted_address
          );
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (
    name: keyof FileData,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate by MIME type
    if (!allowedTypesFor(name).includes(file.type)) {
      addToast({
        title: t("pages.sellerRegister.toast.invalidFileTitle"),
        description: t("pages.sellerRegister.toast.invalidFileDescription"),
        color: "danger",
      });
      clearFile(name);
      setErrors((prev) => ({
        ...prev,
        [name]: t("pages.sellerRegister.error.invalidFile"),
      }));
      return;
    }

    // Valid file
    setFiles((prev) => ({ ...prev, [name]: file }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setPreviews((prev) => {
      if (prev[name]) URL.revokeObjectURL(prev[name] as string);
      return {
        ...prev,
        [name]: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      };
    });
  };

  const clearFile = (name: keyof FileData) => {
    setFiles((prev) => ({ ...prev, [name]: null }));
    setPreviews((prev) => {
      if (prev[name]) URL.revokeObjectURL(prev[name] as string);
      return { ...prev, [name]: undefined };
    });
  };

  const validationToast = () =>
    addToast({
      title: t("pages.sellerRegister.toast.validationErrorTitle"),
      description: t("pages.sellerRegister.toast.validationErrorDesc"),
      color: "danger",
    });

  const validateStep = (index: number) => {
    const newErrors: { [key: string]: string } = {};
    const required = (field: keyof FormData) => {
      if (!formData[field].trim())
        newErrors[field] = t("pages.sellerRegister.error.required");
    };

    if (index === 0) {
      required("sellerName");
      required("mobile");
      required("email");
      required("password");
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      )
        newErrors.email = t("pages.sellerRegister.error.invalidEmail");
      if (formData.mobile && formData.mobile.length < 7)
        newErrors.mobile = t("pages.sellerRegister.error.invalidMobile");
      if (formData.password && formData.password.length < 8)
        newErrors.password = t("pages.sellerRegister.error.shortPassword");
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = t(
          "pages.sellerRegister.error.passwordMismatch"
        );
    }

    if (index === 1) {
      (
        [
          "address",
          "city",
          "landmark",
          "state",
          "zipcode",
          "country",
          ...BANK_TEXT_FIELDS,
          "bankAccountType",
        ] as (keyof FormData)[]
      ).forEach(required);
    }

    if (index === 2) {
      DOC_FIELDS.forEach((field) => {
        const file = files[field];
        if (!file) newErrors[field] = t("pages.sellerRegister.error.required");
        else if (!allowedTypesFor(field).includes(file.type))
          newErrors[field] = t("pages.sellerRegister.error.invalidFile");
      });
    }

    if (index === 3 && !agreed) {
      newErrors.consent = t("pages.sellerRegister.error.consentRequired");
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));

    if (Object.keys(newErrors).length > 0) {
      validationToast();
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, STEP_KEYS.length - 1));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Text field validation
    if (!formData.sellerName)
      newErrors.sellerName = t("pages.sellerRegister.error.required");
    if (!formData.mobile)
      newErrors.mobile = t("pages.sellerRegister.error.required");
    if (!formData.email)
      newErrors.email = t("pages.sellerRegister.error.required");
    if (!formData.password)
      newErrors.password = t("pages.sellerRegister.error.required");
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t(
        "pages.sellerRegister.error.passwordMismatch"
      );
    if (!formData.address)
      newErrors.address = t("pages.sellerRegister.error.required");
    if (!formData.city)
      newErrors.city = t("pages.sellerRegister.error.required");
    if (!formData.state)
      newErrors.state = t("pages.sellerRegister.error.required");
    if (!formData.zipcode)
      newErrors.zipcode = t("pages.sellerRegister.error.required");
    if (!formData.landmark)
      newErrors.landmark = t("pages.sellerRegister.error.required");
    if (!formData.country)
      newErrors.country = t("pages.sellerRegister.error.required");
    [...BANK_TEXT_FIELDS, "bankAccountType" as const].forEach((field) => {
      if (!formData[field])
        newErrors[field] = t("pages.sellerRegister.error.required");
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast({
        title: t("pages.sellerRegister.toast.validationErrorTitle"),
        description: t("pages.sellerRegister.toast.validationErrorDesc"),
        color: "danger",
      });
      return false;
    }

    // File presence + type validation (extra safety)
    const missingFiles: string[] = [];
    const invalidTypes: string[] = [];

    const checkFile = (
      file: File | null,
      label: string,
      key: keyof FileData
    ) => {
      if (!file) {
        missingFiles.push(label);
        newErrors[key as string] = t("pages.sellerRegister.error.required");
      } else if (!allowedTypesFor(key).includes(file.type)) {
        invalidTypes.push(label);
        newErrors[key as string] = t("pages.sellerRegister.error.invalidFile");
      }
    };

    checkFile(files.businessLicense, "Business License", "businessLicense");
    checkFile(
      files.articlesOfIncorporation,
      "Articles of Incorporation",
      "articlesOfIncorporation"
    );
    checkFile(files.nationalId, "National ID Card", "nationalId");
    checkFile(
      files.authorizedSignature,
      "Authorized Signature",
      "authorizedSignature"
    );
    checkFile(files.addressProof, "Address Proof", "addressProof");
    checkFile(files.voidedCheck, "Voided Check", "voidedCheck");

    if (missingFiles.length > 0) {
      addToast({
        title: t("pages.sellerRegister.toast.missingDocumentsTitle"),
        description: t("pages.sellerRegister.toast.missingDocumentsDesc", {
          files: missingFiles.join(", "),
        }),
        color: "warning",
      });
    }

    if (invalidTypes.length > 0) {
      addToast({
        title: t("pages.sellerRegister.toast.invalidFileTypeTitle"),
        description: t("pages.sellerRegister.toast.invalidFileTypeDesc", {
          types: invalidTypes.join(", "),
        }),
        color: "danger",
      });
    }

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      missingFiles.length === 0 &&
      invalidTypes.length === 0
    );
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use FormData for multipart/form-data file upload
      const submitData = new FormData();

      // Append text fields
      submitData.append("name", formData.sellerName);
      submitData.append("email", formData.email);
      submitData.append("mobile", formData.mobile);
      submitData.append("password", formData.password);
      submitData.append("address", formData.address);
      submitData.append("city", formData.city);
      submitData.append("state", formData.state);
      submitData.append("landmark", formData.landmark);
      submitData.append("zipcode", formData.zipcode);
      submitData.append("country", formData.country);
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);
      submitData.append("bank_name", formData.bankName);
      submitData.append("bank_branch_code", formData.bankBranchCode);
      submitData.append("account_holder_name", formData.accountHolderName);
      submitData.append("account_number", formData.accountNumber);
      submitData.append("routing_number", formData.routingNumber);
      submitData.append("bank_account_type", formData.bankAccountType);

      // Append files directly as binary
      if (files.businessLicense) {
        submitData.append("business_license", files.businessLicense);
      }
      if (files.articlesOfIncorporation) {
        submitData.append(
          "articles_of_incorporation",
          files.articlesOfIncorporation
        );
      }
      if (files.nationalId) {
        submitData.append("national_identity_card", files.nationalId);
      }
      if (files.authorizedSignature) {
        submitData.append("authorized_signature", files.authorizedSignature);
      }
      if (files.addressProof) {
        submitData.append("address_proof", files.addressProof);
      }
      if (files.voidedCheck) {
        submitData.append("voided_check", files.voidedCheck);
      }

      const response = await sellerRegister(submitData);

      // Check if response has errors (validation errors) or if success is false
      const hasErrors =
        (response.errors &&
          (typeof response.errors === "object" ||
            Array.isArray(response.errors))) ||
        response.success === false;

      if (response.success === true) {
        resetState();
        addToast({
          title: t("pages.sellerRegister.toast.successTitle"),
          description: t("pages.sellerRegister.toast.successDesc"),
          color: "success",
        });

        setTimeout(() => {
          window
            .open(`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/seller`, "_blank")
            ?.focus();
        }, 2000);
      } else if (hasErrors || !response.success) {
        // Handle API validation errors
        const errorMessages: string[] = [];
        const fieldErrors: { [key: string]: string } = {};

        // Check if response has validation errors object (not array)
        if (
          response.errors &&
          typeof response.errors === "object" &&
          !Array.isArray(response.errors)
        ) {
          const errors = response.errors as {
            [key: string]: string[] | string;
          };

          // Process each field error
          Object.keys(errors).forEach((field) => {
            const fieldError = errors[field];
            const errorMessagesArray = Array.isArray(fieldError)
              ? fieldError
              : [fieldError];

            // Add first error message to toast
            if (errorMessagesArray.length > 0) {
              errorMessages.push(errorMessagesArray[0]);
            }

            // Map API field names to form field names
            let formFieldName = field;
            if (field === "email") formFieldName = "email";
            else if (field === "mobile") formFieldName = "mobile";
            else if (field === "name") formFieldName = "sellerName";
            else if (field === "password") formFieldName = "password";

            // Set field error in form state
            if (errorMessagesArray.length > 0) {
              fieldErrors[formFieldName] = errorMessagesArray[0];
            }
          });
        } else if (Array.isArray(response.errors)) {
          // Handle case where errors is an array
          response.errors.forEach((error) => {
            if (typeof error === "string") {
              errorMessages.push(error);
            }
          });
        }

        // Update form errors state
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }

        // Show toast with all error messages
        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(". ")
            : response.message ||
              t("pages.sellerRegister.toast.genericErrorDesc");

        addToast({
          title: t("pages.sellerRegister.toast.errorTitle"),
          description: errorMessage,
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle axios errors with validation responses
      const errorMessages: string[] = [];
      const fieldErrors: { [key: string]: string } = {};

      if (error?.response?.data) {
        const errorData = error.response.data;

        // Check if error response has validation errors (not array)
        if (
          errorData.errors &&
          typeof errorData.errors === "object" &&
          !Array.isArray(errorData.errors)
        ) {
          const errors = errorData.errors as {
            [key: string]: string[] | string;
          };

          // Process each field error
          Object.keys(errors).forEach((field) => {
            const fieldError = errors[field];
            const errorMessagesArray = Array.isArray(fieldError)
              ? fieldError
              : [fieldError];

            // Add first error message to toast
            if (errorMessagesArray.length > 0) {
              errorMessages.push(errorMessagesArray[0]);
            }

            // Map API field names to form field names
            let formFieldName = field;
            if (field === "email") formFieldName = "email";
            else if (field === "mobile") formFieldName = "mobile";
            else if (field === "name") formFieldName = "sellerName";
            else if (field === "password") formFieldName = "password";

            // Set field error in form state
            if (errorMessagesArray.length > 0) {
              fieldErrors[formFieldName] = errorMessagesArray[0];
            }
          });
        } else if (Array.isArray(errorData.errors)) {
          // Handle case where errors is an array
          errorData.errors.forEach((error: any) => {
            if (typeof error === "string") {
              errorMessages.push(error);
            }
          });
        }

        // Update form errors state
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }

        // Show toast with error messages
        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(". ")
            : errorData.message ||
              t("pages.sellerRegister.toast.unexpectedError");

        addToast({
          title: t("pages.sellerRegister.toast.errorTitle"),
          description: errorMessage,
          color: "danger",
        });
      } else {
        // Generic error for unexpected errors
        addToast({
          title: t("pages.sellerRegister.toast.errorTitle"),
          description: t("pages.sellerRegister.toast.unexpectedError"),
          color: "danger",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileUpload = (
    label: string,
    name: keyof FileData,
    required = false
  ) => {
    const file = files[name];
    const error = errors[name];

    return (
      <div className="flex flex-col gap-1.5" key={name}>
        <label className="text-sm font-medium">
          {t(label)} {required && <span className="text-danger">*</span>}
        </label>
        <div
          className={`border rounded-medium px-4 py-3 flex items-center gap-3 transition ${
            error
              ? "border-danger bg-danger-50"
              : file
                ? "border-success bg-success-50"
                : "border-divider hover:border-primary"
          }`}
        >
          <input
            type="file"
            id={name}
            className="hidden"
            accept={allowedTypesFor(name).join(",")}
            onChange={(e) => handleFileChange(name, e)}
          />

          {file && !error ? (
            <>
              <label
                htmlFor={name}
                className="flex items-center gap-3 w-full min-w-0 cursor-pointer"
              >
                {previews[name] ? (
                  <Image
                    src={previews[name] as string}
                    alt={file.name}
                    radius="sm"
                    removeWrapper
                    className="w-12 h-12 shrink-0 object-cover border border-divider"
                  />
                ) : (
                  <span className="w-12 h-12 shrink-0 rounded-small bg-content2 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-foreground/50" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm">{file.name}</span>
                  <span className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("pages.sellerRegister.button.replaceFile")}
                  </span>
                </span>
              </label>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                radius="full"
                aria-label={t("pages.sellerRegister.button.removeFile")}
                onPress={() => clearFile(name)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <label
              htmlFor={name}
              className="flex items-center gap-2 w-full cursor-pointer"
            >
              <Upload
                className={`w-4 h-4 shrink-0 ${error ? "text-danger" : "text-foreground/50"}`}
              />
              <span
                className={`text-sm ${error ? "text-danger" : "text-foreground/50"}`}
              >
                {t("pages.sellerRegister.button.chooseFile")}
              </span>
            </label>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  };

  const reviewRow = (label: string, value: string) => (
    <div key={label}>
      <p className="text-xs uppercase text-foreground/50">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );

  const inputProps = {
    variant: "bordered" as const,
    labelPlacement: "outside" as const,
    radius: "md" as const,
    classNames: { errorMessage: "text-xs" },
  };

  return (
    <Card
      className="border border-divider w-full shadow-sm"
      id="seller-register"
    >
      <CardBody className="p-0">
        <div className="grid lg:grid-cols-[300px_1fr]">
          {/* Stepper */}
          <div className="p-4 lg:p-6">
            <div className="h-full rounded-large border border-primary-200 bg-primary-50/40 p-5">
              <h2 className="text-lg font-bold">
                {t("pages.sellerRegister.pageTitle")}
              </h2>
              <Divider className="my-4" />

              <ol>
                {STEP_KEYS.map((key, idx) => (
                  <li key={key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                          idx === step
                            ? "bg-primary text-primary-foreground"
                            : "bg-content1 border border-divider text-foreground/50"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      {idx < STEP_KEYS.length - 1 && (
                        <span className="w-px grow bg-divider my-1" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p
                        className={`text-sm font-semibold transition-colors duration-300 ${idx === step ? "text-primary" : ""}`}
                      >
                        {t(`pages.sellerRegister.steps.${key}.title`)}
                      </p>
                      <p className="text-xs text-foreground/50 leading-relaxed">
                        {t(`pages.sellerRegister.steps.${key}.desc`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Step content */}
          <div className="flex flex-col p-4 lg:p-6 lg:ps-0">
            <div className="grow">
              <h3 className="text-xl font-bold">
                {t(`pages.sellerRegister.steps.${STEP_KEYS[step]}.heading`)}
              </h3>
              <p className="text-sm text-foreground/50 mt-1">
                {t(`pages.sellerRegister.steps.${STEP_KEYS[step]}.subheading`)}
              </p>
              <Divider className="my-5" />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: stepShift }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -stepShift }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    {...inputProps}
                    className="md:col-span-2"
                    label={t("pages.sellerRegister.form.sellerName")}
                    placeholder={t("pages.sellerRegister.placeholder.sellerName")}
                    value={formData.sellerName}
                    onValueChange={(v) => handleInputChange("sellerName", v)}
                    isInvalid={!!errors.sellerName}
                    errorMessage={errors.sellerName}
                    isRequired
                  />
                  <Input
                    {...inputProps}
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
                    label={t("pages.sellerRegister.form.password")}
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onValueChange={(v) => handleInputChange("password", v)}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password}
                    isRequired
                    endContent={
                      <button
                        type="button"
                        aria-label={t("pages.sellerRegister.button.togglePassword")}
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
                    label={t("pages.sellerRegister.form.confirmPassword")}
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
                        aria-label={t("pages.sellerRegister.button.togglePassword")}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
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

              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      {...inputProps}
                      className="md:col-span-2"
                      label={t("pages.sellerRegister.form.address")}
                      placeholder={t("pages.sellerRegister.placeholder.address")}
                      value={formData.address}
                      onValueChange={(v) => handleInputChange("address", v)}
                      isInvalid={!!errors.address}
                      errorMessage={errors.address}
                      isRequired
                    />
                    <Input
                      {...inputProps}
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
                      label={t("pages.sellerRegister.form.landmark")}
                      placeholder={t("pages.sellerRegister.placeholder.landmark")}
                      value={formData.landmark}
                      onValueChange={(v) => handleInputChange("landmark", v)}
                      isInvalid={!!errors.landmark}
                      errorMessage={errors.landmark}
                      isRequired
                    />
                    <Input
                      {...inputProps}
                      label={t("pages.sellerRegister.form.state")}
                      placeholder={t("pages.sellerRegister.placeholder.state")}
                      value={formData.state}
                      onValueChange={(v) => handleInputChange("state", v)}
                      isInvalid={!!errors.state}
                      errorMessage={errors.state}
                      isRequired
                    />
                    <Input
                      {...inputProps}
                      label={t("pages.sellerRegister.form.zipcode")}
                      placeholder={t("pages.sellerRegister.placeholder.zipcode")}
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
                      label={t("pages.sellerRegister.form.country")}
                      placeholder={t("pages.sellerRegister.placeholder.country")}
                      defaultItems={COUNTRIES}
                      selectedKey={formData.countryCode || null}
                      onSelectionChange={(key) => {
                        const code = (key as string) || "";
                        setFormData((prev) => ({
                          ...prev,
                          countryCode: code,
                          country:
                            COUNTRIES.find((c) => c.code === code)?.name || "",
                        }));
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

                  <Divider />

                  <div>
                    <h4 className="font-bold text-sm mb-4">
                      {t("pages.sellerRegister.bankDetails")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {BANK_TEXT_FIELDS.map((field) => (
                        <Input
                          key={field}
                          {...inputProps}
                          label={t(`pages.sellerRegister.form.${field}`)}
                          placeholder={t(
                            `pages.sellerRegister.placeholder.${field}`
                          )}
                          value={formData[field]}
                          onValueChange={(v) => handleInputChange(field, v)}
                          isInvalid={!!errors[field]}
                          errorMessage={errors[field]}
                          isRequired
                        />
                      ))}
                      <Select
                        variant="bordered"
                        labelPlacement="outside"
                        radius="md"
                        classNames={{ errorMessage: "text-xs" }}
                        label={t("pages.sellerRegister.form.bankAccountType")}
                        placeholder={t(
                          "pages.sellerRegister.placeholder.bankAccountType"
                        )}
                        selectedKeys={
                          formData.bankAccountType
                            ? [formData.bankAccountType]
                            : []
                        }
                        onSelectionChange={(keys) =>
                          handleInputChange(
                            "bankAccountType",
                            (Array.from(keys)[0] as string) || ""
                          )
                        }
                        isInvalid={!!errors.bankAccountType}
                        errorMessage={errors.bankAccountType}
                        isRequired
                      >
                        {BANK_ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type}>
                            {t(`pages.sellerRegister.bankAccountType.${type}`)}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {DOC_FIELDS.map((field) =>
                    renderFileUpload(
                      `pages.sellerRegister.docs.${field}`,
                      field,
                      true
                    )
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm">
                        {t("pages.sellerRegister.review.accountDetails")}
                      </h4>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        className="text-sm"
                        startContent={<Pencil className="w-3.5 h-3.5" />}
                        onPress={() => setStep(0)}
                      >
                        {t("pages.sellerRegister.button.edit")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {reviewRow(
                        t("pages.sellerRegister.form.sellerName"),
                        formData.sellerName
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.email"),
                        formData.email
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.mobile"),
                        formData.mobile
                      )}
                    </div>
                  </section>

                  <Divider />

                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm">
                        {t("pages.sellerRegister.review.businessInformation")}
                      </h4>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        className="text-sm"
                        startContent={<Pencil className="w-3.5 h-3.5" />}
                        onPress={() => setStep(1)}
                      >
                        {t("pages.sellerRegister.button.edit")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {reviewRow(
                        t("pages.sellerRegister.form.address"),
                        formData.address
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.landmark"),
                        formData.landmark
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.city"),
                        formData.city
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.state"),
                        formData.state
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.zipcode"),
                        formData.zipcode
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.country"),
                        formData.country
                      )}
                      {BANK_TEXT_FIELDS.map((field) =>
                        reviewRow(
                          t(`pages.sellerRegister.form.${field}`),
                          formData[field]
                        )
                      )}
                      {reviewRow(
                        t("pages.sellerRegister.form.bankAccountType"),
                        formData.bankAccountType
                          ? t(
                              `pages.sellerRegister.bankAccountType.${formData.bankAccountType}`
                            )
                          : ""
                      )}
                    </div>
                  </section>

                  <Divider />

                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm">
                        {t("pages.sellerRegister.review.documentsProvided")}
                      </h4>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        className="text-sm"
                        startContent={<Pencil className="w-3.5 h-3.5" />}
                        onPress={() => setStep(2)}
                      >
                        {t("pages.sellerRegister.button.edit")}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DOC_FIELDS.map((field) => (
                        <p
                          key={field}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle
                            className={`w-4 h-4 shrink-0 ${files[field] ? "text-success" : "text-foreground/30"}`}
                          />
                          {t(`pages.sellerRegister.docs.${field}`)}
                        </p>
                      ))}
                    </div>
                  </section>

                  <div>
                    <Checkbox
                      isSelected={agreed}
                      onValueChange={(value) => {
                        setAgreed(value);
                        if (value)
                          setErrors((prev) => ({ ...prev, consent: "" }));
                      }}
                      size="sm"
                      isInvalid={!!errors.consent}
                    >
                      <span className="text-xs text-foreground/70">
                        {t("pages.sellerRegister.review.consent")}
                      </span>
                    </Checkbox>
                    {errors.consent && (
                      <p className="text-xs text-danger mt-1">
                        {errors.consent}
                      </p>
                    )}
                  </div>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>

            <Divider className="my-6" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                {step > 0 ? (
                  <Button
                    variant="light"
                    onPress={() => setStep((prev) => prev - 1)}
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    isDisabled={isSubmitting}
                  >
                    {t("pages.sellerRegister.button.back")}
                  </Button>
                ) : (
                  <span />
                )}

                <Button
                  color="primary"
                  className={`font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md ${step === 0 ? "w-full" : ""}`}
                  endContent={<ArrowRight className="w-4 h-4" />}
                  isLoading={isSubmitting}
                  onPress={step === STEP_KEYS.length - 1 ? handleSubmit : goNext}
                >
                  {step === STEP_KEYS.length - 1
                    ? t("pages.sellerRegister.button.submitApplication")
                    : t(
                        `pages.sellerRegister.steps.${STEP_KEYS[step + 1]}.title`
                      )}
                </Button>
              </div>

              {step === 0 && (
                <p className="text-xs text-center text-foreground/50">
                  {t("pages.sellerRegister.haveAccount")}{" "}
                  <a
                    href={`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/seller`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold"
                  >
                    {t("pages.sellerRegister.signIn")}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
