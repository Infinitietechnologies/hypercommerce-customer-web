// /redesign/not-found — 404 state.
// Source: 404 block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { Shell } from "@/redesign/components/Shell";
import { Button } from "@/redesign/primitives";
import { layout, radius, v } from "@/redesign/tokens";

const NotFoundPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <Shell
      footer={false}
      header="minimal"
      maxWidth={layout.narrowWidth}
      minimalTitle="Not Found"
    >
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, color: v.amberTint }}>
          404
        </div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Page not found</div>
        <p style={{ fontSize: 13.5, color: v.inkSoft, maxWidth: 320 }}>
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Button
          style={{ borderRadius: radius.input, padding: "11px 20px", fontWeight: 600 }}
          onClick={() => router.push("/redesign/home")}
        >
          Back to home
        </Button>
      </div>
    </Shell>
  );
};

NotFoundPage.getLayout = (page) => page;

export default NotFoundPage;
