import { useEffect, useRef, useState } from "react";
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

const TOP_VISIBLE_OFFSET = 24;
const SCROLL_HIDE_THRESHOLD = 10;
const SCROLL_REVEAL_THRESHOLD = 48;
const SCROLL_REVEAL_DELAY = 350;

const BottomNavigation = () => {
  const [isVisible, setIsVisible] = useState(true);
  const isVisibleRef = useRef(true);
  const scrollAnchorY = useRef(0);
  const lastHiddenAt = useRef(0);
  const scrollFrame = useRef<number | null>(null);
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

  useEffect(() => {
    scrollAnchorY.current = Math.max(0, window.scrollY);
    isVisibleRef.current = true;
    lastHiddenAt.current = 0;
    const frame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => window.cancelAnimationFrame(frame);
  }, [router.asPath]);

  useEffect(() => {
    scrollAnchorY.current = Math.max(0, window.scrollY);

    const updateVisibility = () => {
      if (scrollFrame.current !== null) return;

      scrollFrame.current = window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(0, window.scrollY);
        const setNavigationVisible = (nextVisible: boolean) => {
          if (isVisibleRef.current === nextVisible) return;
          isVisibleRef.current = nextVisible;
          if (!nextVisible) {
            lastHiddenAt.current = performance.now();
          }
          setIsVisible(nextVisible);
        };

        if (currentScrollY <= TOP_VISIBLE_OFFSET) {
          setNavigationVisible(true);
          scrollAnchorY.current = currentScrollY;
        } else if (isVisibleRef.current) {
          if (currentScrollY < scrollAnchorY.current) {
            scrollAnchorY.current = currentScrollY;
          } else if (
            currentScrollY - scrollAnchorY.current >=
            SCROLL_HIDE_THRESHOLD
          ) {
            setNavigationVisible(false);
            scrollAnchorY.current = currentScrollY;
          }
        } else {
          if (currentScrollY > scrollAnchorY.current) {
            scrollAnchorY.current = currentScrollY;
          } else if (
            scrollAnchorY.current - currentScrollY >= SCROLL_REVEAL_THRESHOLD &&
            performance.now() - lastHiddenAt.current >= SCROLL_REVEAL_DELAY
          ) {
            setNavigationVisible(true);
            scrollAnchorY.current = currentScrollY;
          }
        }

        scrollFrame.current = null;
      });
    };

    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      if (scrollFrame.current !== null) {
        window.cancelAnimationFrame(scrollFrame.current);
      }
    };
  }, []);

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
      label: t("bag_title"),
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
          strokeWidth={isActive ? 2 : 1.5}
          fill={isActive ? "currentColor" : "none"}
          fillOpacity={isActive ? 0.16 : 0}
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
          strokeWidth={isActive ? 2 : 1.5}
          fill="none"
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
      <div
        className={`fixed inset-x-0 bottom-0 z-50 w-full border-t border-divider bg-content1 transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none min-[1024px]:hidden ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <nav
          aria-label={t("nav.mobileNavigation")}
          className="flex w-full items-center justify-around gap-2 px-1 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]"
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
