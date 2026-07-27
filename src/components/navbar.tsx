import React, { FC, useEffect, useState } from "react";
import { Link, Image, useDisclosure, Button, Badge } from "@/components/ui";
import { Icon } from "@iconify/react";
import LocationSelector from "./Location/LocationSelector";
import AnimatedIcon from "./Functional/AnimatedIcon";
import GlobalSearchbar from "./Functional/GlobalSearchbar";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/router";
import { useSettings } from "@/contexts/SettingsContext";
import CategoryTabs from "./Functional/CategoryTabs";
import { useTranslation } from "react-i18next";
import { authSheetStore } from "@/stores/authSheetStore";

const ProfileBtn = dynamic(() => import("./ProfileBtn"), { ssr: false });
const OfflineCartDrawer = dynamic(() => import("./Cart/OfflineCartDrawer"), {
  ssr: false,
});

/** Stacked glyph + label header action (sandbox `HeaderIconButton`). */
const HeaderAction = ({
  icon,
  label,
  href,
  onClick,
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <Link
    href={href ?? "#"}
    title={label}
    onClick={onClick}
    className="group flex flex-col items-center gap-0.5 text-foreground text-2xl"
  >
    <AnimatedIcon
      icon={icon}
      className="text-[23px] transition-colors group-hover:text-primary-600"
    />
    <span className="text-label font-medium group-hover:text-primary-600 transition-colors">
      {label}
    </span>
  </Link>
);

/**
 * Storefront header — new amber redesign, ported 1:1 from the `/redesign`
 * sandbox `FullHeader` (`src/redesign/components/Shell.tsx`).
 *
 *  • ≥1024px → desktop single row: logo · location · search · stacked
 *    Wishlist / Orders / Account / Cart.
 *  • <1024px → app-style two-row bar: location + Account / Cart on top,
 *    full-width search + Wishlist below.
 *
 * Cutover is 1024px (sandbox parity) via arbitrary `min-[1024px]:` variants,
 * NOT Tailwind's `lg` (1440). Matches the confirmed expected screenshots
 * (2026-07-27): no top-nav/menu button — Brands/FAQs/About live in the footer;
 * the language switch lives inside the Account menu (see ProfileBtn); the
 * account affordance is a stacked "Account" glyph in every auth state.
 *
 * Preserved behaviour: demo banner, dynamic white-label logo, offline-cart
 * drawer, cart badge, auth-aware account, category tabs on home.
 */
export const Navbar: FC = () => {
  const { t } = useTranslation();
  const [showDemoWarning, setShowDemoWarning] = useState(true);
  // Gate the client-only cart count so SSR and first client render match
  // (the count comes from redux and is 0/undefined on the server).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
  const {
    siteHeaderLogo = "https://placehold.co/160x40?text=Logo",
    siteName = "Site Logo",
  } = webSettings || {};

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

  const SiteLogo = (
    <Link
      href="/"
      title={t("nav.home")}
      onClick={(event) => {
        event.preventDefault();
        router.push("/");
      }}
    >
      <Image
        loading="eager"
        src={siteHeaderLogo}
        alt={siteName}
        radius="none"
        className="object-contain"
        classNames={{
          img: "h-12 sm:h-10 min-[1024px]:h-12 w-auto max-w-[160px]",
          wrapper: "cursor-pointer",
        }}
      />
    </Link>
  );

  /** Auth-aware account: profile dropdown when logged-in, login trigger else.
   *  Gated behind `mounted` so SSR and the first client render always show the
   *  same (logged-out) markup — ProfileBtn is client-only (ssr:false) and
   *  `isLoggedIn` comes from a client-rehydrated store, so rendering it during
   *  SSR would mismatch and break hydration for the whole layout. */
  const AccountAction = mounted && isLoggedIn ? (
    <ProfileBtn />
  ) : (
    <button
      type="button"
      id="login-btn"
      aria-label={t("nav.account", "Account")}
      onClick={() => authSheetStore.open()}
      className="group flex flex-col items-center gap-0.5 text-foreground cursor-pointer text-2xl"
    >
      <AnimatedIcon
        icon="solar:user-circle-linear"
        anim="float"
        className="text-[23px] transition-colors group-hover:text-primary-600"
      />
      <span className="text-label font-medium group-hover:text-primary-600 transition-colors">
        {t("nav.account", "Account")}
      </span>
    </button>
  );

  // Wishlist and Orders point at protected `/my-account/*` routes, so they only
  // make sense once signed in. Gated behind `mounted` for the same SSR-parity
  // reason as AccountAction.
  const showAccountLinks = mounted && isLoggedIn;

  const WishlistAction = showAccountLinks ? (
    <HeaderAction
      icon="solar:heart-linear"
      label={t("nav.wishlist", "Wishlist")}
      href="/my-account/wishlists"
    />
  ) : null;

  const OrdersAction = showAccountLinks ? (
    <HeaderAction
      icon="solar:box-linear"
      label={t("nav.orders", "Orders")}
      href="/my-account/orders"
    />
  ) : null;

  const CartAction = (
    <Badge
      color="primary"
      content={mounted ? bagCount || undefined : undefined}
      variant="solid"
      classNames={{ badge: "text-xs font-extrabold text-primary-foreground" }}
    >
      <HeaderAction
        icon="solar:cart-large-2-linear"
        label={t("nav.cart", "Cart")}
        href="#"
        onClick={openCart}
      />
    </Badge>
  );

  return (
    <>
      <div className="w-full flex flex-col items-start">
        {demoMode && showDemoWarning && (
          <div className="w-full bg-primary-100 text-primary-700 text-xs sm:text-sm px-3 py-1.5 flex items-center justify-center gap-2 relative">
            ℹ️
            <span className="font-semibold flex items-center gap-2">
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
              color="primary"
              variant="flat"
              className="min-w-1 w-6 h-6"
            >
              <Icon icon="solar:close-circle-linear" className="text-base" />
            </Button>
          </div>
        )}

        {/* ---------- desktop header (>= 1024px) ---------- */}
        <header className="hidden min-[1024px]:block w-full sticky top-0 z-40 bg-content1 border-b border-divider shadow-[0_2px_16px_-12px_rgba(28,26,23,0.15)]">
          <div className="w-full max-w-site mx-auto px-6 py-3.5 flex items-center gap-5">
            <div className="shrink-0">{SiteLogo}</div>

            <div className="shrink-0">
              <LocationSelector />
            </div>

            <div className="flex-1 min-w-0">
              <GlobalSearchbar />
            </div>

            <div className="flex items-center gap-6 shrink-0 ml-auto">
              {WishlistAction}
              {OrdersAction}
              {AccountAction}
              {CartAction}
            </div>
          </div>
        </header>

        {/* ---------- mobile / tablet header (< 1024px) ---------- */}
        <header className="min-[1024px]:hidden w-full sticky top-0 z-40 bg-content1 border-b border-divider">
          <div className="w-full max-w-site mx-auto px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <LocationSelector />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {AccountAction}
                {CartAction}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <GlobalSearchbar />
              </div>
              {WishlistAction}
            </div>
          </div>
        </header>

        {/* CategoryTabs on home — white strip attached under the header. */}
        {router.pathname === "/" && (
          <div className="w-full bg-content1 border-b border-divider">
            <div className="max-w-site mx-auto px-4 min-[1024px]:px-6">
              <CategoryTabs className="w-full" />
            </div>
          </div>
        )}
      </div>
      <OfflineCartDrawer
        isOpen={isOfflineCartOpen}
        onClose={closeOfflineCart}
      />
    </>
  );
};
