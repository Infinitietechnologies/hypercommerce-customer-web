import type { ButtonProps as HeroButtonProps } from "@heroui/react";

import { Button as HeroButton, Spinner, extendVariants } from "@heroui/react";
import { forwardRef } from "react";

/**
 * The storefront button (redesign): radius 12 (`rounded-small`), amber fill
 * with near-black label, 48px tall on mobile and 40px from tablet up. The
 * primary CTA carries a soft amber glow (`shadow-primary`); other colours stay
 * flat — see the `Button` component below.
 */
const StyledButton = extendVariants(HeroButton, {
  variants: {
    size: {
      // Kept for call sites migrated from components/custom/MyButton.
      xs: "p-2 min-w-12 h-7 text-tiny gap-1 rounded-small",
      responsive: `
      px-3 py-2 min-w-16 h-8 text-tiny gap-2 rounded-small
      sm:px-4 sm:py-2.5 sm:min-w-16 sm:h-10 sm:text-base sm:gap-3 sm:rounded-small
      md:px-4 md:py-2.5 md:min-w-18 md:h-10 md:text-small md:gap-2 md:rounded-small
    `,
      app: "px-4 h-12 md:h-10 text-small gap-2 rounded-small",
    },
  },
  defaultVariants: {
    size: "app",
  },
});

export interface ButtonProps extends Omit<HeroButtonProps, "size"> {
  size?: HeroButtonProps["size"] | "xs" | "responsive" | "app";
}

/**
 * The app swaps the label for a spinner while loading rather than showing both,
 * so `isLoading` hides children here.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading, children, disableAnimation, ...props }, ref) => {
    // Solid primary is the only elevated button; everything else stays flat.
    const isSolidPrimary =
      (props.color ?? "primary") === "primary" &&
      (props.variant ?? "solid") === "solid" &&
      !props.isDisabled &&
      !isLoading;

    return (
      <StyledButton
        ref={ref}
        disableAnimation={disableAnimation}
        isLoading={false}
        isDisabled={props.isDisabled || isLoading}
        {...props}
        className={`${isSolidPrimary ? "shadow-primary" : "shadow-none"} ${props.className ?? ""}`}
      >
        {isLoading ? <Spinner size="sm" color="current" /> : children}
      </StyledButton>
    );
  },
);

Button.displayName = "Button";

export default Button;
