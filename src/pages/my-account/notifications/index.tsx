import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Chip,
  Pagination,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState } from "@/components/ui";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import PageHead from "@/SEO/PageHead";
import { NextPageWithLayout } from "@/types";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/routes/api";
import { getNotificationRedirectUrl } from "@/helpers/notificationUrl";
import type { GetServerSideProps } from "next";
import { serverSideAuthGuard } from "@/guards/authGuard";
import { isSSR } from "@/helpers/getters";
import { loadTranslations } from "../../../../i18n";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotificationMetadata = {
  order_id?: number;
  order_slug?: string;
  order_item_id?: number;
  status_old?: string;
  status_new?: string;
  status?: string;
  total?: number;
  type?: string;
  slug?: string;
  redirect_url?: string;
  [key: string]: unknown;
};

interface Notification {
  id: string;
  user_id: number;
  store_id: number | null;
  order_id: number | null;
  type: string;
  sent_to: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: NotificationMetadata | string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const WALLET_TYPES = [
  "wallet_transaction",
  "withdrawal_request",
  "withdrawal_process",
];
const PER_PAGE = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getNotificationIcon = (type: string) => {
  if (type === "new_order")
    return <Icon icon="solar:bag-check-linear" className="w-5 h-5 text-primary-600" />;
  if (type === "order_update")
    return <Icon icon="solar:box-linear" className="w-5 h-5 text-primary-600" />;
  if (type === "return_order" || type === "return_order_update")
    return <Icon icon="solar:refresh-linear" className="w-5 h-5 text-primary-600" />;
  if (WALLET_TYPES.includes(type))
    return <Icon icon="solar:wallet-linear" className="w-5 h-5 text-primary-600" />;
  return <Icon icon="solar:bell-linear" className="w-5 h-5 text-primary-600" />;
};

// Redesign uses a single warm amber-tint tile for every notification type.
const getIconBg = () => "bg-primary-50";

const formatTime = (dateStr: string) => {
  try {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    const diffSecs = Math.round((past - now) / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, "second");
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
    return rtf.format(diffDays, "day");
  } catch {
    return dateStr;
  }
};

// ── SWR fetcher ───────────────────────────────────────────────────────────────
const notificationsFetcher = async (key: string) => {
  const page = parseInt(key.split("?page=")[1] || "1");
  const response = await getNotifications({ page, per_page: PER_PAGE });
  if (response.success && response.data) {
    return {
      notifications: (response.data.notifications ?? []) as Notification[],
      pagination: response.data.pagination as PaginationInfo,
    };
  }
  throw new Error(response.message || "Failed to fetch notifications");
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const NotificationSkeleton = () => (
  <div className="flex items-start gap-4 p-4 rounded-large bg-default-50 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-default-200 flex-none" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-default-200 rounded w-3/4" />
      <div className="h-3 bg-default-200 rounded w-full" />
      <div className="h-3 bg-default-200 rounded w-1/3" />
    </div>
  </div>
);

// ── Notification Row ──────────────────────────────────────────────────────────
const NotificationItem: React.FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}> = ({ notification, onRead, onNavigate }) => {
  const redirectUrl = getNotificationRedirectUrl(
    notification.metadata as NotificationMetadata | undefined,
    notification.type,
  );
  const isClickable = Boolean(redirectUrl);

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (redirectUrl) {
      onNavigate(redirectUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-medium border p-4 text-start transition-colors ${
        notification.is_read
          ? "border-divider bg-content1"
          : "border-primary-200 bg-primary-50/40"
      } ${isClickable ? "cursor-pointer hover:border-primary" : "cursor-pointer hover:border-default-300"}`}
    >
      {/* Type Icon */}
      <div className={`relative flex h-9 w-9 flex-none items-center justify-center rounded-medium ${getIconBg()}`}>
        {getNotificationIcon(notification.type)}
        {!notification.is_read && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-content1 bg-primary" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={`text-[13px] leading-snug line-clamp-1 ${
            notification.is_read
              ? "font-medium text-foreground"
              : "font-semibold text-foreground"
          }`}
        >
          {notification.title}
        </div>
        <p className="mt-0.5 text-xs text-default-500 line-clamp-2">
          {notification.message}
        </p>
      </div>

      {/* Time */}
      <div className="flex-none whitespace-nowrap text-[11px] text-default-500">
        {formatTime(notification.created_at)}
      </div>
    </button>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const NotificationsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(
    parseInt(router.query.page as string) || 1,
  );
  const [markingAll, setMarkingAll] = useState(false);

  // Keep page in sync with URL
  useEffect(() => {
    const page = parseInt(router.query.page as string) || 1;
    const timer = setTimeout(() => setCurrentPage(page), 0);
    return () => clearTimeout(timer);
  }, [router.query.page]);

  const swrKey = `/api/notifications?page=${currentPage}`;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(swrKey, notificationsFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  });

  const notifications = data?.notifications ?? [];
  const pagination = data?.pagination;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    (url: string) => {
      // An absolute link comes from the notification payload — open it away
      // from the storefront session as FirebaseInitializer does.
      if (/^https?:\/\//i.test(url)) {
        window.open(url, "_blank", "noopener,noreferrer");

        return;
      }
      router.push(url);
    },
    [router],
  );

  const handleMarkRead = useCallback(
    async (id: string) => {
      // Optimistic update
      revalidate(
        (prev) =>
          prev
            ? {
                ...prev,
                notifications: prev.notifications.map((n) =>
                  n.id === id ? { ...n, is_read: true } : n,
                ),
              }
            : prev,
        false,
      );
      await markNotificationRead(id);
    },
    [revalidate],
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    // Optimistic update
    revalidate(
      (prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) => ({
                ...n,
                is_read: true,
              })),
            }
          : prev,
      false,
    );
    await markAllNotificationsRead();
    setMarkingAll(false);
  }, [revalidate]);

  const handlePageChange = (page: number) => {
    router.push(
      {
        pathname: "/my-account/notifications",
        query: { ...router.query, page },
      },
      undefined,
      { shallow: true },
    );
  };

  // ── Render states ────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading && !data) {
      return (
        <div className="space-y-3">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState
          title={t("pages.notifications.errorTitle", "Couldn't load notifications")}
          description={t(
            "pages.notifications.errorDescription",
            "Something went wrong. Please try again.",
          )}
          retryLabel={t("retry", "Retry")}
          onRetry={() => revalidate()}
        />
      );
    }

    if (!notifications.length) {
      return (
        <EmptyState
          icon={
            <Icon icon="solar:bell-linear" width={40} height={40} className="text-primary-600" />
          }
          title={t("pages.notifications.emptyTitle", "No notifications yet")}
          description={t(
            "pages.notifications.emptyDescription",
            "You're all caught up! Check back later.",
          )}
        />
      );
    }

    return (
      <>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleMarkRead}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {pagination && pagination.total > pagination.per_page && (
          <div className="mt-8 flex justify-center">
            <Pagination
              total={Math.ceil(pagination.total / pagination.per_page)}
              initialPage={pagination.current_page}
              page={currentPage}
              showControls
              size="sm"
              isCompact
              classNames={{
                item: "text-sm",
                cursor: "text-sm",
                next: "text-sm",
                prev: "text-sm",
              }}
              onChange={handlePageChange}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <PageHead pageTitle={t("userLayout.notifications", "Notifications")} />
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account", label: t("pageTitle.my-account", "My Account") },
          {
            href: "/my-account/notifications",
            label: t("userLayout.notifications", "Notifications"),
          },
        ]}
      />


        <div className="w-full">
          <PageHeader
            title={t("userLayout.notifications", "Notifications")}
            subtitle={t(
              "pages.notifications.subtitle",
              "Stay updated with your orders, wallet, and more",
            )}
            highlightText={
              unreadCount > 0
                ? t("pages.notifications.unreadCount", {
                    count: unreadCount,
                    defaultValue: "{{count}} unread",
                  })
                : undefined
            }
          />

          <Card shadow="none" radius="lg" className="border border-divider">
            <CardBody className="p-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:bell-linear" className="w-4 h-4 text-default-500" />
                  <span className="text-sm font-medium text-default-700">
                    {t("pages.notifications.totalCount", {
                      count: pagination?.total ?? notifications.length,
                      defaultValue: "{{count}} Total",
                    })}
                  </span>
                  {unreadCount > 0 && (
                    <Chip size="sm" color="primary" variant="flat" classNames={{ base: "text-xs" }}>
                      {t("pages.notifications.newCount", {
                        count: unreadCount,
                        defaultValue: "{{count}} new",
                      })}
                    </Chip>
                  )}
                </div>

                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    isDisabled={markingAll}
                    startContent={
                      markingAll ? (
                        <Spinner size="sm" />
                      ) : (
                        <Icon icon="solar:check-read-linear" className="w-4 h-4" />
                      )
                    }
                    onPress={handleMarkAllRead}
                    className="text-xs"
                  >
                    {t("pages.notifications.markAllRead", "Mark all read")}
                  </Button>
                )}
              </div>

              {renderContent()}
            </CardBody>
          </Card>
        </div>
      
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      const guard = await serverSideAuthGuard(context);

      if (guard) return guard;


      await loadTranslations(context);
      return { props: {} };
    }
  : undefined;

export default NotificationsPage;
