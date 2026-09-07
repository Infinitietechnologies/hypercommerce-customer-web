import { useEffect } from "react";

let activeLocks = 0;
let restoreDocumentStyles: (() => void) | null = null;

export const useDocumentScrollLock = () => {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (activeLocks === 0) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const previousRootOverflow = root.style.overflow;
      const previousRootOverscroll = root.style.overscrollBehavior;
      const previousBodyOverflow = body.style.overflow;
      const previousBodyOverscroll = body.style.overscrollBehavior;
      const keepScrollPosition = () => {
        if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
          window.scrollTo(scrollX, scrollY);
        }
      };

      root.style.overflow = "hidden";
      root.style.overscrollBehavior = "none";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      window.addEventListener("scroll", keepScrollPosition, { passive: true });

      restoreDocumentStyles = () => {
        window.removeEventListener("scroll", keepScrollPosition);
        root.style.overflow = previousRootOverflow;
        root.style.overscrollBehavior = previousRootOverscroll;
        body.style.overflow = previousBodyOverflow;
        body.style.overscrollBehavior = previousBodyOverscroll;
        window.scrollTo(scrollX, scrollY);
      };
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks === 0) {
        restoreDocumentStyles?.();
        restoreDocumentStyles = null;
      }
    };
  }, []);
};
