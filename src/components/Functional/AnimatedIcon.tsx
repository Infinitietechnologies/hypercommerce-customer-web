import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { FC } from "react";

/**
 * Drop-in replacement for Iconify's `<Icon>` that adds a soft motion ON HOVER
 * (nothing moves at rest). Ported from the amber redesign handoff
 * (`src/components/AnimatedIcon.jsx`).
 *
 *   float  — gentle lift              (nav / generic)
 *   pulse  — subtle scale pop         (status / attention)
 *   sway   — small rotation rock      (playful accents)
 *   beat   — heart-style double thump (wishlist)
 */
export type IconAnim = "float" | "pulse" | "sway" | "beat";

const MOTIONS = {
  float: {
    whileHover: { y: -3 },
    transition: { type: "spring" as const, stiffness: 400, damping: 15 },
  },
  pulse: {
    whileHover: { scale: 1.18 },
    transition: { type: "spring" as const, stiffness: 400, damping: 12 },
  },
  sway: {
    whileHover: { rotate: [0, -10, 8, -5, 0] },
    transition: { duration: 0.5, ease: "easeInOut" as const },
  },
  beat: {
    whileHover: { scale: [1, 1.25, 1, 1.18, 1] },
    transition: {
      duration: 0.55,
      ease: "easeInOut" as const,
      times: [0, 0.2, 0.4, 0.6, 1],
    },
  },
};

interface AnimatedIconProps {
  icon: string;
  anim?: IconAnim;
  className?: string;
}

const AnimatedIcon: FC<AnimatedIconProps> = ({
  icon,
  className = "",
}) => {

  return (
    <motion.span
      className="inline-flex"
      style={{ transformOrigin: "center" }}
    >
      <Icon icon={icon} className={className} />
    </motion.span>
  );
};

export default AnimatedIcon;
