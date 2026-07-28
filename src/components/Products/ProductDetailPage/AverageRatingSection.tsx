import React from "react";
import { Card, CardBody, Divider, Progress } from "@/components/ui";
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

const AverageRatingSection: React.FC<AverageRatingSectionProps> = ({
  totalReviews,
  averageRating,
  ratingsBreakdown,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="w-full border border-divider" shadow="none">
      <CardBody className="flex flex-col gap-6 p-5 sm:flex-row sm:px-8">
        {/* Left Section: Average Rating */}
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-4xl font-bold text-foreground">
            {averageRating.toFixed(1)}
          </p>
          <RatingStars rating={averageRating} size={20} />
          <p className="mt-1 text-sm text-foreground/60">
            {totalReviews} {t("ratings")}
          </p>
        </div>

        <Divider className="hidden sm:block" orientation="vertical" />

        {/* Right Section: Ratings Breakdown */}
        <div className="flex w-full flex-col gap-2.5">
          {ratingsBreakdown.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-3">
              <RatingStars rating={rating} size={16} />
              <Progress
                value={totalReviews ? (count / totalReviews) * 100 : 0}
                className="hidden grow sm:flex"
                color="primary"
                size="sm"
                aria-label={`Progress for ${rating} stars`}
              />
              <span className="whitespace-nowrap text-sm text-foreground/60">
                {count} {t("review")}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default AverageRatingSection;
