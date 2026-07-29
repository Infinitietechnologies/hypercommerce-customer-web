import { Button } from "@/components/ui";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const CartPageEmpty = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="max-w-md w-full px-4 py-6 text-center flex flex-col items-center gap-4">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-primary-50">
          <Icon
            icon="solar:cart-large-2-linear"
            className="text-5xl text-primary-600"
          />
        </div>

        <h2 className="text-2xl font-bold text-foreground">
          {t("cart.cartEmptyTitle")}
        </h2>
        <p className="text-sm text-foreground/60">
          {t("cart.cartEmptyDescription")}
        </p>

        <div className="w-full space-y-3 pt-2">
          <Button
            color="primary"
            fullWidth
            onPress={() => router.push("/")}
            startContent={<Icon icon="solar:bag-4-linear" className="text-lg" />}
          >
            {t("cart.backToHome")}
          </Button>
          <Button
            variant="bordered"
            fullWidth
            onPress={() => router.push("/categories")}
            startContent={
              <Icon icon="solar:widget-4-linear" className="text-lg" />
            }
          >
            {t("cart.browseCategories")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPageEmpty;
