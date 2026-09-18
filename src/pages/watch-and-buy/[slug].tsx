import type { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";

import DynamicSEO from "@/SEO/DynamicSEO";
import { Button, Card } from "@/components/ui";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { getMarketFromContext } from "@/helpers/functionalHelpers";
import { getWebSettings, isSSR } from "@/helpers/getters";
import { generateBreadcrumbSchema, generateVideoSchema } from "@/helpers/seo";
import { getSettings } from "@/services/settings";
import { getWatchBuyReels } from "@/services/watchBuy";
import type { Settings } from "@/types/settings";
import type { WatchBuyReel } from "@/types/watchBuy";
import type { NextPageWithLayout } from "@/types";
import { loadTranslations } from "../../../i18n";

interface WatchBuyReelPageProps {
  initialReel: WatchBuyReel;
  initialSettings?: Settings | null;
}

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
};

const WatchBuyReelPage: NextPageWithLayout<WatchBuyReelPageProps> = ({
  initialReel,
  initialSettings,
}) => {
  const title =
    initialReel.caption?.trim() ||
    `Watch & Buy with ${initialReel.profile.username}`;
  const description =
    initialReel.caption?.trim() ||
    `Watch this shoppable video from ${initialReel.profile.username} and explore the featured products.`;
  const canonical = `/watch-and-buy/${initialReel.slug}`;
  const seoBaseUrl = initialSettings
    ? getWebSettings(initialSettings)?.customerWebUrl
    : undefined;
  const schema = generateVideoSchema(initialReel, seoBaseUrl);
  const breadcrumbs = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Watch & Buy", url: "/watch-and-buy" },
      { name: title, url: canonical },
    ],
    seoBaseUrl,
  );

  return (
    <>
      <DynamicSEO
        title={title}
        description={description}
        canonical={canonical}
        ogType="video.other"
        ogTitle={title}
        ogDescription={description}
        ogImage={initialReel.cover_url || undefined}
        ogImageAlt={title}
        twitterTitle={title}
        twitterDescription={description}
        twitterImage={initialReel.cover_url || undefined}
        videoUrl={initialReel.video_url}
        videoWidth={initialReel.width || undefined}
        videoHeight={initialReel.height || undefined}
        videoType="video/mp4"
        jsonLd={[schema, breadcrumbs]}
      />

      <article className="mx-auto grid w-full max-w-5xl gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="mx-auto aspect-[9/16] max-h-[78vh] overflow-hidden rounded-large bg-black shadow-lg">
            {/* The video must be present in SSR HTML for video crawlers. */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
              poster={initialReel.cover_url || undefined}
            >
              <source src={initialReel.video_url} type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <header>
            <p className="text-sm font-semibold text-primary">
              @{initialReel.profile.username}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-foreground/65">
              {description}
            </p>
          </header>

          {initialReel.products.length > 0 && (
            <section aria-labelledby="featured-products" className="space-y-3">
              <h2 id="featured-products" className="text-lg font-bold">
                Featured products
              </h2>
              {initialReel.products.map((product) => (
                <Card
                  key={`${product.product_id}-${product.variant_id}`}
                  className="p-3"
                >
                  <Link
                    href={`/products/${product.product_slug}/`}
                    className="flex items-center gap-3"
                  >
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={72}
                        height={72}
                        className="size-18 rounded-medium object-cover"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {product.title}
                      </span>
                      <span className="block text-sm text-foreground/60">
                        {product.store_name}
                      </span>
                      <span className="mt-1 block font-bold">
                        {formatPrice(
                          product.special_price || product.price,
                          product.currency_code,
                        )}
                      </span>
                    </span>
                  </Link>
                </Card>
              ))}
            </section>
          )}

          <Button as={Link} href="/watch-and-buy/" color="primary">
            Explore more Watch & Buy videos
          </Button>
        </div>
      </article>
    </>
  );
};

export const getServerSideProps:
  | GetServerSideProps<WatchBuyReelPageProps>
  | undefined = isSSR()
  ? async (context) => {
      await loadTranslations(context);
      const slug =
        typeof context.params?.slug === "string" ? context.params.slug : "";
      const access_token =
        (await getAccessTokenFromContext(context)) || undefined;
      const market = getMarketFromContext(context);
      const [settingsResponse, reelsResponse] = await Promise.all([
        getSettings({ access_token, market }),
        getWatchBuyReels({ access_token, market, per_page: 10, slug }),
      ]);
      const reel = reelsResponse.data?.items.find((item) => item.slug === slug);

      if (
        !reelsResponse.success ||
        reelsResponse.data?.meta.slug_not_found ||
        !reel
      ) {
        return { notFound: true };
      }

      return {
        props: {
          initialReel: reel,
          initialSettings: settingsResponse.data ?? null,
        },
      };
    }
  : undefined;

export default WatchBuyReelPage;
