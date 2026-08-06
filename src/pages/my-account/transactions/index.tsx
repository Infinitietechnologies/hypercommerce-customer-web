import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import TransactionTable from "@/components/Tables/TransactionTable";
import { ErrorState } from "@/components/ui";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getSettings, getTransactions, getUserData } from "@/routes/api";
import { NextPageWithLayout } from "@/types";
import {
  PaginatedResponse,
  Transaction,
  TransactionQueryArgs,
  userData,
} from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { loadTranslations } from "../../../../i18n";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";
import { serverSideAuthGuard } from "@/guards/authGuard";
import { useRouter } from "next/router";

type TransactionsPageProps = {
  initialUserData: userData;
  transactions: Transaction[];
  total: number;
  initialQuery: TransactionQueryArgs;
  error?: string;
};

const perPage = 8;

const TransactionsPage: NextPageWithLayout<TransactionsPageProps> = ({
  transactions,
  total,
  initialQuery,
  error,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <PageHead pageTitle={t("pageTitle.transactions")} />

      <MyBreadcrumbs
        breadcrumbs={[
          {
            href: "/my-account/transactions",
            label: t("pageTitle.transactions"),
          },
        ]}
      />

      
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <PageHeader
              title={t("pages.transactionsPage.header.title")}
              subtitle={t("pages.transactionsPage.header.subtitle")}
            />
          </div>

          {/* Table */}
          {error ? (
            <ErrorState
              title={t("pages.transactionsPage.errorTitle", "Couldn't load transactions")}
              description={error}
              retryLabel={t("retry", "Retry")}
              onRetry={() =>
                  router.replace(router.asPath, undefined, { scroll: false })
                }
            />
          ) : (
            <TransactionTable
              initialTransactions={transactions}
              initialTotal={total}
              per_page={perPage}
              initialQuery={initialQuery}
            />
          )}
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
          payment_status = "",
          page = "1",
          transaction_type = "",
          search = "",
        } = context.query;

        const response: PaginatedResponse<Transaction[]> =
          await getTransactions({
            payment_status:
              typeof payment_status === "string" ? payment_status : "",
            page: typeof page === "string" ? page : "1",
            search: typeof search === "string" ? search : "",
            per_page: perPage,
            access_token,
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
                payment_status,
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
            },
          };
        }
      } catch (error) {
        console.error("Error fetching wallet transactions:", error);

        return {
          props: {
            transactions: [],
            initialSettings: null,
            total: 0,
          },
        };
      }
    }
  : undefined;

export default TransactionsPage;
