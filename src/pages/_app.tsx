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
import GoogleAnalytics from "@/components/Functional/GoogleAnalytics";
import MicrosoftClarity from "@/components/Functional/MicrosoftClarity";
import { adTrackingService } from "@/services/adTrackingService";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "@/styles/index.css";
import { CircleX } from "lucide-react";

const ToastProvider = dynamic(
  () => import("@/components/ui").then((mod) => mod.ToastProvider),
  { ssr: false },
);

const ProgressBar = dynamic(() => import("@/components/ProgressBar"), {
  ssr: false,
});

const SupportNotificationListener = dynamic(
  () => import("@/features/support/components/SupportNotificationListener"),
  { ssr: false },
);

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
  if (pathname.startsWith("/my-account/support")) return "support";
  if (pathname.startsWith("/my-account/refer-and-earn"))
    return "refer-and-earn";
  // /my-account and /my-account/profile both highlight the overview row.
  return "my-account";
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  useEffect(() => {
    adTrackingService.init();
  }, []);

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
      <GoogleAnalytics />
      <MicrosoftClarity />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
          key="viewport"
        />
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
              base: "max-w-[calc(100vw-40px)] pe-14 sm:max-w-md",
              closeButton:
                "end-2! top-2! pointer-events-auto size-10 min-w-10 bg-transparent p-0 opacity-100 hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              title: "whitespace-normal line-clamp-none overflow-visible",
              description:
                "whitespace-normal line-clamp-none overflow-visible text-ellipsis-none",
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
        <LanguageProvider>
          <ReduxProvider>
            <ErrorBoundary>{getLayout(content)}</ErrorBoundary>
            <AuthSheetHost />
            <SupportNotificationListener />
          </ReduxProvider>
        </LanguageProvider>
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
