import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import Link from "next/link";

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
    <div className="mb-4 sm:mb-6 flex items-end justify-between gap-4">
      <h2
        className={`font-display text-lg sm:text-2xl font-bold tracking-tight leading-none capitalize ${
          light ? "text-white" : "text-zinc-900"
        }`}
      >
        {title}
      </h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          title={t("see_all")}
          className={`group shrink-0 inline-flex items-center gap-1 text-xs sm:text-sm font-bold transition-all hover:opacity-85 ${
            light ? "text-white" : "text-primary"
          }`}
        >
          {t("see_all")}
          <Icon
            icon="solar:arrow-right-linear"
            className="text-xs sm:text-sm transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
          />
        </Link>
      ) : null}
    </div>
  );
};

export default HomeSectionHeader;
