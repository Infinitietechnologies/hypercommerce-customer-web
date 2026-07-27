import { FC, useEffect } from "react";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Chip, Image } from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";

const LinkColumn = ({
  header,
  links,
}: {
  header: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <h2 className="text-sm font-bold text-foreground mb-3.5">{header}</h2>
    <div className="flex flex-col gap-2.5">
      {links.map(({ label, href }) => (
        <Link
          key={label}
          className="text-sm text-default-500 hover:text-primary-600 transition-colors"
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
    siteFooterLogo = "https://placehold.co/160x40?text=Logo",
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
    { href: facebookLink, icon: "solar:facebook-linear", label: "Facebook" },
    { href: instagramLink, icon: "solar:instagram-linear", label: "Instagram" },
    { href: youtubeLink, icon: "solar:youtube-linear", label: "YouTube" },
    { href: xLink, icon: "solar:twitter-linear", label: "X" },
  ].filter((s) => s.href);

  return (
    <footer className="w-full border-t border-divider bg-gradient-to-b from-primary-100 to-content1">
      <div className="w-full max-w-site mx-auto px-4 sm:px-6 pt-10 pb-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" title={t("nav.home")}>
              <Image
                alt={siteName}
                classNames={{ img: "h-16 w-auto object-contain", wrapper: "cursor-pointer" }}
                radius="none"
                src={siteFooterLogo}
              />
            </Link>
            <p className="text-xs text-default-500 leading-relaxed mt-3 max-w-xs">
              {shortDescription}
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a
                className="flex items-center gap-2 text-sm text-default-500 hover:text-primary-600 transition-colors"
                href={`tel:${supportNumber}`}
              >
                <Icon className="text-lg text-primary-600" icon="solar:phone-linear" />
                {supportNumber}
              </a>
              <a
                className="flex items-center gap-2 text-sm text-default-500 hover:text-primary-600 transition-colors"
                href={`mailto:${supportEmail}`}
              >
                <Icon className="text-lg text-primary-600" icon="solar:letter-linear" />
                {supportEmail}
              </a>
            </div>
          </div>

          <LinkColumn header={t("footer.quick_links.header")} links={quickLinks} />
          <LinkColumn header={t("footer.policies.header")} links={policyLinks} />

          {/* Social + trust */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3.5">
              {t("footer.social.follow_us")}
            </h2>
            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 mb-5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    aria-label={s.label}
                    className="grid place-items-center w-9 h-9 rounded-full border border-divider bg-content1 text-foreground hover:border-primary hover:text-primary-600 transition-colors"
                    href={s.href as string}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon className="text-lg" icon={s.icon} />
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 text-xs text-default-500">
              <span className="flex items-center gap-2">
                <Icon className="text-base text-primary-600" icon="solar:box-linear" />
                {t("footer.company_info.quality")}
              </span>
              <span className="flex items-center gap-2">
                <Icon className="text-base text-primary-600" icon="solar:shield-check-linear" />
                {t("footer.company_info.secure")}
              </span>
              <span className="flex items-center gap-2">
                <Icon className="text-base text-primary-600" icon="solar:verified-check-linear" />
                {t("footer.company_info.trusted")}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-default-500">
            <span>
              &copy; {new Date().getFullYear()} {siteCopyright}
            </span>
            <Chip className="h-5 px-1 text-xs" radius="sm" size="sm">
              {`V ${version}`}
            </Chip>
          </div>
          <div className="text-xs text-default-500">
            {t("footer.bottom_bar.powered_by")}{" "}
            <a
              className="text-primary-600 hover:text-primary-700 font-semibold"
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
