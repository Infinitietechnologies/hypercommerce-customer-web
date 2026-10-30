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

  // Remove outer wrapper document tags while preserving all elements, links, and scripts
  cleaned = cleaned.replace(/<!doctype[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/?(html|head|body)[^>]*>/gi, "");

  return cleaned;
};

const formatLandingCss = (css?: string | null): string => {
  if (!css) return "";

  // Replace 'body' selector with '.custom-landing-page' so root canvas styles
  // (like flex centering, background color, min-height) apply to the landing page wrapper
  // instead of leaking onto document.body and collapsing Next.js #__next layout to 0px width.
  return css.replace(
    /(^|[^a-zA-Z0-9_-])body(?=[^a-zA-Z0-9_-]|$)/g,
    "$1.custom-landing-page",
  );
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

    // 1. Ensure external stylesheets (<link rel="stylesheet">) are attached to head
    const links = Array.from(
      container.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    );
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      try {
        const existing = document.head.querySelector(`link[href="${CSS.escape(href)}"]`);
        if (!existing) {
          const headLink = document.createElement("link");
          headLink.rel = "stylesheet";
          headLink.href = href;
          headLink.setAttribute("data-landing-page-asset", "true");
          document.head.appendChild(headLink);
        }
      } catch (e) {
        console.warn("Error attaching stylesheet:", e);
      }
    });

    // 2. Extract and execute scripts in sequence
    const scriptElements = Array.from(
      container.querySelectorAll<HTMLScriptElement>("script"),
    );

    const executeScripts = async () => {
      for (const oldScript of scriptElements) {
        if (isCancelled) break;

        const src = oldScript.getAttribute("src");
        if (src && /tailwindcss/i.test(src)) {
          continue;
        }

        if (src) {
          await new Promise<void>((resolve) => {
            try {
              const existingScript = document.querySelector<HTMLScriptElement>(
                `script[src="${CSS.escape(src)}"]`,
              );
              if (existingScript && existingScript.dataset.loaded === "true") {
                resolve();
                return;
              }

              const script = document.createElement("script");
              Array.from(oldScript.attributes).forEach((attr) => {
                script.setAttribute(attr.name, attr.value);
              });
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

      // 3. Auto-initialize Swiper if markup (.swiper) exists and hasn't been initialized
      if (!isCancelled) {
        const swipers = container.querySelectorAll<HTMLElement>(".swiper");
        if (swipers.length > 0) {
          const initSwipers = () => {
            const win = window as unknown as { Swiper?: new (el: Element, opts?: unknown) => unknown };
            const SwiperConstructor = win.Swiper;
            if (typeof SwiperConstructor === "function") {
              swipers.forEach((el) => {
                if (!el.classList.contains("swiper-initialized")) {
                  try {
                    new SwiperConstructor(el, {
                      observer: true,
                      observeParents: true,
                      observeSlideChildren: true,
                      resizeObserver: true,
                      navigation: {
                        nextEl: el.querySelector(".swiper-button-next"),
                        prevEl: el.querySelector(".swiper-button-prev"),
                      },
                      pagination: {
                        el: el.querySelector(".swiper-pagination"),
                        clickable: true,
                      },
                    });
                  } catch (e) {
                    console.warn("Swiper init warning:", e);
                  }
                }
              });
            }
          };

          const win = window as unknown as { Swiper?: unknown };
          if (typeof win.Swiper === "function") {
            initSwipers();
          } else {
            const swiperScript = document.createElement("script");
            swiperScript.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
            swiperScript.setAttribute("data-landing-page-asset", "true");
            swiperScript.onload = () => {
              initSwipers();
            };
            document.body.appendChild(swiperScript);
          }
        }
      }
    };

    executeScripts();

    return () => {
      isCancelled = true;
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
        className="w-full min-w-0 custom-landing-page"
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    </DefaultLayout>
  );
}
