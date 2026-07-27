import { useScreenType } from "@/hooks/useScreenType";
import { Brand } from "@/types/ApiResponse";
import { Card, CardBody, Image } from "@heroui/react";
import Link from "next/link";
import { FC, memo } from "react";

interface BrandCardProps {
  brand: Brand;
}

/**
 * Brand card — new amber redesign: white surface, hairline border, 18px radius,
 * soft shadow that lifts and turns amber on hover. Name sits under the logo.
 * (Source: /redesign cards `BrandCard`.)
 */
const BrandCard: FC<BrandCardProps> = ({ brand }) => {
  const screen = useScreenType();

  return (
    <div className="flex flex-col items-center w-full min-w-0">
      <Card
        className="w-full border border-divider bg-content1 rounded-large shadow-sm
          transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-md
          overflow-hidden flex items-center justify-center"
        shadow="none"
        isPressable={screen !== "mobile"}
        href={`/brands/${brand.slug}`}
        as={Link}
        title={brand.title}
      >
        <CardBody className="flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <Image
            unselectable="off"
            src={brand.logo}
            alt={brand.title}
            className="object-contain max-w-full"
            classNames={{
              img: "rounded-md max-w-full h-16 sm:h-20 object-contain",
            }}
            loading="eager"
          />
        </CardBody>
      </Card>

      <div className="h-8 flex items-center w-full min-w-0">
        <h2
          title={brand.title}
          className="text-center truncate w-full text-xs font-semibold px-1"
        >
          {brand.title}
        </h2>
      </div>
    </div>
  );
};

export default memo(BrandCard);
