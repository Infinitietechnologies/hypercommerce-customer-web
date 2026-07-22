import type { GetServerSideProps } from "next";
import type { ReactNode } from "react";
import type { Settings } from "@/types/settings";
import type { userData } from "@/types/user";
import type { NextPageWithLayout } from "@/types";

import { CheckCircle2, Mail, MailWarning } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import AuthShell from "@/features/auth/components/AuthShell";
import PageHead from "@/SEO/PageHead";
import { Button, Input, toastError, toastSuccess } from "@/components/ui";
import { loginRedirect } from "@/guards/authGuard";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { validateEmail } from "@/helpers/validator";
import { getUserData, resendVerificationEmail, updateEmail } from "@/services/auth";
import { getSettings } from "@/services/settings";
import { loadTranslations } from "../../../i18n";

interface VerifyEmailPageProps {
  initialSettings?: Settings | null;
  user?: userData | null;
}

/**
 * Mirrors the Flutter email verification screen
 * (hypercommerce-customer-app/lib/screens/email_verification/view/): shows the
 * current address and its state, lets the customer correct it, and resends the
 * verification link.
 */
const VerifyEmailPage: NextPageWithLayout<VerifyEmailPageProps> = ({ user }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isVerified = Boolean(user?.email_verified_at);
  const isDirty = email.trim() !== (user?.email ?? "");

  const onSave = async () => {
    const invalid = validateEmail(email);
    if (invalid) {
      setError(invalid);
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateEmail(email.trim());
      if (response.success) {
        toastSuccess(t("auth.email_updated"));
        router.replace(router.asPath);
      } else {
        toastError(t("auth.errors.email_update_failed"), response.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onResend = async () => {
    setIsSending(true);
    try {
      const response = await resendVerificationEmail();
      if (response.success) {
        toastSuccess(t("auth.verification_email_sent"));
      } else {
        toastError(t("auth.errors.verification_email_failed"), response.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <PageHead pageTitle={t("auth.email_verification")} />

      <AuthShell
        showSkip={false}
        subtitle={
          isVerified ? t("auth.email_is_verified") : t("auth.email_not_verified")
        }
        title={t("auth.email_verification")}
      >
        <div className="flex flex-col gap-4">
          <div
            className={`flex items-center gap-2.5 rounded-large border-1 p-3.5 ${
              isVerified
                ? "border-success/40 bg-success/10 text-success"
                : "border-warning/40 bg-warning/10 text-warning"
            }`}
          >
            {isVerified ? (
              <CheckCircle2 aria-hidden="true" size={20} />
            ) : (
              <MailWarning aria-hidden="true" size={20} />
            )}
            <span className="text-small font-medium">
              {isVerified ? t("auth.verified") : t("auth.pending_verification")}
            </span>
          </div>

          <Input
            autoComplete="email"
            errorMessage={error}
            isInvalid={Boolean(error)}
            label={t("login_modal.email_label")}
            placeholder={t("login_modal.email_placeholder")}
            startContent={<Mail aria-hidden="true" size={18} />}
            type="email"
            value={email}
            onValueChange={(v) => {
              setEmail(v);
              setError(undefined);
            }}
          />

          {isDirty ? (
            <Button
              className="w-full"
              color="primary"
              isLoading={isSaving}
              onPress={onSave}
            >
              {t("auth.save_email")}
            </Button>
          ) : null}

          {!isVerified ? (
            <Button
              className="w-full"
              isLoading={isSending}
              variant="bordered"
              onPress={onResend}
            >
              {t("auth.resend_email")}
            </Button>
          ) : null}

          <Button className="w-full" variant="light" onPress={() => router.push("/my-account")}>
            {t("auth.back_to_account")}
          </Button>
        </div>
      </AuthShell>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      const access_token = (await getAccessTokenFromContext(context)) || "";
      if (!access_token) {
        return { redirect: { destination: loginRedirect(context), permanent: false } };
      }

      await loadTranslations(context);
      try {
        const [settings, user] = await Promise.all([
          getSettings({ market: getMarketFromContext(context) }),
          getUserData({ access_token }),
        ]);
        return {
          props: { initialSettings: settings.data, user: user.data ?? null },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return { props: { initialSettings: null, user: null } };
      }
    }
  : undefined;

VerifyEmailPage.getLayout = (page: ReactNode) => page;

export default VerifyEmailPage;
