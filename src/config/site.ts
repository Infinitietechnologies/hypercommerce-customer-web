export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "HyperCommerce",
  description:
    "HyperCommerce is a multivendor marketplace for groceries, food, pharmacy and everyday essentials.",
  metaKeywords:
    "hypercommerce, multivendor marketplace, online shopping, ecommerce, groceries, food, pharmacy, verified sellers, secure payments, fast delivery",
  metaDescription:
    "Shop groceries, food, pharmacy and everyday essentials from thousands of verified sellers on HyperCommerce. Secure payments, reliable delivery, one marketplace.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Categories",
      href: "/categories",
    },

    {
      label: "Blogs",
      href: "/blogs",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/my-account",
    },
    {
      label: "Dashboard",
      href: "/",
    },

    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
