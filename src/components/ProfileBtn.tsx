import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";

/**
 * Header account affordance — styled to match the new dark header actions.
 */
interface ProfileBtnProps {
  showLabel?: boolean;
}

const ProfileBtn: FC<ProfileBtnProps> = ({ showLabel = true }) => {
  const { t } = useTranslation();

  return (
    <Link
      href="/my-account"
      title={t("nav.account", "Account")}
      className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-current opacity-90 transition hover:text-primary hover:opacity-100 min-[640px]:flex"
    >
      <User className="h-5 w-5" />
      {showLabel ? <span>{t("nav.account", "Account")}</span> : null}
    </Link>
  );
};

export default ProfileBtn;
