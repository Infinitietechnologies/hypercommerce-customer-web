import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import { useCallback, useEffect, useState } from "react";

import { verifyUser } from "@/services/auth";

type CheckResult = "available" | "taken" | "error";

type PhoneAvailability =
  | { status: "empty" | "invalid" }
  | {
      status: "checking" | CheckResult;
      nationalNumber: string;
      internationalNumber: string;
    };

export const useProfilePhoneAvailability = () => {
  const [phone, setPhone] = useState<PhoneAvailability>({ status: "empty" });
  const pendingCheck = phone.status === "checking" ? phone : null;

  useEffect(() => {
    if (!pendingCheck) return;

    const timer = setTimeout(async () => {
      let status: CheckResult = "error";
      try {
        const { data } = await verifyUser({
          type: "mobile",
          value: pendingCheck.nationalNumber,
        });

        if (data?.exists === true) status = "taken";
        if (data?.exists === false) status = "available";
      } catch {
        // Leave sending disabled until a retry returns a verdict.
      }

      setPhone((current) =>
        current === pendingCheck ? { ...pendingCheck, status } : current,
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [pendingCheck]);

  const resetPhone = useCallback(() => setPhone({ status: "empty" }), []);

  const changePhone = (
    country: string,
    nationalNumber: string,
    dialCode: string,
    _countryName: string,
    expectedLength?: number,
  ) => {
    if (!nationalNumber) {
      resetPhone();
      return;
    }

    const hasExpectedLength =
      expectedLength === undefined || nationalNumber.length === expectedLength;
    const number =
      dialCode && hasExpectedLength && /^\d+$/.test(nationalNumber)
        ? parsePhoneNumberFromString(nationalNumber, country as CountryCode)
        : undefined;

    if (!number?.isPossible()) {
      setPhone({ status: "invalid" });
      return;
    }

    setPhone({
      status: "checking",
      nationalNumber,
      internationalNumber: number.number,
    });
  };

  const retryPhoneCheck = () =>
    setPhone((current) =>
      current.status === "error" ? { ...current, status: "checking" } : current,
    );

  return { phone, changePhone, resetPhone, retryPhoneCheck };
};
