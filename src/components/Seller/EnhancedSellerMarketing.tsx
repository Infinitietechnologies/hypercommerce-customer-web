import {
  CheckCircle,
  Users,
  Package,
  BarChart3,
  Shield,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button, Image } from "@heroui/react";
import { useTranslation } from "react-i18next";
import Reveal from "@/components/custom/Reveal";

const SELLER_HERO_LOGO_PLACEHOLDER = "https://placehold.co/160x40?text=Logo";

export default function EnhancedSellerMarketing() {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const heroFeatures = [
    {
      icon: <Users className="w-4 h-4" />,
      title: t("pages.enhancedSellerMarketing.hero.features.reach.title"),
      desc: t("pages.enhancedSellerMarketing.hero.features.reach.desc"),
    },
    {
      icon: <Package className="w-4 h-4" />,
      title: t("pages.enhancedSellerMarketing.hero.features.manage.title"),
      desc: t("pages.enhancedSellerMarketing.hero.features.manage.desc"),
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: t("pages.enhancedSellerMarketing.hero.features.payments.title"),
      desc: t("pages.enhancedSellerMarketing.hero.features.payments.desc"),
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: t("pages.enhancedSellerMarketing.hero.features.insights.title"),
      desc: t("pages.enhancedSellerMarketing.hero.features.insights.desc"),
    },
  ];



  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-large bg-content1 border border-divider pb-56 sm:pb-64 md:pb-20 bg-[url('/seller-landing/hero-seller-mobile.png')] md:bg-[url('/seller-landing/hero-seller.png')] bg-cover bg-no-repeat bg-bottom md:bg-right">
        <div className="relative max-w-7xl mx-auto px-4 pt-8 md:pt-10">
          <Image
            src={
              webSettings?.siteHeaderLogo ||
              webSettings?.siteHeaderDarkLogo ||
              SELLER_HERO_LOGO_PLACEHOLDER
            }
            alt={webSettings?.siteName || ""}
            radius="none"
            removeWrapper
            className="relative h-14 md:h-16 w-auto object-contain object-left mb-6"
          />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <Reveal className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 px-3.5 py-2 text-primary-700 rounded-full text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                {t("pages.enhancedSellerMarketing.hero.badge")}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                {t("pages.enhancedSellerMarketing.hero.titleMain")}
                <span className="block text-primary mt-1">
                  {t("pages.enhancedSellerMarketing.hero.titleAccent")}
                </span>
              </h1>

              <p className="text-sm md:text-base text-foreground/60 leading-relaxed max-w-lg">
                {t("pages.enhancedSellerMarketing.hero.description")}
              </p>

              <Button
                color="primary"
                variant="solid"
                radius="sm"
                size="lg"
                className="font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                endContent={<ArrowRight className="w-4 h-4" />}
                onPress={() => {
                  const element = document.getElementById("seller-register");
                  const offset = -80;
                  if (element) {
                    const top =
                      element.getBoundingClientRect().top +
                      window.scrollY +
                      offset;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }}
              >
                {t("pages.enhancedSellerMarketing.hero.registerNow")}
              </Button>

              <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                <CheckCircle className="w-3.5 h-3.5" />
                {t("pages.enhancedSellerMarketing.hero.trust")}
              </p>
            </Reveal>

          </div>
        </div>
      </div>

      {/* Feature strip — overhangs the hero's bottom edge */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 -mt-14 sm:-mt-20 lg:-mt-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-content1 rounded-large border border-divider shadow-md divide-y sm:divide-y-0 sm:divide-x divide-divider">
          {heroFeatures.map((feature, idx) => (
            <Reveal
              key={idx}
              delay={idx * 0.08}
              className="group flex items-start gap-3 p-5"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-primary-50 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-bold mb-1">{feature.title}</p>
                <p className="text-xs text-foreground/50 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

    </div>
  );
}
