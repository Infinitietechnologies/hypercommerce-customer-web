import type { FormEvent } from "react";

import { Eye, EyeOff, Mail } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import AppleLoginBtn from "@/components/Functional/AppleLoginBtn";
import GoogleLoginBtn from "@/components/Functional/GoogleLoginBtn";
import {
  Button,
  Divider,
  Input,
  InputOtp,
  Link,
  Tab,
  Tabs,
  toastError,
} from "@/components/ui";
import { handleLoginUser } from "@/helpers/auth";
import { looksLikeEmail } from "@/helpers/validator";
import { useOtpLogin } from "@/features/auth/useOtpLogin";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

export interface LoginFormProps {
  /** Called once the session is established. */
  onSuccess: () => void;
  /** Switch the host sheet over to the register form. */
  onSwitchToRegister: () => void;
  /** Rendered in a sheet rather than a page — used to tighten spacing. */
  compact?: boolean;
}

/**
 * The single login implementation, rendered inside LoginSheet.
 */
const LoginForm = ({ onSuccess, onSwitchToRegister, compact = false }: LoginFormProps) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const otp = useOtpLogin({ onSuccess });

  const onPasswordSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      const found: typeof errors = {};
      if (!identifier.trim()) found.identifier = t("auth.errors.identifier_required");
      if (!password) found.password = t("auth.errors.password_required");
      setErrors(found);
      if (Object.keys(found).length) return;

      setIsLoading(true);
      try {
        const isEmail = looksLikeEmail(identifier);
        // Returns the ApiResponse, not a boolean, and toasts both outcomes.
        const response = await handleLoginUser(
          {
            email: isEmail ? identifier.trim() : undefined,
            mobile: isEmail ? undefined : identifier.replace(/\D/g, ""),
            password,
          },
          dispatch,
        );

        if (response?.success && response.data) onSuccess();
      } catch {
        toastError(t("login_modal.login_failed_toast"));
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, password, dispatch, onSuccess, t],
  );

  const onOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(Object.fromEntries(new FormData(event.currentTarget)).otp ?? "");
    otp.verify(code);
  };

  return (
    <div className="flex flex-col">
      <Tabs
        aria-label={t("auth.sign_in_method")}
        classNames={{ tabList: "w-full", base: compact ? "mb-4" : "mb-5" }}
        variant="bordered"
      >
        <Tab key="password" title={t("login_modal.password_label")}>
          <form className="flex flex-col gap-4" noValidate onSubmit={onPasswordSubmit}>
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

            <Button className="w-full" color="primary" isLoading={isLoading} type="submit">
              {t("login_modal.sign_in")}
            </Button>
          </form>
        </Tab>

        <Tab key="otp" title={t("auth.otp_tab")}>
          {otp.step === "phone" ? (
            <div className="flex flex-col gap-4">
              <PhoneInput
                label={t("auth.phone_number")}
                labelPlacement="outside"
                variant="faded"
                onPhoneChange={(_iso2, phoneNumber, dialCode) =>
                  otp.setPhone(
                    `${dialCode.startsWith("+") ? dialCode : `+${dialCode}`}${phoneNumber}`,
                  )
                }
              />
              <Button
                className="w-full"
                color="primary"
                isLoading={otp.isSending}
                onPress={otp.send}
              >
                {t("auth.send_code")}
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={onOtpSubmit}>
              <p className="text-small text-default-500">
                {t("auth.otp_verify_subtitle", { phone: otp.phone })}
              </p>

              <div className="flex justify-center">
                <InputOtp autoFocus aria-label={t("auth.otp_input_label")} length={6} name="otp" />
              </div>

              <Button
                className="w-full"
                color="primary"
                isLoading={otp.isVerifying}
                type="submit"
              >
                {t("auth.verify_and_continue")}
              </Button>

              <div className="flex items-center justify-between">
                <Button
                  className="h-auto min-w-0 px-2 py-1"
                  size="sm"
                  variant="light"
                  onPress={otp.reset}
                >
                  {t("auth.change_number")}
                </Button>
                <Button
                  className="h-auto min-w-0 px-2 py-1"
                  isLoading={otp.isResending}
                  size="sm"
                  variant="light"
                  onPress={otp.resend}
                >
                  {t("auth.resend_code")}
                </Button>
              </div>
            </form>
          )}
        </Tab>
      </Tabs>

      <div className={`flex items-center gap-3 ${compact ? "my-4" : "my-6"}`}>
        <Divider className="flex-1" />
        <span className="text-xs text-default-500">{t("login_modal.or")}</span>
        <Divider className="flex-1" />
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLoginBtn
          context="login"
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onOpenChange={onSuccess}
        />
        <AppleLoginBtn
          context="login"
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onOpenChange={onSuccess}
        />
      </div>

      <p className={`text-center text-small text-default-500 ${compact ? "mt-4" : "mt-6"}`}>
        {t("login_modal.no_account")}{" "}
        <Link
          className="cursor-pointer text-small font-semibold"
          onPress={onSwitchToRegister}
        >
          {t("login_modal.create_account")}
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
