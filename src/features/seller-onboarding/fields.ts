import type {
  SellerRegistrationField,
  SellerRegistrationFields,
  SellerRegistrationResponse,
} from "@/types/seller";

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const SECTION_KEYS = ["bank_details", "business_documents"] as const;
export type DynamicValues = Record<string, string | File>;

export function fieldValue(
  field: SellerRegistrationField,
  values: DynamicValues,
) {
  return (
    values[field.key] ??
    (field.type === "image" ? "" : String(field.default_value ?? ""))
  );
}

export function validateField(
  field: SellerRegistrationField,
  value: string | File,
): string | undefined {
  if (value === "" || (typeof value === "string" && !value.trim())) {
    return field.required ? "required" : undefined;
  }
  if (field.type === "image") {
    return typeof value === "string" ||
      !IMAGE_TYPES.includes(value.type) ||
      value.size > 5120 * 1024
      ? "image"
      : undefined;
  }
  if (typeof value !== "string") return "invalidValue";
  if (field.type === "number") {
    if (
      !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) ||
      !Number.isFinite(Number(value))
    )
      return "number";
    return Number(value) > 1000 ? "numberMax" : undefined;
  }
  if (Array.from(value).length > 1000) return "maxLength";
  if (field.type === "select" && !field.options.includes(value))
    return "invalidValue";
}

export function appendDynamicFields(
  data: FormData,
  schema: SellerRegistrationFields,
  values: DynamicValues,
) {
  for (const section of SECTION_KEYS) {
    for (const field of schema.sections[section].fields) {
      const value = fieldValue(field, values);
      if (value !== "") data.append(`dynamic_fields[${field.key}]`, value);
      else if (field.type !== "image")
        data.append(`dynamic_fields[${field.key}]`, "");
    }
  }
}

export function registrationErrors(
  response: SellerRegistrationResponse,
): Record<string, string> {
  const source = response.errors ?? response.data;
  if (!source || Array.isArray(source)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === "string")
      result[
        key === "name" ? "sellerName" : key === "country_iso2" ? "country" : key
      ] = message;
  }
  return result;
}
