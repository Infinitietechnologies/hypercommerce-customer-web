import { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

interface TabItem {
  key: string;
  href: string;
  labelKey: string;
  icon: string;
  activeIcon: string;
}

const ITEMS: TabItem[] = [
  {
    key: "home",
    href: "/",
    labelKey: "home",
    icon: "solar:home-2-linear",
    activeIcon: "solar:home-2-bold",
  },
  {
    key: "categories",
    href: "/categories",
    labelKey: "categories",
    icon: "solar:widget-2-linear",
    activeIcon: "solar:widget-2-bold",
  },
  {
    key: "cart",
    href: "/cart",
    labelKey: "cart",
    icon: "solar:bag-3-linear",
    activeIcon: "solar:bag-3-bold",
  },
  {
    key: "account",
    href: "/my-account",
    labelKey: "account",
    icon: "solar:user-linear",
    activeIcon: "solar:user-bold",
  },
];

interface MobileTabBarProps {
  /** Cart badge count — passed in by the layout, not read here. */
  bagCount?: number;
}

/**
 * App-style bottom navigation, shown only below `lg`, so the responsive web
 * storefront reads like the native app on phones. Ported from the amber
 * redesign handoff (`src/components/MobileTabBar.jsx`), wired to real routes.
 */
const MobileTabBar: FC<MobileTabBarProps> = ({ bagCount = 0 }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const isActive = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around items-center px-1.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-divider bg-content1/95 backdrop-blur">
      {ITEMS.map((n) => {
        const on = isActive(n.href);

        return (
          <Link
            key={n.key}
            href={n.href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-0.5 ${
              on ? "text-primary-600" : "text-default-400"
            }`}
          >
            <Icon icon={on ? n.activeIcon : n.icon} className="text-2xl" />
            <span className={`text-[11px] ${on ? "font-extrabold" : "font-semibold"}`}>
              {t(n.labelKey)}
            </span>
            {n.key === "cart" && bagCount > 0 && (
              <span className="absolute -top-1 right-1.5 min-w-[17px] h-[17px] px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold">
                {bagCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileTabBar;
