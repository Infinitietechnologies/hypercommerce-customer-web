import type { TextAreaProps } from "@heroui/react";

import { Textarea as HeroTextarea } from "@heroui/react";
import { forwardRef } from "react";

/** Same surface treatment as Input — see ./Input.tsx. */
const Textarea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (props, ref) => (
    <HeroTextarea
      ref={ref}
      radius="md"
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
  ),
);

Textarea.displayName = "Textarea";

export default Textarea;
