import { useState } from "react";
import useSWR from "swr";
import SellerRegisterForm from "@/components/Seller/SellerRegisterForm";
import { getSellerRegistrationFields, sellerRegister } from "@/services/seller";

export default function SellerOnboardingView() {
  const [country, setCountry] = useState("");
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    country ? ["seller-registration-fields", country] : null,
    async ([, iso2]: [string, string]) => {
      const response = await getSellerRegistrationFields(iso2);
      if (
        !response.success ||
        !response.data ||
        response.data.country.iso2.toUpperCase() !== iso2
      ) {
        throw new Error("Seller registration fields unavailable");
      }
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      keepPreviousData: false,
    },
  );

  return (
    <SellerRegisterForm
      schema={data?.country.iso2.toUpperCase() === country ? data : undefined}
      fieldsLoading={isLoading || isValidating}
      fieldsError={Boolean(error)}
      onCountryChange={setCountry}
      onRetry={() => {
        void mutate().catch(() => undefined);
      }}
      onSubmit={sellerRegister}
      sellerPanelUrl={`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/seller`}
    />
  );
}
