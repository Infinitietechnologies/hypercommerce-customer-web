// src/guards/authGuard.ts
import { GetServerSidePropsContext } from "next";
import { getAccessTokenFromContext } from "@/helpers/auth";

export const PROTECTED_ROUTES = [
  "/cart",
  "/my-account",
  "/my-account/orders",
  "/my-account/addresses",
  "/my-account/wallet",
  "/my-account/transactions",
  "/my-account/refer-and-earn",
];

export const isProtectedRoute = (path: string) => {
  return PROTECTED_ROUTES.some((route) => {
    if (route.endsWith("/*")) {
      const baseRoute = route.slice(0, -2);
      return path.startsWith(baseRoute);
    }
    return path === route;
  });
};

/**
 * Bounce an unauthenticated visitor to the home page with `?auth=required`,
 * which LoginTrigger reads to open the auth sheet. Auth is an overlay rather
 * than a route, so there is nowhere else to send them.
 *
 * `?next=` carries the destination so they are returned there after signing in.
 */
export const loginRedirect = (context: GetServerSidePropsContext) => {
  const next = context.resolvedUrl || "/";
  return next === "/"
    ? "/?auth=required"
    : `/?auth=required&next=${encodeURIComponent(next)}`;
};

export const serverSideAuthGuard = async (
  context: GetServerSidePropsContext
) => {
  try {
    const access_token = await getAccessTokenFromContext(context);

    if (!access_token) {
      return {
        redirect: {
          destination: loginRedirect(context),
          permanent: false,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Auth guard error:", error);
    return {
      redirect: {
        destination: loginRedirect(context),
        permanent: false,
      },
    };
  }
};
