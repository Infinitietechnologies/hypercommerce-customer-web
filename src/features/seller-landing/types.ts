import type { TFunction } from "i18next";
import type {
  ResolvedSellerLandingItem,
  ResolvedSellerLandingSection,
  SellerLandingItem,
  SellerLandingSection,
  SellerLandingSettings,
} from "@/types/sellerLanding";

export interface ResolvedSellerLandingPage {
  seo: { title: string; description: string; keywords: string; image: string };
  sections: ResolvedSellerLandingSection[];
}

const section = (
  id: string,
  type: SellerLandingSection["type"],
  variant: string,
  items: string[] = [],
): SellerLandingSection => ({
  id,
  type,
  variant,
  preset: `hypercommerce.${type}`,
  enabled: true,
  content: {},
  settings: {},
  media: {},
  items: items.map((itemId) => ({
    id: itemId,
    preset: `hypercommerce.${itemId}`,
    content: {},
    settings: {},
    media: {},
  })),
});

export const DEFAULT_SELLER_LANDING: SellerLandingSettings = {
  schemaVersion: 1,
  seo: {},
  seoMedia: {},
  sections: [
    section("hero-default", "hero", "background"),
    section("benefits-default", "benefits", "overlap_grid", [
      "reach",
      "manage",
      "payments",
      "insights",
    ]),
    section("steps-default", "steps", "sticky_story", [
      "register",
      "list",
      "start",
    ]),
    section("registration-default", "registration_form", "stepped"),
    section("testimonials-default", "testimonials", "card_grid", [
      "localSeller",
      "bakeryOwner",
      "electronicsShop",
    ]),
  ],
};

const populated = (record: Record<string, unknown> | undefined) =>
  Object.fromEntries(
    Object.entries(record || {}).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== "" && value != null,
    ),
  );

const copyFor = (
  content: SellerLandingSection["content"] | SellerLandingItem["content"],
  locale: string,
) => ({ ...populated(content?.en), ...populated(content?.[locale]) });

const mediaFor = (media: Record<string, string> | undefined) =>
  Object.fromEntries(Object.entries(media || {}).filter(([, value]) => Boolean(value)));

const defaultSectionCopy = (
  type: SellerLandingSection["type"],
  t: TFunction,
): Record<string, unknown> => {
  if (type === "hero") {
    return {
      badge: t("pages.enhancedSellerMarketing.hero.badge"),
      titleMain: t("pages.enhancedSellerMarketing.hero.titleMain"),
      titleAccent: t("pages.enhancedSellerMarketing.hero.titleAccent"),
      description: t("pages.enhancedSellerMarketing.hero.description"),
      ctaLabel: t("pages.enhancedSellerMarketing.hero.registerNow"),
      trust: t("pages.enhancedSellerMarketing.hero.trust"),
    };
  }
  if (type === "steps") {
    return {
      titleMain: t("pages.enhancedSellerMarketing.how.titleMain"),
      titleAccent: t("pages.enhancedSellerMarketing.how.titleAccent"),
      subtitle: t("pages.enhancedSellerMarketing.how.subtitle"),
      stepLabel: t("pages.enhancedSellerMarketing.how.stepLabel", { number: "{number}" }),
    };
  }
  if (type === "testimonials") {
    return {
      title: t("pages.enhancedSellerMarketing.testimonials.title"),
      subtitle: t("pages.enhancedSellerMarketing.testimonials.subtitle"),
      verifiedLabel: t("pages.enhancedSellerMarketing.testimonials.verifiedBuyer"),
    };
  }
  if (type === "benefits") {
    return {
      title: t("pages.enhancedSellerMarketing.benefits.title"),
      subtitle: t("pages.enhancedSellerMarketing.benefits.subtitle"),
    };
  }
  return {};
};

const defaultItemCopy = (
  type: SellerLandingSection["type"],
  id: string,
  t: TFunction,
): Record<string, unknown> => {
  if (type === "benefits") {
    return {
      title: t(`pages.enhancedSellerMarketing.hero.features.${id}.title`),
      description: t(`pages.enhancedSellerMarketing.hero.features.${id}.desc`),
    };
  }
  if (type === "steps") {
    return {
      title: t(`pages.enhancedSellerMarketing.how.steps.${id}.title`),
      description: t(`pages.enhancedSellerMarketing.how.steps.${id}.desc`),
      points: [1, 2, 3].map((point) =>
        t(`pages.enhancedSellerMarketing.how.steps.${id}.points.p${point}`),
      ),
    };
  }
  if (type === "testimonials") {
    return {
      name: t(`pages.enhancedSellerMarketing.testimonials.items.${id}.name`),
      business: t(`pages.enhancedSellerMarketing.testimonials.items.${id}.business`),
      text: t(`pages.enhancedSellerMarketing.testimonials.items.${id}.text`),
    };
  }
  return {};
};

const itemDefaults = (
  type: SellerLandingSection["type"],
  index: number,
): { settings: Record<string, unknown>; media: Record<string, string> } => {
  if (type === "benefits") {
    return { settings: {}, media: {} };
  }
  if (type === "steps") {
    return {
      settings: {},
      media: { image: `/seller-landing/simple-step${index + 1}.png` },
    };
  }
  if (type === "testimonials") return { settings: { rating: 5 }, media: {} };
  return { settings: {}, media: {} };
};

const resolveItem = (
  sectionType: SellerLandingSection["type"],
  item: SellerLandingItem,
  index: number,
  locale: string,
  t: TFunction,
): ResolvedSellerLandingItem => {
  const defaults = itemDefaults(sectionType, index);
  const presetId = item.preset?.replace("hypercommerce.", "");
  return {
    ...item,
    copy: {
      ...(presetId ? defaultItemCopy(sectionType, presetId, t) : {}),
      ...copyFor(item.content, locale),
    },
    settings: { ...defaults.settings, ...populated(item.settings) },
    media: { ...defaults.media, ...mediaFor(item.media) },
  };
};

const allowedVariants: Record<SellerLandingSection["type"], string[]> = {
  hero: ["background", "split"],
  benefits: ["overlap_grid", "feature_cards"],
  steps: ["sticky_story", "timeline"],
  registration_form: ["stepped"],
  testimonials: ["card_grid", "featured_carousel"],
};

export const resolveSellerLanding = (
  value: unknown,
  locale: string,
  t: TFunction,
): ResolvedSellerLandingPage => {
  const candidate = value as Partial<SellerLandingSettings> | null;
  const source = candidate?.schemaVersion === 1 && Array.isArray(candidate.sections)
    ? candidate as SellerLandingSettings
    : DEFAULT_SELLER_LANDING;
  const recognized = source.sections.filter(
    (entry) =>
      entry &&
      allowedVariants[entry.type]?.includes(entry.variant) &&
      (entry.type === "registration_form" || entry.enabled),
  );
  const hasRegistration = recognized.some((entry) => entry.type === "registration_form");
  const sections = hasRegistration
    ? recognized
    : [...recognized, DEFAULT_SELLER_LANDING.sections[3]];

  return {
    seo: {
      title: String(copyFor(source.seo, locale).title || t("pages.sellerRegister.pageTitle")),
      description: String(
        copyFor(source.seo, locale).description ||
          t("pages.enhancedSellerMarketing.hero.description"),
      ),
      keywords: String(copyFor(source.seo, locale).keywords || "seller registration, sell online, marketplace"),
      image: mediaFor(source.seoMedia).image || "/seller-landing/hero-seller.png",
    },
    sections: sections.map((entry) => {
      const defaultEntry = DEFAULT_SELLER_LANDING.sections.find(
        (candidateEntry) => candidateEntry.type === entry.type,
      );
      const items = entry.items?.length ? entry.items : defaultEntry?.items || [];

      return {
        ...entry,
        copy: {
          ...defaultSectionCopy(entry.type, t),
          ...copyFor(entry.content, locale),
        },
        settings: {
          ...(entry.type === "hero" ? { ctaHref: "#seller-register" } : {}),
          ...populated(entry.settings),
        },
        media: {
          ...(entry.type === "hero"
            ? {
                desktopImage: "/seller-landing/hero-seller.png",
                mobileImage: "/seller-landing/hero-seller-mobile.png",
              }
            : {}),
          ...mediaFor(entry.media),
        },
        items: items.map((item, index) =>
          resolveItem(entry.type, item, index, locale, t),
        ),
      };
    }),
  };
};
