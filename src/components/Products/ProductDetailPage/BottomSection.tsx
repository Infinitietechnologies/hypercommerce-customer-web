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
      {/* Outlined pill tabs (design): a single row of equal-width rounded
          outlines; the active tab gets a dark border + subtle fill. No sliding
          cursor. */}
      <Tabs
        aria-label={t("details")}
        variant="light"
        fullWidth
        classNames={{
          base: "w-full",
          tabList: "w-full flex-nowrap gap-2 bg-transparent p-0",
          cursor: "hidden",
          tab: "h-11 flex-1 rounded-xl border border-divider data-[hover=true]:border-foreground/40 data-[selected=true]:border-foreground data-[selected=true]:bg-content2",
          tabContent:
            "text-sm font-medium text-foreground/60 group-data-[selected=true]:font-semibold group-data-[selected=true]:text-foreground",
          panel: "pt-6",
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
