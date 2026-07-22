import type { SkeletonProps } from "@heroui/react";

import { Skeleton as HeroSkeleton } from "@heroui/react";

/**
 * Loading placeholder. Mirrors custom_shimmer.dart in the Flutter app — a
 * skeleton must match the shape of the content it stands in for, so compose
 * these into the real layout rather than showing a bare spinner.
 */
const Skeleton = (props: SkeletonProps) => (
  <HeroSkeleton
    {...props}
    className={`rounded-medium ${props.className ?? ""}`}
  />
);

export default Skeleton;
