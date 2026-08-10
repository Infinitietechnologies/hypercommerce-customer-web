import { FC } from "react";
import { CartItemAddon } from "@/types/cart";
import { useSettings } from "@/contexts/SettingsContext";

interface CartAddonListProps {
  addons: CartItemAddon[];
  className?: string;
  /** Off in narrow cards where the group label would wrap the chip. */
  showGroupTitle?: boolean;
}

/**
 * "As configured" addon summary for a cart/checkout line — one chip per
 * selected addon: group label, item title, and the addon's price.
 */
const CartAddonList: FC<CartAddonListProps> = ({
  addons,
  className = "",
  showGroupTitle = true,
}) => {
  const { formatPrice } = useSettings();

  if (!addons?.length) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {addons.map((addon) => {
        const groupTitle = addon.group?.title || addon.addon_group_name;
        const itemTitle = addon.item?.title || addon.title;
        const price = Number(addon.price || addon.item?.price || 0);

        return (
          <span
            key={addon.id ?? `${addon.addon_group_id}-${addon.addon_item_id}`}
            className="inline-flex items-center gap-1 rounded-md bg-content2 px-1.5 py-0.5 text-xs leading-snug text-foreground/70"
          >
            {showGroupTitle && groupTitle && (
              <span className="text-foreground/50">{groupTitle}:</span>
            )}
            <span className="font-medium text-foreground/80">{itemTitle}</span>
            {price > 0 && (
              <span className="text-foreground/50">+{formatPrice(price)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default CartAddonList;
