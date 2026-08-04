import React, { FC } from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { userData } from "@/types/ApiResponse";
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

  const { data: wallet } = useSWR("user-wallet", async () => {
    const res = await getWallet();
    return res.success ? res.data : null;
  });

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
      className="w-full border border-divider bg-linear-to-br from-primary-100 to-content1 "
    >
      <CardBody className="p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-medium bg-primary-50 text-primary-600">
              <Icon icon="solar:wallet-bold" width={22} height={22} />
            </div>
            <div>
              <div className="text-xs text-default-500">
                {t("pages.walletPage.availableBalance", "Available balance")}
              </div>
              {!loading && (
                <div className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {wallet?.formatted_balance ?? formatPrice(userData?.wallet_balance)}
                </div>
              )}
            </div>
          </div>
          <DepositModal />
        </div>

        {!loading && (
          <div className="flex items-end justify-between gap-3 pt-1">
            <div className="font-mono text-sm tracking-wider text-default-500">
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
