// The redesign sandbox's screen registry. Drives both the index page and the
// floating "Jump to screen…" control, so a new screen only has to be listed
// once.

export type ScreenGroup = "Design" | "Storefront" | "Checkout" | "Account" | "System";

export type ScreenEntry = {
  label: string;
  href: string;
  group: ScreenGroup;
  /** One-line description shown on the index page. */
  note: string;
};

export const RD_SCREENS: ScreenEntry[] = [
  // --- Design ---
  { label: "Foundations", href: "/redesign/foundations", group: "Design", note: "Colour, type, buttons, inputs, chips, cards, icons" },
  { label: "Components", href: "/redesign/components", group: "Design", note: "Every atom and card in one gallery" },
  { label: "Home section kit", href: "/redesign/kit-gallery", group: "Design", note: "All 11 home section × style variants" },

  // --- Storefront ---
  { label: "Home", href: "/redesign/home", group: "Storefront", note: "Category tabs + composed sections" },
  { label: "Home · empty", href: "/redesign/home?tab=Beauty", group: "Storefront", note: "Empty-state variant" },
  { label: "Product detail", href: "/redesign/pdp", group: "Storefront", note: "Gallery, price block, delivery promises, related" },
  { label: "Search results", href: "/redesign/search", group: "Storefront", note: "Query field, filter chips, result grid" },
  { label: "Categories", href: "/redesign/categories", group: "Storefront", note: "All categories tile grid" },
  { label: "Category detail", href: "/redesign/category", group: "Storefront", note: "Category header + product grid" },
  { label: "Brands", href: "/redesign/brands", group: "Storefront", note: "All brands grid" },
  { label: "Brand detail", href: "/redesign/brand", group: "Storefront", note: "Brand header + product grid" },
  { label: "Stores", href: "/redesign/stores", group: "Storefront", note: "Nearby store cards" },
  { label: "Store detail", href: "/redesign/store", group: "Storefront", note: "Store hero, hours, in-store stock" },
  { label: "Shopping list", href: "/redesign/shopping-list", group: "Storefront", note: "Checkable saved items" },
  { label: "Share page", href: "/redesign/share", group: "Storefront", note: "Single shared product card" },

  // --- Checkout ---
  { label: "Cart", href: "/redesign/cart", group: "Checkout", note: "Line items + sticky order summary" },
  { label: "Cart · empty", href: "/redesign/cart?empty=1", group: "Checkout", note: "Empty-state variant" },
  { label: "Checkout · review", href: "/redesign/checkout", group: "Checkout", note: "Stepper, address picker, promo code" },
  { label: "Checkout · payment", href: "/redesign/checkout?step=payment", group: "Checkout", note: "Payment methods + wallet toggle" },
  { label: "Payment processing", href: "/redesign/processing", group: "Checkout", note: "Spinner interstitial" },
  { label: "Order result", href: "/redesign/result", group: "Checkout", note: "Success confirmation" },

  // --- Account ---
  { label: "Account · overview", href: "/redesign/account", group: "Account", note: "Profile card + quick links" },
  { label: "Account · orders", href: "/redesign/account?tab=orders", group: "Account", note: "Order rows with status pills" },
  { label: "Account · order detail", href: "/redesign/account?tab=orderDetail", group: "Account", note: "Item, timeline, track/cancel" },
  { label: "Account · addresses", href: "/redesign/account?tab=addresses", group: "Account", note: "Saved address cards" },
  { label: "Account · wishlist", href: "/redesign/account?tab=wishlists", group: "Account", note: "Saved product tiles" },
  { label: "Account · wallet", href: "/redesign/account?tab=wallet", group: "Account", note: "Balance card + recent activity" },
  { label: "Account · transactions", href: "/redesign/account?tab=transactions", group: "Account", note: "Credit/debit ledger" },
  { label: "Account · notifications", href: "/redesign/account?tab=notifications", group: "Account", note: "Icon + title + timestamp rows" },
  { label: "Account · refer & earn", href: "/redesign/account?tab=refer", group: "Account", note: "Referral code + share CTA" },

  // --- System ---
  { label: "Static: About", href: "/redesign/static?page=about", group: "System", note: "CMS-backed legal/info page" },
  { label: "Static: FAQs", href: "/redesign/static?page=faqs", group: "System", note: "CMS-backed legal/info page" },
  { label: "Static: Privacy", href: "/redesign/static?page=privacy", group: "System", note: "CMS-backed legal/info page" },
  { label: "Static: Terms", href: "/redesign/static?page=terms", group: "System", note: "CMS-backed legal/info page" },
  { label: "Static: Shipping", href: "/redesign/static?page=shipping", group: "System", note: "CMS-backed legal/info page" },
  { label: "Static: Returns", href: "/redesign/static?page=returns", group: "System", note: "CMS-backed legal/info page" },
  { label: "Static: Seller", href: "/redesign/static?page=seller", group: "System", note: "CMS-backed legal/info page" },
  { label: "404", href: "/redesign/not-found", group: "System", note: "Page-not-found state" },
];

export const SCREEN_GROUPS: ScreenGroup[] = [
  "Design",
  "Storefront",
  "Checkout",
  "Account",
  "System",
];
