import type { ChipProps } from "@heroui/react";

import { Chip as HeroChip } from "@heroui/react";
import { forwardRef } from "react";

/**
 * Pill shape on the L3 surface, matching the chip treatment in the Flutter app
 * (darkExtraCardColor #2E2E2E in dark, grey.100 in light). Flat — no shadow.
 */
const Chip = forwardRef<HTMLDivElement, ChipProps>((props, ref) => (
  <HeroChip
    ref={ref}
    radius="full"
    variant="flat"
    {...props}
    className={`shadow-none ${props.className ?? ""}`}
  />
));

Chip.displayName = "Chip";

export default Chip;
