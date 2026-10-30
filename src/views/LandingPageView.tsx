import { useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import useSWR from "swr";

import DynamicSEO from "@/SEO/DynamicSEO";
import DefaultLayout from "@/layouts/default";
import FullPageLoader from "@/components/ui/FullPageLoader";
import Custom404 from "@/pages/404";
import { getLandingPage } from "@/services/landingPage";
import type { LandingPageData } from "@/types/landingPage";
import type { Settings } from "@/types/ApiResponse";

interface LandingPageViewProps {
  initialLandingPage?: LandingPageData | null;
  initialSettings?: Settings | null;
  initialSlug?: string;
}

const cleanLandingHtml = (rawHtml?: string | null): string => {
  if (!rawHtml) return "";

  // Remove inert tailwind browser runtime script tag as we load it via next/script
  let cleaned = rawHtml.replace(
    /<script\b[^>]*src=["'][^"']*(?:tailwindcss|cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser)[^"']*["'][^>]*>\s*<\/script>/gi,
    "",
  );

  // Normalize relative image paths like src="images/..." or src="./images/..." to "/images/..."
  cleaned = cleaned.replace(/src=["'](?:\.\/)?images\//gi, 'src="/images/');

  // Remove outer wrapper document tags while preserving all elements, links, and scripts
  cleaned = cleaned.replace(/<!doctype[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/?(html|head|body)[^>]*>/gi, "");

  return cleaned;
};

const formatLandingCss = (css?: string | null): string => {
  if (!css) return "";

  const scope = ".custom-landing-page";

  // 1. Replace root 'body' and 'html' selectors with the scope class
  let clean = css
    .replace(/(^|[^a-zA-Z0-9_-])(body|html)(?=[^a-zA-Z0-9_-]|$)/g, `$1${scope}`);

  // 2. Prefix every selector with the scope class so that universal rules
  // (e.g. * { margin: 0; padding: 0; }) or global classes do not leak into
  // the site Header (Navbar) or Footer and break their `mx-auto` centering.
  let output = "";
  let buffer = "";
  let depth = 0;
  let inKeyframes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (char === "{") {
      const selector = buffer.trim();
      buffer = "";

      if (
        selector.startsWith("@keyframes") ||
        selector.startsWith("@-webkit-keyframes")
      ) {
        inKeyframes = true;
        output += `${selector} {`;
      } else if (selector.startsWith("@")) {
        // @media, @supports, etc.
        output += `${selector} {`;
      } else if (inKeyframes) {
        // Keyframe steps (0%, 100%, from, to)
        output += `${selector} {`;
      } else {
        // Normal CSS selector rule
        const prefixed = selector
          .split(",")
          .map((s) => {
            const trimmed = s.trim();
            if (!trimmed) return "";
            if (trimmed === ":root") return `:root, ${scope}`;
            if (trimmed.startsWith(":root ")) {
              return trimmed.replace(/^:root\s+/, `${scope} `);
            }
            if (trimmed === scope) return scope;
            if (trimmed.startsWith(scope)) return trimmed;
            return `${scope} ${trimmed}`;
          })
          .filter(Boolean)
          .join(", ");
        output += `${prefixed || selector} {`;
      }
      depth++;
    } else if (char === "}") {
      output += `${buffer}}`;
      buffer = "";
      depth--;
      if (depth === 0) {
        inKeyframes = false;
      }
    } else {
      buffer += char;
    }
  }

  output += buffer;
  return output;
};

export default function LandingPageView({
  initialLandingPage,
  initialSettings,
  initialSlug,
}: LandingPageViewProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const routeSlug =
    typeof router.query.slug === "string"
      ? router.query.slug
      : router.asPath.match(/^\/go\/([^/?#]+)/)?.[1];

  let slug = routeSlug || initialSlug || "";
  try {
    slug = decodeURIComponent(slug);
  } catch {
    slug = "";
  }

  const { data: response, isLoading } = useSWR(
    slug ? ["landing-page", slug] : null,
    () => getLandingPage(slug),
    {
      fallbackData:
        initialSlug === slug && initialLandingPage
          ? { success: true, message: "", data: initialLandingPage }
          : undefined,
      revalidateOnFocus: false,
      revalidateOnMount: !initialLandingPage || initialSlug !== slug,
      dedupingInterval: 60_000,
    },
  );

  const landingPage = response?.success && response?.data?.is_active ? response.data : null;

  const cleanedHtml = useMemo(
    () => cleanLandingHtml(landingPage?.html),
    [landingPage?.html],
  );

  const formattedCss = useMemo(
    () => formatLandingCss(landingPage?.css),
    [landingPage?.css],
  );

  // Execute CDN scripts, inline scripts, and ensure external stylesheets are loaded
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cleanedHtml) return;

    let isCancelled = false;

    // 1. Ensure external stylesheets and preconnect links are attached to head
    const linkTags = Array.from(
      container.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"], link[rel="preconnect"]',
      ),
    );
    linkTags.forEach((link) => {
      const href = link.getAttribute("href");
      const rel = link.getAttribute("rel") || "stylesheet";
      if (!href) return;
      try {
        const existing = Array.from(document.head.querySelectorAll("link")).find(
          (l) => l.getAttribute("href") === href && l.getAttribute("rel") === rel,
        );
        if (!existing) {
          const headLink = document.createElement("link");
          headLink.rel = rel;
          headLink.href = href;
          if (link.hasAttribute("crossorigin")) {
            headLink.setAttribute("crossorigin", link.getAttribute("crossorigin") || "");
          }
          headLink.setAttribute("data-landing-page-asset", "true");
          document.head.appendChild(headLink);
        }
      } catch (e) {
        console.warn("Error attaching link asset:", e);
      }
    });

    // Helper: load an external script and resolve when ready
    const loadScript = (src: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        try {
          const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${CSS.escape(src)}"]`,
          );
          if (existingScript) {
            if (existingScript.dataset.loaded === "true") {
              resolve();
              return;
            }
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => resolve(), { once: true });
            return;
          }

          const script = document.createElement("script");
          script.src = src;
          script.async = false;
          script.setAttribute("data-landing-page-asset", "true");

          script.onload = () => {
            script.dataset.loaded = "true";
            resolve();
          };
          script.onerror = (e) => {
            console.error("Failed to load landing page script:", src, e);
            resolve();
          };

          document.body.appendChild(script);
        } catch (err) {
          console.error("Error setting up script:", err);
          resolve();
        }
      });
    };

    // Helper: ensure Swiper JS and CSS are available
    const ensureSwiper = async (): Promise<boolean> => {
      const win = window as unknown as { Swiper?: unknown };
      if (typeof win.Swiper === "function") return true;

      // Ensure Swiper CSS
      if (!document.querySelector('link[href*="swiper"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
        link.setAttribute("data-landing-page-asset", "true");
        document.head.appendChild(link);
      }

      // Load Swiper bundle JS
      await loadScript("https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js");
      return typeof (window as unknown as { Swiper?: unknown }).Swiper === "function";
    };

    // Helper: initialize any uninitialized .swiper containers
    const initSwiperElements = () => {
      const swipers = container.querySelectorAll<HTMLElement>(".swiper");
      if (swipers.length === 0) return;

      const win = window as unknown as {
        Swiper?: new (el: Element, opts?: unknown) => unknown;
      };
      const SwiperConstructor = win.Swiper;
      if (typeof SwiperConstructor !== "function") return;

      swipers.forEach((el) => {
        if (el.classList.contains("swiper-initialized")) return;

        try {
          const nextBtn =
            el.querySelector<HTMLElement>(".swiper-button-next") ||
            el.parentElement?.querySelector<HTMLElement>(".swiper-button-next");
          const prevBtn =
            el.querySelector<HTMLElement>(".swiper-button-prev") ||
            el.parentElement?.querySelector<HTMLElement>(".swiper-button-prev");
          const paginationEl =
            el.querySelector<HTMLElement>(".swiper-pagination") ||
            el.parentElement?.querySelector<HTMLElement>(".swiper-pagination");

          new SwiperConstructor(el, {
            observer: true,
            observeParents: true,
            observeSlideChildren: true,
            resizeObserver: true,
            grabCursor: true,
            loop: true,
            navigation:
              nextBtn && prevBtn
                ? { nextEl: nextBtn, prevEl: prevBtn }
                : { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            pagination: paginationEl
              ? { el: paginationEl, clickable: true }
              : { el: ".swiper-pagination", clickable: true },
          });
        } catch (e) {
          console.warn("Swiper auto-init warning:", e);
        }
      });
    };

    const runScriptsAndInitializers = async () => {
      // If markup has .swiper elements, pre-load Swiper library so any subsequent
      // inline scripts calling `new Swiper()` won't crash with "Swiper is not defined"
      const hasSwiperMarkup = container.querySelectorAll(".swiper").length > 0;
      if (hasSwiperMarkup) {
        await ensureSwiper();
      }

      if (isCancelled) return;

      // Extract and execute scripts from container in sequence
      const scriptElements = Array.from(
        container.querySelectorAll<HTMLScriptElement>("script"),
      );

      for (const oldScript of scriptElements) {
        if (isCancelled) break;

        const src = oldScript.getAttribute("src");
        if (src && /tailwindcss/i.test(src)) {
          continue;
        }

        if (src) {
          await loadScript(src);
        } else {
          try {
            const inlineScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach((attr) => {
              inlineScript.setAttribute(attr.name, attr.value);
            });
            inlineScript.setAttribute("data-landing-page-asset", "true");
            inlineScript.textContent = oldScript.textContent || "";
            document.body.appendChild(inlineScript);
          } catch (err) {
            console.error("Error executing landing page inline script:", err);
          }
        }
      }

      if (isCancelled) return;

      // Dispatch synthetic events in case inline scripts attached listeners for DOMContentLoaded or load
      try {
        document.dispatchEvent(new Event("DOMContentLoaded"));
        window.dispatchEvent(new Event("load"));
      } catch {}

      // Auto-initialize Swiper if elements exist and weren't initialized by inline scripts
      if (hasSwiperMarkup) {
        initSwiperElements();
        // Retry after a small delay in case layout or styles are still adjusting
        setTimeout(initSwiperElements, 100);
        setTimeout(initSwiperElements, 500);
      }
    };

    runScriptsAndInitializers();

    return () => {
      isCancelled = true;
      document
        .querySelectorAll('[data-landing-page-asset="true"]')
        .forEach((el) => el.remove());
    };
  }, [cleanedHtml]);

  if (isLoading && !landingPage) {
    return (
      <DefaultLayout
        initialSettings={initialSettings}
        showHeaderFooter={true}
        fullWidth={true}
      >
        <FullPageLoader />
      </DefaultLayout>
    );
  }

  if (!landingPage) {
    return (
      <DefaultLayout
        initialSettings={initialSettings}
        showHeaderFooter={true}
        fullWidth={false}
      >
        <Custom404 />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout
      initialSettings={initialSettings}
      showHeaderFooter={landingPage.show_header_footer}
      fullWidth={true}
    >
      <DynamicSEO
        title={landingPage.title}
        canonical={`/go/${encodeURIComponent(landingPage.slug)}/`}
        ogType="website"
      />

      <Head>
        {formattedCss ? (
          <style
            id="custom-landing-page-css"
            key="custom-landing-page-css"
            dangerouslySetInnerHTML={{ __html: formattedCss }}
          />
        ) : null}
      </Head>

      <Script
        id="tailwind-browser-runtime"
        src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3"
        strategy="afterInteractive"
      />

      <div
        ref={containerRef}
        className="w-full min-w-0 min-h-screen custom-landing-page"
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    </DefaultLayout>
  );
}
