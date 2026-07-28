import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import { Link } from "@/components/ui";

interface HomeSectionHeaderProps {
  title: string;
  /** When set, renders the "See all" pill linking here. */
  seeAllHref?: string;
  /** Image/dark backgrounds flip the text to white. */
  light?: boolean;
}

/**
 * Home section header — an amber accent bar beside a bold title, with a pill
 * "See all" affordance that nudges its arrow on hover.
 */
const HomeSectionHeader: FC<HomeSectionHeaderProps> = ({ title, seeAllHref, light }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-2.5 sm:mb-4 flex items-center justify-between gap-3">
      <h2
        className={`text-[15px] sm:text-[19px] font-semibold leading-tight capitalize ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          title={t("see_all")}
          className={`shrink-0 inline-flex items-center gap-0.5 text-xs sm:text-compact font-semibold ${
            light ? "text-white" : "text-primary-600"
          }`}
        >
          {t("see_all")}
          <Icon
            icon="solar:arrow-right-linear"
            className="text-sm transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
          />
        </Link>
      ) : null}
    </div>
  );
};

export default HomeSectionHeader;
