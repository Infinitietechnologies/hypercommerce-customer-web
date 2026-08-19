import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { HandbagIcon, Home03Icon } from "@hugeicons/core-free-icons";
import { Package, User } from "lucide-react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { toast, useDisclosure } from "@/components/ui";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";

const OfflineCartDrawer = dynamic(() => import("../Cart/OfflineCartDrawer"), {
  ssr: false,
});

const BottomNavigation = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isSingleVendor } = useSettings();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const cartCount =
    useSelector((state: RootState) => state.cart.cartData?.items_count) ||
    undefined;

  const offLineCartCount =
    useSelector((state: RootState) => state.offlineCart.items)?.length || 0;

  const {
    isOpen: isOfflineCartOpen,
    onOpen: openOfflineCart,
    onClose: closeOfflineCart,
  } = useDisclosure();

  useEffect(() => {
    if (isLoggedIn && isOfflineCartOpen) {
      closeOfflineCart();
    }
  }, [isLoggedIn, isOfflineCartOpen, closeOfflineCart]);

  const navItems = [
    {
      id: "home",
      label: t("home_title"),
      path: "/",
    },
    {
      id: "categories",
      label: t("categories"),
      path: "/categories",
    },
    {
      id: "cart",
      label: t("cart_title"),
      path: "/cart",
      protected: true,
    },
    {
      id: "profile",
      label: t("profile"),
      path: "/my-account",
      protected: true,
    },
  ].filter((item) => !(isSingleVendor && item.id === "stores"));

  const handleTabClick = (
    itemId: string,
    path?: string,
    protectedTab?: boolean,
  ) => {
    if (itemId === "cart" && !isLoggedIn) {
      openOfflineCart();
      return;
    }
    if (protectedTab && !isLoggedIn) {
      document.getElementById("login-btn")?.click();
      toast({ title: t("cart.login_required"), color: "warning" });
      return;
    }
    if (path) router.push(path);
  };

  const renderIcon = (itemId: string, isActive: boolean) => {
    if (itemId === "home") {
      return (
        <HugeiconsIcon
          icon={Home03Icon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
          fill={isActive ? "currentColor" : "none"}
          className="mb-1"
        />
      );
    }

    if (itemId === "cart") {
      return (
        <HugeiconsIcon
          icon={HandbagIcon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
          fill={isActive ? "currentColor" : "none"}
          className="mb-1"
        />
      );
    }

    const NavIcon = itemId === "categories" ? Package : User;
    return (
      <NavIcon
        aria-hidden="true"
        size={24}
        strokeWidth={isActive ? 2 : 1.5}
        className="mb-1"
      />
    );
  };

  return (
    <>
      <div aria-hidden="true" className="h-20 min-[1024px]:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-divider bg-content1 min-[1024px]:hidden">
        <nav
          aria-label={t("nav.mobileNavigation")}
          className="flex w-full items-center justify-around gap-2 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? router.pathname === "/"
                : router.pathname.startsWith(item.path);
            return (
              <button
                type="button"
                key={item.id}
                aria-current={isActive ? "page" : undefined}
                onClick={() =>
                  handleTabClick(item.id, item.path, item.protected)
                }
                className={`relative flex min-w-0 flex-1 flex-col items-center justify-center px-3 py-1 transition-colors duration-200 ${
                  isActive
                    ? "text-foreground"
                    : "text-default-500 hover:text-foreground"
                }`}
              >
                {renderIcon(item.id, isActive)}
                {item.id === "cart" &&
                (isLoggedIn ? cartCount : offLineCartCount) ? (
                  <span className="absolute top-0 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                    {isLoggedIn ? cartCount : offLineCartCount}
                  </span>
                ) : null}
                <span
                  className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <OfflineCartDrawer
          isOpen={isOfflineCartOpen}
          onClose={closeOfflineCart}
        />
      </div>
    </>
  );
};

export default BottomNavigation;
