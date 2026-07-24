// /redesign/processing — payment interstitial.
// Source: PROCESSING block of `HyperCommerce App.dc.html`. The design advances
// to the result screen after 1.4s; that timing is preserved here.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";
import { useEffect } from "react";

import { Shell } from "@/redesign/components/Shell";
import { layout, v } from "@/redesign/tokens";

const ProcessingPage: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/redesign/result"), 1400);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <Shell
      footer={false}
      header="minimal"
      maxWidth={layout.narrowWidth}
      minimalTitle="Payment"
    >
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div
          className="rd-spinner"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: `4px solid ${v.amberTint}`,
            borderTopColor: v.amber,
          }}
        />
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          Processing your payment…
        </div>
        <div style={{ fontSize: 13, color: v.inkSoft }}>
          Please don&apos;t close this window.
        </div>
      </div>
    </Shell>
  );
};

ProcessingPage.getLayout = (page) => page;

export default ProcessingPage;
