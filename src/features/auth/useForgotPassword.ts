import type { ConfirmationResult } from "firebase/auth";
import type { FirebaseInstance } from "@/lib/firebase";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { toastError, toastSuccess } from "@/components/ui";
import { handleResendOtp, handleSignUp } from "@/helpers/auth";
import { sendForgotOtp, verifyForgotOtp, resetPassword } from "@/services/auth";

import { useResendCooldown } from "./useResendCooldown";

export type ForgotStep = "identifier" | "otp" | "password";
export type ForgotMethod = "email" | "phone";

/**
 * Password-reset OTP flow, backing ForgotPasswordForm. Three server steps
 * (send OTP -> verify -> reset) matching PasswordResetApiController, and the
 * same gateway split as sign-in: an email address gets an email code, a mobile
 * number gets a custom SMS or a Firebase phone code (sent client-side).
 */
export const useForgotPassword = ({ onSuccess }: { onSuccess: () => void }) => {
  const { t } = useTranslation();

  const [step, setStep] = useState<ForgotStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [token, setToken] = useState("");
  // True once step 1 resolves the mobile channel to Firebase — the browser then
  // owns sending and confirming the code (see window.confirmationResult).
  const [usesFirebase, setUsesFirebase] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const cooldown = useResendCooldown();

  const firebase = () => {
    const instance =
      typeof window !== "undefined"
        ? (window.firebaseInstance as FirebaseInstance | undefined)
        : undefined;
    if (!instance) {
      toastError(
        t("login_modal.errors.firebase_error_title"),
        t("login_modal.errors.firebase_error_desc"),
      );
    }
    return instance;
  };

  /** Step 1: validate the account server-side, then route to the right sender. */
  const send = useCallback(
    async (value: string, method: ForgotMethod) => {
      const trimmed = value.trim();
      setIsSending(true);
      try {
        const response = await sendForgotOtp({ identifier: trimmed });
        if (!response.success) {
          toastError(t("auth.forgot.errors.send_failed"), response.message);
          return;
        }

        setIdentifier(trimmed);
        const isFirebasePhone =
          method === "phone" && response.data?.gateway === "firebase";
        setUsesFirebase(isFirebasePhone);

        // Firebase never sends server-side — the client must trigger the SMS.
        if (isFirebasePhone) {
          const instance = firebase();
          if (!instance) return;
          if (!(await handleSignUp(trimmed, instance))) return;
        } else {
          toastSuccess(t("auth.forgot.code_sent_title"), t("auth.forgot.code_sent_desc"));
        }

        cooldown.start();
        setStep("otp");
      } catch (error) {
        console.error("Forgot send error:", error);
        toastError(t("auth.forgot.errors.send_failed"));
      } finally {
        setIsSending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const resend = useCallback(async () => {
    if (cooldown.secondsLeft > 0) return;

    setIsResending(true);
    try {
      if (usesFirebase) {
        const instance = firebase();
        if (!instance) return;
        if (await handleResendOtp(identifier, instance)) cooldown.start();
        return;
      }

      const response = await sendForgotOtp({ identifier });
      if (response.success) {
        cooldown.start();
        toastSuccess(
          t("resend_otp_toast.otp_resent_title"),
          t("resend_otp_toast.otp_resent_desc"),
        );
      } else {
        toastError(t("auth.forgot.errors.send_failed"), response.message);
      }
    } catch (error) {
      console.error("Forgot resend error:", error);
      toastError(t("auth.forgot.errors.send_failed"));
    } finally {
      setIsResending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, usesFirebase, cooldown.secondsLeft, t]);

  /** Step 2: verify the code and hold the reset token for step 3. */
  const verify = useCallback(
    async (otp: string) => {
      if (!otp || otp.length !== 6) {
        toastError(
          t("login_modal.errors.invalid_otp_title"),
          t("login_modal.errors.invalid_otp_desc"),
        );
        return;
      }

      setIsVerifying(true);
      try {
        let response;
        if (usesFirebase) {
          const confirmation = window.confirmationResult as
            | ConfirmationResult
            | undefined;
          if (!confirmation) {
            toastError(
              t("login_modal.errors.verification_error_title"),
              t("login_modal.errors.verification_error_desc"),
            );
            setStep("identifier");
            return;
          }
          const credential = await confirmation.confirm(otp);
          const idToken = await credential.user.getIdToken();
          response = await verifyForgotOtp({ identifier, idToken });
        } else {
          response = await verifyForgotOtp({ identifier, otp });
        }

        if (response?.success && response.data?.token) {
          setToken(response.data.token);
          setStep("password");
        } else {
          toastError(t("auth.forgot.errors.otp_invalid"), response?.message);
        }
      } catch (error) {
        console.error("Forgot verify error:", error);
        toastError(
          t("auth.forgot.errors.otp_invalid"),
          error instanceof Error ? error.message : undefined,
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [identifier, usesFirebase, t],
  );

  /** Step 3: set the new password against the reset token. */
  const resetPwd = useCallback(
    async (password: string, confirmation: string) => {
      setIsResetting(true);
      try {
        const response = await resetPassword({
          identifier,
          token,
          password,
          password_confirmation: confirmation,
        });

        if (response?.success) {
          toastSuccess(t("auth.forgot.reset_success_title"), t("auth.forgot.reset_success_desc"));
          onSuccess();
        } else {
          toastError(t("auth.forgot.errors.reset_failed"), response?.message);
        }
      } catch (error) {
        console.error("Forgot reset error:", error);
        toastError(t("auth.forgot.errors.reset_failed"));
      } finally {
        setIsResetting(false);
      }
    },
    [identifier, token, onSuccess, t],
  );

  const reset = useCallback(() => {
    setStep("identifier");
    setUsesFirebase(false);
    if (typeof window !== "undefined") window.confirmationResult = undefined;
  }, []);

  return {
    step,
    identifier,
    isSending,
    isVerifying,
    isResending,
    isResetting,
    send,
    verify,
    resend,
    resendIn: cooldown.secondsLeft,
    resetPwd,
    reset,
  };
};
