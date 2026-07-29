import { FC, useState } from "react";
import { Card, CardBody, User, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import RatingStars from "../RatingStars";
import { Review } from "@/types/ApiResponse";
import Lightbox from "yet-another-react-lightbox";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: FC<ReviewCardProps> = ({ review }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const getFormattedDate = (date: string) =>
    new Date(date).toLocaleDateString();

  return (
    <>
      <Card
        shadow="none"
        radius="lg"
        as="div"
        className="h-full border border-divider bg-content1"
      >
        <CardBody className="flex flex-col gap-3 p-4">
          {/* Reviewer + rating */}
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

          {/* Full star row */}
          <span className="flex items-center gap-0.5">
            <RatingStars rating={review.rating} size={15} />
          </span>

          {/* Title + comment */}
          {review.title && (
            <h4 className="text-sm font-semibold text-foreground">
              {review.title}
            </h4>
          )}
          {review.comment && (
            <p className="text-sm leading-relaxed text-foreground/70">
              {review.comment}
            </p>
          )}

          {/* Images */}
          {review.review_images?.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              {review.review_images.map((image, idx) => (
                <Image
                  key={idx}
                  src={image}
                  loading="lazy"
                  alt={`Review Image ${idx + 1}`}
                  onClick={() => setLightboxIndex(idx)}
                  className="h-14 w-14 cursor-pointer rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      {review.review_images && lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={review.review_images.map((src) => ({ src }))}
        />
      )}
    </>
  );
};

export default ReviewCard;
