import type { AuthenticationSettings } from "@/types/settings";

export type SmsGateway = "custom" | "firebase";

type SmsGatewaySettings = Pick<
  AuthenticationSettings,
  "smsGateway" | "customSms" | "firebase"
>;

export const resolveSmsGateway = (
  settings: SmsGatewaySettings | null | undefined,
): SmsGateway | null => {
  if (
    settings?.smsGateway === "custom" ||
    settings?.smsGateway === "firebase"
  ) {
    return settings.smsGateway;
  }

  if (settings?.customSms) return "custom";
  if (settings?.firebase) return "firebase";

  return null;
};
