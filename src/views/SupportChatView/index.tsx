import { useTranslation } from "react-i18next";

import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHead from "@/SEO/PageHead";
import { SupportChat } from "@/features/support/components/SupportChat";
import type { SupportThreadPayload } from "@/types/support";

const SupportChatView = ({ initialData }: { initialData: SupportThreadPayload | null }) => {
  const { t } = useTranslation();

  return (
    <>
      <MyBreadcrumbs breadcrumbs={[{href: "/my-account/support", label: t("supportChat.title")}]} />
      <PageHead pageTitle={t("supportChat.title")} />
      <SupportChat initialData={initialData} />
    </>
  );
};

export default SupportChatView;
