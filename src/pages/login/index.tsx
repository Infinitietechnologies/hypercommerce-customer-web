import type { GetServerSideProps } from "next";
import type { ReactNode } from "react";
import type { Settings } from "@/types/settings";
import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import AuthShell from "@/features/auth/components/AuthShell";
import LoginForm from "@/features/auth/components/LoginForm";
import PageHead from "@/SEO/PageHead";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { safeNext } from "@/features/auth/safeNext";
import { getSettings } from "@/services/settings";
import { loadTranslations } from "../../../i18n";

interface LoginPageProps {
  initialSettings?: Settings | null;
}

const LoginPage: NextPageWithLayout<LoginPageProps> = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const next = safeNext(router.query.next);
  const onSuccess = useCallback(() => {
    router.replace(next);
  }, [router, next]);

  return (
    <>
      <PageHead pageTitle={t("login_modal.sign_in")} />

      <AuthShell subtitle={t("auth.sign_in_subtitle")} title={t("auth.welcome_back")}>
        <LoginForm
          registerHref={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          onSuccess={onSuccess}
        />
      </AuthShell>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      try {
        const settings = await getSettings({ market: getMarketFromContext(context) });
        return { props: { initialSettings: settings.data } };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return { props: { initialSettings: null } };
      }
    }
  : undefined;

LoginPage.getLayout = (page: ReactNode) => page;

export default LoginPage;
