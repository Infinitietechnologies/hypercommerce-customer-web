import type { Product, Store } from "@/types/ApiResponse";
import type { Review } from "@/types/reviews";
import type { WebSettings } from "@/types/settings";

/**
 * Serialises JSON-LD for injection into a <script> block.
 *
 * `JSON.stringify` leaves `<` and `>` intact, so a seller-authored value
 * containing `</script>` would close the element and let the rest parse as
 * HTML. The three escapes below are inert inside JSON and close that.
 */
export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

/**
 * Generates canonical URL for a page
 */
export const getCanonicalUrl = (path: string, baseUrl?: string): string => {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const suffixIndex = cleanPath.search(/[?#]/);
  const pathname =
    suffixIndex === -1 ? cleanPath : cleanPath.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : cleanPath.slice(suffixIndex);
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  // next.config.ts sets trailingSlash — the canonical must name the URL the site
  // actually serves, not the form that 308s to it.
  return `${base.replace(/\/$/, "")}${normalizedPath}${suffix}`;
};

/**
 * Ensures a URL is absolute by prepending the base URL if needed.
 */
export const ensureAbsoluteUrl = (url: string, baseUrl?: string): string => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${base}${cleanPath}`;
};

const PRIVATE_OR_UTILITY_ROUTES = [
  "/my-account",
  "/cart",
  "/payment",
  "/shopping-list",
  "/forgot-password",
  "/products/search",
  "/design-system",
  "/redesign",
  "/404",
  "/500",
];

const isTrackingParameter = (name: string): boolean =>
  name.startsWith("utm_") ||
  ["gclid", "fbclid", "msclkid", "ref"].includes(name);

export const shouldNoIndexUrl = (asPath: string): boolean => {
  const [pathname, query = ""] = asPath.split("?");
  if (
    PRIVATE_OR_UTILITY_ROUTES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }

  const parameters = new URLSearchParams(query.split("#")[0]);
  return [...parameters.keys()].some((key) => !isTrackingParameter(key));
};

export const defaultRobotsForUrl = (asPath: string): string =>
  shouldNoIndexUrl(asPath)
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const compactObject = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null || item === "") return false;
      if (Array.isArray(item) && item.length === 0) return false;
      return true;
    }),
  ) as T;

const productConditionUrl = (slug?: string | null): string | undefined => {
  const normalized = (slug || "").toLowerCase();
  if (normalized.includes("refurb") || normalized.includes("renewed"))
    return "https://schema.org/RefurbishedCondition";
  if (normalized.includes("new")) return "https://schema.org/NewCondition";
  if (normalized.includes("used") || normalized.includes("pre-owned")) {
    return "https://schema.org/UsedCondition";
  }
  if (normalized.includes("damaged"))
    return "https://schema.org/DamagedCondition";
  return undefined;
};

export const generateMerchantReturnPolicy = (
  webSettings?: Partial<WebSettings> | null,
  currency?: string,
  product?: Product,
): object | undefined => {
  const productReturnDays = Number(product?.returnable_days || 0);
  const categoryKey = product
    ? Number(product.is_returnable) === 0
      ? "not_permitted"
      : productReturnDays > 0
        ? "finite"
        : webSettings?.returnPolicyCategory
    : webSettings?.returnPolicyCategory;

  if (!webSettings?.returnPolicyCountry || !categoryKey) {
    return undefined;
  }

  const category = {
    finite: "https://schema.org/MerchantReturnFiniteReturnWindow",
    unlimited: "https://schema.org/MerchantReturnUnlimitedWindow",
    not_permitted: "https://schema.org/MerchantReturnNotPermitted",
  }[categoryKey];
  if (!category) return undefined;

  const method = webSettings.returnPolicyMethod
    ? {
        mail: "https://schema.org/ReturnByMail",
        in_store: "https://schema.org/ReturnInStore",
        kiosk: "https://schema.org/ReturnAtKiosk",
      }[webSettings.returnPolicyMethod]
    : undefined;
  const fees = webSettings.returnFees
    ? {
        free: "https://schema.org/FreeReturn",
        customer_responsibility:
          "https://schema.org/ReturnFeesCustomerResponsibility",
        fixed: "https://schema.org/ReturnShippingFees",
      }[webSettings.returnFees]
    : undefined;

  return compactObject({
    "@type": "MerchantReturnPolicy",
    applicableCountry: webSettings.returnPolicyCountry.toUpperCase(),
    returnPolicyCategory: category,
    merchantReturnDays:
      categoryKey === "finite"
        ? productReturnDays || webSettings.returnPolicyDays || undefined
        : undefined,
    returnMethod: method,
    returnFees: fees,
    returnShippingFeesAmount:
      webSettings.returnFees === "fixed" &&
      webSettings.returnShippingFee != null &&
      currency
        ? {
            "@type": "MonetaryAmount",
            value: webSettings.returnShippingFee,
            currency,
          }
        : undefined,
  });
};

/**
 * Generates Product structured data (JSON-LD)
 */
export const generateProductSchema = (
  product: Product,
  baseUrl?: string,
  options: {
    reviews?: Review[];
    webSettings?: Partial<WebSettings> | null;
  } = {},
): object => {
  const url = getCanonicalUrl(`/products/${product.slug}`, baseUrl);
  const images = [product.main_image, ...(product.additional_images || [])]
    .filter(Boolean)
    .map((image) => ensureAbsoluteUrl(image, baseUrl));
  const validReviews = (options.reviews || [])
    .filter(
      (review) => Number(review.rating) >= 1 && Number(review.rating) <= 5,
    )
    .slice(0, 3)
    .map((review) =>
      compactObject({
        "@type": "Review",
        name: review.title || undefined,
        reviewBody: stripHtmlTags(review.comment || "") || undefined,
        datePublished: review.created_at || undefined,
        author: review.user?.name
          ? { "@type": "Person", name: review.user.name }
          : undefined,
        reviewRating: {
          "@type": "Rating",
          ratingValue: Number(review.rating),
          bestRating: 5,
          worstRating: 1,
        },
      }),
    );
  const condition = productConditionUrl(product.product_condition?.slug);
  const returnPolicy = generateMerchantReturnPolicy(
    options.webSettings,
    product.variants?.find((variant) => variant.currency_code)?.currency_code,
    product,
  );
  const shipping = product.shipping_details;
  const shippingDetails =
    shipping?.country && shipping.currency_code
      ? compactObject({
          "@type": "OfferShippingDetails",
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: shipping.country,
          },
          shippingRate: {
            "@type": "MonetaryAmount",
            value: Number(shipping.rate),
            currency: shipping.currency_code,
          },
          deliveryTime:
            shipping.eta_min != null || shipping.eta_max != null
              ? {
                  "@type": "ShippingDeliveryTime",
                  transitTime: compactObject({
                    "@type": "QuantitativeValue",
                    minValue: shipping.eta_min,
                    maxValue: shipping.eta_max,
                    unitCode: shipping.eta_unit === "hours" ? "HUR" : "DAY",
                  }),
                }
              : undefined,
        })
      : undefined;
  const variants = (product.variants || []).filter(
    (variant) => Number(variant.special_price || variant.price) > 0,
  );
  const makeOffer = (variant: Product["variants"][number]) =>
    compactObject({
      "@type": "Offer",
      url,
      price: Number(variant.special_price || variant.price),
      priceCurrency: variant.currency_code || undefined,
      availability:
        variant.availability && (variant.stock == null || variant.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: condition,
      sku: variant.sku || undefined,
      seller: variant.store_name
        ? { "@type": "Organization", name: variant.store_name }
        : undefined,
      hasMerchantReturnPolicy: returnPolicy,
      shippingDetails,
    });
  const common = compactObject({
    "@context": "https://schema.org",
    name: product.title,
    description:
      (typeof product.metadata === "object" &&
        product.metadata?.seo_description) ||
      product.short_description ||
      product.description,
    image: images,
    sku: variants.find((variant) => variant.sku)?.sku || product.uuid,
    brand: product.brand_name
      ? {
          "@type": "Brand",
          name: product.brand_name,
        }
      : undefined,
    category: product.category_name,
    url,
    aggregateRating:
      product.rating_count > 0 && Number(product.ratings) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.ratings),
            reviewCount: Number(product.rating_count),
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: validReviews,
  });

  if (variants.length > 1) {
    return compactObject({
      ...common,
      "@type": "ProductGroup",
      productGroupID: product.uuid,
      variesBy: product.attributes?.map(
        (attribute) => `https://schema.org/${attribute.slug}`,
      ),
      hasVariant: variants.map((variant) =>
        compactObject({
          "@type": "Product",
          name:
            variant.title && variant.title !== product.title
              ? `${product.title} - ${variant.title}`
              : product.title,
          image: variant.image
            ? ensureAbsoluteUrl(variant.image, baseUrl)
            : images[0],
          sku: variant.sku || undefined,
          gtin: /^\d{8}$|^\d{12,14}$/.test(variant.barcode || "")
            ? variant.barcode
            : undefined,
          offers: makeOffer(variant),
        }),
      ),
    });
  }

  return compactObject({
    ...common,
    "@type": "Product",
    gtin: /^\d{8}$|^\d{12,14}$/.test(variants[0]?.barcode || "")
      ? variants[0]?.barcode
      : undefined,
    offers: variants.map(makeOffer),
  });
};

/**
 * Generates BreadcrumbList structured data
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>,
  baseUrl?: string,
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.url, baseUrl),
    })),
  };
};

/**
 * Generates LocalBusiness structured data for stores
 */
export const generateStoreSchema = (store: Store, baseUrl?: string): object => {
  return compactObject({
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description: store.description,
    image: ensureAbsoluteUrl(store.logo, baseUrl),
    url: getCanonicalUrl(`/stores/${store.slug}`, baseUrl),
    telephone: store.contact_number,
    email: store.contact_email,
    address: store.address
      ? {
          "@type": "PostalAddress",
          streetAddress: store.address,
        }
      : undefined,
  });
};

/**
 * Generates Organization structured data
 */
export const generateOrganizationSchema = (
  siteName: string,
  siteDescription: string,
  logo: string,
  baseUrl?: string,
): object => {
  return compactObject({
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: siteName,
    description: siteDescription,
    url: getCanonicalUrl("/", baseUrl),
    logo: logo,
  });
};

/**
 * Generates supported WebSite structured data for site-name discovery.
 */
export const generateWebsiteSchema = (
  siteName: string,
  baseUrl?: string,
  alternateName?: string,
): object => {
  return compactObject({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName,
    url: getCanonicalUrl("/", baseUrl),
  });
};

export const generateOnlineStoreSchema = (
  webSettings: Partial<WebSettings>,
  baseUrl?: string,
): object => {
  const logo = ensureAbsoluteUrl(
    webSettings.siteHeaderLogo || webSettings.siteFooterLogo || "/logo.png",
    baseUrl,
  );
  const sameAs = [
    webSettings.facebookLink,
    webSettings.instagramLink,
    webSettings.xLink,
    webSettings.youtubeLink,
  ].filter(Boolean);

  return compactObject({
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: webSettings.businessLegalName || webSettings.siteName,
    alternateName: webSettings.alternateSiteName || undefined,
    description:
      webSettings.metaDescription || webSettings.shortDescription || undefined,
    url: getCanonicalUrl("/", baseUrl),
    logo,
    image: ensureAbsoluteUrl(webSettings.defaultSeoImage || logo, baseUrl),
    email: webSettings.supportEmail || undefined,
    telephone: webSettings.supportNumber || undefined,
    address: webSettings.address
      ? { "@type": "PostalAddress", streetAddress: webSettings.address }
      : undefined,
    sameAs,
    hasMerchantReturnPolicy: generateMerchantReturnPolicy(webSettings),
  });
};

export const generateVideoSchema = (
  reel: {
    slug: string;
    caption: string | null;
    video_url: string;
    cover_url: string | null;
    duration_ms: number | null;
    published_at: string;
    profile?: { username?: string; photo_url?: string | null };
    products?: Array<{
      product_slug: string;
      title: string;
      image?: string | null;
      price?: number;
      special_price?: number | null;
      currency_code?: string;
      available?: boolean;
    }>;
  },
  baseUrl?: string,
): object =>
  compactObject({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name:
      reel.caption ||
      `Watch & Buy video by ${reel.profile?.username || "seller"}`,
    description: reel.caption || "Watch this shoppable product video.",
    thumbnailUrl: reel.cover_url
      ? [ensureAbsoluteUrl(reel.cover_url, baseUrl)]
      : undefined,
    uploadDate: reel.published_at,
    duration:
      reel.duration_ms && reel.duration_ms > 0
        ? `PT${Math.max(1, Math.round(reel.duration_ms / 1000))}S`
        : undefined,
    contentUrl: ensureAbsoluteUrl(reel.video_url, baseUrl),
    url: getCanonicalUrl(`/watch-and-buy/${reel.slug}`, baseUrl),
    creator: reel.profile?.username
      ? { "@type": "Organization", name: reel.profile.username }
      : undefined,
    about: reel.products?.map((product) =>
      compactObject({
        "@type": "Product",
        name: product.title,
        url: getCanonicalUrl(`/products/${product.product_slug}`, baseUrl),
        image: product.image
          ? ensureAbsoluteUrl(product.image, baseUrl)
          : undefined,
        offers:
          product.currency_code &&
          Number(product.special_price || product.price) > 0
            ? {
                "@type": "Offer",
                price: Number(product.special_price || product.price),
                priceCurrency: product.currency_code,
                availability: product.available
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                url: getCanonicalUrl(
                  `/products/${product.product_slug}`,
                  baseUrl,
                ),
              }
            : undefined,
      }),
    ),
  });

/**
 * Generates CollectionPage structured data for category/brand pages
 */
export const generateCollectionSchema = (
  name: string,
  description: string,
  url: string,
  baseUrl?: string,
  items: Array<{ name: string; url: string; image?: string }> = [],
): object => {
  return compactObject({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: name,
    description: description,
    url: getCanonicalUrl(url, baseUrl),
    mainEntity: items.length
      ? {
          "@type": "ItemList",
          itemListElement: items.map((item, index) =>
            compactObject({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              url: getCanonicalUrl(item.url, baseUrl),
              image: item.image
                ? ensureAbsoluteUrl(item.image, baseUrl)
                : undefined,
            }),
          ),
        }
      : undefined,
  });
};

/**
 * Generates FAQ structured data
 */
export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>,
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

/**
 * Strips HTML tags from text
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Generates meta description from content
 */
export const generateMetaDescription = (
  content: string | undefined | null,
  maxLength: number = 160,
): string => {
  if (!content) return "";
  const cleanContent = stripHtmlTags(content);
  return truncateText(cleanContent, maxLength);
};

/**
 * Generate keywords from text
 */
export const generateKeywords = (
  text: string | undefined | null,
  limit: number = 10,
): string => {
  if (!text) return "";

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // Get unique words
  const uniqueWords = [...new Set(words)];

  return uniqueWords.slice(0, limit).join(", ");
};

/**
 * Generate product meta tags
 */
/**
 * Parses metadata string or object into SEOMetadata
 */
export const parseMetadata = (metadata: any): any => {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error("Failed to parse metadata", e);
      return {};
    }
  }
  return metadata;
};

/**
 * Generate product meta tags
 */
export const generateProductMeta = (product: Product) => {
  const seoData = parseMetadata(product.metadata);

  const title = seoData.seo_title || product.title;
  const description = seoData.seo_description
    ? generateMetaDescription(seoData.seo_description, 160)
    : generateMetaDescription(
        product.short_description || product.description,
        160,
      );

  const keywords =
    Array.isArray(seoData.seo_keywords) && seoData.seo_keywords.length > 0
      ? seoData.seo_keywords.join(", ")
      : [
          product.title,
          product.category_name,
          product.brand_name,
          ...(Array.isArray(product.tags) ? product.tags : []),
        ]
          .filter(Boolean)
          .join(", ");

  return {
    title,
    description,
    keywords,
    image: ensureAbsoluteUrl(product.main_image),
  };
};

/**
 * Generate store meta tags
 */
export const generateStoreMeta = (store: Store, extraKeywords?: string[]) => {
  const seoData = parseMetadata(store.metadata);

  const title = seoData.seo_title || store.name;
  const description = seoData.seo_description
    ? generateMetaDescription(seoData.seo_description, 160)
    : generateMetaDescription(store.description, 160);

  const keywords =
    Array.isArray(seoData.seo_keywords) && seoData.seo_keywords.length > 0
      ? seoData.seo_keywords.join(", ")
      : [
          ...(Array.isArray(extraKeywords) ? extraKeywords : []),
          store.name,
          ...(store.description ? [store.description] : []),
        ]
          .filter(Boolean)
          .join(", ");

  return {
    title,
    description,
    keywords,
    image: store.logo ? ensureAbsoluteUrl(store.logo) : undefined,
  };
};

/**
 * Generate collection meta tags
 */
export const generateCollectionMeta = (
  name: string,
  description: string,
  image?: string,
  metadata?: any,
  extraKeywords?: string[],
) => {
  const seoData = parseMetadata(metadata);

  const title = seoData.seo_title || name;
  const descriptionText = seoData.seo_description
    ? generateMetaDescription(seoData.seo_description, 160)
    : generateMetaDescription(description, 160);

  const keywords =
    Array.isArray(seoData.seo_keywords) && seoData.seo_keywords.length > 0
      ? seoData.seo_keywords.join(", ")
      : [
          ...(Array.isArray(extraKeywords) ? extraKeywords : []),
          name,
          ...(description ? [description] : []),
        ]
          .filter(Boolean)
          .join(", ");

  return {
    title,
    description: descriptionText,
    keywords,
    image: image ? ensureAbsoluteUrl(image) : undefined,
  };
};
