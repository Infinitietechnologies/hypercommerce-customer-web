import {
  CheckCircle,
  Users,
  Package,
  Truck,
  BarChart3,
  Star,
  Shield,
  ArrowRight,
  TrendingUp,
  Quote,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button, Image } from "@heroui/react";
import { useTranslation } from "react-i18next";
import Reveal from "@/components/custom/Reveal";

const SELLER_HERO_LOGO_PLACEHOLDER = "https://placehold.co/160x40?text=Logo";
// Swap for the final photo when it lands.
const SELLER_STEPS_IMAGE = "/seller-landing/simple-steps.png";

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

  const testimonials = [
    {
      name: t("pages.enhancedSellerMarketing.testimonials.items.localSeller.name"),
      business: t(
        "pages.enhancedSellerMarketing.testimonials.items.localSeller.business"
      ),
      text: t("pages.enhancedSellerMarketing.testimonials.items.localSeller.text"),
      rating: 5,
    },
    {
      name: t(
        "pages.enhancedSellerMarketing.testimonials.items.bakeryOwner.name"
      ),
      business: t(
        "pages.enhancedSellerMarketing.testimonials.items.bakeryOwner.business"
      ),
      text: t(
        "pages.enhancedSellerMarketing.testimonials.items.bakeryOwner.text"
      ),
      rating: 5,
    },
    {
      name: t(
        "pages.enhancedSellerMarketing.testimonials.items.electronicsShop.name"
      ),
      business: t(
        "pages.enhancedSellerMarketing.testimonials.items.electronicsShop.business"
      ),
      text: t(
        "pages.enhancedSellerMarketing.testimonials.items.electronicsShop.text"
      ),
      rating: 5,
    },
  ];

  const steps = [
    {
      step: "1",
      title: t("pages.enhancedSellerMarketing.how.steps.register.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.register.desc"),
      icon: <Users className="w-5 h-5" />,
    },
    {
      step: "2",
      title: t("pages.enhancedSellerMarketing.how.steps.list.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.list.desc"),
      icon: <Package className="w-5 h-5" />,
    },
    {
      step: "3",
      title: t("pages.enhancedSellerMarketing.how.steps.start.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.start.desc"),
      icon: <Truck className="w-5 h-5" />,
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

      {/* How It Works */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t("pages.enhancedSellerMarketing.how.titleMain")}{" "}
              <span className="text-primary">
                {t("pages.enhancedSellerMarketing.how.titleAccent")}
              </span>
            </h2>
            <p className="text-sm text-foreground/50">
              {t("pages.enhancedSellerMarketing.how.subtitle")}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <Reveal className="overflow-hidden rounded-large">
              <Image
                src={SELLER_STEPS_IMAGE}
                alt=""
                radius="lg"
                removeWrapper
                className="w-full h-64 md:h-full md:max-h-96 object-cover transition-transform duration-500 hover:scale-105"
              />
            </Reveal>

            <ol className="space-y-4">
              {steps.map((item, idx) => (
                <Reveal
                  key={idx}
                  delay={idx * 0.1}
                  className="relative flex items-stretch gap-4"
                >
                  <div className="relative flex flex-col items-center">
                    <span
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-content1 border border-divider text-foreground/50"
                      }`}
                    >
                      {item.step}
                    </span>
                    {idx < steps.length - 1 && (
                      <span className="w-px grow bg-divider" />
                    )}
                  </div>

                  <div className="group flex-1 flex items-start gap-3 rounded-large border border-primary-200 bg-content1 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary">
                    <div className="shrink-0 w-9 h-9 rounded-medium bg-primary-50 text-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-1">{item.title}</h3>
                      <p className="text-xs text-foreground/50 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Fulfillment Options */}
      <div className="py-12 px-4 hidden">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden bg-linear-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl p-6 md:p-10 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -me-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-5 rounded-full -ms-32 -mb-32" />

            <div className="relative text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {t("pages.enhancedSellerMarketing.fulfillment.title")}
              </h2>
              <p className="text-sm text-primary-50 max-w-3xl mx-auto">
                {t("pages.enhancedSellerMarketing.fulfillment.desc")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 relative">
              {[
                {
                  icon: <CheckCircle className="w-5 h-5 stroke-2" />,
                  title: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.partnerIntegrations.title"
                  ),
                  desc: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.partnerIntegrations.desc"
                  ),
                },
                {
                  icon: <CheckCircle className="w-5 h-5 stroke-2" />,
                  title: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.realtimeTracking.title"
                  ),
                  desc: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.realtimeTracking.desc"
                  ),
                },
                {
                  icon: <CheckCircle className="w-5 h-5 stroke-2" />,
                  title: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.policies.title"
                  ),
                  desc: t(
                    "pages.enhancedSellerMarketing.fulfillment.items.policies.desc"
                  ),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="text-white mb-2">{item.icon}</div>
                  <p className="font-bold mb-0.5 text-sm text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-primary-100">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative py-12 px-4 overflow-hidden">
        <Quote
          className="absolute -top-4 start-4 w-40 h-40 text-primary-200 -scale-x-100 pointer-events-none"
          strokeWidth={1}
        />

        <div className="relative max-w-7xl mx-auto">
          <Reveal className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t("pages.enhancedSellerMarketing.testimonials.title")}
            </h2>
            <p className="text-sm text-foreground/50">
              {t("pages.enhancedSellerMarketing.testimonials.subtitle")}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Reveal
                key={idx}
                delay={idx * 0.08}
                className="h-full flex flex-col justify-between gap-6 rounded-large border border-primary-200 bg-primary-50/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary"
              >
                <div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-warning text-warning"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed">{testimonial.text}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-default-200 text-foreground/50 flex items-center justify-center text-xs font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-xs">{testimonial.name}</p>
                    <p className="text-xs text-foreground/50">
                      {t(
                        "pages.enhancedSellerMarketing.testimonials.verifiedBuyer"
                      )}
                      , {testimonial.business}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
