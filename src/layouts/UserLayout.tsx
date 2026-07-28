import React, { FC, ReactNode, useState } from "react";
import { Icon } from "@iconify/react";
import { Avatar, Tabs, Tab } from "@/components/ui";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { staticProfileImage } from "@/config/constants";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import Lightbox from "yet-another-react-lightbox";
import { useSettings } from "@/contexts/SettingsContext";

interface UserLayoutProps {
  children: ReactNode;
  activeTab: string;
}

interface UserBlockProps {
  avatarSrc: string;
  name: string;
  subtitle: string;
  size?: "md" | "sm";
  onAvatarClick: () => void;
}

const UserBlock: FC<UserBlockProps> = ({
  avatarSrc,
  name,
  subtitle,
  size = "md",
  onAvatarClick,
}) => (
  <div className="flex items-center gap-3 min-w-0">
    <Avatar
      src={avatarSrc}
      size={size}
      isBordered
      className="cursor-pointer shrink-0"
      onClick={onAvatarClick}
    />
    <div className="min-w-0">
      <div className="text-sm font-bold truncate">{name}</div>
      <div className="text-xs text-default-500 truncate">{subtitle}</div>
    </div>
  </div>
);

/**
 * Account shell — amber redesign. Sticky white nav rail with amber-tint active
 * rows on desktop (source: /redesign/account nav rail); a user card plus an
 * underlined tab strip on mobile. Nav order and solar icons mirror the sandbox
 * ACCOUNT_NAV. Routing, auth, avatar and i18n unchanged.
 */
const UserLayout: FC<UserLayoutProps> = ({ children, activeTab }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const { systemSettings } = useSettings();
  const userData = useSelector((state: RootState) => state.auth.user);

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

  const avatarSrc = userData?.profile_image || staticProfileImage;
  const userName = userData?.name || "";
  const userSubtitle = userData?.email || t("userLayout.online");

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-[240px] shrink-0">
        <div className="sticky top-24 rounded-large border border-divider bg-content1 p-2 shadow-sm">
          <div className="p-2.5">
            <UserBlock
              avatarSrc={avatarSrc}
              name={userName}
              subtitle={userSubtitle}
              size="md"
              onAvatarClick={() => setLightboxOpen(true)}
            />
          </div>
          <div className="h-px bg-divider mx-1 my-1.5" />
          <nav className="flex flex-col gap-0.5">
            {menuItems.map((item) => {
              const isActive = item.key === activeTab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-medium text-[13.5px] font-semibold text-start transition-colors ${
                    isActive
                      ? "bg-primary-100 text-primary-600"
                      : "text-default-500 hover:bg-content2 hover:text-foreground"
                  }`}
                >
                  <Icon icon={item.icon} width={18} height={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile user card */}
      <div className="md:hidden rounded-large border border-divider bg-content1 shadow-sm p-4">
        <UserBlock
          avatarSrc={avatarSrc}
          name={userName}
          subtitle={userSubtitle}
          size="md"
          onAvatarClick={() => setLightboxOpen(true)}
        />
      </div>

      {/* Mobile navigation tabs */}
      <div className="md:hidden">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList:
              "gap-2 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
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
      </div>

      {/* Main content */}
      <div className="flex-1 w-full min-w-0">{children}</div>

      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: avatarSrc }]}
        />
      )}
    </div>
  );
};

export default UserLayout;
