import NextDocument, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from "next/document";

type HypercommerceDocumentProps = DocumentInitialProps & {
  lang: string;
  dir: "ltr" | "rtl";
};

export default function Document({ lang, dir }: HypercommerceDocumentProps) {
  return (
    <Html dir={dir} lang={lang} prefix="og: https://ogp.me/ns#">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta
          name="google-site-verification"
          content="myEMkqRat5aCxpIq0mD1HfuiWYhtSUOYILkM_fothqo"
        />

      </Head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (
  ctx: DocumentContext
): Promise<HypercommerceDocumentProps> => {
  const initialProps = await NextDocument.getInitialProps(ctx);
  const cookieHeader = ctx.req?.headers.cookie || "";
  const match = /(?:^|;\s*)i18nextLng=([^;]*)/.exec(cookieHeader);
  const lang = match ? decodeURIComponent(match[1]) || "en" : "en";

  return { ...initialProps, lang, dir: lang === "ar" ? "rtl" : "ltr" };
};
