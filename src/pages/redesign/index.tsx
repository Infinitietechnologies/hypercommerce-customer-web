// /redesign — index of the storefront redesign sandbox.
//
// Every screen below is static: it renders from `src/redesign/data/mock.ts`,
// never from the API, so the design can be reviewed without a backend.

import type { NextPageWithLayout } from "@/types";

import { useRouter } from "next/router";

import { Card, RdIcon } from "@/redesign/primitives";
import { RD_SCREENS, SCREEN_GROUPS } from "@/redesign/screens";
import { layout, radius, shadow, v } from "@/redesign/tokens";

const RedesignIndex: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <div className="rd">
      <header
        style={{
          background: v.surface,
          borderBottom: `1px solid ${v.line}`,
          padding: "22px 24px",
        }}
      >
        <div
          style={{
            maxWidth: layout.maxWidth,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            alt=""
            src="/logo-icon.png"
            style={{ height: 42, width: 42, borderRadius: 12 }}
          />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              HyperCommerce redesign
            </div>
            <div style={{ fontSize: 12.5, color: v.inkSoft }}>
              Static design sandbox — foundations, atoms, components and every
              screen. No API calls; the live storefront is untouched.
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: layout.maxWidth,
          margin: "0 auto",
          padding: "32px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 36,
        }}
      >
        {SCREEN_GROUPS.map((group) => {
          const screens = RD_SCREENS.filter((s) => s.group === group);

          return (
            <section key={group}>
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
                {group}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                  gap: 14,
                }}
              >
                {screens.map((s) => (
                  <Card
                    key={s.href}
                    className="rd-row rd-row-quicklink"
                    padding={16}
                    style={{ borderRadius: radius.input, boxShadow: shadow.hairline }}
                    onClick={() => router.push(s.href)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {s.label}
                      </div>
                      <RdIcon
                        color={v.amberDark}
                        icon="solar:arrow-right-linear"
                        size={16}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: v.inkSoft,
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {s.note}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
};

RedesignIndex.getLayout = (page) => page;

export default RedesignIndex;
