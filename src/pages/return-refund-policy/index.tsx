import { GetServerSideProps, NextPage } from "next";
import { getSettings } from "@/routes/api";
import { Settings } from "@/types/ApiResponse";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { useSettings } from "@/contexts/SettingsContext";
import { isSSR } from "@/helpers/getters";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import HTMLRenderer from "@/components/Functional/HTMLRenderer";
import { loadTranslations } from "../../../i18n";
import DynamicSEO from "@/SEO/DynamicSEO";
import { generateBreadcrumbSchema, getCanonicalUrl } from "@/helpers/seo";
import { useTranslation } from "react-i18next";

interface ReturnRefundPolicyPageProps {
  initialSettings?: Settings | null;
  error?: string;
}

const ReturnRefundPolicyPage: NextPage<ReturnRefundPolicyPageProps> = () => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const policyContent = {
    title: t("pages.returnRefundPolicy.title", "Return & Refund Policy"),
    description: t(
      "pages.returnRefundPolicy.description",
      "Learn about our return process and refund conditions.",
    ),
    content:
      webSettings?.returnRefundPolicy || t("notAvailable", "Not Available"),
  };

  return (
    <>
      <DynamicSEO
        title={policyContent.title}
        description={policyContent.description}
        canonical="/return-refund-policy"
        ogType="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: policyContent.title,
            description: policyContent.description,
            url: getCanonicalUrl(
              "/return-refund-policy/",
              webSettings?.customerWebUrl,
            ),
          },
          generateBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: policyContent.title, url: "/return-refund-policy" },
            ],
            webSettings?.customerWebUrl,
          ),
        ]}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: "/return-refund-policy",
              label: t("pageTitle.return-refund-policy"),
            },
          ]}
        />
        <div className="w-full mb-2">
          <h1 className="text-xl font-bold">{policyContent.title}</h1>
          <p className="text-foreground/50 text-xs">
            {policyContent.description}
          </p>
        </div>
        <HTMLRenderer html={policyContent.content} />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const market = getMarketFromContext(context);
        const settings = await getSettings({ market });
        await loadTranslations(context);

        return {
          props: {
            initialSettings: settings.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialSettings: null,
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default ReturnRefundPolicyPage;
