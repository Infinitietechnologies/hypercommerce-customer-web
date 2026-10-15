import type { Address } from "@/types/user";
import { getCookie, setCookie } from "@/lib/cookies";

type LastCheckoutAddress = {
  userId: number;
  addressId: number;
};

const cookieName = "lastCheckoutAddress";

export const getLastCheckoutAddressId = (
  userId: number | null,
): number | null => {
  if (userId == null) return null;

  const saved = getCookie<LastCheckoutAddress>(cookieName);
  return saved?.userId === userId && Number.isInteger(saved.addressId)
    ? saved.addressId
    : null;
};

export const rememberCheckoutAddress = (
  userId: number | null,
  addressId: number,
): void => {
  if (userId == null) return;
  setCookie<LastCheckoutAddress>(cookieName, { userId, addressId });
};

export const chooseCheckoutAddress = (
  addresses: Address[],
  selectedId: number | null,
  lastUsedId: number | null,
): Address | null => {
  if (addresses.length === 1) return addresses[0];
  return (
    addresses.find((address) => address.id === selectedId) ??
    addresses.find((address) => address.id === lastUsedId) ??
    null
  );
};
