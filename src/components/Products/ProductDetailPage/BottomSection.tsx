import { Product } from "@/types/ApiResponse";
import { Tab, Tabs } from "@/components/ui";
import { Icon } from "@iconify/react";
import { FC } from "react";
import ProductReviewsSection from "./ProductReviewsSection";
import ProductFaqSection from "./ProductFaqSection";
import AdditionalDetailSection from "./AdditionalDetailSection";
import SoldBySection from "./SoldBySection";
import SellerReviewSection from "./SellerReviewSection";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";

interface BottomSectionProps {
  initialProduct: Product;
}

const tabTitle = (icon: string, label: string) => (
  <div className="flex items-center gap-2">
    <Icon icon={icon} className="text-lg" />
    <span>{label}</span>
  </div>
);

const BottomSection: FC<BottomSectionProps> = ({ initialProduct }) => {
  const { t } = useTranslation();
  const { isSingleVendor } = useSettings();
  return (
    <div className="flex w-full flex-col">
      <Tabs
        aria-label={t("details")}
        color="primary"
        variant="solid"
        radius="lg"
        classNames={{
          base: "w-full",
          tabList:
            "w-full gap-1 rounded-2xl border border-divider bg-content2 p-1.5 overflow-x-auto",
          cursor: "rounded-xl shadow-sm",
          tab: "px-4 h-10",
          tabContent: "font-medium text-foreground/60 group-data-[selected=true]:text-primary-foreground",
          panel: "pt-5",
        }}
      >
        <Tab key="details" title={tabTitle("solar:document-text-linear", t("details"))}>
          <AdditionalDetailSection initialProduct={initialProduct} />
        </Tab>
        <Tab key="reviews" title={tabTitle("solar:star-linear", t("reviews"))}>
          <ProductReviewsSection productSlug={initialProduct?.slug} />
        </Tab>
        <Tab key="faqs" title={tabTitle("solar:question-circle-linear", t("faqs"))}>
          <ProductFaqSection productSlug={initialProduct?.slug} />
        </Tab>
        {!isSingleVendor && (
          <Tab key="soldby" title={tabTitle("solar:shop-linear", t("soldBy"))}>
            <div className="flex flex-col gap-4">
              <SoldBySection product={initialProduct} />
              <SellerReviewSection product={initialProduct} />
            </div>
          </Tab>
        )}
      </Tabs>
    </div>
  );
};

export default BottomSection;
