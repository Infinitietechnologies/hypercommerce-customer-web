import type { AuthenticationSettings } from "@/types/settings";

type SocialLoginSettings = Pick<
  AuthenticationSettings,
  "googleLogin" | "appleLogin"
>;

export const resolveSocialLoginProviders = (
  settings: SocialLoginSettings | null | undefined,
) => ({
  google: settings?.googleLogin === true,
  apple: settings?.appleLogin === true,
});
