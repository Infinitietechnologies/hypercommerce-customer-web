import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Link } from "@/components/ui";

interface HomeSectionHeaderProps {
  title: string;
  /** When set, renders the "See all →" affordance linking here. */
  seeAllHref?: string;
  /** Image/dark backgrounds flip the text to white. */
  light?: boolean;
}

/**
 * Home section header — title (19/600) with an optional "See all →" link.
 * (Source: /redesign primitives `SectionHeader`.)
 */
const HomeSectionHeader: FC<HomeSectionHeaderProps> = ({ title, seeAllHref, light }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2
        className={`text-[17px] sm:text-[19px] font-semibold leading-tight ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          title={t("see_all")}
          className={`shrink-0 text-compact font-semibold ${
            light ? "text-white" : "text-primary-600"
          }`}
        >
          {t("see_all")} →
        </Link>
      ) : null}
    </div>
  );
};

export default HomeSectionHeader;
