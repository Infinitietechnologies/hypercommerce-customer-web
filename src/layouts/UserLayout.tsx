import React, { FC, ReactNode, useState } from "react";
import { Avatar, Tabs, Tab } from "@heroui/react";
import {
  User,
  ShoppingCart,
  MapPin,
  CreditCard,
  Bookmark,
  Banknote,
  Gift,
  Bell,
} from "lucide-react";
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

/**
 * Account shell — new amber redesign. Sticky white nav rail with amber-tint
 * active rows on desktop (source: /redesign/account nav rail); a user card plus
 * an underlined tab strip on mobile. Routing, auth, avatar and i18n unchanged.
 */
const UserLayout: FC<UserLayoutProps> = ({ children, activeTab }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const { systemSettings } = useSettings();
  const userData = useSelector((state: RootState) => state.auth.user);

  const menuItems = [
    { label: t("userLayout.myAccount"), icon: User, href: "/my-account", key: "my-account" },
    { label: t("userLayout.myWishlists"), icon: Bookmark, href: "/my-account/wishlists", key: "wishlists" },
    { label: t("userLayout.myOrders"), icon: ShoppingCart, href: "/my-account/orders", key: "orders" },
    { label: t("userLayout.addresses"), icon: MapPin, href: "/my-account/addresses", key: "addresses" },
    { label: t("userLayout.wallet"), icon: CreditCard, href: "/my-account/wallet", key: "wallet" },
    { label: t("userLayout.transactions"), icon: Banknote, href: "/my-account/transactions", key: "transactions" },
    {
      label: t("userLayout.referAndEarn"),
      icon: Gift,
      href: "/my-account/refer-and-earn",
      key: "refer-and-earn",
      hidden: systemSettings?.referEarnStatus === false,
    },
    { label: t("userLayout.notifications", "Notifications"), icon: Bell, href: "/my-account/notifications", key: "notifications" },
  ].filter((item) => !item.hidden);

  const go = (href: string) => {
    if (router.asPath !== href) router.push(href);
  };

  const handleTabChange = (key: React.Key) => {
    const selected = menuItems.find((item) => item.key === key);
    if (selected) router.push(selected.href);
  };

  const avatarSrc = userData?.profile_image || staticProfileImage;

  const UserBlock = ({ size = "md" as "md" | "sm" }) => (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar
        src={avatarSrc}
        size={size}
        isBordered
        className="cursor-pointer shrink-0"
        onClick={() => setLightboxOpen(true)}
      />
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{userData?.name || ""}</div>
        <div className="text-xs text-default-500 truncate">
          {userData?.email || t("userLayout.online")}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-[260px] shrink-0">
        <div className="sticky top-24 rounded-large border border-divider bg-content1 p-2 shadow-sm">
          <div className="p-2.5">
            <UserBlock size="md" />
          </div>
          <div className="h-px bg-divider mx-1 my-1.5" />
          <nav className="flex flex-col gap-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeTab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-medium text-[13.5px] font-semibold text-start transition-colors ${
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-default-500 hover:bg-content2 hover:text-foreground"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile user card */}
      <div className="md:hidden rounded-large border border-divider bg-content1 shadow-sm p-4">
        <UserBlock size="md" />
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
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tab
                key={item.key}
                textValue={item.label}
                title={
                  <div className="flex flex-col items-center gap-1">
                    <Icon size={18} />
                    <span className="text-[10px] leading-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                }
              />
            );
          })}
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
