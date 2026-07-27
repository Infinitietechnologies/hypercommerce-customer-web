import type { FormEvent } from "react";

import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, InputOtp, Input, Tab, Tabs } from "@/components/ui";
import { validatePassword } from "@/helpers/validator";
import { useForgotPassword, type ForgotMethod } from "@/features/auth/useForgotPassword";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

export interface ForgotPasswordFormProps {
  /** Return to the sign-in form (used by the back link and after a reset). */
  onSwitchToLogin: () => void;
  compact?: boolean;
}

/**
 * In-sheet password reset: identifier -> OTP -> new password, over the panel's
 * PasswordResetApiController. Replaces the standalone /forgot-password page and
 * its email-link flow. Email and phone are offered as tabs, mirroring the OTP
 * sign-in so a Firebase or custom-SMS gateway is handled the same way.
 */
const ForgotPasswordForm = ({ onSwitchToLogin, compact = false }: ForgotPasswordFormProps) => {
  const { t } = useTranslation();
  const forgot = useForgotPassword({ onSuccess: onSwitchToLogin });

  const [method, setMethod] = useState<ForgotMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const onSendSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (method === "email") {
      forgot.send(email, "email");
    } else {
      forgot.send(phone, "phone");
    }
  };

  const onOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(Object.fromEntries(new FormData(event.currentTarget)).otp ?? "");
    forgot.verify(code);
  };

  const onResetSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found: typeof errors = {};
    const passwordError = validatePassword(password);
    if (passwordError) found.password = passwordError;
    if (confirm !== password) found.confirm = t("auth.errors.passwords_mismatch");
    setErrors(found);
    if (Object.keys(found).length) return;
    forgot.resetPwd(password, confirm);
  };

  return (
    <div className="flex flex-col">
      {forgot.step === "identifier" ? (
        <Tabs
          aria-label={t("auth.forgot.method_label")}
          classNames={{ tabList: "w-full", base: compact ? "mb-4" : "mb-5" }}
          selectedKey={method}
          variant="bordered"
          onSelectionChange={(key) => setMethod(key as ForgotMethod)}
        >
          <Tab key="email" title={t("auth.forgot.email_tab")}>
            <form className="flex flex-col gap-4" noValidate onSubmit={onSendSubmit}>
              <p className="text-small text-default-500">{t("auth.forgot.email_hint")}</p>
              <Input
                autoComplete="email"
                label={t("login_modal.email_label")}
                placeholder={t("login_modal.email_placeholder")}
                startContent={<Icon aria-hidden="true" className="text-lg" icon="solar:letter-linear" />}
                type="email"
                value={email}
                onValueChange={setEmail}
              />
              <Button
                className="w-full"
                color="primary"
                isDisabled={!email.trim()}
                isLoading={forgot.isSending}
                type="submit"
              >
                {t("auth.forgot.send_code")}
              </Button>
            </form>
          </Tab>

          <Tab key="phone" title={t("auth.forgot.phone_tab")}>
            <form className="flex flex-col gap-4" onSubmit={onSendSubmit}>
              <p className="text-small text-default-500">{t("auth.forgot.phone_hint")}</p>
              <PhoneInput
                label={t("auth.phone_number")}
                labelPlacement="outside"
                variant="faded"
                onPhoneChange={(_iso2, phoneNumber, dialCode) =>
                  setPhone(
                    `${dialCode.startsWith("+") ? dialCode : `+${dialCode}`}${phoneNumber}`,
                  )
                }
              />
              <Button
                className="w-full"
                color="primary"
                isLoading={forgot.isSending}
                type="submit"
              >
                {t("auth.forgot.send_code")}
              </Button>
            </form>
          </Tab>
        </Tabs>
      ) : null}

      {forgot.step === "otp" ? (
        <form className="flex flex-col gap-4" onSubmit={onOtpSubmit}>
          <p className="text-small text-default-500">
            {t("auth.forgot.otp_hint", { target: forgot.identifier })}
          </p>

          <div className="flex justify-center">
            <InputOtp autoFocus aria-label={t("auth.otp_input_label")} length={6} name="otp" />
          </div>

          <Button className="w-full" color="primary" isLoading={forgot.isVerifying} type="submit">
            {t("auth.verify_and_continue")}
          </Button>

          <div className="flex items-center justify-between">
            <Button
              className="h-auto min-w-0 px-2 py-1 text-[10px]"
              size="sm"
              variant="light"
              onPress={forgot.reset}
            >
              {t("auth.change_number")}
            </Button>
            <Button
              className="h-auto min-w-0 px-2 py-1 text-[10px]"
              isLoading={forgot.isResending}
              size="sm"
              variant="light"
              onPress={forgot.resend}
            >
              {t("auth.resend_code")}
            </Button>
          </div>
        </form>
      ) : null}

      {forgot.step === "password" ? (
        <form className="flex flex-col gap-4" noValidate onSubmit={onResetSubmit}>
          <p className="text-small text-default-500">{t("auth.forgot.new_password_hint")}</p>
          <Input
            autoComplete="new-password"
            errorMessage={errors.password}
            isInvalid={Boolean(errors.password)}
            label={t("auth.forgot.new_password")}
            placeholder={t("login_modal.password_placeholder")}
            startContent={<Icon aria-hidden="true" className="text-lg" icon="solar:lock-password-linear" />}
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
            startContent={<Icon aria-hidden="true" className="text-lg" icon="solar:lock-password-linear" />}
            type={showPassword ? "text" : "password"}
            value={confirm}
            onValueChange={(v) => {
              setConfirm(v);
              setErrors((p) => ({ ...p, confirm: undefined }));
            }}
          />
          <Button className="w-full" color="primary" isLoading={forgot.isResetting} type="submit">
            {t("auth.forgot.reset_password")}
          </Button>
        </form>
      ) : null}

      <p className={`text-center text-small text-default-500 ${compact ? "mt-4" : "mt-6"}`}>
        {t("auth.forgot.remember")}{" "}
        <button
          className="cursor-pointer text-small font-semibold text-primary"
          type="button"
          onClick={onSwitchToLogin}
        >
          {t("login_modal.sign_in")}
        </button>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
