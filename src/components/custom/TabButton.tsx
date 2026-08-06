import React, { useEffect, useRef } from "react";
import { Image } from "@/components/ui";
import { Icon } from "@iconify/react";

interface Category {
  id: number;
  title: string;
  slug: string;
  image: string;
  icon: string;
  active_icon: string;
  description: string | null;
  status: string;
}

interface TabButtonProps {
  slug: string;
  title: string;
  category?: Category | null;
  isSelected: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  staticIcon?: React.ReactNode;
  size?: "sm" | "lg";
  /**
   * `card` (default) — stacked icon-tile + label; used where category tiles are
   * shown as a grid. `strip` — flat inline icon + label with an underline on
   * the active tab, matching the /redesign sandbox home category strip.
   */
  variant?: "card" | "strip";
}

const TabButton: React.FC<TabButtonProps> = ({
  slug,
  title,
  category = null,
  isSelected,
  isLoading = false,
  onClick,
  staticIcon,
  size = "sm",
  variant = "card",
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Auto trigger when "see-more" is visible
  useEffect(() => {
    if (slug !== "see-more" || !buttonRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          onClick?.();
        }
      },
      { threshold: 1 },
    );

    observer.observe(buttonRef.current);
    return () => observer.disconnect();
  }, [slug, isLoading, onClick]);

  const iconUrl =
    isSelected && category?.active_icon
      ? category.active_icon
      : category?.icon || category?.image;

  // Both states rendered so the strip can crossfade icon → active_icon on select.
  const stripInactiveIcon = category?.icon || category?.image || "";
  const stripActiveIcon = category?.active_icon || stripInactiveIcon;

  // ---- Flat inline strip (sandbox home category nav) --------------------------
  if (variant === "strip") {
    return (
      <button
        ref={buttonRef}
        onClick={onClick}
        disabled={isLoading}
        className={`
          flex flex-col items-center gap-1 px-2.5 py-1.5
          sm:flex-row sm:gap-1.5 sm:px-3.5 sm:py-[11px]
          whitespace-nowrap border-b-2 transition-colors duration-200
          ${
            isSelected
              ? "border-primary text-primary-600"
              : "border-transparent text-default-500 hover:text-foreground hover:border-primary/40"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className="relative flex items-center justify-center shrink-0 w-7 h-7">
          {stripInactiveIcon || stripActiveIcon ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stripInactiveIcon || stripActiveIcon}
                alt=""
                loading="eager"
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-300 ease-out ${
                  isSelected ? "opacity-0 scale-90" : "opacity-80 scale-100"
                }`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stripActiveIcon || stripInactiveIcon}
                alt=""
                loading="eager"
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-300 ease-out ${
                  isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
              />
            </>
          ) : (
            staticIcon || (
              <Icon
                icon="solar:widget-2-linear"
                className={`text-xl sm:text-[17px] transition-colors duration-300 ${
                  isSelected ? "text-primary-600" : "text-default-400"
                }`}
              />
            )
          )}
        </span>
        <span
          className={`text-[11px] sm:text-[13px] leading-none transition-all duration-300 ${
            isSelected ? "font-bold text-primary-600" : "font-semibold"
          }`}
        >
          {title}
        </span>
        {isLoading && (
          <span className="ms-1 animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary" />
        )}
      </button>
    );
  }

  // ---- Card (default) ---------------------------------------------------------
  const isLarge = size === "lg";

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex flex-col items-center justify-center gap-2
        ${
          isLarge
            ? "px-1 py-2 sm:min-w-[80px] lg:min-w-[110px] lg:px-4 lg:py-3"
            : "px-1 py-2 sm:min-w-[72px] min-w-[50px]"
        }
        border-b-2 transition-all duration-200 hover:border-primary
        ${
          isSelected
            ? "border-primary text-primary-600"
            : "border-transparent text-default-500 hover:text-foreground"
        }
        ${
          isLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-content2/60"
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
            flex items-center justify-center rounded-lg
            ${
              isLarge
                ? "w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16"
                : "w-10 h-10 md:w-12 md:h-12"
            }
            ${isSelected ? "bg-primary-50" : "bg-content2"}
          `}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={title}
            loading="eager"
            radius="none"
            className={`
                object-contain
                ${
                  isLarge
                    ? "w-6 h-6 md:w-9 md:h-9 lg:w-11 lg:h-11"
                    : "w-6 h-6 md:w-8 md:h-8"
                }
              `}
          />
        ) : (
          staticIcon || (
            <Icon
              icon="solar:widget-2-linear"
              className={`
                ${isLarge ? "text-2xl md:text-4xl lg:text-5xl" : "text-2xl md:text-3xl"}
                ${isSelected ? "text-primary-600" : "text-default-400"}
              `}
            />
          )
        )}
      </div>

      {/* Title */}
      <span
        className={`
          text-xxs sm:text-xs text-center leading-tight truncate
          ${
            isLarge
              ? "lg:text-sm max-w-[80px] sm:max-w-[100px] lg:max-w-[120px]"
              : "max-w-[60px] sm:max-w-[80px]"
          }
          ${isSelected ? "font-extrabold text-primary-600" : "font-semibold"}
        `}
      >
        {title}
      </span>

      {/* Loader */}
      {isLoading && (
        <div className="mt-1 animate-spin rounded-sm h-4 w-4 border-b-2 border-secondary" />
      )}
    </button>
  );
};

export default TabButton;
