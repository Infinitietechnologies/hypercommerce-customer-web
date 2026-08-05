import type { ConfirmationResult } from "firebase/auth";
import type { FirebaseInstance } from "@/lib/firebase";

import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import { toastError, toastSuccess } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { handlePhoneLogin, handleResendOtp, handleSignUp } from "@/helpers/auth";
import {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  trackLogin,
} from "@/lib/analytics";
import { setCookie } from "@/lib/cookies";
import { login as ReduxLogin } from "@/lib/redux/slices/authSlice";
import { clearRecentlyViewed } from "@/lib/redux/slices/recentlyViewedSlice";
import { syncOfflineCartToServer, updateCartData, updateDataOnAuth } from "@/helpers/updators";
import { sendOtp, verifyOtp } from "@/services/auth";

import { useResendCooldown } from "./useResendCooldown";

export type OtpStep = "phone" | "verify";

/**
 * Phone OTP sign-in, supporting both gateways the panel can be configured for:
 * Firebase (the browser gets a ConfirmationResult) and the panel's own SMS
 * endpoints. Lifted out of the old LoginModal so the /login route and the
 * desktop sheet share one implementation instead of keeping copies in sync.
 */
export const useOtpLogin = ({ onSuccess }: { onSuccess: () => void }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { authSettings } = useSettings();

  const [step, setStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const cooldown = useResendCooldown();

  const gateway =
    authSettings?.smsGateway ||
    (authSettings?.firebase ? "firebase" : authSettings?.customSms ? "custom" : "firebase");
  const isFirebase = gateway === "firebase";

  const firebase = () => {
    const instance = (typeof window !== "undefined"
      ? (window.firebaseInstance as FirebaseInstance | undefined)
      : undefined);
    if (!instance) {
      toastError(
        t("login_modal.errors.firebase_error_title"),
        t("login_modal.errors.firebase_error_desc"),
      );
    }
    return instance;
  };

  const send = useCallback(async () => {
    if (!phone || phone.length < 8) {
      toastError(
        t("login_modal.errors.invalid_phone_title"),
        t("login_modal.errors.invalid_phone_desc"),
      );
      return;
    }

    setIsSending(true);
    try {
      if (isFirebase) {
        const instance = firebase();
        if (!instance) return;
        if (await handleSignUp(phone, instance)) {
          cooldown.start();
          setStep("verify");
        }
        return;
      }

      const response = await sendOtp({ mobile: phone, expires_in: 600 });
      if (response.success) {
        cooldown.start();
        toastSuccess(t("signup_toast.otp_sent_title"), t("signup_toast.otp_sent_desc"));
        setStep("verify");
      } else {
        toastError(t("login_modal.errors.verification_failed_title"), response.message);
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toastError(t("login_modal.errors.verification_failed_title"));
    } finally {
      setIsSending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, isFirebase, t]);

  const resend = useCallback(async () => {
    if (cooldown.secondsLeft > 0) return;

    setIsResending(true);
    try {
      if (isFirebase) {
        const instance = firebase();
        if (!instance) return;
        if (await handleResendOtp(phone, instance)) cooldown.start();
        return;
      }

      const response = await sendOtp({ mobile: phone, expires_in: 600 });
      if (response.success) {
        cooldown.start();
        toastSuccess(
          t("resend_otp_toast.otp_resent_title"),
          t("resend_otp_toast.otp_resent_desc"),
        );
      } else {
        toastError(t("login_modal.errors.verification_failed_title"), response.message);
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toastError(t("login_modal.errors.verification_failed_title"));
    } finally {
      setIsResending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, isFirebase, cooldown.secondsLeft, t]);

  const verify = useCallback(
    async (otp: string, friendsCode?: string) => {
      if (!otp || otp.length !== 6) {
        toastError(
          t("login_modal.errors.invalid_otp_title"),
          t("login_modal.errors.invalid_otp_desc"),
        );
        return;
      }

      setIsVerifying(true);
      try {
        if (isFirebase) {
          const confirmation = window.confirmationResult as ConfirmationResult | undefined;
          if (!confirmation) {
            toastError(
              t("login_modal.errors.verification_error_title"),
              t("login_modal.errors.verification_error_desc"),
            );
            setStep("phone");
            return;
          }

          const credential = await confirmation.confirm(otp);
          const idToken = await credential.user.getIdToken();
          // handlePhoneLogin persists the session and toasts on its own.
          const result = await handlePhoneLogin({
            idToken,
            dispatch,
            friends_code: friendsCode,
            renderToast: true,
          });

          if (result?.success) onSuccess();
          return;
        }

        const response = await verifyOtp({ mobile: phone, otp, friends_code: friendsCode });

        if (response?.success && response.data) {
          setCookie("user", response.data);
          setCookie("access_token", response.access_token || "");
          dispatch(
            ReduxLogin({
              user: response.data,
              access_token: response.access_token || "",
            }),
          );

          if (response.data.new_user) dispatch(clearRecentlyViewed());

          await syncOfflineCartToServer();
          updateDataOnAuth();
          updateCartData(false, false, 0);

          setAnalyticsUserId(response.data.id.toString());
          setAnalyticsUserProperties({ login_method: "phone_otp", user_type: "customer" });
          trackLogin("phone_otp");

          toastSuccess(
            t("login_modal.welcome_title"),
            t("login_modal.login_success_toast"),
          );
          onSuccess();
        } else {
          toastError(
            t("login_modal.errors.verification_failed_title"),
            response?.message,
          );
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        toastError(
          t("login_modal.errors.verification_failed_title"),
          error instanceof Error ? error.message : undefined,
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [phone, isFirebase, dispatch, onSuccess, t],
  );

  const reset = useCallback(() => {
    setStep("phone");
    if (typeof window !== "undefined") window.confirmationResult = undefined;
  }, []);

  return {
    step,
    phone,
    setPhone,
    isSending,
    isVerifying,
    isResending,
    send,
    verify,
    resend,
    resendIn: cooldown.secondsLeft,
    reset,
  };
};
