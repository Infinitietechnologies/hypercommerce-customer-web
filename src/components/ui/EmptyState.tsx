import type { ReactNode } from "react";

import Image from "next/image";

import Button from "./Button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Path under /public. Falls back to `icon` when omitted. */
  image?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Mirrors EmptyStatePage in the Flutter app
 * (hypercommerce-customer-app/lib/utils/widgets/empty_states_page.dart):
 * centred illustration, title, supporting copy, optional action.
 *
 * Every list and detail screen needs one of these — an empty result must never
 * render as a blank region.
 */
const EmptyState = ({
  title,
  description,
  image,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) => (
  <div
    className={`flex min-h-[320px] w-full flex-col items-center justify-center gap-2.5 px-4 text-center ${className}`}
  >
    {image ? (
      <Image
        alt=""
        aria-hidden="true"
        className="mb-2.5 h-auto w-auto max-w-[200px] object-contain"
        height={200}
        src={image}
        width={200}
      />
    ) : icon ? (
      <div aria-hidden="true" className="mb-2.5 text-default-400">
        {icon}
      </div>
    ) : null}

    <h2 className="text-large font-bold text-foreground">{title}</h2>

    {description ? (
      <p className="max-w-sm text-small text-default-500">{description}</p>
    ) : null}

    {actionLabel && onAction ? (
      <Button className="mt-2.5" color="primary" onPress={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default EmptyState;
