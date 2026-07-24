// /redesign/static — CMS-backed legal/info pages.
// Source: STATIC / LEGAL block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { Shell } from "@/redesign/components/Shell";
import { STATIC_PAGES } from "@/redesign/data/mock";
import { RdIcon } from "@/redesign/primitives";
import { layout, v } from "@/redesign/tokens";

const StaticPage: NextPageWithLayout = () => {
  const router = useRouter();
  const slug = (router.query.page as string) || "about";
  const title = STATIC_PAGES[slug] ?? "Page";

  return (
    <Shell header="minimal" maxWidth={layout.narrowWidth} minimalTitle={title}>
      <div style={{ maxWidth: 640, margin: "20px auto", textAlign: "center" }}>
        <RdIcon
          color={v.amberDark}
          icon="solar:document-text-linear"
          size={36}
        />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 8px" }}>
          {title}
        </h1>
        <p style={{ fontSize: 13.5, color: v.inkSoft, lineHeight: 1.7 }}>
          This page&apos;s content is served from the backend CMS.
        </p>
      </div>
    </Shell>
  );
};

StaticPage.getLayout = (page) => page;

export default StaticPage;
