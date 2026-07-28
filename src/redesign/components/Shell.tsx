// Page shell for the redesign sandbox: full header, minimal header, footer, and
// the prototype screen-jump control.
//
// Pixel source: `HyperCommerce App.dc.html` — FULL HEADER, MINIMAL HEADER and
// FOOTER blocks. The screen-jump select is the design's own dev aid, kept so
// every screen is reachable without typing URLs.

import type { CSSProperties, ReactNode } from "react";

import { useRouter } from "next/router";

import { HeaderIconButton, RdIcon, SearchField } from "../primitives";
import { layout, radius, shadow, v } from "../tokens";
import { RD_SCREENS } from "../screens";

const LOGO_SRC = "/logo-icon.png";

/* -------------------------------------------------------------------------- */
/* Logo                                                                        */
/* -------------------------------------------------------------------------- */

function Logo({ height = 42, onClick }: { height?: number; onClick?: () => void }) {
  return (
    <div
      role={onClick ? "button" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        cursor: onClick ? "pointer" : undefined,
      }}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={LOGO_SRC}
        style={{ height, width: height, objectFit: "contain", borderRadius: 10 }}
      />
      <span
        style={{
          fontSize: height >= 40 ? 19 : 15,
          fontWeight: 800,
          fontStyle: "italic",
          letterSpacing: "-.01em",
          whiteSpace: "nowrap",
        }}
      >
        HYPER<span style={{ color: v.amberDark }}>COMMERCE</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Full header                                                                 */
/* -------------------------------------------------------------------------- */

export type HeaderTab = { key: string; icon: string };

export function FullHeader({
  cartCount = 0,
  tabs,
  activeTab,
  onSelectTab,
}: {
  cartCount?: number;
  tabs?: HeaderTab[];
  activeTab?: string;
  onSelectTab?: (key: string) => void;
}) {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  const locationPill = (
    <button
      aria-label="Change delivery location"
      className="rd-field"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 14px",
        border: `1px solid ${v.line}`,
        borderRadius: radius.input,
        background: v.surface,
        flexShrink: 0,
        cursor: "pointer",
        boxShadow: shadow.hairline,
        fontFamily: "inherit",
        color: "inherit",
      }}
      type="button"
    >
      <RdIcon color={v.amberDark} icon="solar:map-point-bold" size={18} />
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1.2,
        }}
      >
        <span style={{ fontSize: 10, color: v.inkSoft }}>Deliver to</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Bengaluru 560001</span>
      </span>
      <RdIcon color={v.inkSoft} icon="solar:alt-arrow-down-linear" size={14} />
    </button>
  );

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: v.surface,
        borderBottom: `1px solid ${v.line}`,
        boxShadow: shadow.header,
      }}
    >
      {/* Desktop bar (≥1024px) — the design's original single-row layout. */}
      <div
        className="rd-hdr-desktop"
        style={{
          maxWidth: layout.maxWidth,
          margin: "0 auto",
          padding: "14px 24px",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Logo onClick={() => go("/redesign/home")} />
        {locationPill}
        <SearchField
          placeholder="Search for products, brands and more"
          style={{ flex: "1 1 260px", minWidth: 220 }}
          onClick={() => go("/redesign/search")}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <HeaderIconButton
            icon="solar:heart-linear"
            label="Wishlist"
            onClick={() => go("/redesign/account?tab=wishlists")}
          />
          <HeaderIconButton
            icon="solar:box-linear"
            label="Orders"
            onClick={() => go("/redesign/account?tab=orders")}
          />
          <HeaderIconButton
            icon="solar:user-circle-linear"
            label="Account"
            onClick={() => go("/redesign/account")}
          />
          <HeaderIconButton
            badge={cartCount}
            icon="solar:cart-large-2-linear"
            label="Cart"
            onClick={() => go("/redesign/cart")}
          />
        </div>
      </div>

      {/* Mobile bar (<1024px) — location replaces the logo, account + cart on the
          right; search and wishlist take the full-width second row. */}
      <div
        className="rd-hdr-mobile"
        style={{
          maxWidth: layout.maxWidth,
          margin: "0 auto",
          padding: "12px 16px",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {locationPill}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            <HeaderIconButton
              icon="solar:user-circle-linear"
              label="Account"
              onClick={() => go("/redesign/account")}
            />
            <HeaderIconButton
              badge={cartCount}
              icon="solar:cart-large-2-linear"
              label="Cart"
              onClick={() => go("/redesign/cart")}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SearchField
            placeholder="Search products, brands…"
            style={{ flex: 1, minWidth: 0 }}
            onClick={() => go("/redesign/search")}
          />
          <HeaderIconButton
            icon="solar:heart-linear"
            label="Wishlist"
            onClick={() => go("/redesign/account?tab=wishlists")}
          />
        </div>
      </div>

      {tabs?.length ? (
        <nav style={{ borderTop: `1px solid ${v.line}` }}>
          <div
            className="rd-hscroll"
            style={{
              maxWidth: layout.maxWidth,
              margin: "0 auto",
              padding: "6px 24px",
              display: "flex",
              gap: 4,
              overflowX: "auto",
            }}
          >
            {tabs.map((t) => {
              const isActive = t.key === activeTab;

              return (
                <button
                  key={t.key}
                  className="rd-tab"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "11px 14px",
                    whiteSpace: "nowrap",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    borderBottom: `2px solid ${isActive ? v.amber : "transparent"}`,
                    color: isActive ? v.ink : v.inkSoft,
                  }}
                  type="button"
                  onClick={() => onSelectTab?.(t.key)}
                >
                  <RdIcon icon={t.icon} size={17} />
                  {t.key}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Minimal header                                                              */
/* -------------------------------------------------------------------------- */

export function MinimalHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: v.surface,
        borderBottom: `1px solid ${v.line}`,
      }}
    >
      <div
        style={{
          maxWidth: layout.narrowWidth,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            border: `1px solid ${v.line}`,
            background: v.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          type="button"
          onClick={() => router.back()}
        >
          <RdIcon icon="solar:arrow-left-linear" size={18} />
        </button>
        <Logo height={30} onClick={() => router.push("/redesign/home")} />
        <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 4 }}>
          {title}
        </span>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "About",
    links: [
      { label: "About HyperCommerce", href: "/redesign/static?page=about" },
      { label: "Sell on HyperCommerce", href: "/redesign/static?page=seller" },
      { label: "Store locator", href: "/redesign/stores" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQs", href: "/redesign/static?page=faqs" },
      { label: "Shipping policy", href: "/redesign/static?page=shipping" },
      { label: "Returns & refunds", href: "/redesign/static?page=returns" },
    ],
  },
  {
    title: "Policy",
    links: [
      { label: "Privacy policy", href: "/redesign/static?page=privacy" },
      { label: "Terms & conditions", href: "/redesign/static?page=terms" },
    ],
  },
];

export function Footer() {
  const router = useRouter();

  return (
    <footer
      style={{
        marginTop: 40,
        background: `linear-gradient(180deg, ${v.amberTint} 0%, ${v.surface} 55%)`,
        borderTop: `1px solid ${v.line}`,
      }}
    >
      <div
        style={{
          maxWidth: layout.maxWidth,
          margin: "0 auto",
          padding: "40px 24px 28px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 28,
          }}
        >
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div
                style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}
              >
                {col.title}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 13,
                  color: v.inkSoft,
                }}
              >
                {col.links.map((l) => (
                  <span
                    key={l.label}
                    role="button"
                    style={{ cursor: "pointer" }}
                    tabIndex={0}
                    onClick={() => router.push(l.href)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(l.href)}
                  >
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
              Stay in the loop
            </div>
            <p
              style={{
                fontSize: 12.5,
                color: v.inkSoft,
                margin: "0 0 12px",
                lineHeight: 1.6,
              }}
            >
              Deals, drops and restocks — straight to your inbox.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  background: v.surface,
                  border: `1px solid ${v.line}`,
                  borderRadius: radius.md,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: v.inkSoft,
                }}
              >
                Email address
              </div>
              <button
                style={{
                  background: v.amber,
                  color: v.onAmber,
                  border: "none",
                  borderRadius: radius.md,
                  padding: "0 16px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                type="button"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 32,
            paddingTop: 22,
            borderTop: `1px solid ${v.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Logo height={26} />
          <span style={{ fontSize: 12, color: v.inkSoft }}>
            © 2026 HyperCommerce. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen jump (prototype aid, as in the design file)                          */
/* -------------------------------------------------------------------------- */

function ScreenJump() {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 50,
        background: v.surface,
        border: `1px solid ${v.line}`,
        borderRadius: radius.md,
        boxShadow: shadow.overlay,
        padding: 8,
      }}
    >
      <select
        className="rd-jump"
        style={{
          fontSize: 12,
          border: "none",
          background: "none",
          color: v.inkSoft,
          cursor: "pointer",
        }}
        value=""
        onChange={(e) => {
          if (e.target.value) router.push(e.target.value);
        }}
      >
        <option value="">Jump to screen…</option>
        {RD_SCREENS.map((s) => (
          <option key={s.href} value={s.href}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                       */
/* -------------------------------------------------------------------------- */

export function Shell({
  children,
  header = "full",
  minimalTitle = "",
  footer = true,
  cartCount = 0,
  tabs,
  activeTab,
  onSelectTab,
  mainStyle,
  maxWidth,
}: {
  children: ReactNode;
  header?: "full" | "minimal" | "none";
  minimalTitle?: string;
  footer?: boolean;
  cartCount?: number;
  tabs?: HeaderTab[];
  activeTab?: string;
  onSelectTab?: (key: string) => void;
  mainStyle?: CSSProperties;
  maxWidth?: number;
}) {
  return (
    <div className="rd">
      {header === "full" ? (
        <FullHeader
          activeTab={activeTab}
          cartCount={cartCount}
          tabs={tabs}
          onSelectTab={onSelectTab}
        />
      ) : null}
      {header === "minimal" ? <MinimalHeader title={minimalTitle} /> : null}

      <main
        style={{
          maxWidth: maxWidth ?? layout.maxWidth,
          margin: "0 auto",
          padding: "24px 24px 8px",
          minHeight: "60vh",
          ...mainStyle,
        }}
      >
        {children}
      </main>

      {footer ? <Footer /> : null}
      <ScreenJump />
    </div>
  );
}
