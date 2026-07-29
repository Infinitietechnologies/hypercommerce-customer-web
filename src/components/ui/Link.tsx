import type { LinkProps } from "@heroui/react";

import { Link as HeroLink } from "@heroui/react";
import NextLink from "next/link";
import { forwardRef } from "react";

/**
 * Redesign link — renders through `next/link` so internal navigation is a
 * client-side transition (no full-page reload). Also hard-overrides HeroUI's
 * hover/press opacity dim (`hover:opacity-hover`), which the redesign never uses.
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
  <HeroLink
    ref={ref}
    as={props.href != null ? NextLink : undefined}
    {...props}
    className={`hover:!opacity-100 active:!opacity-100 ${props.className ?? ""}`}
  />
));

Link.displayName = "Link";

export default Link;
