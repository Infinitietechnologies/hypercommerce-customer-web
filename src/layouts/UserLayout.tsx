import React, { FC, ReactNode } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { Tabs, Tab, useDisclosure } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useSettings } from "@/contexts/SettingsContext";

const LogoutModal = dynamic(() => import("@/components/Modals/LogoutModal"), {
  ssr: false,
});

interface UserLayoutProps {
  children: ReactNode;
  activeTab: string;
}

/**
 * Account shell — amber redesign. Sticky white nav rail with amber-tint active
 * rows on desktop (source: /redesign/account nav rail); an underlined tab strip
 * on mobile. Nav order and solar icons mirror the sandbox ACCOUNT_NAV. The user
 * identity lives on the Overview pane, so the rail is pure navigation.
 */
const UserLayout: FC<UserLayoutProps> = ({ children, activeTab }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { systemSettings } = useSettings();
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    isOpen: isLogoutOpen,
    onOpen: openLogout,
    onClose: closeLogout,
  } = useDisclosure();

  const menuItems = [
    { label: t("userLayout.myAccount"), icon: "solar:user-circle-linear", href: "/my-account", key: "my-account" },
    { label: t("userLayout.myOrders"), icon: "solar:box-linear", href: "/my-account/orders", key: "orders" },
    { label: t("userLayout.addresses"), icon: "solar:map-point-linear", href: "/my-account/addresses", key: "addresses" },
    { label: t("userLayout.myWishlists"), icon: "solar:heart-linear", href: "/my-account/wishlists", key: "wishlists" },
    { label: t("userLayout.wallet"), icon: "solar:wallet-linear", href: "/my-account/wallet", key: "wallet" },
    { label: t("userLayout.transactions"), icon: "solar:bill-list-linear", href: "/my-account/transactions", key: "transactions" },
    { label: t("userLayout.notifications", "Notifications"), icon: "solar:bell-linear", href: "/my-account/notifications", key: "notifications" },
    {
      label: t("userLayout.referAndEarn"),
      icon: "solar:gift-linear",
      href: "/my-account/refer-and-earn",
      key: "refer-and-earn",
      hidden: systemSettings?.referEarnStatus === false,
    },
  ].filter((item) => !item.hidden);

  const go = (href: string) => {
    if (router.asPath !== href) router.push(href);
  };

  const handleTabChange = (key: React.Key) => {
    const selected = menuItems.find((item) => item.key === key);
    if (selected) router.push(selected.href);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
      {/* Desktop nav rail */}
      <aside className="hidden shrink-0 pt-6 md:block md:w-[240px]">
        <nav className="sticky top-32 flex flex-col gap-0.5 rounded-large border border-divider bg-content1 p-2">
          {menuItems.map((item) => {
            const isActive = item.key === activeTab;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.href)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-medium text-[13.5px] font-semibold text-start transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-default-500 hover:bg-content2 hover:text-foreground"
                }`}
              >
                <Icon icon={item.icon} width={18} height={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Sign out — lives at the foot of the rail, danger-tinted so it
              reads as a destructive action distinct from the nav rows. */}
          <div className="my-1 h-px bg-divider" />
          <button
            type="button"
            onClick={openLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-medium text-[13.5px] font-semibold text-start text-danger transition-colors hover:bg-danger-50"
          >
            <Icon icon="solar:logout-2-linear" width={18} height={18} className="shrink-0" />
            <span className="truncate">{t("profileBtn.logout", "Log Out")}</span>
          </button>
        </nav>
      </aside>

      {/* Mobile navigation tabs — logout sits inline at the end of the strip */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 border-b border-divider">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "flex-1 min-w-0",
              tabList:
                "gap-2 w-full relative rounded-none p-0 overflow-x-auto",
              cursor: "w-full bg-primary",
              tab: "max-w-16 px-2 h-14 min-w-0 shrink-0",
              tabContent:
                "group-data-[selected=true]:text-primary-600 text-xs font-medium",
            }}
          >
            {menuItems.map((item) => (
              <Tab
                key={item.key}
                textValue={item.label}
                title={
                  <div className="flex flex-col items-center gap-1">
                    <Icon icon={item.icon} width={18} height={18} />
                    <span className="text-[10px] leading-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                }
              />
            ))}
          </Tabs>

          <button
            type="button"
            onClick={openLogout}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-medium border border-danger-200 bg-danger-50 px-2.5 py-1.5 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-100"
          >
            <Icon icon="solar:logout-2-linear" width={16} height={16} />
            <span className="hidden sm:inline">{t("profileBtn.logout", "Log Out")}</span>
          </button>
        </div>
      </div>

      {/* Main content — cascade the pane's sections in on each load */}
      <div key={router.pathname} className="rd-stagger flex-1 w-full min-w-0">
        {children}
      </div>

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={closeLogout}
        userName={user?.name}
        userEmail={user?.email}
        profileImg={user?.profile_image}
      />
    </div>
  );
};

export default UserLayout;
