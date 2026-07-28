import { Button, toast } from "@/components/ui";
import { Icon } from "@iconify/react";
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
      className="inline-flex items-center gap-1 rounded-xl border border-divider bg-content1 p-1"
    >
      <Button
        radius="lg"
        isIconOnly
        variant="light"
        onPress={decrement}
        size="sm"
        aria-label={t("decrease_quantity", "Decrease quantity")}
        isDisabled={quantity <= min}
        className="text-primary-600"
      >
        <Icon icon="solar:minus-square-linear" className="text-xl" />
      </Button>
      <span className="min-w-9 text-center text-base font-bold tabular-nums">
        {quantity}
      </span>
      <Button
        radius="lg"
        isIconOnly
        variant="light"
        onPress={increment}
        size="sm"
        aria-label={t("increase_quantity", "Increase quantity")}
        className="text-primary-600"
      >
        <Icon icon="solar:add-square-linear" className="text-xl" />
      </Button>
    </div>
  );
};

export default QtyInput;
