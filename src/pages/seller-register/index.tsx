import { useRouter } from "next/router";
import { useEffect } from "react";
import { getSettings } from "@/routes/api";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { GetServerSideProps } from "next";
import { loadTranslations } from "../../../i18n";
import { useSettings } from "@/contexts/SettingsContext";
import SellerLandingView from "@/views/SellerLandingView";

export default function SellerRegistration() {
  const { isSingleVendor } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (isSingleVendor) {
      router.replace("/");
    }
  }, [isSingleVendor, router]);

  if (isSingleVendor) return null;

  return <SellerLandingView />;
}

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const market = getMarketFromContext(context);
        const settings = await getSettings({ market });

        // Server-side redirect for single vendor mode
        const systemSettings = settings?.data?.find(
          (s: { variable: string }) => s.variable === "system",
        )?.value as { systemVendorType?: string } | undefined;
        if (systemSettings?.systemVendorType === "single") {
          return { redirect: { destination: "/", permanent: false } };
        }

        await loadTranslations(context);
        return {
          props: {
            initialSettings: settings.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialSettings: null,
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;
