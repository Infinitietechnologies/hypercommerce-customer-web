import { Icon } from "@iconify/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";

interface ProductCardActionProps {
  appearance?: "showcase" | "standard" | "compact" | "minimal";
  isLoading: boolean;
  isOutOfStock: boolean;
  onPress: () => void;
}

const ProductCardAction: FC<ProductCardActionProps> = ({
  appearance = "showcase",
  isLoading,
  isOutOfStock,
  onPress,
}) => {
  const { t } = useTranslation();
  const label = isOutOfStock ? t("out_of_stock") : t("a11y.add_to_cart");
  const shortLabel = isOutOfStock ? t("out_of_stock") : t("add");

  if (appearance === "compact") {
    return (
      <Button
        aria-label={label}
        className="h-10 w-full px-3 text-xs font-semibold"
        color="primary"
        isDisabled={isOutOfStock}
        isLoading={isLoading}
        startContent={
          isLoading ? undefined : (
            <Icon icon="solar:add-circle-linear" className="text-lg" />
          )
        }
        variant="flat"
        onPress={onPress}
      >
        {shortLabel}
      </Button>
    );
  }

  if (appearance === "minimal") {
    return (
      <Button
        aria-label={label}
        className="h-9 w-full bg-content2 px-3 text-xs font-semibold"
        color="primary"
        isDisabled={isOutOfStock}
        isLoading={isLoading}
        variant="light"
        onPress={onPress}
      >
        {shortLabel}
      </Button>
    );
  }

  if (appearance === "standard") {
    return (
      <Button
        aria-label={label}
        className="h-10 w-full text-xs font-semibold"
        color="primary"
        isDisabled={isOutOfStock}
        isLoading={isLoading}
        startContent={
          isLoading ? undefined : (
            <Icon icon="solar:cart-plus-linear" className="text-lg" />
          )
        }
        variant="bordered"
        onPress={onPress}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      aria-label={label}
      className="w-full text-sm font-semibold"
      color="primary"
      isDisabled={isOutOfStock}
      isLoading={isLoading}
      startContent={
        isLoading ? undefined : (
          <Icon icon="solar:cart-plus-linear" className="text-lg" />
        )
      }
      onPress={onPress}
    >
      {label}
    </Button>
  );
};

export default ProductCardAction;
