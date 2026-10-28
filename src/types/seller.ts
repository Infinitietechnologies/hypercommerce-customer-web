export type SellerFieldSectionKey = "bank_details" | "business_documents";

export interface SellerRegistrationField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "image";
  required: boolean;
  placeholder: string | null;
  default_value: string | number | null;
  options: string[];
}

export interface SellerRegistrationFields {
  country: { name: string; iso2: string };
  sections: Record<
    SellerFieldSectionKey,
    {
      label: string;
      fields: SellerRegistrationField[];
    }
  >;
}

export interface SellerRegistrationResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown> | null;
  errors?: Record<string, string | string[]> | string[];
}
