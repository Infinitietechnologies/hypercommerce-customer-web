import { default as WalletCardLoading } from "@/components/Cart/WalletCard";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { setUserDataRedux } from "@/lib/redux/slices/authSlice";
import { getSettings, getUserData, getWalletTransactions } from "@/routes/api";
import {
  WalletTransaction,
  userData,
  PaginatedResponse,
  TransactionQueryArgs,
} from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { NextPageWithLayout } from "@/types";
import { loadTranslations } from "../../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import WalletTransactionTable from "@/components/Tables/WalletTransactionTable";
import { ErrorState, toast } from "@/components/ui";
import { serverSideAuthGuard } from "@/guards/authGuard";
import { useRouter } from "next/router";
import { getWalletTransaction } from "@/services/wallet";

type WalletPageProps = {
  initialUserData: userData;
  transactions: WalletTransaction[];
  total: number;
  initialQuery: TransactionQueryArgs;
  error?: string;
};

const perPage = 5;

const WalletCard = dynamic(() => import("@/components/Cart/WalletCard"), {
  ssr: false,
  loading: () => <WalletCardLoading loading={true} />,
});

const fetchUserData = async () => {
  const access_token = localStorage.getItem("access_token");
  if (!access_token) console.error("No access token");
  const response = await getUserData();
  return response.data;
};

const WalletPage: NextPageWithLayout<WalletPageProps> = ({
  transactions,
  total,
  initialUserData,
  initialQuery,
  error,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const router = useRouter();
  const xenditTransactionId = Number(router.query.transaction);
  const isConfirmingXendit =
    router.isReady &&
    router.query.xendit_return === "1" &&
    Number.isInteger(xenditTransactionId) &&
    xenditTransactionId > 0;

  const { data: userData, mutate: refreshUserData } = useSWR(
    !isSSR() ? "user-data" : null,
    fetchUserData,
    {
      fallbackData: initialUserData || {},
    }
  );

  useEffect(() => {
    if (userData) {
      dispatch(setUserDataRedux(userData));
    }
  }, [userData, dispatch]);

  useEffect(() => {
    if (!router.isReady || router.query.xendit_return !== "1") return;

    const transactionId = xenditTransactionId;
    if (!Number.isInteger(transactionId) || transactionId <= 0) return;

    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const finish = async (status: "completed" | "failed" | "pending") => {
      if (!active) return;
      if (status === "completed") {
        await refreshUserData();
        toast({ title: t("deposit.success.title"), color: "success" });
      } else if (status === "failed") {
        toast({ title: t("deposit.error.title"), color: "danger" });
      } else {
        toast({ title: t("checkout.paymentPending"), color: "warning" });
      }

      void router.replace("/my-account/wallet", undefined, {
        shallow: true,
        scroll: false,
      });
    };

    const poll = async () => {
      if (!active) return;
      const response = await getWalletTransaction(transactionId);
      const status = response?.data?.status;

      if (status === "completed") {
        await finish("completed");
        return;
      }

      if (status === "failed" || status === "cancelled") {
        await finish("failed");
        return;
      }

      attempts += 1;
      if (attempts >= 30) {
        await finish("pending");
        return;
      }

      timer = setTimeout(poll, 3000);
    };

    timer = setTimeout(poll, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refreshUserData, router, router.isReady, router.query.transaction, router.query.xendit_return, t, xenditTransactionId]);

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/wallet", label: t("pageTitle.wallet") },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.wallet")} />

      
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center gap-4 justify-between">
            <PageHeader
              title={t("pages.walletPage.header.title")}
              subtitle={t("pages.walletPage.header.subtitle")}
            />
            {isSSR() && (
              <div className="text-xs sm:text-sm text-default-500">
                {t("pages.walletPage.totalFound", { total })}
              </div>
            )}
          </div>

          <div className="w-full flex flex-col gap-2">
            {isConfirmingXendit ? (
              <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
                {t("payments.xendit.confirmingWallet")}
              </div>
            ) : null}
            <div className="bg-amber-50/10 backdrop-blur-lg rounded-xl p-4 shadow-md">
          <WalletCard loading={false} />
        </div>

            {/* Table */}
            {error ? (
              <ErrorState
                title={t("pages.walletPage.errorTitle", "Couldn't load transactions")}
                description={error}
                retryLabel={t("retry", "Retry")}
                onRetry={() =>
                  router.replace(router.asPath, undefined, { scroll: false })
                }
              />
            ) : (
              <WalletTransactionTable
                initialTransactions={transactions}
                initialTotal={total}
                per_page={perPage}
                tableTitle={t("pages.walletPage.table.title")}
                initialQuery={initialQuery}
              />
            )}
          </div>
        </div>
      
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const guard = await serverSideAuthGuard(context);

        if (guard) return guard;

        const access_token = (await getAccessTokenFromContext(context)) || "";
        const res = await getUserData({ access_token });
        await loadTranslations(context);

        const {
          status = "",
          page = "1",
          transaction_type = "",
          query = "",
        } = context.query;

        const response: PaginatedResponse<WalletTransaction[]> =
          await getWalletTransactions({
            status: typeof status === "string" ? status : "",
            transaction_type:
              typeof transaction_type === "string" ? transaction_type : "",
            page: typeof page === "string" ? page : "1",
            per_page: perPage,
            access_token,
            query: typeof query === "string" ? query : "",
          });

        const market = getMarketFromContext(context);
        const settings = await getSettings({ market });

        if (response.success) {
          return {
            props: {
              initialUserData: res.data,
              transactions: response.data.data || [],
              initialSettings: settings.data,
              total: response.data.total || 0,
              initialQuery: {
                status,
                page: parseInt(typeof page === "string" ? page : "1"),
                transaction_type,
              },
            },
          };
        } else {
          return {
            props: {
              transactions: [],
              initialSettings: settings.data,
              total: 0,
              error: response.message || "Failed to fetch wallet transactions",
              initialQuery: {},
            },
          };
        }
      } catch (error) {
        console.error("Error fetching wallet transactions:", error);

        return {
          props: {
            transactions: [],
            initialSettings: null,
            initialQuery: {},
            total: 0,
          },
        };
      }
    }
  : undefined;

export default WalletPage;
