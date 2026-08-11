import { Quote, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import Reveal from "@/components/custom/Reveal";

export default function SellerTestimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t(
        "pages.enhancedSellerMarketing.testimonials.items.localSeller.name"
      ),
      business: t(
        "pages.enhancedSellerMarketing.testimonials.items.localSeller.business"
      ),
      text: t(
        "pages.enhancedSellerMarketing.testimonials.items.localSeller.text"
      ),
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

  return (
    <div className="relative w-full px-4 overflow-hidden">
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
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
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
  );
}
