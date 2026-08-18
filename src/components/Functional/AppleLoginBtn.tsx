import { handleAppleLogin } from "@/helpers/auth";
import { Button } from "@/components/ui";
import { Icon } from "@iconify/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface AppleLoginBtnProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onOpenChange: () => void;
  context?: "login" | "register";
}

const AppleLoginBtn: FC<AppleLoginBtnProps> = ({
  isLoading,
  setIsLoading,
  onOpenChange,
  context = "login",
}) => {
  const { t } = useTranslation();

  return (
    <Button
      isDisabled={isLoading}
      variant="bordered"
      className="h-12 min-h-12 w-full border-divider bg-content1 px-4 text-sm font-semibold text-foreground hover:bg-content2"
      onPress={() => handleAppleLogin({ setIsLoading, onOpenChange, context })}
      startContent={<Icon icon="logos:apple" className="h-5 w-5 shrink-0" />}
    >
      {t("continue_with_apple")}
    </Button>
  );
};

export default AppleLoginBtn;
