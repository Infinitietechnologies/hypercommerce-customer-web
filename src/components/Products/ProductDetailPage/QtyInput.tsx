import { Button, toast } from "@/components/ui";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface QtyInputProps {
  quantity: number;
  setQuantity: (val: number) => void;
  min?: number;
  step?: number;
  max?: number;
  stock?: number;
}

const QtyInput: FC<QtyInputProps> = ({
  quantity,
  setQuantity,
  min = 1,
  step = 1,
  max = 9999,
  stock = 9999,
}) => {
  const { t } = useTranslation();

  const handleChange = (newQty: number) => {
    if (newQty < min) {
      toast({
        title: t("min_quantity_error_title"),
        description: t("min_quantity_error_description", { min }),
        color: "danger",
      });
      return;
    }

    if (newQty > max) {
      toast({
        title: t("max_quantity_error_title"),
        description: t("max_quantity_error_description", { max }),
        color: "danger",
      });
      return;
    }

    if (newQty > stock) {
      toast({
        title: t("stock_limit_error_title"),
        description: t("stock_limit_error_description", { stock }),
        color: "danger",
      });
      return;
    }

    if ((newQty - min) % step !== 0) {
      toast({
        title: t("step_error_title"),
        description: t("step_error_description", { step }),
        color: "danger",
      });
      return;
    }

    setQuantity(newQty);
  };

  const decrement = () => handleChange(quantity - step);
  const increment = () => handleChange(quantity + step);

  return (
    <div
      id="qty-input"
      className="inline-flex h-10 items-center overflow-hidden rounded-medium border border-divider bg-content1"
    >
      <Button
        isIconOnly
        color="default"
        variant="light"
        onPress={decrement}
        size="sm"
        aria-label={t("decrease_quantity", "Decrease quantity")}
        isDisabled={quantity <= min}
        className="h-full min-w-10 rounded-none bg-transparent p-0 text-foreground shadow-none hover:bg-content2 disabled:text-foreground/30"
      >
        <span aria-hidden="true" className="text-lg font-semibold leading-none">
          −
        </span>
      </Button>
      <span className="min-w-9 text-center text-sm font-bold tabular-nums text-foreground">
        {quantity}
      </span>
      <Button
        isIconOnly
        color="default"
        variant="light"
        onPress={increment}
        size="sm"
        aria-label={t("increase_quantity", "Increase quantity")}
        className="h-full min-w-10 rounded-none bg-transparent p-0 text-foreground shadow-none hover:bg-content2"
      >
        <span aria-hidden="true" className="text-lg font-semibold leading-none">
          +
        </span>
      </Button>
    </div>
  );
};

export default QtyInput;
