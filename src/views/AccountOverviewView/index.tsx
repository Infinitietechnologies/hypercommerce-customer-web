import type { FC } from "react";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { userData } from "@/types/ApiResponse";

interface AccountOverviewViewProps {
  user: userData | null;
}

interface QuickLink {
  key: string;
  href: string;
  icon: string;
  label: string;
  hidden?: boolean;
}

/**
 * Account overview — amber redesign. User card plus a quick-links grid, matching
 * the `/redesign/account?tab=overview` pane. Profile editing lives at
 * `/my-account/profile`, reached from the "Edit profile" action here.
 */
const AccountOverviewView: FC<AccountOverviewViewProps> = ({ user }) => {
  const { t } = useTranslation();
  const { systemSettings } = useSettings();

  const name = user?.name || "";
  const email = user?.email || "";
  const avatar = user?.profile_image || "";

  const quickLinks: QuickLink[] = [
    { key: "orders", href: "/my-account/orders", icon: "solar:box-linear", label: t("userLayout.myOrders") },
    { key: "addresses", href: "/my-account/addresses", icon: "solar:map-point-linear", label: t("userLayout.addresses") },
    { key: "wallet", href: "/my-account/wallet", icon: "solar:wallet-linear", label: t("userLayout.wallet") },
    { key: "wishlists", href: "/my-account/wishlists", icon: "solar:heart-linear", label: t("userLayout.myWishlists") },
    { key: "shoppingList", href: "/shopping-list", icon: "solar:checklist-linear", label: t("shoppingList") },
    {
      key: "refer",
      href: "/my-account/refer-and-earn",
      icon: "solar:gift-linear",
      label: t("userLayout.referAndEarn"),
      hidden: systemSettings?.referEarnStatus === false,
    },
  ].filter((q) => !q.hidden);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* User card */}
      <div className="flex items-center gap-4 rounded-large border border-divider bg-content1 p-5">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-primary-50 flex items-center justify-center">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name || "avatar"} className="h-full w-full object-cover" />
          ) : (
            <Icon icon="solar:user-bold" width={26} height={26} className="text-primary-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold truncate">{name}</div>
          <div className="text-[13px] text-default-500 truncate">{email}</div>
        </div>
        <Button
          as={Link}
          href="/my-account/profile"
          variant="light"
          size="sm"
          color="primary"
          className="shrink-0 text-xs font-semibold"
          startContent={<Icon icon="solar:pen-linear" width={16} height={16} />}
        >
          {t("pages.myAccount.editProfile", "Edit profile")}
        </Button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {quickLinks.map((q) => (
          <Link
            key={q.key}
            href={q.href}
            className="group flex items-center gap-2.5 rounded-medium border border-divider bg-content1 p-4 transition-all hover:border-primary hover:shadow-sm"
          >
            <Icon icon={q.icon} width={20} height={20} className="text-primary-600 shrink-0" />
            <span className="text-[13.5px] font-semibold truncate">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AccountOverviewView;
