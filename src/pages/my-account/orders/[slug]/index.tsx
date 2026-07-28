import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { GetServerSideProps } from "next";
import { Order } from "@/types/ApiResponse";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getSpecificOrders, getSettings } from "@/routes/api";
import { NextPageWithLayout } from "@/types";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import OrderDetailPageView from "@/views/OrderDetailView";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui";
import useSWR from "swr";
import { loadTranslations } from "../../../../../i18n";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";
import { getCookie } from "@/lib/cookies";
import { loginRedirect } from "@/guards/authGuard";

interface OrderDetailsPageProps {
  order?: Order;
  error?: string;
  isSSR: boolean;
}


// SWR fetcher function
const fetchOrderDetails = async (slug: string) => {
  const access_token = getCookie<string>("access_token") || "";
  const response = await getSpecificOrders({
    slug,
    access_token: access_token,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch order details");
  }
  return response.data;
};

const OrderDetailsPage: NextPageWithLayout<OrderDetailsPageProps> = ({
  order: initialOrder,
  error: initialError,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { slug } = router.query;

  const shouldFetch = typeof window !== "undefined" && !!slug;
  const {
    data: clientOrder,
    error: clientError,
    isLoading,
  } = useSWR(
    shouldFetch ? `/api/orders/detail/${slug}` : null,
    () => fetchOrderDetails(slug as string),
    {
      fallbackData: initialOrder,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      refreshInterval: 10000,
    }

  );

  const order = clientOrder || initialOrder;
  const error = clientError ? clientError.message : initialError;

  // Common layout wrapper
  const renderContent = (content: React.ReactNode) => (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/orders", label: t("pageTitle.orders") },
          { href: "#", label: t("pages.order.details") },
        ]}
      />

      <PageHead pageTitle={`${t("order")} #${order?.id || ""}`} />

      
        <div className="w-full">
          <PageHeader
            title={t("pages.order.details")}
            subtitle={t("pages.order.detailsSubtitle")}
          />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">{content}</div>
          </div>
        </div>
      
    </>
  );

  // Loading state (skeleton mirroring the detail layout)
  const isClientLoading = isLoading && !order;

  if (isClientLoading) {
    return renderContent(
      <div className="grid w-full grid-cols-1 gap-4 text-left lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-large" />
          <Skeleton className="h-20 w-full rounded-large" />
          <Skeleton className="h-40 w-full rounded-large" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-large" />
          <Skeleton className="h-24 w-full rounded-large" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return renderContent(
      <ErrorState
        title={t("pages.order.errorLoading")}
        description={error}
        retryLabel={t("retry", "Retry")}
        onRetry={() => router.reload()}
      />
    );
  }

  // Order not found
  if (!order) {
    return renderContent(
      <EmptyState
        icon={
          <Icon icon="solar:box-linear" width={40} height={40} className="text-primary-600" />
        }
        title={t("pages.order.notFound")}
        description={t("pages.order.notFoundDesc")}
        actionLabel={t("pages.order.backToList")}
        onAction={() => router.push("/my-account/orders")}
      />
    );
  }

  // Success
  return <OrderDetailPageView order={order} />;
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        if (!access_token) {
          return {
            redirect: {
              destination: loginRedirect(context),
              permanent: false,
            },
          };
        }
        const { slug } = context.params || {};
        await loadTranslations(context);

        if (!slug || typeof slug !== "string") {
          return {
            props: {
              order: null,
              error: "Invalid order identifier",
            },
          };
        }
        const response = await getSpecificOrders({ slug, access_token });
        const market = getMarketFromContext(context);
        const settings = await getSettings({ market });

        if (response.success && response.data) {
          return {
            props: { order: response.data, initialSettings: settings.data, isSSR: true },
          };
        } else {
          return {
            props: {
              order: null,
              initialSettings: settings.data,
              error: response.message || "Failed to fetch order details",
              isSSR: true,
            },
          };
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        return {
          props: {
            order: null,
            initialSettings: null,
            error: "Unable to load order details. Please try again later.",
            isSSR: true,
          },
        };
      }
    }
  : undefined;

export default OrderDetailsPage;
