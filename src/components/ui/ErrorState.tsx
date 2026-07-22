import { AlertTriangle } from "lucide-react";

import Button from "./Button";

export interface ErrorStateProps {
  title: string;
  /** Keep this human-readable — never surface a raw error or stack trace. */
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Failure counterpart to EmptyState. Every screen that fetches needs one:
 * a failed request must offer a way out, not a blank page.
 */
const ErrorState = ({
  title,
  description,
  retryLabel,
  onRetry,
  className = "",
}: ErrorStateProps) => (
  <div
    className={`flex min-h-[320px] w-full flex-col items-center justify-center gap-2.5 px-4 text-center ${className}`}
    role="alert"
  >
    <AlertTriangle aria-hidden="true" className="mb-2.5 text-danger" size={48} />

    <h2 className="text-large font-bold text-foreground">{title}</h2>

    {description ? (
      <p className="max-w-sm text-small text-default-500">{description}</p>
    ) : null}

    {retryLabel && onRetry ? (
      <Button className="mt-2.5" color="primary" onPress={onRetry}>
        {retryLabel}
      </Button>
    ) : null}
  </div>
);

export default ErrorState;
