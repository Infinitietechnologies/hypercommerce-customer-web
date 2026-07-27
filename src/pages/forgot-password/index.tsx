import { GetServerSideProps } from "next";

/**
 * Password reset now lives inside the auth sheet (the OTP flow over
 * PasswordResetApiController), not on its own page. This route is kept only so
 * old links and bookmarks still work — it redirects to the home page with the
 * sheet opened on the reset step.
 */
const ForgotPasswordRedirect = () => null;

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/?auth=forgot",
    permanent: false,
  },
});

export default ForgotPasswordRedirect;
