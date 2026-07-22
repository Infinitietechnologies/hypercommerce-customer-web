import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { authSheetStore } from "@/stores/authSheetStore";

export interface LoginTriggerProps {
  /** `btn` shows a labelled button, `icon` shows the compact header affordance. */
  view?: "btn" | "icon";
}

/**
 * Opens the shared auth sheet. The sheet itself lives once in AuthSheetHost, so
 * the header can render this per breakpoint without stacking overlays.
 */
const LoginTrigger = ({ view = "btn" }: LoginTriggerProps) => {
  const { t } = useTranslation();
  const onPress = () => authSheetStore.open();

  if (view === "icon") {
    return (
      <Button
        isIconOnly
        aria-label={t("login_modal.sign_in")}
        id="login-btn"
        size="sm"
        className="text-header-foreground"
        variant="light"
        onPress={onPress}
      >
        <LogIn aria-hidden="true" size={18} />
      </Button>
    );
  }

  // Reads as a text action in the dark header bar, not a filled button.
  return (
    <Button
      className="px-2 text-small font-normal text-header-foreground"
      id="login-btn"
      size="sm"
      startContent={<LogIn aria-hidden="true" size={16} />}
      variant="light"
      onPress={onPress}
    >
      {t("login_modal.button")}
    </Button>
  );
};

export default LoginTrigger;
