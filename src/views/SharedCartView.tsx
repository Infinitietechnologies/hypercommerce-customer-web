import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { Button, EmptyState, ErrorState, Sheet, Skeleton, toastError, toastSuccess } from "@/components/ui";
import { useSharedCart } from "@/features/cartSharing/hooks/useSharedCart";
import { updateCartData } from "@/helpers/updators";
import type { RootState } from "@/lib/redux/store";
import { authSheetStore } from "@/stores/authSheetStore";

const SharedCartView = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [isDismissed, setIsDismissed] = useState(false);
  const [authHandoff, setAuthHandoff] = useState(false);
  const isOpen = router.isReady && !isDismissed && (!authHandoff || isLoggedIn);
  const { status, preview, isImporting, load, importItems } = useSharedCart(
    token,
    router.isReady && isLoggedIn,
  );
  const previewItems = preview?.items ?? [];

  const signIn = () => {
    setAuthHandoff(true);
    window.requestAnimationFrame(() => {
      authSheetStore.open({ next: router.asPath });
    });
  };

  const addToCart = async () => {
    try {
      const imported = await importItems();
      if (!imported) {
        toastError(t("cartShare.importFailed"));
        return;
      }
      await updateCartData(true, false);
      toastSuccess(t("cartShare.importSuccess"));
      await router.push("/cart/");
    } catch {
      toastError(t("cartShare.importFailed"));
    }
  };

  const close = () => {
    setIsDismissed(true);
    void router.push("/");
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-site items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid size-16 place-items-center rounded-large bg-primary-50 text-primary-600">
          <Icon icon="solar:cart-large-2-linear" width={32} height={32} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("cartShare.openTitle")}</h1>
        <p className="max-w-md text-sm text-default-500">{t("cartShare.openDescription")}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {authHandoff && !isLoggedIn ? (
            <Button variant="bordered" className="text-sm font-semibold" onPress={() => setAuthHandoff(false)}>
              {t("cartShare.previewTitle")}
            </Button>
          ) : null}
          <Button as={Link} href="/" variant="bordered" className="text-sm font-semibold">
            {t("cartShare.continueShopping")}
          </Button>
        </div>
      </div>

      <Sheet
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) close(); }}
        size="lg"
        backdrop="blur"
        classNames={{
          backdrop: "z-sheet",
          wrapper: "z-sheet",
          base: "border border-divider bg-content1 shadow-overlay",
          closeButton: "end-3 top-3 rounded-medium p-2 text-base text-default-500 hover:bg-content2 hover:text-foreground",
        }}
        title={
          <div className="pe-8">
            <h2 className="text-xl font-bold text-foreground">{t("cartShare.previewTitle")}</h2>
            <p className="mt-1 text-sm font-normal text-default-500">
              {preview?.ownerName
                ? t("cartShare.fromPerson", { name: preview.ownerName })
                : t("cartShare.previewDescription")}
            </p>
          </div>
        }
        footer={status === "ready" && isLoggedIn ? (
          <Button
            fullWidth
            color="primary"
            isLoading={isImporting}
            className="font-semibold"
            startContent={<Icon icon="solar:cart-plus-linear" width={19} height={19} />}
            onPress={() => void addToCart()}
          >
            {t("cartShare.addAll", { count: preview?.totalQuantity ?? 0 })}
          </Button>
        ) : null}
      >
        {router.isReady && !token ? (
          <ErrorState
            title={t("cartShare.invalidLinkTitle")}
            description={t("cartShare.invalidLinkDescription")}
          />
        ) : !isLoggedIn ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-content2 text-primary-600">
              <Icon icon="solar:lock-keyhole-linear" width={30} height={30} />
            </div>
            <p className="text-base font-bold text-foreground">{t("cartShare.signInTitle")}</p>
            <p className="max-w-sm text-sm text-default-500">{t("cartShare.signInDescription")}</p>
            <Button color="primary" className="mt-2 font-semibold" onPress={signIn}>
              {t("cartShare.signIn")}
            </Button>
          </div>
        ) : status === "idle" || status === "loading" ? (
          <div className="space-y-3 py-2" aria-label={t("cartShare.loading")}>
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-large border border-divider p-3">
                <Skeleton className="size-16 shrink-0 rounded-medium" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-small" />
                  <Skeleton className="h-3 w-1/2 rounded-small" />
                </div>
              </div>
            ))}
          </div>
        ) : status === "error" ? (
          <ErrorState
            title={t("cartShare.loadFailedTitle")}
            description={t("cartShare.loadFailedDescription")}
            retryLabel={t("cartShare.retry")}
            onRetry={() => void load()}
          />
        ) : status === "empty" ? (
          <EmptyState
            icon={<Icon icon="solar:cart-large-2-linear" width={42} height={42} />}
            title={t("cartShare.emptyTitle")}
            description={t("cartShare.emptyDescription")}
          />
        ) : (
          <div className="space-y-3 pb-2">
            <>
                <p className="text-sm font-semibold text-default-500">
                  {t("cartShare.itemCount", { count: preview?.totalQuantity ?? 0 })}
                </p>
                <ul className="max-h-96 space-y-3 overflow-y-auto pe-1">
                  {previewItems.map((item) => (
                    <li key={item.id} className="flex gap-3 rounded-large border border-divider bg-content1 p-3 shadow-sm">
                      {item.productSlug ? (
                        <Link
                          href={`/products/${encodeURIComponent(item.productSlug)}/`}
                          aria-label={item.name}
                          className="shrink-0 rounded-medium focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="size-16 rounded-medium bg-content2 object-contain" />
                          ) : (
                            <span className="grid size-16 place-items-center rounded-medium bg-content2 text-default-500">
                              <Icon icon="solar:box-linear" width={24} height={24} />
                            </span>
                          )}
                        </Link>
                      ) : item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="size-16 shrink-0 rounded-medium bg-content2 object-contain" />
                      ) : (
                        <div className="grid size-16 shrink-0 place-items-center rounded-medium bg-content2 text-default-500">
                          <Icon icon="solar:box-linear" width={24} height={24} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {item.productSlug ? (
                          <Link
                            href={`/products/${encodeURIComponent(item.productSlug)}/`}
                            className="line-clamp-2 text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:rounded-small focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</p>
                        )}
                        {item.variant ? <p className="mt-1 text-xs text-default-500">{item.variant}</p> : null}
                        {item.store ? <p className="mt-1 text-xs text-default-500">{item.store}</p> : null}
                        <p className="mt-2 text-xs font-semibold text-foreground">
                          {t("cartShare.quantity", { count: item.quantity })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
            </>
            <p className="text-xs leading-5 text-default-500">{t("cartShare.importHint")}</p>
          </div>
        )}
      </Sheet>
    </main>
  );
};

export default SharedCartView;
