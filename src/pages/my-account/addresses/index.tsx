import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { getPageFromUrl, isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getAddresses, getSettings } from "@/routes/api";
import { Address, PaginatedResponse } from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { Button, useDisclosure, Pagination } from "@heroui/react";
import { EmptyState, ErrorState } from "@/components/ui";
import AddressCard from "@/components/Cards/AddressCard";
import AddressModal from "@/components/Modals/AddressModal";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { useRouter } from "next/router";
import AddressCardSkeleton from "@/components/Skeletons/AddressCardSkeleton";
import useSWR from "swr";
import { NextPageWithLayout } from "@/types";
import { loadTranslations } from "../../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { loginRedirect } from "@/guards/authGuard";

const per_page = 6;

interface AddressesPageProps {
  paginatedAddresses: PaginatedResponse<Address[]>["data"] | null;
  error?: string;
  initialPage: number;
}

// SWR fetcher
const addressesFetcher = async (url: string) => {
  const [, page] = url.split(":");
  const response: PaginatedResponse<Address[]> = await getAddresses({
    page: parseInt(page),
    per_page,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch addresses");
  }

  return response.data;
};

const AddressesPage: NextPageWithLayout<AddressesPageProps> = ({
  paginatedAddresses: ssrPaginatedAddresses,
  error: ssrError,
  initialPage,
}) => {
  const router = useRouter();
  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState<number>(
    initialPage ?? getPageFromUrl()
  );

  const swrKey = `addresses:${currentPage}`;
  const {
    data: paginatedData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR(swrKey, addressesFetcher, {
    fallbackData: ssrPaginatedAddresses ?? undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    revalidateOnMount: !isSSR(),
  });

  const loading = isLoading;
  const error = swrError?.message || ssrError;
  const addresses = paginatedData?.data || [];
  const totalPages = paginatedData?.last_page || 1;
  const totalAddresses = paginatedData?.total || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, page: page.toString() },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleEditAddress = async () => {
    await mutate();
  };

  const handleDeleteAddress = async () => {
    await mutate();
  };

  const handleAddressAdded = async () => {
    await mutate();
  };

  const handleRetry = () => mutate();

  if (error && !paginatedData) {
    return (
      <>
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/my-account/addresses", label: t("pageTitle.addresses") },
          ]}
        />
        <PageHead pageTitle={t("pageTitle.addresses")} />

        
          <PageHeader
            title={t("pages.addresses.myAddresses")}
            subtitle={t("pages.addresses.subtitle")}
          />
          <ErrorState
            title={t("pages.addresses.errorLoading")}
            description={error}
            retryLabel={t("pages.addresses.tryAgain")}
            onRetry={handleRetry}
          />
        
      </>
    );
  }

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/addresses", label: t("pageTitle.addresses") },
        ]}
      />

      <PageHead pageTitle={t("pageTitle.addresses")} />

      
        <div className="w-full">
          <div className="flex justify-between items-center">
            <PageHeader
              title={t("pages.addresses.myAddresses")}
              subtitle={`${t("pages.addresses.subtitle")}${
                totalAddresses > 0
                  ? ` (${totalAddresses} ${t("pages.addresses.total")})`
                  : ""
              }`}
            />
            <Button
              variant="bordered"
              size="sm"
              className="text-xs px-1 md:px-2"
              startContent={<Icon icon="solar:add-circle-linear" className="w-4 h-4" />}
              onPress={onOpen}
            >
              {t("pages.addresses.addNew")}
            </Button>
          </div>

          {loading && (
            <div className="mt-4 flex flex-col gap-2.5">
              {Array.from({ length: 6 }).map((_, index) => (
                <AddressCardSkeleton key={index} />
              ))}
            </div>
          )}

          {addresses.length > 0 ? (
            <div className="mt-4 space-y-6">
              <div className="flex flex-col gap-2.5">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={handleEditAddress}
                    onDelete={handleDeleteAddress}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    showControls
                    showShadow
                    color="primary"
                    size="sm"
                    isCompact
                    classNames={{
                      item: "text-sm",
                      cursor: "text-sm",
                      next: "text-sm",
                      prev: "text-sm",
                    }}
                  />
                </div>
              )}

              <div className="text-center text-sm text-default-500">
                {t("pages.addresses.showingRange", {
                  from: paginatedData?.from || 0,
                  to: paginatedData?.to || 0,
                  total: totalAddresses,
                })}
              </div>
            </div>
          ) : (
            !loading && (
              <EmptyState
                icon={
                  <Icon icon="solar:map-point-add-linear" width={40} height={40} className="text-primary-600" />
                }
                title={t("pages.addresses.noAddresses")}
                description={t("pages.addresses.noAddressesDesc")}
                actionLabel={t("pages.addresses.addFirst")}
                onAction={onOpen}
              />
            )
          )}
        </div>
      

      <AddressModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSave={handleAddressAdded}
      />
    </>
  );
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
        const page = parseInt(context.query.page as string) || 1;

        const response = await getAddresses({ access_token, page, per_page });
        const market = getMarketFromContext(context);
        const settings = await getSettings({ market });
        await loadTranslations(context);

        return {
          props: {
            paginatedAddresses: response.success ? response.data : null,
            initialSettings: settings?.data || null,
            initialPage: page,
            error: response.success
              ? null
              : response.message || "Failed to fetch addresses",
          },
        };
      } catch (error) {
        console.error("SSR Error fetching addresses:", error);
        return {
          props: {
            paginatedAddresses: null,
            initialSettings: null,
            initialPage: 1,
            error: "Unable to load addresses. Please try again later.",
          },
        };
      }
    }
  : undefined;

export default AddressesPage;
