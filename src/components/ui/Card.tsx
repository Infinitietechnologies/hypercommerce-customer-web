import type { CardProps } from "@heroui/react";

import { Card as HeroCard } from "@heroui/react";
import { forwardRef } from "react";

/**
 * Matches cardTheme in the Flutter app
 * (hypercommerce-customer-app/lib/config/theme.dart): radius 12, elevation 0
 * with a hairline border instead of a shadow, and no margin of its own —
 * the parent owns spacing.
 */
const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <HeroCard
    ref={ref}
    radius="lg"
    shadow="none"
    {...props}
    className={`border-1 border-divider bg-content1 m-0 ${props.className ?? ""}`}
  />
));

Card.displayName = "Card";

export default Card;
