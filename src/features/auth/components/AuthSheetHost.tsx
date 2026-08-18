import { useRouter } from "next/router";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { Sheet } from "@/components/ui";
import { authSheetStore } from "@/stores/authSheetStore";
import { safeNext } from "@/features/auth/safeNext";

const serverSnapshot = () => authSheetStore.getState();

/**
 * The one auth sheet for the whole app, mounted once in _app.
 *
 * Auth is an overlay rather than a route, and several places can ask for it —
 * the header (which renders a trigger per breakpoint), the location gate, and a
 * protected page bouncing the visitor to `/?auth=required`. They all drive this
 * through authSheetStore, so exactly one sheet ever opens.
 *
 * Login and register swap in place, so the two are one continuous flow.
 */
const AuthSheetHost = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { isOpen, mode, next } = useSyncExternalStore(
    authSheetStore.subscribe,
    authSheetStore.getState,
    serverSnapshot,
  );

  // Opened via query: a protected page bounces signed-out visitors here with
  // `?auth=required`, and the retired /forgot-password route redirects to
  // `?auth=forgot` so old links land on the in-sheet reset flow.
  useEffect(() => {
    if (!router.isReady) return;
    const auth = router.query.auth;
    if (auth !== "required" && auth !== "forgot") return;

    authSheetStore.open({
      mode: auth === "forgot" ? "forgot" : "login",
      next: safeNext(router.query.next),
    });

    // Drop the params so a refresh or back-navigation does not reopen the sheet.
    const rest = { ...router.query };
    delete rest.auth;
    delete rest.next;
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.auth]);

  const onSuccess = useCallback(() => {
    authSheetStore.close();
    if (next && next !== "/") router.push(next);
  }, [next, router]);

  const heading =
    mode === "login"
      ? { title: t("auth.welcome_back"), subtitle: t("auth.sign_in_subtitle") }
      : mode === "register"
        ? {
            title: t("login_modal.create_account"),
            subtitle: t("auth.create_account_subtitle"),
          }
        : {
            title: t("auth.forgot.title"),
            subtitle: t("auth.forgot.subtitle"),
          };

  return (
    <Sheet
      isOpen={isOpen}
      size="md"
      backdrop="blur"
      classNames={{
        base: "overflow-hidden border border-divider bg-content1 shadow-overlay",
        header: "px-5 pb-4 pt-4 sm:px-6 sm:pt-6",
        body: "px-5 pb-6 pt-0 sm:px-6 sm:pb-7",
        closeButton:
          "end-3 top-3 rounded-full text-default-500 hover:bg-content2 hover:text-foreground",
      }}
      title={
        <div className="flex flex-col gap-1.5 pe-8">
          <span className="text-xl font-bold tracking-tight text-foreground">
            {heading.title}
          </span>
          <span className="text-sm font-normal leading-5 text-default-500">
            {heading.subtitle}
          </span>
        </div>
      }
      onOpenChange={(open) => {
        if (!open) authSheetStore.close();
      }}
    >
      <div>
        {mode === "login" ? (
          <LoginForm
            compact
            onSuccess={onSuccess}
            onForgotPassword={() => authSheetStore.setMode("forgot")}
            onSwitchToRegister={() => authSheetStore.setMode("register")}
          />
        ) : mode === "register" ? (
          <RegisterForm
            compact
            onSuccess={onSuccess}
            onSwitchToLogin={() => authSheetStore.setMode("login")}
          />
        ) : (
          <ForgotPasswordForm
            compact
            onSwitchToLogin={() => authSheetStore.setMode("login")}
          />
        )}
      </div>
    </Sheet>
  );
};

export default AuthSheetHost;
