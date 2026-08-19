import { useEffect } from "react";
import { Icon } from "@iconify/react";
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
      icon: "hugeicons:home-03",
      path: "/",
    },
    {
      id: "categories",
      label: t("categories"),
      icon: "hugeicons:package-02",
      path: "/categories",
    },
    {
      id: "cart",
      label: t("cart_title"),
      icon: "hugeicons:handbag",
      path: "/cart",
      protected: true,
    },
    {
      id: "profile",
      label: t("profile"),
      icon: "hugeicons:user",
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

  return (
    <>
      <div aria-hidden="true" className="h-20 min-[1024px]:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-50 min-[1024px]:hidden">
        <div className="shadow-[0_-2px_16px_-12px_rgba(28,26,23,0.25)] bg-content1 border-t border-divider">
          <div className="max-w-md mx-auto">
            <nav
              aria-label={t("nav.mobileNavigation")}
              className="flex items-center justify-around gap-2 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
                    <Icon icon={item.icon} className="mb-1 text-2xl" />
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
          </div>
        </div>
        <OfflineCartDrawer
          isOpen={isOfflineCartOpen}
          onClose={closeOfflineCart}
        />
      </div>
    </>
  );
};

export default BottomNavigation;
