import { ReactNode } from "react";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui";
import { NextPageWithLayout } from "@/types";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

const Custom404: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <>
      <PageHead pageTitle={t("pageTitle.404")} />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <Icon
            icon="solar:map-arrow-square-linear"
            className="text-4xl text-primary-600"
          />
        </div>

        <p className="mt-6 text-6xl font-extrabold tracking-tight text-foreground">
          404
        </p>
        <h1 className="mt-2 text-lg font-bold text-foreground">
          {t("pages.notFound.heading", { defaultValue: "Page not found" })}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          {t("pages.notFound.subheading", {
            defaultValue:
              "The page you're looking for doesn't exist or has been moved.",
          })}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            color="primary"
            className="font-semibold"
            onPress={() => router.push("/")}
            startContent={<Icon icon="solar:home-2-linear" className="text-lg" />}
          >
            {t("pages.notFound.home.title", { defaultValue: "Go to home" })}
          </Button>
          <Button
            variant="bordered"
            className="font-semibold"
            onPress={() => router.push("/products/search")}
            startContent={<Icon icon="solar:bag-4-linear" className="text-lg" />}
          >
            {t("browse_products", { defaultValue: "Browse products" })}
          </Button>
        </div>
      </div>
    </>
  );
};

Custom404.getLayout = (page: ReactNode) => page;

export default Custom404;
