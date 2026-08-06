import React from "react";
import { Progress } from "@/components/ui";
import { Icon } from "@iconify/react";
import RatingStars from "@/components/RatingStars";
import { useTranslation } from "react-i18next";

interface AverageRatingSectionProps {
  totalReviews: number;
  averageRating: number;
  ratingsBreakdown: {
    rating: number;
    count: number;
  }[];
}

/** Compact count formatting: 989 → "989", 4500 → "4.5K", 1_200_000 → "1.2M". */
const fmtCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
};

const AverageRatingSection: React.FC<AverageRatingSectionProps> = ({
  totalReviews,
  averageRating,
  ratingsBreakdown,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid w-full gap-5 rounded-2xl border border-divider bg-content1 p-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:p-6">
      {/* Breakdown bars */}
      <div className="flex flex-col justify-center gap-2.5">
        {ratingsBreakdown.map(({ rating, count }) => (
          <div key={rating} className="flex items-center gap-3">
            <span className="flex w-9 shrink-0 items-center justify-end gap-0.5 text-sm font-semibold text-foreground/70">
              {rating}
              <Icon
                icon="solar:star-bold"
                className="text-[13px] text-rating-star"
              />
            </span>
            <Progress
              value={totalReviews ? (count / totalReviews) * 100 : 0}
              className="grow"
              color="primary"
              size="sm"
              aria-label={`Progress for ${rating} stars`}
            />
            <span className="w-10 shrink-0 text-end text-sm font-medium text-foreground/60">
              {fmtCount(count)}
            </span>
          </div>
        ))}
      </div>

      {/* Big average card on warm amber tint */}
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-primary-50 p-5 text-center">
        <p className="text-5xl font-extrabold leading-none text-foreground">
          {averageRating.toFixed(1)}
        </p>
        <span className="flex items-center gap-0.5">
          <RatingStars rating={averageRating} size={18} />
        </span>
        <p className="mt-0.5 text-sm font-medium text-foreground/60">
          {fmtCount(totalReviews)} {t("ratings", "Ratings")}
        </p>
      </div>
    </div>
  );
};

export default AverageRatingSection;
