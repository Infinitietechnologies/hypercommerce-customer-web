import { FC, useEffect } from "react";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Chip, Image } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";

/** Inline brand glyphs — rendered directly so they never depend on a runtime
 *  icon fetch. `currentColor` lets them follow the button's hover colour. */
const SOCIAL_ICON: Record<string, React.ReactNode> = {
  Facebook: (
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.07 1.47-4.07 4.17v2.24H7.8V13h2.7v8h3z" />
  ),
  Instagram: (
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.38.19-1.7.32-.43.16-.74.36-1.06.68-.32.32-.52.63-.68 1.06-.13.32-.28.8-.32 1.7-.06 1.24-.07 1.6-.07 4.74s.01 3.5.07 4.74c.04.9.19 1.38.32 1.7.16.43.36.74.68 1.06.32.32.63.52 1.06.68.32.13.8.28 1.7.32 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.16.74-.36 1.06-.68.32-.32.52-.63.68-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.7a2.86 2.86 0 0 0-.68-1.06 2.86 2.86 0 0 0-1.06-.68c-.32-.13-.8-.28-1.7-.32-1.24-.06-1.6-.07-4.74-.07zm0 3.06a4.98 4.98 0 1 1 0 9.96 4.98 4.98 0 0 1 0-9.96zm0 8.22a3.24 3.24 0 1 0 0-6.48 3.24 3.24 0 0 0 0 6.48zm6.34-8.42a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0z" />
  ),
  YouTube: (
    <path d="M23.5 6.9a3 3 0 0 0-2.1-2.12C19.5 4.25 12 4.25 12 4.25s-7.5 0-9.4.53A3 3 0 0 0 .5 6.9 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.1 3 3 0 0 0 2.1 2.12c1.9.53 9.4.53 9.4.53s7.5 0 9.4-.53a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.1zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
  ),
  X: (
    <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-6.08l-4.76-6.22L5.46 21H2.44l7.06-8.07L2.25 3h6.24l4.3 5.69L17.53 3zm-1.06 16.2h1.67L7.6 4.71H5.8l10.67 14.49z" />
  ),
};

const LinkColumn = ({
  header,
  links,
}: {
  header: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <h3 className="font-display text-sm font-semibold tracking-wide uppercase text-ink-foreground mb-4">{header}</h3>
    <div className="flex flex-col gap-2.5">
      {links.map(({ label, href }) => (
        <Link
          key={label}
          className="text-sm text-ink-foreground/70 hover:text-primary transition-colors"
          href={href}
          title={label}
        >
          {label}
        </Link>
      ))}
    </div>
  </div>
);

/**
 * Storefront footer — new amber redesign. Warm amber-tint → surface gradient,
 * warm-ink text, amber links (source: `HyperCommerce App.dc.html` FOOTER).
 * All data wiring, links, i18n keys and the footer-script injection are carried
 * over from the previous slate footer unchanged.
 */
const Footer: FC = () => {
  const { webSettings, isSingleVendor } = useSettings();
  const { t } = useTranslation();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "0";

  const {
    siteName = "",
    shortDescription = "",
    siteCopyright = "",
    supportEmail = "",
    supportNumber = "",
    siteHeaderDarkLogo = "https://placehold.co/160x40?text=Logo",
    facebookLink = null,
    instagramLink = null,
    xLink = null,
    youtubeLink = null,
  } = webSettings || {};

  useEffect(() => {
    if (webSettings?.footerScript) {
      const temp = document.createElement("div");
      temp.innerHTML = webSettings.footerScript;
      Array.from(temp.querySelectorAll("script")).forEach((oldScript) => {
        const newScript = document.createElement("script");
        if (oldScript.src) newScript.src = oldScript.src;
        if (oldScript.textContent) newScript.textContent = oldScript.textContent;
        document.head.appendChild(newScript);
      });
    }
  }, [webSettings?.footerScript]);

  const quickLinks = [
    { label: t("footer.quick_links.about_us"), href: "/about-us" },
    { label: t("footer.quick_links.faqs"), href: "/faqs" },
    ...(!isSingleVendor
      ? [
          { label: t("footer.quick_links.stores"), href: "/stores" },
          { label: t("footer.quick_links.become_seller", "Become a Seller"), href: "/seller-register" },
        ]
      : []),
  ];

  const policyLinks = [
    { label: t("footer.policies.privacy_policy"), href: "/privacy-policy" },
    { label: t("footer.policies.terms_conditions"), href: "/terms-and-conditions" },
    { label: t("footer.policies.shipping_policy"), href: "/shipping-policy" },
    { label: t("footer.policies.return_refund_policy"), href: "/return-refund-policy" },
  ];

  const socials = [
    { href: facebookLink, label: "Facebook" },
    { href: instagramLink, label: "Instagram" },
    { href: youtubeLink, label: "YouTube" },
    { href: xLink, label: "X" },
  ].filter((s) => s.href);

  return (
    <footer className="w-full bg-ink text-ink-foreground border-t border-white/10">
      <div className="w-full max-w-site mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" title={t("nav.home")}>
              <Image
                alt={siteName}
                classNames={{ img: "h-16 w-auto object-contain", wrapper: "cursor-pointer" }}
                radius="none"
                src={siteHeaderDarkLogo}
              />
            </Link>
            <p className="text-xs text-ink-foreground/70 leading-relaxed mt-4 max-w-xs">
              {shortDescription}
            </p>
            <div className="flex flex-col gap-2.5 mt-5">
              <a
                className="flex items-center gap-2 text-sm text-ink-foreground/70 hover:text-primary transition-colors"
                href={`tel:${supportNumber}`}
              >
                <Icon className="text-lg text-primary" icon="solar:phone-linear" />
                {supportNumber}
              </a>
              <a
                className="flex items-center gap-2 text-sm text-ink-foreground/70 hover:text-primary transition-colors"
                href={`mailto:${supportEmail}`}
              >
                <Icon className="text-lg text-primary" icon="solar:letter-linear" />
                {supportEmail}
              </a>
            </div>
          </div>

          <LinkColumn header={t("footer.quick_links.header")} links={quickLinks} />
          <LinkColumn header={t("footer.policies.header")} links={policyLinks} />

          {/* Social + trust */}
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide uppercase text-ink-foreground mb-4">
              {t("footer.social.follow_us")}
            </h3>
            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 mb-6">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    aria-label={s.label}
                    className="grid place-items-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-ink-foreground hover:bg-primary hover:border-primary hover:text-zinc-950 transition-colors"
                    href={s.href as string}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-[18px] w-[18px]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {SOCIAL_ICON[s.label]}
                    </svg>
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 text-xs text-ink-foreground/70">
              <span className="flex items-center gap-2">
                <Icon className="text-base text-primary" icon="solar:box-linear" />
                {t("footer.company_info.quality")}
              </span>
              <span className="flex items-center gap-2">
                <Icon className="text-base text-primary" icon="solar:shield-check-linear" />
                {t("footer.company_info.secure")}
              </span>
              <span className="flex items-center gap-2">
                <Icon className="text-base text-primary" icon="solar:verified-check-linear" />
                {t("footer.company_info.trusted")}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-ink-foreground/60">
            <span>
              &copy; {new Date().getFullYear()} {siteCopyright}
            </span>
            <Chip
              className="h-5 px-2 text-[10px] bg-white/10 text-ink-foreground border-none"
              radius="sm"
              size="sm"
            >
              {`V ${version}`}
            </Chip>
          </div>
          <div className="text-xs text-ink-foreground/60">
            {t("footer.bottom_bar.powered_by")}{" "}
            <a
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
              href="https://infinitietech.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Infinitietech
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
