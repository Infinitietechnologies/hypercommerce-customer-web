// /redesign/foundations — design tokens and UI atoms.
//
// Ported 1:1 from `ecommerce-website-design/HyperCommerce Foundations.dc.html`,
// with the colour values reconciled to the App/Kit files (see tokens.ts for why).

import type { NextPageWithLayout } from "@/types";
import type { ReactNode } from "react";

import {
  Button,
  Card,
  Checkbox,
  Chip,
  DiscountBadge,
  IconButton,
  ImageSlot,
  Radio,
  RatingBadge,
  RdIcon,
  StatusPill,
  TextField,
} from "@/redesign/primitives";
import { layout, radius, rdColors, shadow, v } from "@/redesign/tokens";

const SWATCHES: { name: string; hex: string }[] = [
  { name: "Ink", hex: rdColors.ink },
  { name: "Ink soft", hex: rdColors.inkSoft },
  { name: "Line", hex: rdColors.line },
  { name: "Surface", hex: rdColors.surface },
  { name: "Background", hex: rdColors.bg },
  { name: "Amber", hex: rdColors.amber },
  { name: "Amber dark", hex: rdColors.amberDark },
  { name: "Amber tint", hex: rdColors.amberTint },
  { name: "Danger", hex: rdColors.danger },
  { name: "On amber", hex: rdColors.onAmber },
];

const ICONS: { name: string; icon: string }[] = [
  { name: "Search", icon: "solar:magnifer-linear" },
  { name: "Cart", icon: "solar:cart-large-2-linear" },
  { name: "Wishlist", icon: "solar:heart-linear" },
  { name: "Orders", icon: "solar:box-linear" },
  { name: "Account", icon: "solar:user-circle-linear" },
  { name: "Location", icon: "solar:map-point-bold" },
  { name: "Wallet", icon: "solar:wallet-linear" },
  { name: "Star", icon: "solar:star-bold" },
  { name: "Delivery", icon: "solar:delivery-linear" },
  { name: "Shield", icon: "solar:shield-check-linear" },
  { name: "Refresh", icon: "solar:refresh-linear" },
  { name: "Share", icon: "solar:share-linear" },
  { name: "Store", icon: "solar:shop-linear" },
  { name: "Gift", icon: "solar:gift-linear" },
  { name: "Bell", icon: "solar:bell-linear" },
  { name: "Checklist", icon: "solar:checklist-linear" },
];

const SHADOWS: { name: string; value: string }[] = [
  { name: "hairline", value: shadow.hairline },
  { name: "card", value: shadow.card },
  { name: "cardHover", value: shadow.cardHover },
  { name: "banner", value: shadow.banner },
  { name: "amber", value: shadow.amber },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          color: v.inkSoft,
          margin: "0 0 16px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const FoundationsPage: NextPageWithLayout = () => {
  return (
    <div className="rd">
      <header style={{ borderBottom: `1px solid ${v.line}`, padding: "20px 24px" }}>
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            alt=""
            src="/logo-icon.png"
            style={{ height: 34, width: 34, borderRadius: 10 }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              Foundations &amp; Components
            </div>
            <div style={{ fontSize: 12.5, color: v.inkSoft }}>
              Design tokens and UI atoms used across the storefront.
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: `32px ${layout.gutter}px 60px`,
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        <Section title="Colour">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
              gap: 14,
            }}
          >
            {SWATCHES.map((sw) => (
              <div
                key={sw.name}
                style={{
                  border: `1px solid ${v.line}`,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <div style={{ height: 70, background: sw.hex }} />
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {sw.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: v.inkSoft,
                      fontFamily: "monospace",
                    }}
                  >
                    {sw.hex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div
            style={{
              border: `1px solid ${v.line}`,
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: v.surface,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700 }}>Display — 28 / 700</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Heading — 22 / 700</div>
            <div style={{ fontSize: 19, fontWeight: 600 }}>
              Section title — 19 / 600
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Subtitle — 15 / 600</div>
            <div style={{ fontSize: 13.5, fontWeight: 400 }}>
              Body — 13.5 / 400. The quick brown fox jumps over the lazy dog.
            </div>
            <div style={{ fontSize: 12, color: v.inkSoft }}>
              Caption — 12 / muted. Secondary metadata and helper text.
            </div>
          </div>
        </Section>

        <Section title="Buttons">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tinted">Tinted</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="disabled">Disabled</Button>
            <IconButton icon="solar:heart-linear" />
          </div>
        </Section>

        <Section title="Inputs">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 420,
            }}
          >
            <TextField icon="solar:magnifer-linear" placeholder="Search field" />
            <TextField placeholder="Text input" />
            <TextField focused placeholder="Focused input" />
            <Checkbox checked label="Checkbox · selected" />
            <Radio checked label="Radio · selected" />
          </div>
        </Section>

        <Section title="Chips &amp; badges">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Chip>Filter chip</Chip>
            <Chip selected>Selected chip</Chip>
            <StatusPill status="Delivered" />
            <StatusPill status="Shipped" />
            <StatusPill status="Cancelled" />
            <DiscountBadge>50% off</DiscountBadge>
            <RatingBadge value="4.4" />
          </div>
        </Section>

        <Section title="Cards">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                background: v.surface,
                border: `1px solid ${v.line}`,
                borderRadius: radius.card,
                overflow: "hidden",
                boxShadow: shadow.card,
              }}
            >
              <div style={{ aspectRatio: "1 / 1" }}>
                <ImageSlot label="Product image" />
              </div>
              <div style={{ padding: "11px 13px 15px" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: v.inkSoft,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Brand
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 500, margin: "2px 0 6px" }}
                >
                  Product name goes here
                </div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 6 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700 }}>₹2,499</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: v.amberDark,
                      fontWeight: 600,
                    }}
                  >
                    50% off
                  </span>
                </div>
              </div>
            </div>

            <Card style={{ boxShadow: shadow.card }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                Info card
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: v.inkSoft,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Rounded 18px, hairline border, soft shadow. The base surface for
                content blocks.
              </p>
            </Card>

            <div
              style={{
                background: `linear-gradient(135deg, ${v.amberTint}, ${v.surface})`,
                border: `1px solid ${v.line}`,
                borderRadius: radius.card,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 12, color: v.inkSoft }}>
                Wallet balance
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                ₹450
              </div>
            </div>
          </div>
        </Section>

        <Section title="Radii">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {Object.entries(radius).map(([name, value]) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 76,
                    height: 56,
                    borderRadius: value,
                    border: `1px solid ${v.line}`,
                    background: v.amberTint,
                  }}
                />
                <span style={{ fontSize: 11.5, color: v.inkSoft }}>
                  {name} · {value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {SHADOWS.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 110,
                    height: 66,
                    borderRadius: radius.card,
                    background: v.surface,
                    border: `1px solid ${v.line}`,
                    boxShadow: s.value,
                  }}
                />
                <span style={{ fontSize: 11.5, color: v.inkSoft }}>{s.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Icons">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {ICONS.map((ic) => (
              <div
                key={ic.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  width: 72,
                }}
              >
                <RdIcon color={v.ink} icon={ic.icon} size={26} />
                <span
                  style={{
                    fontSize: 10.5,
                    color: v.inkSoft,
                    textAlign: "center",
                  }}
                >
                  {ic.name}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
};

FoundationsPage.getLayout = (page) => page;

export default FoundationsPage;
