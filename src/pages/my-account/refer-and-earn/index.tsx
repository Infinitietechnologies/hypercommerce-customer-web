import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { Button } from "@heroui/react";
import { ErrorState } from "@/components/ui";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { getReferralInfo } from "@/routes/api";
import { NextPageWithLayout } from "@/types";
import { ReferralInfo } from "@/types/ApiResponse";
import { useSettings } from "@/contexts/SettingsContext";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import type { GetServerSideProps } from "next";
import { loginRedirect } from "@/guards/authGuard";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { isSSR } from "@/helpers/getters";
import { loadTranslations } from "../../../../i18n";

const ReferAndEarnPage: NextPageWithLayout = () => {
  const [copied, setCopied] = useState(false);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchReferralInfo = async () => {
      try {
        const referralRes = await getReferralInfo();
        if (referralRes.success && referralRes.data) {
          setReferralInfo(referralRes.data);
        } else {
          setError(referralRes.message || "Failed to fetch referral data");
        }
      } catch (err) {
        console.error("Referral fetch error:", err);
        setError("Failed to fetch referral data");
      } finally {
        setLoading(false);
      }
    };

    fetchReferralInfo();
  }, []);

  const referralCode = referralInfo?.referral_code || "";
  const { formatPrice } = useSettings();
  const program = referralInfo?.program;
  const bonusCap = program?.referrer_bonus_max_cap;
  const rewardCapDisplay =
    bonusCap != null && bonusCap !== "" ? formatPrice(bonusCap) : "";

  const rewardLineText = rewardCapDisplay
    ? t("pages.referAndEarnPage.hero.rewardLine", {
        rewardCap: rewardCapDisplay,
      })
    : "";

  const howItWorksSteps = [
    {
      title: t("pages.referAndEarnPage.howItWorks.steps.shareCode.title"),
      description: t(
        "pages.referAndEarnPage.howItWorks.steps.shareCode.description"
      ),
    },
    {
      title: t("pages.referAndEarnPage.howItWorks.steps.friendSignsUp.title"),
      description: t(
        "pages.referAndEarnPage.howItWorks.steps.friendSignsUp.description"
      ),
    },
    {
      title: t("pages.referAndEarnPage.howItWorks.steps.earnRewards.title"),
      description:
        t("pages.referAndEarnPage.howItWorks.steps.earnRewards.description", {
          rewardCap: rewardCapDisplay,
        }) || rewardLineText,
    },
  ];

  const handleCopyCode = () => {
    if (
      !referralCode ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    ) {
      return;
    }

    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          {
            href: "/my-account/refer-and-earn",
            label: t("pageTitle.refer-and-earn"),
          },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.refer-and-earn")} />

      
        <div className="w-full space-y-8">
          {/* Header */}
          <PageHeader
            title={t("pages.referAndEarnPage.header.title")}
            subtitle={t("pages.referAndEarnPage.header.subtitle")}
          />

          {error ? (
            <ErrorState
              title={t("pages.referAndEarnPage.errorTitle", "Couldn't load referral info")}
              description={error}
              retryLabel={t("retry", "Retry")}
              onRetry={() => window.location.reload()}
            />
          ) : loading ? (
            /* ── Skeleton ── */
            <div className="space-y-6 animate-pulse">
              {/* Hero banner skeleton */}
              <div className="rounded-large bg-primary-100 p-6 md:p-8 flex flex-col items-center gap-6 md:flex-row">
                <div className="w-full md:w-52 flex justify-center md:justify-start">
                  <div className="w-[180px] h-[180px] rounded-large bg-default-200" />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div className="h-7 w-2/3 rounded-medium bg-default-200" />
                  <div className="h-4 w-full rounded bg-default-200" />
                  <div className="h-4 w-4/5 rounded bg-default-200" />
                  <div className="h-4 w-1/2 rounded bg-default-200" />
                </div>
              </div>

              {/* Card skeleton */}
              <div className="rounded-large border border-divider bg-content1 shadow-sm p-6">
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Referral code box skeleton */}
                  <div className="lg:w-[60%] space-y-3">
                    <div className="rounded-large border border-divider bg-content2 px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 h-6 rounded bg-default-200" />
                      <div className="w-10 h-10 rounded-medium bg-default-200 shrink-0" />
                    </div>
                    <div className="h-3 w-2/3 rounded bg-default-200" />
                  </div>

                  {/* How it works skeleton */}
                  <div className="lg:w-[40%] lg:border-l lg:border-divider lg:pl-6 space-y-4">
                    <div className="h-5 w-1/3 rounded bg-default-200" />
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-full bg-default-200 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-1/2 rounded bg-default-200" />
                          <div className="h-3 w-4/5 rounded bg-default-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Referral code — centered card */}
              <div className="rounded-large border border-divider bg-content1 p-6 text-center shadow-sm sm:p-8">
                <div className="text-sm text-default-500">
                  {t("pages.referAndEarnPage.referralCode.label", "Your referral code")}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-[0.08em] text-primary-600">
                  {referralCode || "—"}
                </div>
                <div className="mt-5 flex justify-center">
                  <Button
                    color="primary"
                    radius="md"
                    onPress={handleCopyCode}
                    startContent={
                      <Icon
                        icon={copied ? "solar:check-circle-bold" : "solar:copy-linear"}
                        width={16}
                        height={16}
                      />
                    }
                  >
                    {copied
                      ? t("copied", "Copied")
                      : t("pages.referAndEarnPage.referralCode.copy", "Copy code")}
                  </Button>
                </div>
                {rewardLineText && (
                  <p className="mx-auto mt-4 max-w-md text-sm text-default-500">
                    {rewardLineText}
                  </p>
                )}
              </div>

              {/* How it works */}
              <div className="rounded-large border border-divider bg-content1 p-6 shadow-sm">
                <h3 className="text-base font-semibold">
                  {t("pages.referAndEarnPage.howItWorks.title")}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {howItWorksSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-3 sm:flex-col">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-divider bg-primary-100 text-sm font-semibold text-primary-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-0.5 text-xs text-default-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      const access_token = (await getAccessTokenFromContext(context)) || "";
      if (!access_token) {
        return { redirect: { destination: loginRedirect(context), permanent: false } };
      }

      await loadTranslations(context);
      return { props: {} };
    }
  : undefined;

export default ReferAndEarnPage;
