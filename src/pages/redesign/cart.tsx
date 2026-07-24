// /redesign/cart — cart with line items and a sticky order summary.
// Source: CART block of `HyperCommerce App.dc.html`. `?empty=1` shows the
// empty-cart state.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";
import { useState } from "react";

import { Shell } from "@/redesign/components/Shell";
import { INITIAL_CART, PRODUCTS, money } from "@/redesign/data/mock";
import { Button, ImageSlot, PageTitle, RdIcon } from "@/redesign/primitives";
import { radius, v } from "@/redesign/tokens";

const CartPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [cart, setCart] = useState(INITIAL_CART);

  const isEmpty = router.query.empty === "1" || cart.length === 0;

  const items = cart.map((ci) => {
    const p = PRODUCTS.find((x) => x.id === ci.id)!;

    return { ...p, qty: ci.qty, lineTotal: p.price * ci.qty };
  });

  const count = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
  const mrpTotal = items.reduce((a, it) => a + it.mrp * it.qty, 0);
  const discount = mrpTotal - subtotal;

  const setQty = (id: number, delta: number) =>
    setCart((c) =>
      c.map((x) =>
        x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x,
      ),
    );

  return (
    <Shell cartCount={count}>
      <PageTitle style={{ margin: "0 0 20px" }}>My Cart ({count})</PageTitle>

      {isEmpty ? (
        <div
          style={{
            minHeight: "40vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <RdIcon
            color={v.inkSoft}
            icon="solar:cart-large-2-linear"
            size={44}
          />
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            Your cart is empty
          </div>
          <Button
            style={{ borderRadius: radius.input, padding: "11px 20px", fontWeight: 600 }}
            onClick={() => router.push("/redesign/home")}
          >
            Start shopping
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  gap: 14,
                  border: `1px solid ${v.line}`,
                  borderRadius: 16,
                  padding: 14,
                  background: v.surface,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: radius.md,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <ImageSlot label={it.name} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: v.inkSoft,
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {it.brand}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      margin: "2px 0 8px",
                    }}
                  >
                    {it.name}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        border: `1px solid ${v.line}`,
                        borderRadius: radius.sm,
                        padding: "4px 10px",
                      }}
                    >
                      <button
                        style={{
                          border: "none",
                          background: "none",
                          fontSize: 16,
                          cursor: "pointer",
                          color: v.ink,
                        }}
                        type="button"
                        onClick={() => setQty(it.id, -1)}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          minWidth: 14,
                          textAlign: "center",
                        }}
                      >
                        {it.qty}
                      </span>
                      <button
                        style={{
                          border: "none",
                          background: "none",
                          fontSize: 16,
                          cursor: "pointer",
                          color: v.ink,
                        }}
                        type="button"
                        onClick={() => setQty(it.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      style={{
                        border: "none",
                        background: "none",
                        fontSize: 12.5,
                        color: v.inkSoft,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      type="button"
                      onClick={() =>
                        setCart((c) => c.filter((x) => x.id !== it.id))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {money(it.lineTotal)}
                </div>
              </div>
            ))}
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
            {[
              { label: "Subtotal", value: money(subtotal) },
              { label: "Discount", value: `−${money(discount)}`, amber: true },
              { label: "Delivery", value: "Free" },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13.5,
                  marginBottom: row.label === "Delivery" ? 14 : 8,
                  color: v.inkSoft,
                }}
              >
                <span>{row.label}</span>
                <span style={{ color: row.amber ? v.amberDark : undefined }}>
                  {row.value}
                </span>
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
                marginBottom: 18,
              }}
            >
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </div>
            <Button
              fullWidth
              style={{ borderRadius: radius.input, padding: 13 }}
              onClick={() => router.push("/redesign/checkout")}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </Shell>
  );
};

CartPage.getLayout = (page) => page;

export default CartPage;
