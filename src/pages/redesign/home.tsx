// /redesign/home — storefront home.
//
// Source: HOME block of `HyperCommerce App.dc.html`, including the exact
// `HOME_LAYOUTS.All` section order. `?tab=Beauty` shows the empty-home state,
// matching the design's empty layout for that tab.

import type { NextPageWithLayout } from "@/types";
import type { SectionSpec } from "@/redesign/components/HomeSection";

import { useRouter } from "next/router";

import { HomeSection } from "@/redesign/components/HomeSection";
import { Shell } from "@/redesign/components/Shell";
import {
  BANNERS,
  BRANDS,
  CATEGORIES,
  HOME_TABS,
  INITIAL_CART,
  PRODUCTS,
} from "@/redesign/data/mock";
import { Button, EmptyState } from "@/redesign/primitives";

/** Section composition per tab. `All` is the design's reference layout. */
const HOME_LAYOUTS: Record<string, SectionSpec[]> = {
  All: [
    { type: "categories", title: "Shop by category", style: "card", items: CATEGORIES },
    { type: "products", title: "Best Sellers", orientation: "horizontal", bg: "none", items: PRODUCTS.slice(0, 8) },
    { type: "brands", title: "Top brands", style: "full", items: BRANDS },
    { type: "products", title: "Recommended for you", orientation: "vertical", bg: "color", items: PRODUCTS.slice(4, 8) },
    { type: "banners", title: null, style: "peek", items: BANNERS },
    { type: "categories", title: "Explore more", style: "overlay", items: CATEGORIES.slice(0, 4) },
  ],
  // Deliberately empty — drives the "Fresh finds on the way" state.
  Beauty: [],
};

const FALLBACK_LAYOUT: SectionSpec[] = [
  { type: "products", title: "Featured", orientation: "horizontal", bg: "none", items: PRODUCTS.slice(0, 6) },
];

const cartCount = INITIAL_CART.reduce((a, c) => a + c.qty, 0);

const HomePage: NextPageWithLayout = () => {
  const router = useRouter();
  const activeTab = (router.query.tab as string) || "All";
  const sections = HOME_LAYOUTS[activeTab] ?? FALLBACK_LAYOUT;

  return (
    <Shell
      activeTab={activeTab}
      cartCount={cartCount}
      tabs={HOME_TABS}
      onSelectTab={(key) =>
        router.push({ pathname: "/redesign/home", query: { tab: key } }, undefined, {
          shallow: true,
        })
      }
    >
      {sections.length === 0 ? (
        <EmptyState
          action={
            <Button
              icon="solar:home-smile-linear"
              style={{ borderRadius: 14 }}
              onClick={() => router.push("/redesign/home")}
            >
              Continue shopping
            </Button>
          }
          body="We're stocking this space with new products and offers. In the meantime, explore what's trending across the store."
          icon="solar:bag-smile-linear"
          title="Fresh finds on the way"
        />
      ) : null}

      {sections.map((spec, i) => (
        <HomeSection
          key={`${spec.type}-${i}`}
          spec={spec}
          onSeeAll={() => router.push("/redesign/search")}
          onSelectBanner={() => router.push("/redesign/search")}
          onSelectBrand={() => router.push("/redesign/brand")}
          onSelectCategory={() => router.push("/redesign/category")}
          onSelectProduct={(p) =>
            router.push({ pathname: "/redesign/pdp", query: { slug: p.slug } })
          }
        />
      ))}
    </Shell>
  );
};

HomePage.getLayout = (page) => page;

export default HomePage;
