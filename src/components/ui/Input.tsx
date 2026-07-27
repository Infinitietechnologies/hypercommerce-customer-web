import type { InputProps as HeroInputProps } from "@heroui/react";

import { Input as HeroInput } from "@heroui/react";
import { forwardRef } from "react";

/**
 * Redesign input: white fill, radius 14 (`md`), 1px hairline border that turns
 * amber with a soft tint ring on focus (sandbox `TextField`).
 */
const Input = forwardRef<HTMLInputElement, HeroInputProps>((props, ref) => (
  <HeroInput
    ref={ref}
    radius="md"
    variant="faded"
    labelPlacement="outside"
    {...props}
    classNames={{
      ...props.classNames,
      inputWrapper: `bg-content1 border-1 border-divider
        data-[hover=true]:border-default-300
        focus-within:border-primary
        focus-within:ring-3 focus-within:ring-primary-100
        shadow-none ${props.classNames?.inputWrapper ?? ""}`,
    }}
  />
));

Input.displayName = "Input";

export default Input;
