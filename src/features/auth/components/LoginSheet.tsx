import { useRouter } from "next/router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import LoginForm from "@/features/auth/components/LoginForm";
import { Sheet } from "@/components/ui";

export interface LoginSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to land after a successful sign-in. Defaults to staying put. */
  next?: string;
}

/**
 * The desktop quick path. Renders the same LoginForm the /login route uses, so
 * the two can never drift — only the presentation differs. On mobile the
 * navbar links to /login instead, matching the Flutter app's full-screen auth.
 */
const LoginSheet = ({ isOpen, onOpenChange, next }: LoginSheetProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  const onSuccess = useCallback(() => {
    onOpenChange(false);
    if (next) router.replace(next);
  }, [onOpenChange, next, router]);

  return (
    <Sheet
      isOpen={isOpen}
      title={
        <div className="flex flex-col gap-0.5">
          <span className="text-large font-bold">{t("auth.welcome_back")}</span>
          <span className="text-small font-normal text-default-500">
            {t("auth.sign_in_subtitle")}
          </span>
        </div>
      }
      onOpenChange={onOpenChange}
    >
      <div className="pb-2">
        <LoginForm compact registerHref="/register" onSuccess={onSuccess} />
      </div>
    </Sheet>
  );
};

export default LoginSheet;
