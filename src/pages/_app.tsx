import ErrorBoundary from "@/components/Functional/ErrorBoundary";
import type { AppProps } from "next/app";
import Head from "next/head";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import ReduxProvider from "@/lib/redux/ReduxProvider";

// The one auth sheet for the app — every trigger drives it through authSheetStore.
const AuthSheetHost = dynamic(
  () => import("@/features/auth/components/AuthSheetHost"),
  { ssr: false },
);
import DefaultLayout from "@/layouts/default";
import UserLayout from "@/layouts/UserLayout";
import { NextPageWithLayout } from "@/types";
import { fontSans, fontMono, fontDisplay } from "@/config/fonts";
import { trackPageView } from "@/lib/analytics";
import { adTrackingService } from "@/services/adTrackingService";
import "@/styles/index.css";
import { CircleX } from "lucide-react";
import i18n from "../../i18n";

const ToastProvider = dynamic(
  () => import("@heroui/react").then((mod) => mod.ToastProvider),
  { ssr: false }
);

const ProgressBar = dynamic(() => import("@/components/ProgressBar"), {
  ssr: false,
});

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Maps a /my-account/* pathname to its nav-rail key so the account shell can be
// rendered ONCE (persistent) and only its content pane swaps on navigation.
const accountTabForPath = (pathname: string): string => {
  if (pathname.startsWith("/my-account/orders")) return "orders";
  if (pathname.startsWith("/my-account/addresses")) return "addresses";
  if (pathname.startsWith("/my-account/wishlists")) return "wishlists";
  if (pathname.startsWith("/my-account/wallet")) return "wallet";
  if (pathname.startsWith("/my-account/transactions")) return "transactions";
  if (pathname.startsWith("/my-account/notifications")) return "notifications";
  if (pathname.startsWith("/my-account/refer-and-earn")) return "refer-and-earn";
  // /my-account and /my-account/profile both highlight the overview row.
  return "my-account";
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  // // Set initial RTL direction based on language
  useEffect(() => {
    const currentLang = i18n.language;
    if (currentLang === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", currentLang);
    }

    // Initialize Ad Tracking Service
    adTrackingService.init();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Get the page title from document or use the URL as fallback
      const pageTitle = document.title || url;
      trackPageView(url, pageTitle);
    };

    // Track initial page view
    handleRouteChange(router.pathname);

    // Listen to route changes
    router.events.on("routeChangeComplete", handleRouteChange);

    // Cleanup listener on unmount
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, router.pathname]);

  // ✅ Use custom layout if defined, else wrap in DefaultLayout
  const getLayout =
    Component.getLayout ??
    ((page) => (
      <DefaultLayout initialSettings={pageProps?.initialSettings}>
        {page}
      </DefaultLayout>
    ));

  // Account routes share ONE persistent nav rail (UserLayout). Rendering it here
  // — rather than inside each page — keeps the rail mounted across navigation so
  // only the content pane updates. Pages must NOT wrap themselves in UserLayout.
  const isAccountRoute = router.pathname.startsWith("/my-account");
  const pageElement = <Component {...pageProps} />;
  const content = isAccountRoute ? (
    <UserLayout activeTab={accountTabForPath(router.pathname)}>
      {pageElement}
    </UserLayout>
  ) : (
    pageElement
  );

  const isSandboxRoute =
    router.pathname.startsWith("/redesign") ||
    router.pathname.startsWith("/design-system");

  return (
    <HeroUIProvider navigate={router.push}>
      <Head>
        <style>{`:root{--font-sans:${fontSans.style.fontFamily};--font-display:${fontDisplay.style.fontFamily};}`}</style>
        {isSandboxRoute && (
          <meta name="robots" content="noindex, nofollow" key="robots" />
        )}
      </Head>
      <NextThemesProvider
        forcedTheme="light"
        defaultTheme="light"
        attribute="class"
        disableTransitionOnChange
      >
        <ProgressBar />
        <ToastProvider
          placement="top-right"
          toastOffset={10}
          toastProps={{
            classNames: {
              base: "max-w-[calc(100vw-40px)] sm:max-w-md pe-6",
              title: "whitespace-normal line-clamp-none overflow-visible",
              description: "whitespace-normal line-clamp-none overflow-visible text-ellipsis-none",
            },

            timeout: 4000,
            closeIcon: (
              <CircleX
                size={34}
                strokeWidth={2.5}
                className="text-foreground/25"
              />
            ),
          }}
        />
        <ReduxProvider>
          <ErrorBoundary>{getLayout(content)}</ErrorBoundary>
          <AuthSheetHost />
        </ReduxProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export default App;

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
  display: fontDisplay.style.fontFamily,
};
