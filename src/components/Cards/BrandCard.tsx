import { useScreenType } from "@/hooks/useScreenType";
import { Brand } from "@/types/ApiResponse";
import { Card, CardBody, Image } from "@heroui/react";
import Link from "next/link";
import { FC, memo } from "react";

interface BrandCardProps {
  brand: Brand;
  /** `image_title` shows the name under the logo; `full` is a soft-tint logo tile. */
  showName?: boolean;
}

/**
 * Brand card — amber redesign. `image_title` = white card, compact logo, name
 * below. `full` = a soft amber-tint logo tile (no name), a distinct showcase
 * treatment. (Source: /redesign cards `BrandCard`.)
 */
const BrandCard: FC<BrandCardProps> = ({ brand, showName = true }) => {
  const screen = useScreenType();

  return (
    <div className="flex flex-col items-center w-full min-w-0">
      <Card
        className={`w-full rounded-large overflow-hidden flex items-center justify-center transition-all duration-200 hover:border-primary hover:shadow-md ${
          showName
            ? "border border-divider bg-content1 "
            : "border border-primary-100 bg-primary-50/40"
        }`}
        shadow="none"
        isPressable={screen !== "mobile"}
        href={`/brands/${brand.slug}`}
        as={Link}
        title={brand.title}
      >
        <CardBody className="flex items-center justify-center p-2.5 sm:p-3 overflow-hidden">
          <Image
            unselectable="off"
            src={brand.logo}
            alt={brand.title}
            className="object-contain max-w-full"
            classNames={{
              img: "rounded-md max-w-full h-11 sm:h-14 object-contain",
            }}
            loading="eager"
          />
        </CardBody>
      </Card>

      {showName && (
        <div className="h-7 flex items-center w-full min-w-0">
          <h2
            title={brand.title}
            className="text-center truncate w-full text-[11px] sm:text-xs font-semibold px-1"
          >
            {brand.title}
          </h2>
        </div>
      )}
    </div>
  );
};

export default memo(BrandCard);
