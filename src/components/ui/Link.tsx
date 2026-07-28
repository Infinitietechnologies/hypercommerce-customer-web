import type { LinkProps } from "@heroui/react";

import { Link as HeroLink } from "@heroui/react";
import { forwardRef } from "react";

/**
 * Redesign link — HeroUI's Link dims to 80% opacity on hover/press
 * (`hover:opacity-hover`). The redesign never dims on hover (cards, banners and
 * text links use colour/shadow instead), so we hard-override it off here, once.
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
  <HeroLink
    ref={ref}
    {...props}
    className={`hover:!opacity-100 active:!opacity-100 ${props.className ?? ""}`}
  />
));

Link.displayName = "Link";

export default Link;
