import React, { FC, useEffect, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  Link,
  Image,
  Sheet,
  useDisclosure,
  Button,
} from "@/components/ui";
import { Icon } from "@iconify/react";
import LocationSelector from "./Location/LocationSelector";
import AnimatedIcon from "./Functional/AnimatedIcon";
import { ThemeSwitch } from "./theme-switch";
import GlobalSearchbar from "./Functional/GlobalSearchbar";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/router";
import { useSettings } from "@/contexts/SettingsContext";
import CategoryTabs from "./Functional/CategoryTabs";
import LanguageSwitcher from "./Functional/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const FallbackCartIcon = () => (
  <Link href="/cart">
    <Icon icon="solar:bag-3-linear" className="text-2xl cursor-pointer" />
  </Link>
);

const Badge = dynamic(() => import("@heroui/react").then((mod) => mod.Badge), {
  ssr: false,
  loading: () => <FallbackCartIcon />,
});

const ProfileBtn = dynamic(() => import("./ProfileBtn"), { ssr: false });
const LoginTrigger = dynamic(
  () => import("@/features/auth/components/LoginTrigger"),
  { ssr: false },
);
const OfflineCartDrawer = dynamic(() => import("./Cart/OfflineCartDrawer"), {
  ssr: false,
});

/**
 * Storefront header — amber redesign (Claude Design handoff
 * `src/components/Header.jsx`).
 *
 *  • lg and up → full desktop navbar (brand · location · search · actions),
 *    all sharing the `max-w-site` width so nothing drifts out of alignment.
 *  • below lg  → compact app-style header: location row + wishlist/bag on top,
 *    full-width search below — the same shape as the native app.
 *
 * All existing behaviour is preserved: demo banner, dynamic site logos,
 * offline-cart drawer, language/theme switches, category tabs.
 */
export const Navbar: FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoWarning, setShowDemoWarning] = useState(true);
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
    siteHeaderDarkLogo = "https://placehold.co/160x40?text=Logo",
    siteName = "Site Logo",
  } = webSettings || {};

  useEffect(() => {
    if (webSettings?.headerScript) {
      const temp = document.createElement("div");
      temp.innerHTML = webSettings.headerScript;

      // Append each <script> dynamically
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

  // Menu items with translation keys
  const navMenuItems = [
    { label: t("nav.home"), href: "/", icon: "solar:home-2-linear" },
    { label: t("nav.brands"), href: "/brands", icon: "solar:tag-linear" },
    { label: t("nav.faqs"), href: "/faqs", icon: "solar:question-circle-linear" },
    { label: t("nav.about_us"), href: "/about-us", icon: "solar:info-circle-linear" },
  ];

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
      {/* Light theme logo */}
      <Image
        loading="eager"
        src={siteHeaderLogo}
        alt={siteName}
        radius="none"
        className="object-contain dark:hidden"
        classNames={{
          img: "h-8 sm:h-10 md:h-12 w-full sm:min-w-5 md:min-w-32",
          wrapper: "cursor-pointer",
        }}
      />
      {/* Dark theme logo */}
      <Image
        loading="eager"
        src={siteHeaderDarkLogo}
        alt={siteName}
        radius="none"
        className="object-contain hidden dark:block"
        classNames={{
          img: "h-8 sm:h-10 md:h-12 w-full sm:min-w-5 md:min-w-32",
          wrapper: "cursor-pointer",
        }}
      />
    </Link>
  );

  return (
    <>
      <div className="w-full flex flex-col items-start">
        {demoMode && showDemoWarning && (
          <div className="w-full bg-primary-100 dark:bg-content2 text-primary-700 dark:text-primary-600 text-xs sm:text-sm px-3 py-1.5 flex items-center justify-center gap-2 relative">
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

        {/* ---------- desktop header ---------- */}
        <div className="hidden lg:block w-full">
          <HeroUINavbar
            maxWidth="full"
            height="4.5rem"
            position="sticky"
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
            classNames={{
              base: "bg-content1 border-b border-divider shadow-none",
              wrapper: "w-full max-w-site mx-auto px-6 gap-6",
            }}
          >
            <NavbarBrand className="grow-0 gap-2.5">{SiteLogo}</NavbarBrand>

            <div className="shrink-0">
              <LocationSelector />
            </div>

            <NavbarContent className="flex-1" justify="center">
              <div className="w-full">
                <GlobalSearchbar />
              </div>
            </NavbarContent>

            <NavbarContent justify="end" className="gap-4 grow-0">
              <NavbarItem>
                <LanguageSwitcher />
              </NavbarItem>
              <NavbarItem>
                <ThemeSwitch />
              </NavbarItem>
              <NavbarItem>
                <Link
                  href="/my-account/wishlists"
                  title={t("pageTitle.wishlists")}
                  className="group flex flex-col items-center gap-0.5 text-foreground"
                >
                  <AnimatedIcon
                    icon="solar:heart-linear"
                    anim="beat"
                    className="text-2xl transition-colors group-hover:text-primary-600"
                  />
                  <span className="text-[11px] font-semibold">
                    {t("pageTitle.wishlists")}
                  </span>
                </Link>
              </NavbarItem>
              <NavbarItem>
                <Badge
                  color="primary"
                  content={bagCount || undefined}
                  variant="solid"
                  classNames={{ badge: "text-xs font-extrabold" }}
                >
                  <Link
                    title={t("cart_title")}
                    href="#"
                    onClick={openCart}
                    className="group flex flex-col items-center gap-0.5 text-foreground"
                  >
                    <AnimatedIcon
                      icon="solar:bag-3-linear"
                      anim="sway"
                      className="text-2xl transition-colors group-hover:text-primary-600"
                    />
                    <span className="text-[11px] font-semibold">
                      {t("cart_title")}
                    </span>
                  </Link>
                </Badge>
              </NavbarItem>
              <NavbarItem>
                {isLoggedIn ? <ProfileBtn /> : <LoginTrigger />}
              </NavbarItem>
            </NavbarContent>
          </HeroUINavbar>
        </div>

        {/* ---------- mobile / tablet header ---------- */}
        <header className="lg:hidden w-full sticky top-0 z-40 bg-content1 border-b border-divider">
          <div className="flex items-center justify-between px-4 py-2.5 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                aria-label={
                  isMenuOpen ? t("aria.close_menu") : t("aria.open_menu")
                }
                onClick={() => setIsMenuOpen(true)}
                className="grid place-items-center w-9 h-9 -ml-1 rounded-lg hover:bg-content2 transition-colors"
              >
                <Icon icon="solar:hamburger-menu-linear" className="text-2xl" />
              </button>
              <div className="min-w-0">{SiteLogo}</div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/my-account/wishlists"
                aria-label={t("pageTitle.wishlists")}
                className="group grid place-items-center text-foreground"
              >
                <AnimatedIcon
                  icon="solar:heart-linear"
                  anim="beat"
                  className="text-2xl"
                />
              </Link>
              <Badge
                color="primary"
                content={bagCount || undefined}
                variant="solid"
                classNames={{ badge: "text-xs font-extrabold" }}
              >
                <Link
                  href="#"
                  aria-label={t("cart_title")}
                  onClick={openCart}
                  className="group grid place-items-center text-foreground"
                >
                  <AnimatedIcon
                    icon="solar:bag-3-linear"
                    anim="sway"
                    className="text-2xl"
                  />
                </Link>
              </Badge>
              {isLoggedIn ? <ProfileBtn /> : <LoginTrigger view="icon" />}
            </div>
          </div>

          {/* location row + full-width search, app-style */}
          <div className="px-4 pb-2.5 flex flex-col gap-2">
            <LocationSelector />
            <GlobalSearchbar />
          </div>
        </header>

        {/* Mobile menu — bottom sheet on phones, centred modal from tablet up */}
        <Sheet
          isOpen={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          title={t("nav.menu")}
        >
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center gap-4 pb-4 border-b border-divider">
              <LanguageSwitcher />
              <ThemeSwitch variant="switch" />
            </div>
            {navMenuItems.map((item) => (
              <Link
                key={item.href}
                color="foreground"
                href={item.href}
                size="lg"
                className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-content2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon icon={item.icon} className="text-xl text-default-500" />
                <span className="font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>
        </Sheet>

        {/* CategoryTabs */}
        {router.pathname === "/" && (
          <div className="w-full max-w-site mx-auto px-6">
            <CategoryTabs className="w-full" />
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
