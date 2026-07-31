import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Password reset now lives inside the auth sheet (the OTP flow over
 * PasswordResetApiController), not on its own page. This route is kept only so
 * old links and bookmarks still work — it redirects to the home page with the
 * sheet opened on the reset step.
 */
const ForgotPasswordRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=forgot");
  }, [router]);

  return null;
};

export default ForgotPasswordRedirect;