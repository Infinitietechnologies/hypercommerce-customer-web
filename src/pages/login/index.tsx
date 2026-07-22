import type { GetServerSideProps } from "next";
import type { ReactNode } from "react";
import type { Settings } from "@/types/settings";
import type { NextPageWithLayout } from "@/types";

import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import AuthShell from "@/features/auth/components/AuthShell";
import AppleLoginBtn from "@/components/Functional/AppleLoginBtn";
import GoogleLoginBtn from "@/components/Functional/GoogleLoginBtn";
import PageHead from "@/SEO/PageHead";
import { Button, Divider, Input, Link, toastError } from "@/components/ui";
import { handleLoginUser } from "@/helpers/auth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { looksLikeEmail } from "@/helpers/validator";
import { safeNext } from "@/features/auth/safeNext";
import { getSettings } from "@/services/settings";
import { loadTranslations } from "../../../i18n";

interface LoginPageProps {
  initialSettings?: Settings | null;
}

const LoginPage: NextPageWithLayout<LoginPageProps> = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const next = safeNext(router.query.next);

  const validate = () => {
    const found: typeof errors = {};
    if (!identifier.trim()) found.identifier = t("auth.errors.identifier_required");
    if (!password) found.password = t("auth.errors.password_required");
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const isEmail = looksLikeEmail(identifier);
      // Returns the ApiResponse (or undefined on throw) — not a boolean.
      // handleLoginUser already toasts both outcomes, so only redirect here.
      const response = await handleLoginUser(
        {
          email: isEmail ? identifier.trim() : undefined,
          mobile: isEmail ? undefined : identifier.replace(/\D/g, ""),
          password,
        },
        dispatch,
      );

      if (response?.success && response.data) router.replace(next);
    } catch {
      toastError(t("login_modal.login_failed_toast"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHead pageTitle={t("login_modal.sign_in")} />

      <AuthShell
        subtitle={t("auth.sign_in_subtitle")}
        title={t("auth.welcome_back")}
        footer={
          <p className="text-center text-small text-default-500">
            {t("login_modal.no_account")}{" "}
            <Link
              className="cursor-pointer text-small font-semibold"
              href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            >
              {t("login_modal.create_account")}
            </Link>
          </p>
        }
      >
        <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
          <Input
            autoComplete="username"
            errorMessage={errors.identifier}
            isInvalid={Boolean(errors.identifier)}
            label={t("login_modal.email_label")}
            placeholder={t("login_modal.email_placeholder")}
            startContent={<Mail aria-hidden="true" size={18} />}
            value={identifier}
            onValueChange={(v) => {
              setIdentifier(v);
              setErrors((p) => ({ ...p, identifier: undefined }));
            }}
          />

          <Input
            autoComplete="current-password"
            errorMessage={errors.password}
            isInvalid={Boolean(errors.password)}
            label={t("login_modal.password_label")}
            placeholder={t("login_modal.password_placeholder")}
            type={showPassword ? "text" : "password"}
            value={password}
            endContent={
              <button
                aria-label={t(showPassword ? "auth.hide_password" : "auth.show_password")}
                className="text-default-400 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                type="button"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            onValueChange={(v) => {
              setPassword(v);
              setErrors((p) => ({ ...p, password: undefined }));
            }}
          />

          <div className="flex justify-end">
            <Link className="text-small" href="/forgot-password">
              {t("login_modal.forgot_password")}
            </Link>
          </div>

          <Button
            className="w-full"
            color="primary"
            isLoading={isLoading}
            type="submit"
          >
            {t("login_modal.sign_in")}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Divider className="flex-1" />
          <span className="text-xs text-default-500">{t("login_modal.or")}</span>
          <Divider className="flex-1" />
        </div>

        <div className="flex flex-col gap-3">
          <GoogleLoginBtn
            context="login"
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onOpenChange={() => router.replace(next)}
          />
          <AppleLoginBtn
            context="login"
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onOpenChange={() => router.replace(next)}
          />
        </div>
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
