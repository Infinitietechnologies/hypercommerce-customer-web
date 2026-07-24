// /redesign/checkout — two-step checkout under the minimal header.
// Source: CHECKOUT block of `HyperCommerce App.dc.html`. `?step=payment`
// switches to the payment step.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";
import { useState } from "react";

import { Shell } from "@/redesign/components/Shell";
import {
  ADDRESSES,
  INITIAL_CART,
  PAYMENT_METHODS,
  PRODUCTS,
  WALLET_BALANCE,
  money,
} from "@/redesign/data/mock";
import { Button, Radio, RdIcon } from "@/redesign/primitives";
import { layout, radius, v } from "@/redesign/tokens";

const STEPS = [
  { key: "review", num: 1, label: "Review" },
  { key: "payment", num: 2, label: "Payment" },
  { key: "result", num: 3, label: "Order Placed" },
];

/** Shared row chrome for the address / payment / wallet pickers. */
function selectionRowStyle(selected: boolean) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    cursor: "pointer",
    marginBottom: 8,
    border: `1px solid ${selected ? v.amber : v.line}`,
    background: selected ? v.amberTint : v.surface,
  } as const;
}

const CheckoutPage: NextPageWithLayout = () => {
  const router = useRouter();
  const step = router.query.step === "payment" ? "payment" : "review";
  const stepIdx = step === "payment" ? 1 : 0;

  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0].id);
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [useWallet, setUseWallet] = useState(false);

  const items = INITIAL_CART.map((ci) => {
    const p = PRODUCTS.find((x) => x.id === ci.id)!;

    return { ...p, qty: ci.qty, lineTotal: p.price * ci.qty };
  });
  const total = items.reduce((a, it) => a + it.lineTotal, 0);

  return (
    <Shell
      footer={false}
      header="minimal"
      maxWidth={layout.narrowWidth}
      minimalTitle="Checkout"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 28,
        }}
      >
        {STEPS.map((st, i) => (
          <div
            key={st.key}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                background: i <= stepIdx ? v.amber : v.line,
                color: i <= stepIdx ? v.onAmber : v.inkSoft,
              }}
            >
              {st.num}
            </div>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                marginRight: 14,
                color: i <= stepIdx ? v.ink : v.inkSoft,
              }}
            >
              {st.label}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: layout.narrowWidth,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {step === "review" ? (
            <>
              <div
                style={{
                  border: `1px solid ${v.line}`,
                  borderRadius: 16,
                  padding: 18,
                  background: v.surface,
                }}
              >
                <div
                  style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}
                >
                  Delivery address
                </div>
                {ADDRESSES.map((a) => {
                  const selected = selectedAddress === a.id;

                  return (
                    <div
                      key={a.id}
                      className="rd-radio-row"
                      role="button"
                      style={{
                        ...selectionRowStyle(selected),
                        alignItems: "flex-start",
                      }}
                      tabIndex={0}
                      onClick={() => setSelectedAddress(a.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setSelectedAddress(a.id)
                      }
                    >
                      <Radio
                        checked={selected}
                        size={16}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                          {a.label} · {a.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: v.inkSoft,
                            marginTop: 2,
                          }}
                        >
                          {a.line}, {a.city}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  border: `1px solid ${v.line}`,
                  borderRadius: 16,
                  padding: 18,
                  background: v.surface,
                }}
              >
                <div
                  style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 10 }}
                >
                  Promo code
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      border: `1px solid ${v.line}`,
                      borderRadius: radius.sm,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: v.inkSoft,
                    }}
                  >
                    Enter promo code
                  </div>
                  <button
                    className="rd-btn rd-btn-secondary"
                    style={{
                      background: v.bg,
                      border: `1px solid ${v.line}`,
                      borderRadius: radius.sm,
                      padding: "0 16px",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <Button
                style={{
                  alignSelf: "flex-end",
                  borderRadius: radius.input,
                  padding: "13px 26px",
                }}
                onClick={() =>
                  router.push("/redesign/checkout?step=payment", undefined, {
                    shallow: true,
                  })
                }
              >
                Continue to payment
              </Button>
            </>
          ) : (
            <>
              <div
                style={{
                  border: `1px solid ${v.line}`,
                  borderRadius: 16,
                  padding: 18,
                  background: v.surface,
                }}
              >
                <div
                  style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}
                >
                  Payment method
                </div>
                {PAYMENT_METHODS.map((pm) => {
                  const selected = selectedPayment === pm.key;

                  return (
                    <div
                      key={pm.key}
                      className="rd-radio-row"
                      role="button"
                      style={selectionRowStyle(selected)}
                      tabIndex={0}
                      onClick={() => setSelectedPayment(pm.key)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setSelectedPayment(pm.key)
                      }
                    >
                      <Radio checked={selected} size={16} />
                      <RdIcon color={v.inkSoft} icon={pm.icon} size={20} />
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {pm.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="rd-radio-row"
                role="button"
                style={{ ...selectionRowStyle(useWallet), marginBottom: 0 }}
                tabIndex={0}
                onClick={() => setUseWallet((w) => !w)}
                onKeyDown={(e) => e.key === "Enter" && setUseWallet((w) => !w)}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 5,
                    border: `2px solid ${useWallet ? v.amberDark : v.line}`,
                    background: useWallet ? v.amberDark : "transparent",
                    flexShrink: 0,
                  }}
                />
                <RdIcon color={v.inkSoft} icon="solar:wallet-linear" size={20} />
                <div style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>
                  Use wallet balance ({money(WALLET_BALANCE)})
                </div>
              </div>

              <Button
                style={{
                  alignSelf: "flex-end",
                  borderRadius: radius.input,
                  padding: "13px 26px",
                }}
                onClick={() => router.push("/redesign/processing")}
              >
                Place order · {money(total)}
              </Button>
            </>
          )}
        </div>

        <div
          style={{
            border: `1px solid ${v.line}`,
            borderRadius: radius.card,
            padding: 20,
            background: v.surface,
            position: "sticky",
            top: 100,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
            Order summary
          </div>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 8,
                color: v.inkSoft,
                gap: 12,
              }}
            >
              <span>
                {it.name} ×{it.qty}
              </span>
              <span>{money(it.lineTotal)}</span>
            </div>
          ))}
          <div
            style={{
              borderTop: `1px solid ${v.line}`,
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
        </div>
      </div>
    </Shell>
  );
};

CheckoutPage.getLayout = (page) => page;

export default CheckoutPage;
