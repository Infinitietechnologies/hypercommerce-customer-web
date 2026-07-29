import { FC } from "react";
import { Card, CardBody, User } from "@heroui/react";
import { Icon } from "@iconify/react";
import RatingStars from "../RatingStars";
import { SellerReview } from "@/types/ApiResponse";

interface SellerReviewCardProps {
  review: SellerReview;
}

const SellerReviewCard: FC<SellerReviewCardProps> = ({ review }) => {
  const getFormattedDate = (date: string) =>
    new Date(date).toLocaleDateString();

  return (
    <Card
      shadow="none"
      radius="lg"
      as="div"
      className="h-full border border-divider bg-content1"
    >
      <CardBody className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <User
            classNames={{
              name: "text-sm font-semibold text-foreground",
              description: "text-xxs text-foreground/50",
            }}
            avatarProps={{
              src: "",
              name: review.user.name,
              className: "h-9 w-9 bg-primary-50 text-primary-600",
            }}
            name={review.user.name}
            description={getFormattedDate(review.created_at)}
          />
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-600">
            {review.rating}
            <Icon icon="solar:star-bold" className="text-[12px]" />
          </span>
        </div>

        <span className="flex items-center gap-0.5">
          <RatingStars rating={review.rating} size={15} />
        </span>

        {review.title && (
          <h4 className="text-sm font-semibold text-foreground">
            {review.title}
          </h4>
        )}
        {review.description && (
          <p className="text-sm leading-relaxed text-foreground/70">
            {review.description}
          </p>
        )}
      </CardBody>
    </Card>
  );
};

export default SellerReviewCard;
