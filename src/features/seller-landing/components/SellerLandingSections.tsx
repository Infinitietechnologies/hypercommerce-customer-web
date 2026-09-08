import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Button, Image } from "@/components/ui";
import Reveal from "@/components/custom/Reveal";
import SellerRegisterForm from "@/components/Seller/SellerRegisterForm";
import type { ResolvedSellerLandingSection } from "@/types/sellerLanding";

const iconNames: Record<string, string> = {
  users: "solar:users-group-rounded-bold-duotone",
  package: "solar:box-bold-duotone",
  shield: "solar:shield-check-bold-duotone",
  chart: "solar:chart-2-bold-duotone",
  truck: "solar:delivery-bold-duotone",
};

const text = (value: unknown) => String(value ?? "");
const icon = (value: unknown) => iconNames[text(value)] || text(value) || iconNames.package;

function SellerHero({ section, logo, siteName }: { section: ResolvedSellerLandingSection; logo: string; siteName: string }) {
  const isSplit = section.variant === "split";
  const handleCta = () => {
    const href = text(section.settings.ctaHref) || "#seller-register";
    if (href === "#seller-register") {
      const element = document.getElementById("seller-register");
      if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
      return;
    }
    if (href.startsWith("/") || href.startsWith("https://")) window.location.assign(href);
  };
  const copy = (
    <Reveal className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-50/80 px-3.5 py-2 text-xs font-semibold text-primary">
        <Icon icon="solar:graph-up-bold-duotone" className="h-4 w-4" />
        {text(section.copy.badge)}
      </div>
      <h1 className="text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
        {text(section.copy.titleMain)}
        <span className="mt-1 block text-primary">{text(section.copy.titleAccent)}</span>
      </h1>
      <p className="max-w-lg text-sm leading-relaxed text-foreground/60 md:text-base">{text(section.copy.description)}</p>
      <Button color="primary" size="lg" className="font-semibold shadow-primary" endContent={<Icon icon="solar:arrow-right-linear" className="h-4 w-4 rtl:rotate-180" />} onPress={handleCta}>
        {text(section.copy.ctaLabel)}
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-foreground/50"><Icon icon="solar:check-circle-bold" className="h-4 w-4" />{text(section.copy.trust)}</p>
    </Reveal>
  );

  if (isSplit) {
    return (
      <section className="w-full px-4">
        <div className="mx-auto grid max-w-site items-center gap-8 overflow-hidden rounded-large border border-divider bg-content1 p-6 shadow-sm md:grid-cols-2 md:p-10">
          <div><Image src={logo} alt={siteName} removeWrapper radius="none" className="mb-7 h-12 w-auto object-contain" />{copy}</div>
          <Image src={section.media.desktopImage} alt="" radius="lg" classNames={{ wrapper: "!max-w-full w-full", img: "h-[420px] w-full object-cover" }} />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-large border border-divider bg-content1 pb-56 shadow-sm sm:pb-64 md:pb-20">
        <picture className="absolute inset-0">
          <source media="(min-width: 768px)" srcSet={section.media.desktopImage} />
          <img src={section.media.mobileImage || section.media.desktopImage} alt="" className="h-full w-full object-cover object-bottom md:object-right" />
        </picture>
        <div className="relative mx-auto max-w-site px-4 pt-8 md:pt-10">
          <Image src={logo} alt={siteName} removeWrapper radius="none" className="mb-6 h-14 w-auto object-contain object-left md:h-16" />
          <div className="grid items-center gap-8 md:grid-cols-2">{copy}</div>
        </div>
      </div>
    </section>
  );
}

function SellerBenefits({ section, overlapsHero }: { section: ResolvedSellerLandingSection; overlapsHero: boolean }) {
  const cards = section.items.map((item, index) => (
    <Reveal key={item.id} delay={index * 0.08} className={section.variant === "feature_cards" ? "group rounded-large border border-divider bg-content1 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md" : "group flex items-start gap-3 p-5"}>
      <div className={`shrink-0 bg-primary-50 text-primary flex items-center justify-center ${section.variant === "feature_cards" ? "mb-4 h-12 w-12 rounded-medium" : "h-9 w-9 rounded-full"}`}>
        <Icon icon={icon(item.settings.icon)} className={section.variant === "feature_cards" ? "h-6 w-6" : "h-4 w-4"} />
      </div>
      <div><h2 className="mb-1 text-sm font-bold">{text(item.copy.title)}</h2><p className="text-xs leading-relaxed text-foreground/50">{text(item.copy.description)}</p></div>
    </Reveal>
  ));
  const heading = text(section.copy.title) ? <Reveal className="mb-6 text-center"><h2 className="text-2xl font-bold md:text-3xl">{text(section.copy.title)}</h2>{text(section.copy.subtitle) && <p className="mt-2 text-sm text-foreground/50">{text(section.copy.subtitle)}</p>}</Reveal> : null;
  if (section.variant === "feature_cards") return <section className="w-full px-4"><div className="mx-auto max-w-site">{heading}<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{cards}</div></div></section>;
  return <section className={`relative z-10 w-full px-4 ${overlapsHero ? "-mt-[6.5rem] sm:-mt-32 lg:-mt-[6.5rem]" : ""}`}><div className="mx-auto max-w-site">{heading}<div className="grid grid-cols-1 divide-y divide-divider rounded-large border border-divider bg-content1 shadow-md sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">{cards}</div></div></section>;
}

function StepCard({ section, index }: { section: ResolvedSellerLandingSection; index: number }) {
  const item = section.items[index];
  const points = Array.isArray(item.copy.points) ? item.copy.points : [];
  const stepLabel = text(section.copy.stepLabel || "Step {number}").replace("{number}", String(index + 1));
  return <div className="rounded-large border border-primary-200 bg-content1 p-5 shadow-sm"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-medium bg-primary-50 text-primary"><Icon icon={icon(item.settings.icon)} className="h-5 w-5" /></div><div><p className="mb-0.5 text-xs font-semibold text-primary">{stepLabel}</p><h3 className="text-lg font-bold leading-tight">{text(item.copy.title)}</h3><p className="mt-1 text-sm leading-relaxed text-foreground/50">{text(item.copy.description)}</p></div></div><ul className="mt-4 space-y-2 border-t border-divider pt-4">{points.map((point, pointIndex) => <li key={pointIndex} className="flex items-start gap-2 text-xs text-foreground/70"><Icon icon="solar:check-circle-bold" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{text(point)}</li>)}</ul></div>;
}

function StepsHeading({ section }: { section: ResolvedSellerLandingSection }) {
  return <Reveal className="mb-6 text-center"><h2 className="mb-2 text-2xl font-bold md:text-3xl">{text(section.copy.titleMain)} <span className="text-primary">{text(section.copy.titleAccent)}</span></h2><p className="text-sm text-foreground/50">{text(section.copy.subtitle)}</p></Reveal>;
}

function SellerSteps({ section }: { section: ResolvedSellerLandingSection }) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => setActive(Math.min(section.items.length - 1, Math.max(0, Math.floor(value * section.items.length)))));
  if (!section.items.length) return null;
  if (section.variant === "timeline") {
    return <section className="w-full px-4"><div className="mx-auto max-w-site"><StepsHeading section={section} /><div className="space-y-8">{section.items.map((item, index) => <Reveal key={item.id} className="grid items-center gap-6 rounded-large border border-divider bg-content1 p-5 shadow-sm md:grid-cols-2"><Image src={item.media.image} alt="" radius="lg" classNames={{wrapper: `!max-w-full w-full ${index % 2 ? "md:order-2" : ""}`, img: "h-72 w-full object-cover"}} /><StepCard section={section} index={index} /></Reveal>)}</div></div></section>;
  }
  return <section className="w-full px-4"><div className="mx-auto md:hidden max-w-site"><StepsHeading section={section} /><div className="flex flex-col gap-5">{section.items.map((item, index) => <Reveal key={item.id}><StepCard section={section} index={index} /></Reveal>)}</div></div><div ref={sectionRef} className="relative mx-auto hidden max-w-site md:block" style={{height: `${Math.max(1, section.items.length) * 100}vh`}}><div className="sticky top-0 flex h-screen flex-col justify-center"><StepsHeading section={section} /><div className="grid items-stretch gap-8 md:grid-cols-2 lg:gap-12"><div className="relative h-[62vh] min-h-96 max-h-[600px] overflow-hidden rounded-large"><AnimatePresence mode="wait" initial={false}><motion.div key={active} className="absolute inset-0" initial={{opacity: 0, scale: prefersReducedMotion ? 1 : 1.04}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0}}><Image src={section.items[active].media.image} alt="" radius="none" classNames={{wrapper: "!max-w-full h-full w-full", img: "h-full w-full object-cover"}} /></motion.div></AnimatePresence></div><div className="flex items-center gap-5 self-center"><ol className="flex flex-col items-center gap-2">{section.items.map((item, index) => <li key={item.id} className="flex flex-col items-center gap-2"><span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${index === active ? "bg-primary text-primary-foreground shadow-sm" : "border border-divider bg-content1 text-foreground/40"}`}>{index + 1}</span>{index < section.items.length - 1 && <span className={`h-10 w-px ${index < active ? "bg-primary" : "bg-divider"}`} />}</li>)}</ol><div className="flex-1"><AnimatePresence mode="wait" initial={false}><motion.div key={active} initial={{opacity: 0, y: prefersReducedMotion ? 0 : 14}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: prefersReducedMotion ? 0 : -14}}><StepCard section={section} index={active} /></motion.div></AnimatePresence></div></div></div></div></div></section>;
}

function TestimonialCard({ section, index }: { section: ResolvedSellerLandingSection; index: number }) {
  const item = section.items[index];
  const rating = Math.min(5, Math.max(1, Number(item.settings.rating) || 5));
  return <div className="flex h-full flex-col justify-between gap-6 rounded-large border border-primary-200 bg-primary-50/40 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-md"><div><div className="mb-4 flex gap-0.5">{Array.from({length: rating}).map((_, star) => <Icon key={star} icon="solar:star-bold" className="h-4 w-4 text-warning" />)}</div><p className="text-sm leading-relaxed">{text(item.copy.text)}</p></div><div className="flex items-center gap-3">{item.media.avatar ? <Image src={item.media.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-default-200 text-xs font-bold text-foreground/50">{text(item.copy.name).charAt(0)}</div>}<div><p className="text-xs font-bold">{text(item.copy.name)}</p><p className="text-xs text-foreground/50">{text(section.copy.verifiedLabel)}, {text(item.copy.business)}</p></div></div></div>;
}

function SellerTestimonials({ section }: { section: ResolvedSellerLandingSection }) {
  const [active, setActive] = useState(0);
  if (!section.items.length) return null;
  return <section className="relative mb-4 w-full overflow-hidden px-4"><Icon icon="solar:quote-up-square-bold-duotone" className="pointer-events-none absolute -top-4 start-4 h-40 w-40 text-primary-200" /><div className="relative mx-auto max-w-site"><Reveal className="mb-8 text-center"><h2 className="mb-2 text-2xl font-bold md:text-3xl">{text(section.copy.title)}</h2><p className="text-sm text-foreground/50">{text(section.copy.subtitle)}</p></Reveal>{section.variant === "featured_carousel" ? <div className="mx-auto max-w-2xl"><TestimonialCard section={section} index={active} /><div className="mt-4 flex justify-center gap-2"><Button isIconOnly variant="flat" aria-label="Previous testimonial" onPress={() => setActive((active - 1 + section.items.length) % section.items.length)}><Icon icon="solar:alt-arrow-left-linear" /></Button><Button isIconOnly variant="flat" aria-label="Next testimonial" onPress={() => setActive((active + 1) % section.items.length)}><Icon icon="solar:alt-arrow-right-linear" /></Button></div></div> : <div className="grid gap-6 md:grid-cols-3">{section.items.map((item, index) => <Reveal key={item.id} delay={index * 0.08}><TestimonialCard section={section} index={index} /></Reveal>)}</div>}</div></section>;
}

export function SellerLandingSectionRenderer({ section, previousType, logo, siteName }: { section: ResolvedSellerLandingSection; previousType?: string; logo: string; siteName: string }) {
  if (section.type === "hero") return <SellerHero section={section} logo={logo} siteName={siteName} />;
  if (section.type === "benefits") return <SellerBenefits section={section} overlapsHero={previousType === "hero"} />;
  if (section.type === "steps") return <SellerSteps section={section} />;
  if (section.type === "testimonials") return <SellerTestimonials section={section} />;
  if (section.type === "registration_form") return <SellerRegisterForm />;
  return null;
}
