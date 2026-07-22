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
 * Send the visitor to the real login route, remembering where they were headed
 * so it can return them there. Previously this dropped them on `/?auth=required`,
 * which lost the destination and relied on a modal opening itself.
 */
export const loginRedirect = (context: GetServerSidePropsContext) => {
  const next = context.resolvedUrl || "/";
  return next === "/"
    ? "/login"
    : `/login?next=${encodeURIComponent(next)}`;
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
