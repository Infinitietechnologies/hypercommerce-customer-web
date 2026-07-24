// /redesign/account — account area: sticky nav rail plus one of nine panes.
// Source: ACCOUNT AREA block of `HyperCommerce App.dc.html`. Pane selection is
// driven by `?tab=` so every pane has its own shareable URL.

import type { NextPageWithLayout } from "@/types";
import type { ReactNode } from "react";

import { useRouter } from "next/router";

import { WishlistCard } from "@/redesign/components/cards";
import { Shell } from "@/redesign/components/Shell";
import {
  ACCOUNT_NAV,
  ACCOUNT_QUICK_LINKS,
  ACCOUNT_USER,
  ADDRESSES,
  INITIAL_CART,
  NOTIFICATIONS,
  ORDERS,
  ORDER_TIMELINE,
  PRODUCTS,
  WALLET_BALANCE,
  WALLET_TXNS,
  money,
} from "@/redesign/data/mock";
import {
  Button,
  Grid,
  ImageSlot,
  PaneTitle,
  RdIcon,
  StatusPill,
} from "@/redesign/primitives";
import { grids, radius, v } from "@/redesign/tokens";

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

/* -------------------------------------------------------------------------- */
/* Panes                                                                       */
/* -------------------------------------------------------------------------- */

function Overview({ onQuickLink }: { onQuickLink: (key: string) => void }) {
  return (
    <>
      <div
        style={{
          border: `1px solid ${v.line}`,
          borderRadius: radius.card,
          padding: 22,
          background: v.surface,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: v.amberTint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RdIcon color={v.amberDark} icon="solar:user-bold" size={26} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {ACCOUNT_USER.name}
          </div>
          <div style={{ fontSize: 13, color: v.inkSoft }}>
            {ACCOUNT_USER.email}
          </div>
        </div>
      </div>

      <Grid columns={grids.quickLink} gap={14}>
        {ACCOUNT_QUICK_LINKS.map((q) => (
          <div
            key={q.key}
            className="rd-row rd-row-quicklink"
            role="button"
            style={{
              border: `1px solid ${v.line}`,
              borderRadius: 14,
              padding: 16,
              background: v.surface,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            tabIndex={0}
            onClick={() => onQuickLink(q.key)}
            onKeyDown={(e) => e.key === "Enter" && onQuickLink(q.key)}
          >
            <RdIcon color={v.amberDark} icon={q.icon} size={20} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{q.label}</span>
          </div>
        ))}
      </Grid>
    </>
  );
}

function Orders({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <>
      <PaneTitle>My orders</PaneTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ORDERS.map((o) => (
          <div
            key={o.id}
            className="rd-row rd-row-quiet"
            role="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: `1px solid ${v.line}`,
              borderRadius: 14,
              padding: 14,
              background: v.surface,
              cursor: "pointer",
            }}
            tabIndex={0}
            onClick={() => onSelect(o.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(o.id)}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.sm,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <ImageSlot label={o.itemName} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                Order #{o.id}
              </div>
              <div style={{ fontSize: 12, color: v.inkSoft }}>
                {o.date} · {o.itemsCount} item(s)
              </div>
            </div>
            <StatusPill status={o.status} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                minWidth: 70,
                textAlign: "right",
              }}
            >
              {money(o.total)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function OrderDetail({ orderId }: { orderId?: string }) {
  const order = ORDERS.find((o) => o.id === orderId) ?? ORDERS[0];

  return (
    <>
      <PaneTitle style={{ margin: "0 0 6px" }}>Order #{order.id}</PaneTitle>
      <div style={{ fontSize: 13, color: v.inkSoft, marginBottom: 20 }}>
        Placed on {order.date}
      </div>

      <div
        style={{
          border: `1px solid ${v.line}`,
          borderRadius: 16,
          padding: 18,
          background: v.surface,
          marginBottom: 16,
          display: "flex",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.sm,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <ImageSlot label={order.itemName} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.itemName}</div>
          <div style={{ fontSize: 12.5, color: v.inkSoft }}>
            Qty {order.itemsCount}
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        {ORDER_TIMELINE.map((label, i) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                margin: "0 auto",
                background: i <= 1 ? v.amber : v.line,
              }}
            />
            <div
              style={{ fontSize: 11.5, color: v.inkSoft, marginTop: 6 }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button
          style={{ borderRadius: radius.md, padding: "11px 18px", fontSize: 13 }}
          variant="secondary"
        >
          Track order
        </Button>
        <Button
          style={{
            borderRadius: radius.md,
            padding: "11px 18px",
            fontSize: 13,
            color: v.danger,
          }}
          variant="secondary"
        >
          Cancel order
        </Button>
      </div>
    </>
  );
}

function Addresses() {
  return (
    <>
      <PaneTitle>Saved addresses</PaneTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ADDRESSES.map((a) => (
          <div
            key={a.id}
            style={{
              border: `1px solid ${v.line}`,
              borderRadius: 14,
              padding: 16,
              background: v.surface,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                {a.label} · {a.name}
              </div>
              <div
                style={{ fontSize: 12.5, color: v.inkSoft, marginTop: 4 }}
              >
                {a.line}, {a.city}
              </div>
              <div style={{ fontSize: 12.5, color: v.inkSoft }}>{a.phone}</div>
            </div>
            <button
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: v.amberDark,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              type="button"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function Wishlist({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <>
      <PaneTitle>Wishlist</PaneTitle>
      <Grid columns={grids.productCompact} gap={14}>
        {PRODUCTS.slice(2, 6).map((p) => (
          <WishlistCard
            key={p.id}
            product={p}
            onClick={() => onSelect(p.slug)}
          />
        ))}
      </Grid>
    </>
  );
}

function TxnRow({ tx }: { tx: (typeof WALLET_TXNS)[number]; }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: `1px solid ${v.line}`,
        borderRadius: radius.md,
        padding: "12px 16px",
        background: v.surface,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.desc}</div>
        <div style={{ fontSize: 11.5, color: v.inkSoft }}>{tx.date}</div>
      </div>
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: tx.amount > 0 ? v.amberDark : v.ink,
        }}
      >
        {tx.amount > 0 ? "+" : ""}
        {money(tx.amount)}
      </span>
    </div>
  );
}

function Wallet() {
  return (
    <>
      <PaneTitle>Wallet</PaneTitle>
      <div
        style={{
          background: `linear-gradient(135deg, ${v.amberTint}, ${v.surface})`,
          border: `1px solid ${v.line}`,
          borderRadius: radius.card,
          padding: 22,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: v.inkSoft }}>Available balance</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
          {money(WALLET_BALANCE)}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        Recent activity
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {WALLET_TXNS.map((tx) => (
          <TxnRow key={tx.id} tx={tx} />
        ))}
      </div>
    </>
  );
}

function Transactions() {
  return (
    <>
      <PaneTitle>Transactions</PaneTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {WALLET_TXNS.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: `1px solid ${v.line}`,
              borderRadius: radius.md,
              padding: "12px 16px",
              background: v.surface,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.desc}</div>
              <div style={{ fontSize: 11.5, color: v.inkSoft }}>
                {tx.date} · {tx.type}
              </div>
            </div>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: tx.amount > 0 ? v.amberDark : v.ink,
              }}
            >
              {tx.amount > 0 ? "+" : ""}
              {money(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Notifications() {
  return (
    <>
      <PaneTitle>Notifications</PaneTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 12,
              border: `1px solid ${v.line}`,
              borderRadius: radius.md,
              padding: "14px 16px",
              background: v.surface,
            }}
          >
            <RdIcon color={v.amberDark} icon={n.icon} size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: v.inkSoft, marginTop: 2 }}>
                {n.body}
              </div>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: v.inkSoft,
                whiteSpace: "nowrap",
              }}
            >
              {n.time}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Refer() {
  return (
    <>
      <PaneTitle>Refer &amp; earn</PaneTitle>
      <div
        style={{
          border: `1px solid ${v.line}`,
          borderRadius: radius.card,
          padding: 24,
          background: v.surface,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: v.inkSoft, marginBottom: 8 }}>
          Your referral code
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: ".08em",
            color: v.amberDark,
            marginBottom: 16,
          }}
        >
          {ACCOUNT_USER.referralCode}
        </div>
        <Button
          style={{ borderRadius: radius.md, padding: "11px 22px", fontSize: 13.5 }}
        >
          Share invite link
        </Button>
      </div>
      <div style={{ fontSize: 13.5, color: v.inkSoft, lineHeight: 1.7 }}>
        Give ₹100, get ₹100 — your friend gets ₹100 off their first order, and
        you get ₹100 wallet credit once they complete it.
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const AccountPage: NextPageWithLayout = () => {
  const router = useRouter();
  const tab = (router.query.tab as string) || "overview";
  const orderId = router.query.order as string | undefined;

  const setTab = (key: string, extra?: Record<string, string>) =>
    router.push(
      { pathname: "/redesign/account", query: { tab: key, ...extra } },
      undefined,
      { shallow: true },
    );

  const PANES: Record<string, ReactNode> = {
    overview: (
      <Overview
        onQuickLink={(key) =>
          key === "shoppingList"
            ? router.push("/redesign/shopping-list")
            : setTab(key)
        }
      />
    ),
    orders: (
      <Orders onSelect={(id) => setTab("orderDetail", { order: id })} />
    ),
    orderDetail: <OrderDetail orderId={orderId} />,
    addresses: <Addresses />,
    wishlists: (
      <Wishlist
        onSelect={(slug) =>
          router.push({ pathname: "/redesign/pdp", query: { slug } })
        }
      />
    ),
    wallet: <Wallet />,
    transactions: <Transactions />,
    notifications: <Notifications />,
    refer: <Refer />,
  };

  return (
    <Shell cartCount={cartCount}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: `1px solid ${v.line}`,
            borderRadius: 16,
            background: v.surface,
            padding: 8,
            position: "sticky",
            top: 100,
          }}
        >
          {ACCOUNT_NAV.map((an) => {
            // The order-detail pane is reached from the orders list, so keep
            // "My Orders" highlighted while it is showing.
            const isActive =
              tab === an.key || (tab === "orderDetail" && an.key === "orders");

            return (
              <div
                key={an.key}
                role="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 12px",
                  borderRadius: radius.sm,
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: 600,
                  marginBottom: 2,
                  color: isActive ? v.amberDark : v.inkSoft,
                  background: isActive ? v.amberTint : "transparent",
                }}
                tabIndex={0}
                onClick={() => setTab(an.key)}
                onKeyDown={(e) => e.key === "Enter" && setTab(an.key)}
              >
                <RdIcon icon={an.icon} size={18} />
                {an.label}
              </div>
            );
          })}
        </div>

        <div>{PANES[tab] ?? PANES.overview}</div>
      </div>
    </Shell>
  );
};

AccountPage.getLayout = (page) => page;

export default AccountPage;
