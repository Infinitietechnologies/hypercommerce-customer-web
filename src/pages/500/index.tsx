import { ReactNode } from "react";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui";
import { NextPageWithLayout } from "@/types";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

const Custom500: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <>
      <PageHead pageTitle={t("pageTitle.500", { defaultValue: "Something went wrong" })} />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-50">
          <Icon
            icon="solar:danger-triangle-linear"
            className="text-4xl text-danger"
          />
        </div>

        <p className="mt-6 text-6xl font-extrabold tracking-tight text-foreground">
          500
        </p>
        <h1 className="mt-2 text-lg font-bold text-foreground">
          {t("general.error.title")}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          {t("general.error.somethingWentWrong")}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            color="primary"
            className="font-semibold"
            onPress={() => router.reload()}
            startContent={
              <Icon icon="solar:refresh-linear" className="text-lg" />
            }
          >
            {t("common.retry")}
          </Button>
          <Button
            variant="bordered"
            className="font-semibold"
            onPress={() => router.push("/")}
            startContent={
              <Icon icon="solar:home-2-linear" className="text-lg" />
            }
          >
            {t("pages.notFound.home.title", { defaultValue: "Go to home" })}
          </Button>
        </div>
      </div>
    </>
  );
};

Custom500.getLayout = (page: ReactNode) => page;

export default Custom500;
