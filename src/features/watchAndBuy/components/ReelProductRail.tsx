import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { WatchBuyProduct } from "@/types/watchBuy";

import ReelProductCard from "./ReelProductCard";

interface ReelProductRailProps {
  products: WatchBuyProduct[];
}

const ReelProductRail = ({ products }: ReelProductRailProps) => {
  const { t } = useTranslation();
  const railRef = useRef<HTMLUListElement | null>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    scrollLeft: 0,
    startX: 0,
  });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const handleWheel = (event: WheelEvent) => {
      if (rail.scrollWidth <= rail.clientWidth) return;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const previousScroll = rail.scrollLeft;
      rail.scrollLeft += delta;
      if (rail.scrollLeft !== previousScroll) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragRef.current = {
        active: true,
        moved: false,
        pointerId: event.pointerId,
        scrollLeft: rail.scrollLeft,
        startX: event.clientX,
      };
      rail.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;
      const distance = event.clientX - drag.startX;
      if (Math.abs(distance) > 4) drag.moved = true;
      if (!drag.moved) return;
      event.preventDefault();
      rail.scrollLeft = drag.scrollLeft - distance;
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (dragRef.current.pointerId !== event.pointerId) return;
      dragRef.current.active = false;
      if (rail.hasPointerCapture(event.pointerId)) {
        rail.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerCancel = () => {
      dragRef.current.active = false;
      dragRef.current.moved = false;
    };

    const handleClick = (event: MouseEvent) => {
      if (!dragRef.current.moved) return;
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    };

    const preventDrag = (event: DragEvent) => event.preventDefault();

    rail.addEventListener("wheel", handleWheel, { passive: false });
    rail.addEventListener("pointerdown", handlePointerDown);
    rail.addEventListener("pointermove", handlePointerMove);
    rail.addEventListener("pointerup", handlePointerEnd);
    rail.addEventListener("pointercancel", handlePointerCancel);
    rail.addEventListener("click", handleClick, true);
    rail.addEventListener("dragstart", preventDrag);

    return () => {
      rail.removeEventListener("wheel", handleWheel);
      rail.removeEventListener("pointerdown", handlePointerDown);
      rail.removeEventListener("pointermove", handlePointerMove);
      rail.removeEventListener("pointerup", handlePointerEnd);
      rail.removeEventListener("pointercancel", handlePointerCancel);
      rail.removeEventListener("click", handleClick, true);
      rail.removeEventListener("dragstart", preventDrag);
    };
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 pb-2 ps-4">
      <ul
        ref={railRef}
        aria-label={t("watchBuy.products.featuredTitle")}
        className="scrollbar-hide flex cursor-grab touch-pan-x select-none snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pe-4 active:cursor-grabbing"
      >
        {products.map((product, index) => (
          <ReelProductCard
            key={`${product.variant_id}-${index}`}
            product={product}
          />
        ))}
      </ul>
    </div>
  );
};

export default ReelProductRail;
