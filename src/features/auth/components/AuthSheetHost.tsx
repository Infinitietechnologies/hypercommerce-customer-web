import { useRouter } from "next/router";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";
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

  // A protected page redirects here when the visitor is signed out.
  useEffect(() => {
    if (!router.isReady || router.query.auth !== "required") return;

    authSheetStore.open({ next: safeNext(router.query.next) });

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

  const isLogin = mode === "login";

  return (
    <Sheet
      isOpen={isOpen}
      title={
        <div className="flex flex-col gap-0.5">
          <span className="text-large font-bold">
            {isLogin ? t("auth.welcome_back") : t("login_modal.create_account")}
          </span>
          <span className="text-small font-normal text-default-500">
            {isLogin ? t("auth.sign_in_subtitle") : t("auth.create_account_subtitle")}
          </span>
        </div>
      }
      onOpenChange={(open) => {
        if (!open) authSheetStore.close();
      }}
    >
      <div className="pb-2">
        {isLogin ? (
          <LoginForm
            compact
            onSuccess={onSuccess}
            onSwitchToRegister={() => authSheetStore.setMode("register")}
          />
        ) : (
          <RegisterForm
            compact
            onSuccess={onSuccess}
            onSwitchToLogin={() => authSheetStore.setMode("login")}
          />
        )}
      </div>
    </Sheet>
  );
};

export default AuthSheetHost;
