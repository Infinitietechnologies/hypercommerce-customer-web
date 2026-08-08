import React, { FC, useEffect, useState, useSyncExternalStore } from "react";
import { useDisclosure, Button } from "@/components/ui";
import Link from "next/link";
import { Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import LocationSelector from "./Location/LocationSelector";
import GlobalSearchbar from "./Functional/GlobalSearchbar";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/router";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { authSheetStore } from "@/stores/authSheetStore";
import { Heart, ShoppingCart, User, Package } from "lucide-react";
import { setCookie } from "@/lib/cookies";
import { onHomeCategoryChange } from "@/helpers/events";

const ProfileBtn = dynamic(() => import("./ProfileBtn"), { ssr: false });
const OfflineCartDrawer = dynamic(() => import("./Cart/OfflineCartDrawer"), {
  ssr: false,
});

const navItems = ["All", "Electronics", "Clothing", "Furniture", "Cosmetics", "Shoes"];

const HeaderAction = ({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <Link
    href={href ?? "#"}
    title={label}
    onClick={onClick}
    className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] opacity-90 transition hover:text-primary hover:opacity-100 min-[640px]:flex text-ink-foreground cursor-pointer"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export const Navbar: FC = () => {
  const { t } = useTranslation();
  const [showDemoWarning, setShowDemoWarning] = useState(true);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { webSettings, demoMode, systemSettings } = useSettings();
  const router = useRouter();
  const cartCount =
    useSelector((state: RootState) => state.cart.cartData?.items_count) || 0;

  const offLineCartCount =
    useSelector((state: RootState) => state.offlineCart.items)?.length || 0;

  const bagCount = isLoggedIn ? cartCount : offLineCartCount;

  const {
    isOpen: isOfflineCartOpen,
    onOpen: openOfflineCart,
    onClose: closeOfflineCart,
  } = useDisclosure();

  useEffect(() => {
    if (webSettings?.headerScript) {
      const temp = document.createElement("div");
      temp.innerHTML = webSettings.headerScript;

      Array.from(temp.querySelectorAll("script")).forEach((oldScript) => {
        const newScript = document.createElement("script");
        if (oldScript.src) {
          newScript.src = oldScript.src;
        }
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        document.head.appendChild(newScript);
      });
    }
  }, [webSettings?.headerScript]);

  useEffect(() => {
    if (isLoggedIn && isOfflineCartOpen) {
      closeOfflineCart();
    }
  }, [isLoggedIn, isOfflineCartOpen, closeOfflineCart]);

  const openCart = (event: React.MouseEvent) => {
    event.preventDefault();
    if (isLoggedIn) {
      router.push("/cart");
    } else {
      openOfflineCart();
    }
  };

  const {
    siteHeaderDarkLogo = "https://placehold.co/160x40?text=Logo",
    siteName = "Site Logo",
  } = webSettings || {};

  const SiteLogo = (
    <Link
      href="/"
      title={t("nav.home")}
      className="flex shrink-0 items-center"
      onClick={(event) => {
        event.preventDefault();
        router.push("/");
      }}
    >
      <Image
        loading="eager"
        disableSkeleton
        disableAnimation
        src={siteHeaderDarkLogo}
        alt={siteName}
        radius="none"
        className="object-contain"
        classNames={{
          img: "h-11 min-[640px]:h-10 min-[1024px]:h-11 w-auto max-w-[160px]",
          wrapper: "cursor-pointer",
        }}
      />
    </Link>
  );

  const AccountAction = mounted && isLoggedIn ? (
    <ProfileBtn />
  ) : (
    <button
      type="button"
      id="login-btn"
      aria-label={t("nav.account", "Account")}
      onClick={() => authSheetStore.open()}
      className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] opacity-90 transition hover:text-primary hover:opacity-100 min-[640px]:flex text-ink-foreground cursor-pointer"
    >
      <User className="h-5 w-5" />
      <span>{t("nav.account", "Account")}</span>
    </button>
  );

  const showAccountLinks = mounted && isLoggedIn;

  const WishlistAction = showAccountLinks ? (
    <HeaderAction
      icon={<Heart className="h-5 w-5" />}
      label={t("nav.wishlist", "Wishlist")}
      href="/my-account/wishlists"
    />
  ) : null;

  const OrdersAction = showAccountLinks ? (
    <HeaderAction
      icon={<Package className="h-5 w-5" />}
      label={t("nav.orders", "Orders")}
      href="/my-account/orders"
    />
  ) : null;

  const CartAction = (
    <button
      onClick={openCart}
      aria-label={t("nav.cart", "Cart")}
      className="relative flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] opacity-90 transition hover:text-primary hover:opacity-100 text-ink-foreground cursor-pointer"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden min-[640px]:block">{t("nav.cart", "Cart")}</span>
      {mounted && bagCount > 0 && (
        <span className="absolute -top-1 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {bagCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      {demoMode && showDemoWarning && (
        <div className="w-full relative flex items-center justify-center gap-2 border-b border-amber-200/70 bg-amber-50 px-10 py-2 text-amber-800">
          <Icon
            icon="solar:info-circle-bold"
            className="shrink-0 text-base text-amber-500"
          />
          <span className="text-center text-xs font-medium leading-snug sm:text-[13px]">
            {systemSettings?.customerDemoModeMessage
              ? systemSettings.customerDemoModeMessage
              : "Currently running in Demo Mode"}
          </span>
          <Button
            onPress={() => setShowDemoWarning(false)}
            aria-label="Close demo mode warning"
            isIconOnly
            size="sm"
            radius="full"
            variant="light"
            className="absolute right-2 top-1/2 h-6 w-6 min-w-6 -translate-y-1/2 text-amber-700"
          >
            <Icon icon="solar:close-circle-linear" className="text-base" />
          </Button>
        </div>
      )}

      {/* Mobile-only location selector row at the top (not sticky) */}
      <div className="w-full bg-ink px-4 py-2.5 min-[1024px]:hidden border-b border-white/5">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <LocationSelector variant="mobile" />
          </div>
          {showAccountLinks && (
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                router.push("/my-account/notifications");
              }}
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Icon icon="solar:bell-bing-linear" className="text-lg" />
            </button>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full">
          <div className="bg-ink text-ink-foreground">
            <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 min-[640px]:gap-6">
              {SiteLogo}

              <div className="flex min-w-0 items-center gap-3 flex-1">
                <LocationSelector />
                <GlobalSearchbar />
              </div>

              <nav className="flex shrink-0 items-center gap-1 min-[640px]:gap-3">
                {WishlistAction}
                {OrdersAction}
                {AccountAction}
                {CartAction}
              </nav>
            </div>
          </div>

          <div className="relative border-b border-zinc-100/60 bg-white/75 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
              {navItems.map((item) => {
                const currentCategory = (router.query.category as string) || "";
                const isAll = item === "All";
                const isActive = isAll ? !currentCategory : (currentCategory.toLowerCase() === item.toLowerCase());
                return (
                  <button
                    key={item}
                    onClick={async () => {
                      const slug = isAll ? "all" : item.toLowerCase();
                      setCookie("homeCategory", slug);
                      if (router.pathname === "/") {
                        await router.push(
                          { pathname: "/", query: isAll ? {} : { category: slug } },
                          undefined,
                          { shallow: true }
                        );
                        onHomeCategoryChange();
                      } else {
                        router.push(isAll ? "/" : `/?category=${slug}`);
                      }
                    }}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-zinc-950 font-bold"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {/* Right fade gradient indicator on mobile/tablet to signal horizontal scroll UX */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent min-[1024px]:hidden" />
        </div>
      </header>

      <OfflineCartDrawer
        isOpen={isOfflineCartOpen}
        onClose={closeOfflineCart}
      />
    </>
  );
};
