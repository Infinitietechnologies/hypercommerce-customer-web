import { useRef, useState, type ReactNode } from "react";
import { Image } from "@heroui/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { CheckCircle, Users, Package, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import Reveal from "@/components/custom/Reveal";

interface Step {
  step: string;
  title: string;
  desc: string;
  icon: ReactNode;
  image: string;
  points: string[];
}

// One frame per step — point these at the per-step art when it lands.
const STEP_IMAGES = [
  "/seller-landing/simple-steps.png",
  "/seller-landing/simple-steps.png",
  "/seller-landing/simple-steps.png",
];

export default function SellerSteps() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const steps: Step[] = [
    {
      step: "1",
      title: t("pages.enhancedSellerMarketing.how.steps.register.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.register.desc"),
      icon: <Users className="w-5 h-5" />,
      image: STEP_IMAGES[0],
      points: [
        t("pages.enhancedSellerMarketing.how.steps.register.points.p1"),
        t("pages.enhancedSellerMarketing.how.steps.register.points.p2"),
        t("pages.enhancedSellerMarketing.how.steps.register.points.p3"),
      ],
    },
    {
      step: "2",
      title: t("pages.enhancedSellerMarketing.how.steps.list.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.list.desc"),
      icon: <Package className="w-5 h-5" />,
      image: STEP_IMAGES[1],
      points: [
        t("pages.enhancedSellerMarketing.how.steps.list.points.p1"),
        t("pages.enhancedSellerMarketing.how.steps.list.points.p2"),
        t("pages.enhancedSellerMarketing.how.steps.list.points.p3"),
      ],
    },
    {
      step: "3",
      title: t("pages.enhancedSellerMarketing.how.steps.start.title"),
      desc: t("pages.enhancedSellerMarketing.how.steps.start.desc"),
      icon: <Truck className="w-5 h-5" />,
      image: STEP_IMAGES[2],
      points: [
        t("pages.enhancedSellerMarketing.how.steps.start.points.p1"),
        t("pages.enhancedSellerMarketing.how.steps.start.points.p2"),
        t("pages.enhancedSellerMarketing.how.steps.start.points.p3"),
      ],
    },
  ];

  // Section is `steps.length` viewports tall; progress through it picks the step.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const index = Math.floor(value * steps.length);
    setActive(Math.min(steps.length - 1, Math.max(0, index)));
  });

  const heading = (
    <Reveal className="text-center mb-8">
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
  );

  const stepCard = (item: Step) => (
    <div className="rounded-large border border-primary-200 bg-content1 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-medium bg-primary-50 text-primary flex items-center justify-center">
          {item.icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-primary mb-0.5">
            {t("pages.enhancedSellerMarketing.how.stepLabel", {
              number: item.step,
            })}
          </p>
          <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
          <p className="text-sm text-foreground/50 leading-relaxed mt-1">
            {item.desc}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-divider pt-4">
        {item.points.map((point, pointIdx) => (
          <li
            key={pointIdx}
            className="flex items-start gap-2 text-xs text-foreground/70"
          >
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="w-full px-4">
      {/* Mobile: plain stack, nothing pinned */}
      <div className="md:hidden max-w-7xl mx-auto">
        {heading}
        <div className="flex flex-col gap-5">
          {steps.map((item, idx) => (
            <Reveal key={idx} delay={idx * 0.1}>
              {stepCard(item)}
            </Reveal>
          ))}
        </div>
      </div>

      {/* Desktop: section is 3 viewports tall and pins while the steps advance */}
      <div
        ref={sectionRef}
        className="hidden md:block relative h-[300vh] max-w-7xl mx-auto"
      >
        <div className="sticky top-0 h-screen flex flex-col justify-center">
          {heading}

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            <div className="relative h-full min-h-96 overflow-hidden rounded-large">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  className="absolute inset-0"
                  initial={{
                    opacity: 0,
                    scale: prefersReducedMotion ? 1 : 1.04,
                  }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <Image
                    src={steps[active].image}
                    alt=""
                    radius="none"
                    classNames={{
                      wrapper: "!max-w-full w-full h-full",
                      img: "w-full h-full object-cover object-center",
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex gap-5 self-center">
              {/* Progress rail */}
              <ol className="flex flex-col items-center gap-2 pt-2">
                {steps.map((item, idx) => (
                  <li key={idx} className="flex flex-col items-center gap-2">
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                        idx === active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-content1 border border-divider text-foreground/40"
                      }`}
                    >
                      {item.step}
                    </span>
                    {idx < steps.length - 1 && (
                      <span
                        className={`w-px h-10 transition-colors duration-300 ${
                          idx < active ? "bg-primary" : "bg-divider"
                        }`}
                      />
                    )}
                  </li>
                ))}
              </ol>

              <div className="flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={{
                      opacity: 0,
                      y: prefersReducedMotion ? 0 : 14,
                    }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -14 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {stepCard(steps[active])}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
