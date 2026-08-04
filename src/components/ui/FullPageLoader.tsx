import { FC } from "react";

interface FullPageLoaderProps {
  /** Optional caption shown under the spinner (e.g. "Loading store…"). */
  label?: string;
  /**
   * When true the loader fills the viewport with a solid backdrop (used for the
   * initial app boot). When false it only centers itself inside its parent.
   */
  fullScreen?: boolean;
}

/**
 * Lightweight, brand-amber dual-ring spinner. Pure CSS (see `.brand-loader` in
 * globals.css) — no GIF, no JS animation, animates during hydration. Replaces
 * the legacy `logo-loading.gif` boot loader.
 */
const FullPageLoader: FC<FullPageLoaderProps> = ({
  label,
  fullScreen = true,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
      className={
        (fullScreen
          ? "h-screen w-full bg-white "
          : "w-full py-16 ") +
        "flex flex-col items-center justify-center gap-4"
      }
    >
      <span className="brand-loader" aria-hidden="true" />
      {label && (
        <span className="text-sm font-medium text-neutral-500">{label}</span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default FullPageLoader;
