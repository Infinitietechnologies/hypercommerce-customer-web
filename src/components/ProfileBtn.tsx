import { Link } from "@/components/ui";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import AnimatedIcon from "./Functional/AnimatedIcon";

/**
 * Header account affordance — new amber redesign. A stacked glyph + "Account"
 * label (matching Wishlist / Orders / Cart) that navigates straight to the
 * account hub on click, rather than opening a dropdown (decision 2026-07-27).
 */
const ProfileBtn: FC = () => {
  const { t } = useTranslation();

  return (
    <Link
      href="/my-account"
      title={t("nav.account", "Account")}
      className="group flex flex-col items-center gap-0.5 text-foreground text-2xl"
    >
      <AnimatedIcon
        icon="solar:user-circle-linear"
        anim="float"
        className="text-[23px] transition-colors group-hover:text-primary-600"
      />
      <span className="text-[11px] font-medium group-hover:text-primary-600 transition-colors">
        {t("nav.account", "Account")}
      </span>
    </Link>
  );
};

export default ProfileBtn;
