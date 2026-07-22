import type { GetServerSideProps } from "next";
import type { ReactNode } from "react";
import type { Settings } from "@/types/settings";
import type { NextPageWithLayout } from "@/types";

import { Eye, EyeOff, Mail, User } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import AuthShell from "@/features/auth/components/AuthShell";
import AppleLoginBtn from "@/components/Functional/AppleLoginBtn";
import GoogleLoginBtn from "@/components/Functional/GoogleLoginBtn";
import PageHead from "@/SEO/PageHead";
import { Button, Divider, Input, Link, toastError } from "@/components/ui";
import { handleRegisterUser } from "@/helpers/auth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { safeNext } from "@/features/auth/safeNext";
import { validateEmail, validatePassword } from "@/helpers/validator";
import { getSettings } from "@/services/settings";
import { loadTranslations } from "../../../i18n";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

interface RegisterPageProps {
  initialSettings?: Settings | null;
}

interface PhoneState {
  iso2: string;
  number: string;
  dialCode: string;
  country: string;
}

type FieldErrors = Partial<
  Record<"name" | "email" | "phone" | "password" | "confirm", string>
>;

const RegisterPage: NextPageWithLayout<RegisterPageProps> = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneState | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referral, setReferral] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const next = safeNext(router.query.next);

  const validate = () => {
    const found: FieldErrors = {};

    if (name.trim().length < 3) found.name = t("auth.errors.name_too_short");

    const emailError = validateEmail(email);
    if (emailError) found.email = emailError;

    if (!phone?.number) found.phone = t("auth.errors.phone_required");

    const passwordError = validatePassword(password);
    if (passwordError) found.password = passwordError;

    if (confirm !== password) found.confirm = t("auth.errors.passwords_mismatch");

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !phone) return;

    setIsLoading(true);
    try {
      // handleRegisterUser toasts both outcomes itself.
      const response = await handleRegisterUser(
        {
          name: name.trim(),
          email: email.trim(),
          mobile: phone.number,
          iso_2: phone.iso2,
          country: phone.country,
          password,
          password_confirmation: confirm,
          friends_code: referral.trim() || undefined,
        },
        dispatch,
      );

      if (response?.success) router.replace(next);
    } catch {
      toastError(t("auth.errors.register_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHead pageTitle={t("login_modal.create_account")} />

      <AuthShell
        subtitle={t("auth.create_account_subtitle")}
        title={t("login_modal.create_account")}
        footer={
          <p className="text-center text-small text-default-500">
            {t("auth.have_account")}{" "}
            <Link
              className="cursor-pointer text-small font-semibold"
              href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            >
              {t("login_modal.sign_in")}
            </Link>
          </p>
        }
      >
        <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
          <Input
            autoComplete="name"
            errorMessage={errors.name}
            isInvalid={Boolean(errors.name)}
            label={t("auth.full_name")}
            placeholder={t("auth.full_name_placeholder")}
            startContent={<User aria-hidden="true" size={18} />}
            value={name}
            onValueChange={(v) => {
              setName(v);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
          />

          <Input
            autoComplete="email"
            errorMessage={errors.email}
            isInvalid={Boolean(errors.email)}
            label={t("login_modal.email_label")}
            placeholder={t("login_modal.email_placeholder")}
            startContent={<Mail aria-hidden="true" size={18} />}
            type="email"
            value={email}
            onValueChange={(v) => {
              setEmail(v);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
          />

          <div>
            <PhoneInput
              label={t("auth.phone_number")}
              labelPlacement="outside"
              variant="faded"
              onPhoneChange={(countryCode, phoneNumber, dialCode, country) => {
                setPhone({ iso2: countryCode, number: phoneNumber, dialCode, country });
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-danger">{errors.phone}</p>
            ) : null}
          </div>

          <Input
            autoComplete="new-password"
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

          <Input
            autoComplete="new-password"
            errorMessage={errors.confirm}
            isInvalid={Boolean(errors.confirm)}
            label={t("auth.confirm_password")}
            placeholder={t("auth.confirm_password_placeholder")}
            type={showPassword ? "text" : "password"}
            value={confirm}
            onValueChange={(v) => {
              setConfirm(v);
              setErrors((p) => ({ ...p, confirm: undefined }));
            }}
          />

          <Input
            label={`${t("auth.referral_code")} (${t("auth.optional")})`}
            placeholder={t("auth.referral_code_placeholder")}
            value={referral}
            onValueChange={setReferral}
          />

          <Button className="w-full" color="primary" isLoading={isLoading} type="submit">
            {t("auth.register")}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Divider className="flex-1" />
          <span className="text-xs text-default-500">{t("login_modal.or")}</span>
          <Divider className="flex-1" />
        </div>

        <div className="flex flex-col gap-3">
          <GoogleLoginBtn
            context="register"
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onOpenChange={() => router.replace(next)}
          />
          <AppleLoginBtn
            context="register"
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

RegisterPage.getLayout = (page: ReactNode) => page;

export default RegisterPage;
