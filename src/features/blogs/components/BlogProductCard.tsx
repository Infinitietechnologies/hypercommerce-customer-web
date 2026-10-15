import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import type { BlogProduct } from "@/types/blogs";

const BlogProductCard = ({ product, compact = false }: { product: BlogProduct; compact?: boolean }) => {
  const { t } = useTranslation();
  const variant = product.variants?.find((item) => item.is_default) ?? product.variants?.[0];
  const hasOffer = variant?.special_price != null && variant.special_price < variant.price;
  const unavailable = variant?.availability === false || variant?.is_in_stock === false;

  return (
    <Link href={`/products/${encodeURIComponent(product.slug)}/`}
      className={clsx(
        "group flex h-full cursor-pointer flex-col gap-3 rounded-large bg-content1 p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        !compact && "sm:flex-row sm:items-center sm:gap-4",
      )}>
      <span className={clsx(
        "relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-medium bg-content2",
        !compact && "sm:size-36 sm:aspect-auto sm:w-36",
      )}>
        {product.main_image ? (
          <Image unoptimized fill alt="" src={product.main_image} sizes="(min-width: 640px) 144px, 80vw" className="object-contain p-3" />
        ) : <Icon aria-hidden="true" icon="solar:bag-linear" className="size-10 text-default-400" />}
      </span>
      <span className={clsx("flex min-w-0 flex-1 flex-col px-1 py-2", !compact && "sm:px-0 sm:pe-2")}>
        <span className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">{product.title}</span>
        {variant ? (
          <span className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{hasOffer ? variant.formatted_special_price : variant.formatted}</span>
            {hasOffer ? <span className="text-xs text-default-500 line-through">{variant.formatted}</span> : null}
          </span>
        ) : null}
        {unavailable ? <span className="mt-2 text-xs font-medium text-danger">{t("blogs.outOfStock")}</span> : null}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary group-hover:text-primary-600">
          {t("blogs.viewProduct")}
          <Icon aria-hidden="true" icon="solar:arrow-right-linear" className="size-4 rtl:rotate-180" />
        </span>
      </span>
    </Link>
  );
};

export default BlogProductCard;
