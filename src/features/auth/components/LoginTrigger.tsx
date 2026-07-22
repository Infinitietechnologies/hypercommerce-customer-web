import { LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import LoginSheet from "@/features/auth/components/LoginSheet";
import { Button, useDisclosure } from "@/components/ui";
import { useScreenType } from "@/hooks/useScreenType";

export interface LoginTriggerProps {
  /** `btn` shows a labelled button, `icon` shows the compact header affordance. */
  view?: "btn" | "icon";
}

/**
 * Entry point for signing in.
 *
 * Mobile navigates to /login, matching the Flutter app, which has no auth
 * overlays — that also gives the flow real history and a back button.
 * Tablet and up open LoginSheet, keeping the faster desktop path. Both render
 * the same LoginForm.
 */
const LoginTrigger = ({ view = "btn" }: LoginTriggerProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const screen = useScreenType();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const isMobile = screen === "mobile";

  const onPress = () => {
    if (isMobile) {
      const next = router.asPath;
      router.push(
        next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login",
      );
      return;
    }
    onOpen();
  };

  return (
    <>
      {view === "icon" ? (
        <Button
          isIconOnly
          aria-label={t("login_modal.sign_in")}
          id="login-btn"
          size="sm"
          variant="light"
          onPress={onPress}
        >
          <LogIn aria-hidden="true" size={18} />
        </Button>
      ) : (
        <Button
          className="p-0 text-xs"
          color="primary"
          id="login-btn"
          size="responsive"
          startContent={<LogIn aria-hidden="true" size={16} />}
          variant="flat"
          onPress={onPress}
        >
          {t("login_modal.button")}
        </Button>
      )}

      {!isMobile ? (
        <LoginSheet isOpen={isOpen} next={router.asPath} onOpenChange={onOpenChange} />
      ) : null}
    </>
  );
};

export default LoginTrigger;
