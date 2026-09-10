import NextDocument, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from "next/document";
import { parse } from "cookie";

import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGES,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_DIRECTION_COOKIE_KEY,
} from "@/config/languages";

type HypercommerceDocumentProps = DocumentInitialProps & {
  lang: string;
  dir: "ltr" | "rtl";
};

const languageAttributeScript = `
(function(){
  try {
    var values = document.cookie.split(';').reduce(function(result, item) {
      var separator = item.indexOf('=');
      if (separator < 0) return result;
      result[decodeURIComponent(item.slice(0, separator).trim())] = item.slice(separator + 1);
      return result;
    }, {});
    var read = function(key) {
      if (!values[key]) return null;
      try {
        var value = JSON.parse(decodeURIComponent(values[key]));
        return typeof value === 'string' ? value : null;
      } catch (_) {
        return null;
      }
    };
    var language = read('${LANGUAGE_COOKIE_KEY}');
    var direction = read('${LANGUAGE_DIRECTION_COOKIE_KEY}');
    if (language) document.documentElement.setAttribute('lang', language);
    if (direction === 'ltr' || direction === 'rtl') document.documentElement.setAttribute('dir', direction);
  } catch (_) {}
})();`;

export default function Document({ lang, dir }: HypercommerceDocumentProps) {
  return (
    <Html dir={dir} lang={lang} prefix="og: https://ogp.me/ns#">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: languageAttributeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (
  ctx: DocumentContext,
): Promise<HypercommerceDocumentProps> => {
  const initialProps = await NextDocument.getInitialProps(ctx);
  const cookies = parse(ctx.req?.headers.cookie || "");
  const readCookie = (key: string): string | null => {
    const value = cookies[key];
    if (!value) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(value));
      return typeof parsed === "string" ? parsed : null;
    } catch {
      return null;
    }
  };
  const lang = readCookie(LANGUAGE_COOKIE_KEY) || DEFAULT_LANGUAGE;
  const storedDirection = readCookie(LANGUAGE_DIRECTION_COOKIE_KEY);
  const fallbackDirection =
    FALLBACK_LANGUAGES.find((language) => language.code === lang)?.direction ??
    "ltr";
  const dir =
    storedDirection === "rtl" || storedDirection === "ltr"
      ? storedDirection
      : fallbackDirection;

  return { ...initialProps, lang, dir };
};
