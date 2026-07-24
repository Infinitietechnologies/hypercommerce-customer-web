// /redesign/result — order confirmation.
// Source: RESULT block of `HyperCommerce App.dc.html`.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { Shell } from "@/redesign/components/Shell";
import { Button, RdIcon } from "@/redesign/primitives";
import { layout, radius, v } from "@/redesign/tokens";

const ORDER_ID = "84512";
const ETA = "Fri, 28 Jul";

const ResultPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <Shell
      footer={false}
      header="minimal"
      maxWidth={layout.narrowWidth}
      minimalTitle="Order Confirmation"
    >
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: v.amberTint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RdIcon
            color={v.amberDark}
            icon="solar:check-circle-linear"
            size={40}
          />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Order placed successfully
        </div>
        <div style={{ fontSize: 13.5, color: v.inkSoft, maxWidth: 360 }}>
          Order #{ORDER_ID} will be delivered by {ETA}. A confirmation has been
          sent to your email.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Button
            style={{ borderRadius: radius.input, padding: "12px 20px", fontSize: 13.5 }}
            variant="secondary"
            onClick={() => router.push("/redesign/account?tab=orders")}
          >
            View order
          </Button>
          <Button
            style={{ borderRadius: radius.input, padding: "12px 20px", fontSize: 13.5 }}
            onClick={() => router.push("/redesign/home")}
          >
            Continue shopping
          </Button>
        </div>
      </div>
    </Shell>
  );
};

ResultPage.getLayout = (page) => page;

export default ResultPage;
