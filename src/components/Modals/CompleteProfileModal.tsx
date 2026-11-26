import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import {
  Button,
  Input,
  InputOtp,
  Sheet,
  toastError,
  toastSuccess,
} from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { useProfilePhoneAvailability } from "@/features/auth/useProfilePhoneAvailability";
import { useResendCooldown } from "@/features/auth/useResendCooldown";
import {
  handlePhoneLogin,
  handleResendOtp,
  handleSignUp,
} from "@/helpers/auth";
import { getDefaultPhoneCountry } from "@/helpers/phoneCountry";
import { getCookie } from "@/lib/cookies";
import { setUserDataRedux } from "@/lib/redux/slices/authSlice";
import { sendOtp, verifyOtp } from "@/services/auth";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

type Step = "phone" | "otp" | "success";
type OtpAction = "send" | "resend" | "verify";

export const CompleteProfileModal = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { authSettings, demoMode, systemSettings } = useSettings();
  const { phone, changePhone, resetPhone, retryPhoneCheck } =
    useProfilePhoneAvailability();
  const cooldown = useResendCooldown();

  const [openedSession, setOpenedSession] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("phone");
  const [friendsCode, setFriendsCode] = useState("");
  const [action, setAction] = useState<OtpAction | null>(null);
  const [actionError, setActionError] = useState("");
  const session = useRef(0);
  const actionInFlight = useRef(false);

  const smsGateway =
    authSettings?.smsGateway ||
    (authSettings?.firebase ? "firebase" : "custom");
  const isFirebaseGateway = smsGateway === "firebase";
  const isOpen = openedSession !== null;
  const isBusy = action !== null;
  const approvedNumber =
    phone.status === "available" ? phone.internationalNumber : null;
  const canSendOtp =
    isOpen && step === "phone" && Boolean(approvedNumber) && !isBusy;
  const canResendOtp =
    isOpen &&
    step === "otp" &&
    Boolean(approvedNumber) &&
    !isBusy &&
    cooldown.secondsLeft === 0;

  const closeModal = useCallback(() => {
    session.current += 1;
    resetPhone();
    setOpenedSession(null);
  }, [resetPhone]);

  useEffect(() => {
    const handleOpen = () => {
      session.current += 1;
      resetPhone();
      setStep("phone");
      setActionError("");
      setFriendsCode(getCookie<string>("friend_code") ?? "");
      setOpenedSession(session.current);
    };

    window.addEventListener("open-complete-profile", handleOpen);
    return () =>
      window.removeEventListener("open-complete-profile", handleOpen);
  }, [resetPhone]);

  useEffect(() => {
    if (!isOpen || step !== "success") return;
    const timer = setTimeout(closeModal, 2000);
    return () => clearTimeout(timer);
  }, [closeModal, isOpen, step]);

  const runOtpAction = async (
    nextAction: OtpAction,
    errorMessage: string,
    perform: (isCurrent: () => boolean) => Promise<void>,
  ) => {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    const currentSession = session.current;
    const isCurrent = () => currentSession === session.current;
    setAction(nextAction);
    setActionError("");

    try {
      await perform(isCurrent);
    } catch {
      if (isCurrent()) {
        setActionError(errorMessage);
        toastError(errorMessage);
      }
    } finally {
      actionInFlight.current = false;
      setAction(null);
    }
  };

  const handleSendOtp = async (resend = false) => {
    if (!approvedNumber || !(resend ? canResendOtp : canSendOtp)) return;

    const errorMessage = t("auth.complete_profile.send_failed");
    await runOtpAction(
      resend ? "resend" : "send",
      errorMessage,
      async (isCurrent) => {
        if (isFirebaseGateway) {
          const firebase = window.firebaseInstance;
          if (!firebase) throw new Error("Missing Firebase configuration");

          const send = resend ? handleResendOtp : handleSignUp;
          if (!(await send(approvedNumber, firebase))) {
            if (isCurrent()) setActionError(errorMessage);
            return;
          }
        } else {
          const response = await sendOtp({ mobile: approvedNumber });
          if (!response.success) throw new Error("OTP delivery failed");
          if (isCurrent()) {
            toastSuccess(
              resend
                ? t("resend_otp_toast.otp_resent_title")
                : t("signup_toast.otp_sent_title"),
              resend
                ? t("resend_otp_toast.otp_resent_desc")
                : t("signup_toast.otp_sent_desc"),
            );
          }
        }

        if (!isCurrent()) return;
        if (resend) cooldown.start();
        else setStep("otp");
      },
    );
  };

  const handleVerify = async (otp: string) => {
    if (
      !isOpen ||
      step !== "otp" ||
      isBusy ||
      !approvedNumber ||
      otp.length !== 6
    )
      return;

    await runOtpAction(
      "verify",
      t("auth.forgot.errors.otp_invalid"),
      async (isCurrent) => {
        const friends_code = friendsCode || undefined;
        let response;
        if (isFirebaseGateway) {
          const confirmation = window.confirmationResult;
          if (!confirmation) throw new Error("Missing OTP confirmation");

          const credential = await confirmation.confirm(otp);
          const idToken = await credential.user.getIdToken();
          if (!isCurrent()) return;

          response = await handlePhoneLogin({
            idToken,
            dispatch,
            friends_code,
            renderToast: false,
          });
        } else {
          response = await verifyOtp({
            mobile: approvedNumber,
            otp,
            friends_code,
          });
        }

        if (!response?.success) throw new Error("OTP verification failed");
        if (isCurrent()) {
          dispatch(setUserDataRedux(response.data ?? {}));
          setStep("success");
          toastSuccess(t("auth.complete_profile.success_title"));
        }
      },
    );
  };

  const handleEditNumber = () => {
    if (actionInFlight.current) return;
    resetPhone();
    setActionError("");
    setStep("phone");
  };

  let phoneError: string | null = null;
  if (phone.status === "invalid") phoneError = t("phone_check.invalid_phone");
  if (phone.status === "taken") phoneError = t("phone_check.phone_exists");
  if (phone.status === "error") phoneError = t("phone_check.check_error");

  const title = {
    phone: t("auth.complete_profile.title"),
    otp: t("auth.complete_profile.verify_title"),
    success: t("auth.complete_profile.success_title"),
  }[step];
  const otpLabel = t("auth.otp_input_label");

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "z-sheet",
        wrapper: "z-sheet",
        base: "border border-divider bg-content1 shadow-overlay",
        header: "px-5 pb-2 pt-5 sm:px-6",
        body: "gap-4 px-5 py-3 sm:px-6",
        footer: "px-5 pb-6 pt-3 sm:px-6",
        closeButton:
          "end-3 top-3 rounded-medium p-2 text-base text-default-500 hover:bg-default-100 hover:text-foreground",
      }}
      title={
        <span className="pe-8 text-xl font-bold text-foreground">{title}</span>
      }
      footer={
        step === "phone" ? (
          <Button
            aria-label={t("login_modal.send_otp")}
            className="w-full text-base font-semibold"
            color="primary"
            isDisabled={!canSendOtp}
            isLoading={action === "send"}
            onPress={() => handleSendOtp()}
          >
            {t("login_modal.send_otp")}
          </Button>
        ) : step === "otp" ? (
          <Button
            className="w-full text-base font-semibold"
            isDisabled={isBusy}
            onPress={handleEditNumber}
            variant="bordered"
          >
            {t("auth.change_number")}
          </Button>
        ) : null
      }
    >
      {step === "phone" && (
        <>
          <p className="text-base text-default-600">
            {t("auth.complete_profile.description")}
          </p>
          <PhoneInput
            key={openedSession}
            defaultCountry={
              demoMode ? "IN" : getDefaultPhoneCountry(systemSettings)
            }
            description={
              phone.status === "checking" ? (
                <span role="status">
                  {t("auth.complete_profile.checking_phone")}
                </span>
              ) : undefined
            }
            errorMessage={phoneError}
            isReadOnly={isBusy}
            label={t("auth.phone_number")}
            onPhoneChange={(...args) => {
              if (actionInFlight.current) return;
              changePhone(...args);
              setActionError("");
            }}
            placeholder={t("phoneInput.placeholder")}
          />
          {phone.status === "error" && (
            <Button
              className="self-start text-base font-semibold"
              onPress={retryPhoneCheck}
              variant="bordered"
            >
              {t("common.retry")}
            </Button>
          )}
          <Input
            label={`${t("auth.referral_code")} (${t("auth.optional")})`}
            placeholder={t("auth.referral_code_placeholder")}
            value={friendsCode}
            onValueChange={setFriendsCode}
          />
        </>
      )}

      {step === "otp" && approvedNumber && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-base text-default-600">
            {t("auth.otp_verify_subtitle", {
              phone: approvedNumber,
            })}
          </p>
          <InputOtp
            aria-label={otpLabel}
            ref={(input: HTMLInputElement | null) =>
              input?.setAttribute("aria-label", otpLabel)
            }
            autoFocus
            isDisabled={isBusy}
            length={6}
            name="otp"
            onValueChange={handleVerify}
            variant="bordered"
          />
          {action === "verify" && (
            <p className="text-sm" role="status">
              {t("auth.complete_profile.verifying_code")}
            </p>
          )}
          <Button
            className="text-base font-semibold"
            isDisabled={!canResendOtp}
            isLoading={action === "resend"}
            onPress={() => handleSendOtp(true)}
            variant="light"
          >
            {cooldown.secondsLeft > 0
              ? t("auth.resend_in", { seconds: cooldown.secondsLeft })
              : t("auth.resend_code")}
          </Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-base font-medium text-danger">
          {actionError}
        </p>
      )}

      {step === "success" && (
        <div
          className="flex flex-col items-center gap-3 py-4 text-center"
          role="status"
        >
          <Icon
            aria-hidden="true"
            className="text-success"
            icon="solar:check-circle-bold"
            width={32}
            height={32}
          />
          <p className="text-base">
            {t("auth.complete_profile.success_description")}
          </p>
        </div>
      )}
    </Sheet>
  );
};
