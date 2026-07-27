import type { FormEvent } from "react";

import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import AppleLoginBtn from "@/components/Functional/AppleLoginBtn";
import GoogleLoginBtn from "@/components/Functional/GoogleLoginBtn";
import { Button, Divider, Input, Link, toastError } from "@/components/ui";
import { handleRegisterUser } from "@/helpers/auth";
import { validateEmail, validatePassword } from "@/helpers/validator";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

interface PhoneState {
  iso2: string;
  number: string;
  dialCode: string;
  country: string;
}

type FieldErrors = Partial<
  Record<"name" | "email" | "phone" | "password" | "confirm", string>
>;

export interface RegisterFormProps {
  /** Called once the account is created and the session established. */
  onSuccess: () => void;
  /** Switch the host sheet over to the login form. */
  onSwitchToLogin: () => void;
  compact?: boolean;
}

/**
 * The single registration implementation, mirroring the Flutter register screen
 * (hypercommerce-customer-app/lib/screens/auth/view/register_page.dart).
 * Rendered inside RegisterSheet.
 */
const RegisterForm = ({ onSuccess, onSwitchToLogin, compact = false }: RegisterFormProps) => {
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

  const onSubmit = async (event: FormEvent) => {
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

      if (response?.success) onSuccess();
    } catch {
      toastError(t("auth.errors.register_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
        <Input
          autoComplete="name"
          errorMessage={errors.name}
          isInvalid={Boolean(errors.name)}
          label={t("auth.full_name")}
          placeholder={t("auth.full_name_placeholder")}
          startContent={<Icon aria-hidden="true" className="text-lg" icon="solar:user-linear" />}
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
          startContent={<Icon aria-hidden="true" className="text-lg" icon="solar:letter-linear" />}
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
              <Icon
                className="text-lg"
                icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"}
              />
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

      <div className={`flex items-center gap-3 ${compact ? "my-4" : "my-6"}`}>
        <Divider className="flex-1" />
        <span className="text-xs text-default-500">{t("login_modal.or")}</span>
        <Divider className="flex-1" />
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLoginBtn
          context="register"
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onOpenChange={onSuccess}
        />
        <AppleLoginBtn
          context="register"
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onOpenChange={onSuccess}
        />
      </div>

      <p className={`text-center text-small text-default-500 ${compact ? "mt-4" : "mt-6"}`}>
        {t("auth.have_account")}{" "}
        <Link
          className="cursor-pointer text-small font-semibold"
          onPress={onSwitchToLogin}
        >
          {t("login_modal.sign_in")}
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;
