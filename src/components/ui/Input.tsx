import type { InputProps as HeroInputProps } from "@heroui/react";

import { Input as HeroInput } from "@heroui/react";
import { forwardRef } from "react";

/**
 * Matches inputDecorationTheme in the Flutter app
 * (hypercommerce-customer-app/lib/config/theme.dart): filled surface,
 * radius 12, hairline border that thickens to amber on focus.
 */
const Input = forwardRef<HTMLInputElement, HeroInputProps>((props, ref) => (
  <HeroInput
    ref={ref}
    radius="lg"
    variant="faded"
    labelPlacement="outside"
    {...props}
    classNames={{
      ...props.classNames,
      inputWrapper: `bg-content2 dark:bg-content1 border-1 border-divider
        data-[hover=true]:border-default-300
        group-data-[focus=true]:border-2 group-data-[focus=true]:border-primary
        shadow-none ${props.classNames?.inputWrapper ?? ""}`,
    }}
  />
));

Input.displayName = "Input";

export default Input;
