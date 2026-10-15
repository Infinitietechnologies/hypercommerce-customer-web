import useSWR from "swr";

import { getAddresses } from "@/services/address";
import type { Address } from "@/types/user";

type CheckoutAddresses = {
  addresses: Address[];
  total: number;
};

export const useCheckoutAddresses = (
  userId: number | null,
  zoneId: string | number,
) =>
  useSWR<CheckoutAddresses>(
    userId == null ? null : ["/cart-addresses", userId, zoneId],
    async () => {
      const addresses: Address[] = [];
      let page = 1;
      let lastPage = 1;
      let total = 0;

      do {
        const response = await getAddresses({ page, per_page: 50 });
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch addresses");
        }

        const pageData: unknown = response.data.data;
        const pageAddresses = Array.isArray(pageData)
          ? (pageData as Address[])
          : pageData && typeof pageData === "object"
            ? (Object.values(pageData) as Address[])
            : [];
        addresses.push(...pageAddresses);
        total = response.data.total;
        lastPage =
          response.data.last_page ??
          Math.ceil(total / (response.data.per_page || 50));
        page += 1;
      } while (page <= lastPage);

      return { addresses, total };
    },
    { dedupingInterval: 2000, revalidateOnFocus: true },
  );
