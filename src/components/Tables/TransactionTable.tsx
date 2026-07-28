import { FC, useState } from "react";
import {
  Pagination,
  Chip,
  Select,
  SelectItem,
  Input,
  Skeleton,
} from "@heroui/react";
import { TransactionQueryArgs, Transaction } from "@/types/ApiResponse";
import { getTransactions } from "@/routes/api";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import {
  getFormattedDate,
  getPageFromUrl,
  getQueryParamFromUrl,
  isSSR,
} from "@/helpers/getters";
import { debounce } from "lodash";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

interface TransactionTableProps {
  initialTransactions?: Transaction[];
  initialTotal?: number;
  initialQuery: TransactionQueryArgs;
  per_page: number;
  tableTitle?: string;
}

const fetcher = async (params: {
  page: number | string;
  per_page: number | string;
  payment_status?: string;
  transaction_type?: string;
  search?: string;
}) => {
  // Map params to getTransactions API
  const apiParams = {
    payment_status: params.payment_status,
    page: params.page,
    per_page: params.per_page,
    type: params.transaction_type,
    search: params.search,
  };

  const response = await getTransactions(apiParams);
  return response;
};

const TransactionTable: FC<TransactionTableProps> = ({
  initialTransactions = [],
  initialTotal = 0,
  initialQuery,
  per_page = 10,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(initialQuery?.page ?? getPageFromUrl());
  const [statusFilter, setStatusFilter] = useState(
    initialQuery?.payment_status || getQueryParamFromUrl("payment_status") || ""
  );
  const [transactionTypeFilter, setTransactionTypeFilter] = useState(
    initialQuery?.transaction_type ||
      getQueryParamFromUrl("transaction_type") ||
      ""
  );
  const [searchQuery, setSearchQuery] = useState(
    getQueryParamFromUrl("search") || ""
  );
  const router = useRouter();

  const { data, isLoading } = useSWR(
    [
      {
        page,
        per_page,
        payment_status: statusFilter,
        transaction_type: transactionTypeFilter,
        search: searchQuery,
      },
    ],
    ([params]) => fetcher(params),
    {
      fallbackData: {
        success: true,
        message: "",
        data: {
          data: initialTransactions,
          total: initialTotal,
          current_page: 1,
          per_page,
          last_page: Math.ceil(initialTotal / per_page),
          from: 1,
          to: Math.min(per_page, initialTotal),
          first_page_url: "",
          last_page_url: "",
          next_page_url: null,
          prev_page_url: null,
          path: "",
          links: [],
        },
      },
      revalidateOnFocus: false,
      revalidateOnMount: !isSSR(),
      keepPreviousData: true,
    }
  );

  const transactions = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / per_page);

  const TxnRow = ({ tx }: { tx: Transaction }) => {
    const label =
      tx.order_id != null
        ? `${t("order_id")} #${tx.order_id}`
        : tx.transaction_id || tx.payment_method || t("payment");
    return (
      <div className="flex items-center justify-between gap-3 rounded-medium border border-divider bg-content1 px-4 py-3 transition-colors hover:border-primary">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-foreground">
            {label}
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-default-500">
            {getFormattedDate(tx.created_at)}
            {tx.payment_method ? ` · ${tx.payment_method}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Chip
            size="sm"
            radius="full"
            variant="flat"
            color={
              tx.payment_status === "completed"
                ? "success"
                : tx.payment_status === "pending"
                  ? "warning"
                  : tx.payment_status === "refunded" ||
                      tx.payment_status === "partially_refunded"
                    ? "secondary"
                    : "danger"
            }
            classNames={{ content: "text-[10px] font-semibold capitalize" }}
          >
            {t(tx.payment_status)}
          </Chip>
          <span className="text-[13.5px] font-bold text-foreground">
            {tx.formatted_amount}
          </span>
        </div>
      </div>
    );
  };

  const statusOptions = [
    { value: "", label: t("all_statuses") },
    { value: "completed", label: t("completed") },
    { value: "pending", label: t("pending") },
    { value: "failed", label: t("failed") },
    { value: "refunded", label: t("refunded") },
    { value: "partially_refunded", label: t("partially_refunded") },
  ];

  const typeOptions = [
    { value: "", label: t("all_types") },
    { value: "deposit", label: t("deposit_title") },
    { value: "payment", label: t("payment") },
  ];

  const handleSearchDebounced = debounce((value: string) => {
    setSearchQuery(value);
    handlePageChange({ page: 1, search: value });
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchDebounced(e.target.value);
  };

  const handlePageChange = (args: TransactionQueryArgs) => {
    setPage(args?.page || 1);
    const filteredArgs = Object.fromEntries(
      Object.entries({ ...router.query, ...args }).filter(
        ([, value]) => value !== 0 && value !== "" && value != null
      )
    );
    router.push({ pathname: router.pathname, query: filteredArgs }, undefined, {
      shallow: true,
    });
  };

  const topContent = (
    <div className="flex sm:justify-between w-full sm:items-center flex-col sm:flex-row items-start gap-4">
      <div className="gap-4 w-full flex justify-between">
        <Input
          classNames={{
            base: "max-w-xs min-h-8 h-8",
            inputWrapper: "text-xs min-h-8 h-8",
          }}
          size="sm"
          placeholder={t("search")}
          startContent={
            <Icon
              icon="solar:magnifer-linear"
              className="text-base text-default-400 pointer-events-none shrink-0"
              width={16}
              height={16}
            />
          }
          type="search"
          onChange={handleSearchChange}
          defaultValue={searchQuery}
        />

        <Select
          aria-label={t("select_status")}
          placeholder={t("select_status")}
          selectedKeys={[statusFilter]}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            handlePageChange({ page: 1, payment_status: e.target.value });
          }}
          classNames={{
            base: "max-w-36",
            trigger: "text-xs min-h-8 h-8",
            value: "text-xs",
          }}
        >
          {statusOptions.map((option) => (
            <SelectItem
              classNames={{ title: "text-xs" }}
              key={option.value}
              textValue={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          className="hidden"
          aria-label={t("select_type")}
          placeholder={t("select_type")}
          selectedKeys={[transactionTypeFilter]}
          onChange={(e) => {
            setTransactionTypeFilter(e.target.value);
            handlePageChange({ page: 1, transaction_type: e.target.value });
          }}
          classNames={{
            base: "max-w-28",
            trigger: "text-xs min-h-8 h-8",
            value: "text-xs",
          }}
        >
          {typeOptions.map((option) => (
            <SelectItem
              classNames={{ title: "text-xs" }}
              key={option.value}
              textValue={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {topContent}

      <div className="mt-4 flex flex-col gap-2">
        {isLoading ? (
          Array.from({ length: per_page }).map((_, i) => (
            <Skeleton key={i} className="rounded-medium">
              <div className="h-16 w-full bg-default-200" />
            </Skeleton>
          ))
        ) : transactions.length === 0 ? (
          <div className="py-14 text-center text-sm text-default-500">
            {t("no_transactions_found")}
          </div>
        ) : (
          transactions.map((tx: Transaction) => <TxnRow key={tx.id} tx={tx} />)
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={(page) => handlePageChange({ page })}
            showControls
            isCompact
            size="sm"
            classNames={{
              item: "text-sm",
              cursor: "text-sm",
              next: "text-sm",
              prev: "text-sm",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
