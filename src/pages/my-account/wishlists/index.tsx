import { useState } from "react";
import type { GetServerSideProps } from "next";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { getFavoriteWishlist, toggleFavorite } from "@/routes/api";
import { Wishlist, WishlistItem } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { isSSR } from "@/helpers/getters";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { loginRedirect } from "@/guards/authGuard";
import { loadTranslations } from "../../../../i18n";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHead from "@/SEO/PageHead";
import { toastError } from "@/components/ui";
import { useTranslation } from "react-i18next";

const WishListPageView = dynamic(() => import("@/views/WishListPageView"), {
  ssr: false,
});

const WishlistsPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { data, isLoading, error, mutate } = useSWR(
    "/api/wishlists/favorite",
    async () => {
      const res = await getFavoriteWishlist();
      if (res.success && res.data) return res.data as Wishlist;
      throw new Error(res.message || t("pages.wishlistsPage.errors.fetchFailed"));
    },
    { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 3000 },
  );

  const items = data?.items ?? [];

  const handleRemove = async (item: WishlistItem) => {
    setRemovingId(item.id);
    mutate(
      (prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.id !== item.id),
              items_count: Math.max(0, (prev.items_count || 1) - 1),
            }
          : prev,
      false,
    );
    try {
      const res = await toggleFavorite({
        product_id: item.product.id,
        product_variant_id: item.variant?.id ?? null,
        store_id: item.store.id,
      });
      if (!res.success) {
        toastError(res.message || t("pages.wishlistsPage.errors.removeItem"));
        mutate();
      }
    } catch {
      toastError(t("pages.wishlistsPage.errors.network"));
      mutate();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/wishlists", label: t("pageTitle.wishlists") },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.wishlists")} />

      <WishListPageView
        items={items}
        loading={isLoading && !data}
        error={error ? error.message : undefined}
        removingId={removingId}
        onRemove={handleRemove}
        onRetry={() => mutate()}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      const access_token = (await getAccessTokenFromContext(context)) || "";
      if (!access_token) {
        return {
          redirect: { destination: loginRedirect(context), permanent: false },
        };
      }
      await loadTranslations(context);
      return { props: {} };
    }
  : undefined;

export default WishlistsPage;
