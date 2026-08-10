import React, { FC } from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { userData } from "@/types/ApiResponse";
import { Skeleton } from "@/components/ui";
import DepositModal from "../Modals/DepositModal";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { getWallet } from "@/routes/api";

type WalletCardPageProps = {
  loading: boolean;
};

/**
 * Wallet balance card — amber redesign. Warm amber-tint→surface gradient panel
 * (source: /redesign/account Wallet pane) with the available balance headline,
 * the masked wallet id, and the deposit action.
 */
const WalletCard: FC<WalletCardPageProps> = ({ loading = true }) => {
  const userData = (useSelector((state: RootState) => state.auth.user) ||
    {}) as userData;

  const { formatPrice } = useSettings();
  const { t } = useTranslation();

  const { data: wallet, isLoading: isWalletLoading } = useSWR("user-wallet", async () => {
    const res = await getWallet();
    if (!res.success) throw new Error(res.message || "Failed to load wallet");

    return res.data;
  });

  const resolvedBalance =
    wallet?.formatted_balance ??
    (typeof userData?.wallet_balance === "number"
      ? formatPrice(userData.wallet_balance)
      : null);

  const formattedId =
    userData?.id
      ?.toString()
      .padStart(16, "X")
      .match(/.{1,4}/g)
      ?.join(" ") || "";

  return (
    <Card
      as="div"
      disableRipple
      radius="lg"
      className="w-full border border-amber-300 bg-gradient-to-br from-amber-50 to-white/10 backdrop-blur-xl shadow-xl rounded-xl"
    >
      <CardBody className="p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-200/30 text-amber-800 shadow-lg">
              <Icon icon="solar:wallet-bold" width={22} height={22} />
            </div>
            <div>
              <div className="text-xs text-amber-600">
                {t("pages.walletPage.availableBalance", "Available balance")}
              </div>
              {!loading &&
                (isWalletLoading && resolvedBalance === null ? (
                  <Skeleton className="mt-1 h-8 w-28 rounded-medium" />
                ) : resolvedBalance === null ? (
                  <div className="text-sm font-medium text-danger">
                    {t("pages.walletPage.balanceUnavailable")}
                  </div>
                ) : (
                  <div className="text-4xl sm:text-5xl font-bold text-amber-900 bg-amber-100/30 px-3 py-2 rounded-lg">
                    {resolvedBalance}
                  </div>
                ))}
            </div>
          </div>
          <DepositModal />
        </div>

        {!loading && (
          <div className="flex items-end justify-between gap-3 pt-1">
            <div className="font-mono text-sm tracking-wider text-amber-600">
              {formattedId}
            </div>
            {userData?.name && (
              <div className="text-sm font-semibold text-foreground truncate">
                {userData.name}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default WalletCard;
