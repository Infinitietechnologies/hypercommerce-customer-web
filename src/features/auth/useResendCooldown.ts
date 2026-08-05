import { useCallback, useEffect, useState } from "react";

/**
 * Countdown gate for the OTP resend controls. A usability control only — the
 * security limit is the panel's throttle:otp-send on the send endpoints.
 */
export const useResendCooldown = (seconds = 60) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);

    return () => clearTimeout(id);
  }, [secondsLeft]);

  return {
    secondsLeft,
    start: useCallback(() => setSecondsLeft(seconds), [seconds]),
  };
};
