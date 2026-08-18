import React, {
  CSSProperties,
  FC,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Button, Image, useDisclosure } from "@/components/ui";
import Link from "next/link";
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
import useSWR from "swr";
import { getHomeCategories } from "@/services/catalog";
import { STALE_TIME } from "@/hooks/useInfiniteData";
import { resolveHeaderSettings } from "@/config/header";

const ProfileBtn = dynamic(() => import("./ProfileBtn"), { ssr: false });
const LanguageSwitcher = dynamic(
  () => import("./Functional/LanguageSwitcher"),
  { ssr: false },
);
const OfflineCartDrawer = dynamic(() => import("./Cart/OfflineCartDrawer"), {
  ssr: false,
});

const HeaderAction = ({
  icon,
  label,
  href,
  onClick,
  showLabel,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  showLabel: boolean;
}) => (
  <Link
    href={href ?? "#"}
    title={label}
    onClick={onClick}
    className="hidden cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-current opacity-90 transition hover:text-primary hover:opacity-100 min-[640px]:flex"
  >
    {icon}
    {showLabel ? <span>{label}</span> : null}
  </Link>
);

export const Navbar: FC = () => {
  const { t } = useTranslation();
  const [showDemoWarning, setShowDemoWarning] = useState(true);
  const [showHeaderAnnouncement, setShowHeaderAnnouncement] = useState(true);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const {
    webSettings,
    demoMode,
    systemSettings,
    homeGeneralSettings,
    headerSettings,
  } = useSettings();
  const header = useMemo(
    () => resolveHeaderSettings(headerSettings),
    [headerSettings],
  );
  const router = useRouter();
  const cartCount =
    useSelector((state: RootState) => state.cart.cartData?.items_count) || 0;

  const offLineCartCount =
    useSelector((state: RootState) => state.offlineCart.items)?.length || 0;

  const bagCount = isLoggedIn ? cartCount : offLineCartCount;

  // The strip must carry real category slugs: `/home-layout` silently falls
  // back to the global layout for a slug it can't resolve.
  const { data: navCategoriesRes } = useSWR(
    header.enabled &&
      header.showCategoryNavigation &&
      (header.navigationScope === "all" || router.pathname === "/") &&
      header.navigationSource === "categories"
      ? `home-nav-categories:${header.categoryLimit}`
      : null,
    () =>
      getHomeCategories({
        page: 1,
        per_page: header.categoryLimit,
      }),
    { revalidateOnFocus: false, dedupingInterval: STALE_TIME.reference },
  );
  const navCategories = navCategoriesRes?.data?.data ?? [];
  const selectedCategorySlug =
    typeof router.query.category === "string" ? router.query.category : "";
  const selectedHeaderCategory = navCategories.find(
    (category) => category.slug === selectedCategorySlug,
  );
  const categoryDesktopAppearance =
    selectedHeaderCategory?.home_appearance.desktop;
  const usesCategoryAppearance = Boolean(categoryDesktopAppearance);
  const effectiveBackgroundType = usesCategoryAppearance
    ? categoryDesktopAppearance?.background_type
    : header.backgroundType;
  const effectiveBackgroundImage = usesCategoryAppearance
    ? selectedHeaderCategory?.banner || null
    : header.backgroundImage;
  const containerClass =
    header.containerWidth === "full"
      ? "max-w-none"
      : header.containerWidth === "wide"
        ? "max-w-screen-2xl"
        : "max-w-site";
  const densityClass = header.density === "compact" ? "py-2" : "py-3";
  const surfaceToneClass =
    header.contentTone === "light"
      ? "bg-ink text-ink-foreground"
      : "bg-content1 text-foreground";
  const gradientDirection = {
    "to-right": "to right",
    "to-left": "to left",
    "to-bottom": "to bottom",
    "to-bottom-right": "to bottom right",
  }[header.gradientDirection];
  const categoryGradientAngle = Number(
    categoryDesktopAppearance?.gradient_angle ?? 90,
  );
  const surfaceStyle: CSSProperties = usesCategoryAppearance
    ? {
        ...(effectiveBackgroundType === "color" &&
        categoryDesktopAppearance?.gradient_start
          ? { backgroundColor: categoryDesktopAppearance.gradient_start }
          : {}),
        ...(effectiveBackgroundType === "gradient" &&
        categoryDesktopAppearance?.gradient_start &&
        categoryDesktopAppearance.gradient_end
          ? {
              backgroundImage: `linear-gradient(${Number.isFinite(categoryGradientAngle) ? categoryGradientAngle : 90}deg, ${categoryDesktopAppearance.gradient_start}, ${categoryDesktopAppearance.gradient_end})`,
            }
          : {}),
        ...(categoryDesktopAppearance?.font_color
          ? { color: categoryDesktopAppearance.font_color }
          : {}),
      }
    : {
        ...(header.backgroundType === "color" && header.backgroundColor
          ? { backgroundColor: header.backgroundColor }
          : {}),
        ...(header.backgroundType === "gradient" &&
        header.gradientFrom &&
        header.gradientTo
          ? {
              backgroundImage: `linear-gradient(${gradientDirection}, ${header.gradientFrom}, ${header.gradientTo})`,
            }
          : {}),
        ...(header.textColor ? { color: header.textColor } : {}),
      };
  const desktopBackgroundStyle: CSSProperties | undefined =
    effectiveBackgroundType === "image" && effectiveBackgroundImage
      ? {
          backgroundImage: `url(${JSON.stringify(effectiveBackgroundImage)})`,
          backgroundPosition: header.backgroundPosition,
          backgroundSize:
            header.backgroundFit === "fill" ? "100% 100%" : "cover",
        }
      : undefined;
  const mobileBackgroundUrl = usesCategoryAppearance
    ? effectiveBackgroundImage
    : (header.mobileBackgroundImage ?? header.backgroundImage);
  const mobileBackgroundStyle: CSSProperties | undefined =
    effectiveBackgroundType === "image" && mobileBackgroundUrl
      ? {
          backgroundImage: `url(${JSON.stringify(mobileBackgroundUrl)})`,
          backgroundPosition: header.backgroundPosition,
          backgroundSize:
            header.backgroundFit === "fill" ? "100% 100%" : "cover",
        }
      : undefined;
  const overlayStyle: CSSProperties = {
    ...(header.overlayColor ? { backgroundColor: header.overlayColor } : {}),
    opacity: header.overlayOpacity,
  };

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

  useEffect(() => {
    if (!header.sticky || header.navigationScrollBehavior === "keep") {
      return;
    }

    const updateScrolledState = () => {
      setIsHeaderScrolled((current) => {
        const openThreshold = Math.max(
          0,
          header.navigationScrollThreshold - 24,
        );
        return current
          ? window.scrollY > openThreshold
          : window.scrollY > header.navigationScrollThreshold;
      });
    };

    const frame = window.requestAnimationFrame(updateScrolledState);
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrolledState);
    };
  }, [
    header.navigationScrollBehavior,
    header.navigationScrollThreshold,
    header.sticky,
  ]);

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
  const desktopLogo = header.logoUrl ?? siteHeaderDarkLogo;
  const mobileLogo = header.mobileLogoUrl ?? desktopLogo;
  const logoHeightClass =
    header.density === "compact"
      ? "h-8"
      : header.layout === "showcase"
        ? "h-10 min-[1024px]:h-12"
        : "h-10 min-[1024px]:h-11";

  const SiteLogo = (
    <Link
      href="/"
      title={t("nav.home")}
      className="flex shrink-0 items-center"
      style={{ maxWidth: header.logoMaxWidth }}
      onClick={(event) => {
        event.preventDefault();
        router.push("/");
      }}
    >
      {mobileLogo !== desktopLogo ? (
        <>
          <span className="min-[640px]:hidden">
            <Image
              removeWrapper
              loading="eager"
              disableSkeleton
              disableAnimation
              src={mobileLogo}
              alt={siteName}
              radius="none"
              className={`${logoHeightClass} w-auto max-w-full object-contain`}
            />
          </span>
          <span className="hidden min-[640px]:block">
            <Image
              removeWrapper
              loading="eager"
              disableSkeleton
              disableAnimation
              src={desktopLogo}
              alt={siteName}
              radius="none"
              className={`${logoHeightClass} w-auto max-w-full object-contain`}
            />
          </span>
        </>
      ) : (
        <Image
          removeWrapper
          loading="eager"
          disableSkeleton
          disableAnimation
          src={desktopLogo}
          alt={siteName}
          radius="none"
          className={`${logoHeightClass} w-auto max-w-full object-contain`}
        />
      )}
    </Link>
  );

  const AccountAction =
    mounted && isLoggedIn ? (
      <ProfileBtn showLabel={header.showActionLabels} />
    ) : (
      <button
        type="button"
        id="login-btn"
        aria-label={t("nav.account", "Account")}
        onClick={() => authSheetStore.open()}
        className="hidden cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-current opacity-90 transition hover:text-primary hover:opacity-100 min-[640px]:flex"
      >
        <User className="h-5 w-5" />
        {header.showActionLabels ? (
          <span>{t("nav.account", "Account")}</span>
        ) : null}
      </button>
    );

  const showAccountLinks = mounted && isLoggedIn;

  const MobileAccountAction = (
    <button
      type="button"
      aria-label={t("nav.account", "Account")}
      onClick={() => {
        if (showAccountLinks) {
          router.push("/my-account");
        } else {
          authSheetStore.open();
        }
      }}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-current opacity-90 transition-colors hover:bg-content1/60 hover:opacity-100"
    >
      <User className="h-5 w-5" />
    </button>
  );

  const WishlistAction = showAccountLinks ? (
    <HeaderAction
      icon={<Heart className="h-5 w-5" />}
      label={t("nav.wishlist", "Wishlist")}
      href="/my-account/wishlists"
      showLabel={header.showActionLabels}
    />
  ) : null;

  const OrdersAction = showAccountLinks ? (
    <HeaderAction
      icon={<Package className="h-5 w-5" />}
      label={t("nav.orders", "Orders")}
      href="/my-account/orders"
      showLabel={header.showActionLabels}
    />
  ) : null;

  const CartAction = (
    <button
      onClick={openCart}
      aria-label={t("nav.cart", "Cart")}
      className="relative flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-current opacity-90 transition hover:text-primary hover:opacity-100"
    >
      <ShoppingCart className="h-5 w-5" />
      {header.showActionLabels ? (
        <span className="hidden min-[640px]:block">
          {t("nav.cart", "Cart")}
        </span>
      ) : null}
      {mounted && bagCount > 0 && (
        <span className="absolute -top-1 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {bagCount}
        </span>
      )}
    </button>
  );

  const headerTools =
    header.showLocation || header.showSearch ? (
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {header.showLocation ? (
          <LocationSelector
            variant={header.layout === "showcase" ? "showcase" : "desktop"}
            tone={header.contentTone}
            showLabel={header.showLocationLabel}
          />
        ) : null}
        {header.showSearch ? (
          <GlobalSearchbar
            tone={header.contentTone}
            size={header.layout === "showcase" ? "large" : "default"}
          />
        ) : null}
      </div>
    ) : null;

  const mobileSearch = header.showSearch ? (
    <div className="min-w-0 flex-1">
      <GlobalSearchbar tone={header.contentTone} size="default" />
    </div>
  ) : null;

  const headerActions = (
    <nav className="flex shrink-0 items-center gap-1 min-[640px]:gap-3">
      {header.actionItems.map((item) => (
        <Link
          key={item.id}
          href={item.url}
          target={item.openInNewTab ? "_blank" : undefined}
          rel={item.openInNewTab ? "noreferrer" : undefined}
          className={`hidden min-w-24 items-center justify-center gap-1.5 rounded-small border px-4 py-2 text-xs font-bold min-[1024px]:inline-flex ${
            item.style === "solid"
              ? "border-primary bg-primary text-primary-foreground"
              : item.style === "soft"
                ? "border-transparent bg-content2 text-foreground"
                : "border-divider bg-content1/80 text-foreground"
          }`}
        >
          {item.icon ? <Icon icon={item.icon} className="text-base" /> : null}
          {item.label}
        </Link>
      ))}
      {header.showWishlist ? WishlistAction : null}
      {header.showOrders ? OrdersAction : null}
      {header.showAccount ? AccountAction : null}
      {header.showCart ? CartAction : null}
    </nav>
  );

  const mobileHeaderActions =
    header.showAccount || header.showCart ? (
      <nav className="flex shrink-0 items-center gap-0.5">
        {header.showAccount ? MobileAccountAction : null}
        {header.showCart ? CartAction : null}
      </nav>
    ) : null;

  const announcementContent = header.announcementText ? (
    <span className="text-center text-xs font-semibold sm:text-sm">
      {header.announcementText}
    </span>
  ) : null;

  const renderSurfaceBackground = () => {
    if (effectiveBackgroundType !== "image") return null;
    const hasDifferentMobileBackground =
      !usesCategoryAppearance &&
      Boolean(header.mobileBackgroundImage) &&
      header.mobileBackgroundImage !== header.backgroundImage;

    return (
      <>
        {desktopBackgroundStyle ? (
          <div
            aria-hidden="true"
            className={`absolute inset-0 ${hasDifferentMobileBackground ? "hidden min-[1024px]:block" : ""}`}
            style={desktopBackgroundStyle}
          />
        ) : null}
        {hasDifferentMobileBackground && mobileBackgroundStyle ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 min-[1024px]:hidden"
            style={mobileBackgroundStyle}
          />
        ) : null}
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${header.overlayColor ? "" : "bg-ink"}`}
          style={overlayStyle}
        />
      </>
    );
  };

  const socialLinks = [
    {
      label: "Facebook",
      url: webSettings?.facebookLink,
      icon: "logos:facebook",
    },
    {
      label: "Instagram",
      url: webSettings?.instagramLink,
      icon: "skill-icons:instagram",
    },
    {
      label: "YouTube",
      url: webSettings?.youtubeLink,
      icon: "logos:youtube-icon",
    },
    { label: "X", url: webSettings?.xLink, icon: "ri:twitter-x-fill" },
  ].filter((item) => Boolean(item.url));

  const utilityIsHidden =
    isHeaderScrolled && header.hideUtilityOnScroll;

  const utilityBar = header.showUtilityBar ? (
    <div
      aria-hidden={utilityIsHidden}
      inert={utilityIsHidden ? true : undefined}
      className={`relative z-10 hidden overflow-hidden transition-[max-height,opacity,transform] duration-700 ease-in-out motion-reduce:transition-none min-[1024px]:block ${
        utilityIsHidden
          ? "pointer-events-none max-h-0 -translate-y-full opacity-0"
          : "max-h-8 translate-y-0 opacity-100"
      }`}
      style={{
        ...(header.utilityBackgroundColor
          ? { backgroundColor: header.utilityBackgroundColor }
          : {}),
        ...(header.utilityTextColor
          ? { color: header.utilityTextColor }
          : {}),
      }}
    >
      <div
        className={`mx-auto flex min-h-8 items-center justify-between gap-6 px-4 text-xs ${containerClass}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {header.utilityText ? (
            <span className="truncate font-medium">{header.utilityText}</span>
          ) : null}
          {header.showSocialLinks && socialLinks.length > 0 ? (
            <div className="flex items-center gap-2.5">
              <span className="font-medium opacity-70">
                {t("nav.followUs", "Follow us")}
              </span>
              {socialLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-5 w-5 items-center justify-center"
                >
                  <Icon icon={item.icon} className="text-sm" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-5">
          {header.showSupportPhone && webSettings?.supportNumber ? (
            <a
              href={`tel:${webSettings.supportNumber}`}
              className="inline-flex items-center gap-1.5 font-semibold"
            >
              <Icon icon="solar:phone-calling-linear" className="text-sm" />
              {webSettings.supportNumber}
            </a>
          ) : null}
          {header.showLanguage ? <LanguageSwitcher /> : null}
        </div>
      </div>
    </div>
  ) : null;

  const showNavigation =
    header.showCategoryNavigation &&
    (header.navigationScope === "all" || router.pathname === "/");
  const navigationIsCompact =
    isHeaderScrolled && header.navigationScrollBehavior === "compact";
  const navigationIsHidden =
    isHeaderScrolled && header.navigationScrollBehavior === "hide";
  const navigationUsesIcons = header.navigationStyle === "icons";
  const navigationStyle = navigationIsCompact
    ? "links"
    : header.navigationStyle;
  const navigationItemClass = (isActive: boolean) =>
    `shrink-0 cursor-pointer whitespace-nowrap text-xs font-medium transition-all duration-500 ease-in-out motion-reduce:transition-none min-[640px]:text-sm ${
      navigationUsesIcons
        ? `flex flex-col items-center border-b-2 ${
            navigationIsCompact
              ? "min-w-16 gap-0 px-2 py-1.5 min-[640px]:min-w-20 min-[640px]:px-3"
              : "min-w-16 gap-1 px-2 py-2 min-[640px]:min-w-20 min-[640px]:px-3"
          } ${
            isActive
              ? "border-primary font-bold text-primary"
              : "border-transparent text-current opacity-75"
          }`
        : `px-4 py-1.5 ${
            navigationStyle === "pills"
              ? "rounded-full"
              : "border-b-2 border-transparent"
          } ${
            isActive
              ? navigationStyle === "pills"
                ? "bg-primary font-bold text-primary-foreground"
                : "border-primary font-bold text-foreground"
              : "text-current opacity-70"
          }`
    }`;
  const navigationActiveStyle = (isActive: boolean): CSSProperties => ({
    ...(isActive &&
    (categoryDesktopAppearance?.active_font_color ||
      header.navigationActiveColor)
      ? navigationStyle === "pills"
        ? {
            backgroundColor:
              categoryDesktopAppearance?.active_font_color ||
              header.navigationActiveColor ||
              undefined,
          }
        : {
            borderColor:
              categoryDesktopAppearance?.active_font_color ||
              header.navigationActiveColor ||
              undefined,
            color:
              categoryDesktopAppearance?.active_font_color ||
              header.navigationActiveColor ||
              undefined,
          }
      : {}),
  });
  const navigationIconClass = `flex items-center justify-center overflow-hidden transition-[height,opacity,transform] duration-500 ease-in-out motion-reduce:transition-none ${
    navigationIsCompact
      ? "h-0 -translate-y-6 opacity-0"
      : "h-6 translate-y-0 opacity-100"
  }`;
  const navigationBar = showNavigation ? (
    <div
      aria-hidden={navigationIsHidden}
      inert={navigationIsHidden ? true : undefined}
      className={`relative z-10 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-in-out motion-reduce:transition-none ${
        navigationIsHidden
          ? "pointer-events-none max-h-0 -translate-y-full opacity-0"
          : navigationIsCompact
            ? "max-h-12 -translate-y-1 opacity-100"
            : "max-h-24 translate-y-0 opacity-100"
      } ${
        header.layout === "showcase"
          ? "bg-transparent"
          : "bg-content1/90 backdrop-blur-md"
      }`}
      style={{
        ...(header.navigationBackgroundColor
          ? { backgroundColor: header.navigationBackgroundColor }
          : {}),
        ...(header.navigationTextColor
          ? {
              color:
                categoryDesktopAppearance?.font_color ||
                header.navigationTextColor,
            }
          : categoryDesktopAppearance?.font_color
            ? { color: categoryDesktopAppearance.font_color }
          : {}),
      }}
    >
      <div
        className={`mx-auto flex items-center overflow-x-auto px-4 transition-transform duration-500 ease-in-out motion-reduce:transition-none no-scrollbar ${
          navigationUsesIcons
            ? "gap-3"
            : navigationIsCompact
              ? "gap-2 py-1"
              : "gap-2 py-2"
        } ${containerClass}`}
      >
        {header.navigationSource === "categories"
          ? [
              ...(header.showAllCategory
                ? [
                    {
                      slug: "all",
                      title: homeGeneralSettings?.title || t("filters.all"),
                      image: homeGeneralSettings?.icon || null,
                      activeImage:
                        homeGeneralSettings?.activeIcon ||
                        homeGeneralSettings?.icon ||
                        null,
                      icon: "solar:widget-2-bold-duotone",
                    },
                  ]
                : []),
              ...navCategories.map((category) => ({
                slug: category.slug,
                title: category.title,
                image: category.image || null,
                activeImage: category.image || null,
                icon: null,
              })),
            ].map((item) => {
              const currentCategory = (router.query.category as string) || "";
              const isAll = item.slug === "all";
              const isActive = isAll
                ? !currentCategory
                : currentCategory === item.slug;
              const itemImage =
                isActive && "activeImage" in item
                  ? item.activeImage
                  : item.image;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={async () => {
                    const slug = item.slug;
                    setCookie("homeCategory", slug);
                    if (router.pathname === "/") {
                      await router.push(
                        {
                          pathname: "/",
                          query: isAll ? {} : { category: slug },
                        },
                        undefined,
                        { shallow: true },
                      );
                      onHomeCategoryChange();
                    } else {
                      router.push(isAll ? "/" : `/?category=${slug}`);
                    }
                  }}
                  className={navigationItemClass(isActive)}
                  style={navigationActiveStyle(isActive)}
                >
                  {navigationUsesIcons ? (
                    <span className={navigationIconClass} aria-hidden="true">
                      {itemImage ? (
                        <Image
                          removeWrapper
                          disableAnimation
                          src={itemImage}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Icon
                          icon={item.icon ?? "solar:widget-2-linear"}
                          className="text-2xl"
                        />
                      )}
                    </span>
                  ) : null}
                  <span>{item.title}</span>
                </button>
              );
            })
          : header.navigationItems.map((item) => {
              const isActive = router.asPath === item.url;
              return (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noreferrer" : undefined}
                  className={navigationItemClass(isActive)}
                  style={navigationActiveStyle(isActive)}
                >
                  {navigationUsesIcons ? (
                    <span className={navigationIconClass} aria-hidden="true">
                      {item.imageUrl ? (
                        <Image
                          removeWrapper
                          disableAnimation
                          src={item.imageUrl}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Icon
                          icon={item.icon ?? "solar:link-circle-linear"}
                          className="text-2xl"
                        />
                      )}
                    </span>
                  ) : null}
                  <span>{item.label}</span>
                </Link>
              );
            })}
      </div>
    </div>
  ) : null;

  const mobileHeaderRow =
    header.showLocation || (header.showNotifications && showAccountLinks) ? (
      <div
        className={`relative z-10 px-3 min-[1024px]:hidden ${header.density === "compact" ? "py-1" : "py-1.5"}`}
      >
        <div
          className={`mx-auto flex items-center justify-between gap-3 ${containerClass}`}
        >
          {header.showLocation ? (
            <div className="min-w-0 flex-1">
              <LocationSelector variant="mobile" tone={header.contentTone} />
            </div>
          ) : null}
          {header.showNotifications && showAccountLinks ? (
            <button
              type="button"
              aria-label={t("profileBtn.notifications")}
              onClick={() => {
                router.push("/my-account/notifications");
              }}
              className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${header.contentTone === "light" ? "bg-white/10 text-white hover:bg-white/20" : "bg-content1 text-foreground hover:bg-content2"}`}
            >
              <Icon icon="solar:bell-bing-linear" className="text-lg" />
            </button>
          ) : null}
        </div>
      </div>
    ) : null;

  const isCheckoutOrPayment =
    router.pathname === "/cart/checkout" ||
    router.pathname.startsWith("/payment");

  if (isCheckoutOrPayment) {
    const isPaymentPage = router.pathname.startsWith("/payment");
    const backHref = isPaymentPage ? "/cart/checkout" : "/cart";
    const backText = isPaymentPage
      ? t("nav.backToCheckout", "Back to Checkout")
      : t("nav.backToCart", "Back to Cart");
    const titleText = isPaymentPage
      ? t("nav.securePayment", "Secure Payment")
      : t("nav.secureCheckout", "Secure Checkout");

    return (
      <header className="sticky top-0 z-50 w-full bg-ink text-ink-foreground border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4">
          {/* Logo on the left */}
          <div className="flex items-center">{SiteLogo}</div>

          {/* Secure label in the center */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Icon
              icon="solar:shield-keyhole-bold-duotone"
              className="text-emerald-400 text-lg sm:text-xl shrink-0"
            />
            <span className="font-display text-sm sm:text-base font-bold tracking-tight text-white leading-none">
              {titleText}
            </span>
          </div>

          {/* Back Action on the right */}
          <Link
            href={backHref}
            className="group inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="text-sm transition-transform group-hover:-translate-x-0.5 rtl:rotate-180"
            />
            {backText}
          </Link>
        </div>
      </header>
    );
  }

  if (!header.enabled) {
    return (
      <OfflineCartDrawer
        isOpen={isOfflineCartOpen}
        onClose={closeOfflineCart}
      />
    );
  }

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

      {header.announcementEnabled &&
      announcementContent &&
      showHeaderAnnouncement ? (
        <div
          className="relative flex w-full items-center justify-center gap-2 bg-primary px-10 py-2 text-primary-foreground"
          style={{
            ...(header.announcementBackgroundColor
              ? { backgroundColor: header.announcementBackgroundColor }
              : {}),
            ...(header.announcementTextColor
              ? { color: header.announcementTextColor }
              : {}),
          }}
        >
          {header.announcementUrl ? (
            <Link
              href={header.announcementUrl}
              target={
                header.announcementUrl.startsWith("http") ? "_blank" : undefined
              }
              rel={
                header.announcementUrl.startsWith("http")
                  ? "noreferrer"
                  : undefined
              }
            >
              {announcementContent}
            </Link>
          ) : (
            announcementContent
          )}
          {header.announcementDismissible ? (
            <Button
              isIconOnly
              aria-label={t("close")}
              className="absolute end-2 top-1/2 h-6 w-6 min-w-6 -translate-y-1/2 text-current"
              radius="full"
              size="sm"
              variant="light"
              onPress={() => setShowHeaderAnnouncement(false)}
            >
              <Icon icon="solar:close-circle-linear" className="text-base" />
            </Button>
          ) : null}
        </div>
      ) : null}

      <header
        className={`${header.sticky ? "sticky" : "relative"} top-0 z-40 w-full border-0`}
      >
        <div
          className={`relative isolate overflow-hidden border-0 ${surfaceToneClass}`}
          style={surfaceStyle}
        >
          {renderSurfaceBackground()}
          {mobileHeaderRow}
          <div
            className={`relative z-10 mx-auto grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 min-[640px]:gap-3 min-[1024px]:hidden ${containerClass}`}
          >
            <div className="max-w-24 min-[640px]:max-w-32">{SiteLogo}</div>
            {mobileSearch ?? <span />}
            {mobileHeaderActions ?? <span />}
          </div>
          {header.layout === "showcase" ? utilityBar : null}
          {header.layout === "stacked" ? (
            <div
              className={`relative z-10 mx-auto hidden flex-col gap-2 px-4 min-[1024px]:flex ${densityClass} ${containerClass}`}
            >
              <div className="flex items-center justify-between gap-4">
                {SiteLogo}
                {headerActions}
              </div>
              {headerTools}
            </div>
          ) : header.layout === "showcase" ? (
            <div
              className={`relative z-10 mx-auto hidden min-h-20 grid-cols-[auto_1fr_auto] items-center gap-6 px-4 py-4 min-[1024px]:grid ${containerClass}`}
            >
              {SiteLogo}
              {headerTools ?? <span />}
              {headerActions}
            </div>
          ) : (
            <div
              className={`relative z-10 mx-auto hidden grid-cols-[auto_1fr_auto] items-center gap-6 px-4 min-[1024px]:grid ${densityClass} ${containerClass}`}
            >
              {SiteLogo}
              {headerTools ?? <span />}
              {headerActions}
            </div>
          )}
          {header.layout === "showcase" ? navigationBar : null}
        </div>
        {header.layout === "showcase" ? null : navigationBar}
      </header>

      <OfflineCartDrawer
        isOpen={isOfflineCartOpen}
        onClose={closeOfflineCart}
      />
    </>
  );
};
