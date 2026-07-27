import { Icon } from "@iconify/react";
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
        variant="light"
        onPress={onPress}
      >
        <Icon aria-hidden="true" className="text-lg" icon="solar:login-2-linear" />
      </Button>
    );
  }

  return (
    <Button
      className="p-0 text-xs"
      color="primary"
      id="login-btn"
      size="responsive"
      startContent={<Icon aria-hidden="true" className="text-base" icon="solar:login-2-linear" />}
      variant="flat"
      onPress={onPress}
    >
      {t("login_modal.button")}
    </Button>
  );
};

export default LoginTrigger;
