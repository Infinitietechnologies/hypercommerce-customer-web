import type { GetServerSideProps } from "next";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHead from "@/SEO/PageHead";
import AccountOverviewView from "@/views/AccountOverviewView";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { isSSR } from "@/helpers/getters";
import { loginRedirect } from "@/guards/authGuard";
import { getSettings, getUserData } from "@/routes/api";
import { RootState } from "@/lib/redux/store";
import { NextPageWithLayout } from "@/types";
import { userData } from "@/types/ApiResponse";
import { loadTranslations } from "../../../i18n";

type OverviewPageProps = {
  initialData: userData;
};

const AccountOverviewPage: NextPageWithLayout<OverviewPageProps> = ({
  initialData,
}) => {
  const { t } = useTranslation();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const user = (isSSR() ? initialData : reduxUser || initialData) || null;

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account", label: t("pageTitle.my-account") },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.my-account")} />

      
        <AccountOverviewView user={user} />
      
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
        const response = await getUserData({ access_token });
        const market = getMarketFromContext(context);
        const res = await getSettings({ market });
        await loadTranslations(context);

        return {
          props: {
            initialData: response.success ? response.data : {},
            initialSettings: res?.success ? res.data : [],
          },
        };
      } catch (error) {
        console.error("Error fetching account overview:", error);
        return {
          props: {
            initialSettings: null,
            initialData: {},
          },
        };
      }
    }
  : undefined;

export default AccountOverviewPage;
