import { useEffect, useRef } from "react";

import { createLandingDocument } from "@/helpers/landingDocument";

interface LandingPageDocumentProps {
  html: string;
  css: string;
  title: string;
  assetBaseUrl: string;
}

export default function LandingPageDocument({
  html,
  css,
  title,
  assetBaseUrl,
}: LandingPageDocumentProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const source = createLandingDocument(
      html,
      css,
      assetBaseUrl,
      window.location.href,
    );
    if (frame.srcdoc !== source) frame.srcdoc = source;
  }, [html, css, assetBaseUrl]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      className="block h-dvh w-full border-0"
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation"
    />
  );
}
