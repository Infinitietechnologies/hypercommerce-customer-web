# Header backend contract

Return one optional settings entry with `variable: "header"`. Every property is optional; the storefront validates the values and falls back to neutral showcase defaults when a property is missing or invalid. It does not supply a bundled fallback background image.

```json
{
  "variable": "header",
  "value": {
    "enabled": true,
    "layout": "showcase",
    "density": "comfortable",
    "sticky": true,
    "containerWidth": "site",
    "contentTone": "dark",
    "backgroundType": "image",
    "backgroundColor": null,
    "gradientFrom": null,
    "gradientTo": null,
    "gradientDirection": "to-right",
    "backgroundImage": "https://cdn.example.com/header-desktop.webp",
    "mobileBackgroundImage": "https://cdn.example.com/header-mobile.webp",
    "backgroundPosition": "center",
    "backgroundFit": "cover",
    "overlayColor": "rgba(255,255,255,0.5)",
    "overlayOpacity": 0.25,
    "textColor": null,
    "logoUrl": "https://cdn.example.com/logo.svg",
    "mobileLogoUrl": "https://cdn.example.com/logo-mobile.svg",
    "logoMaxWidth": 160,
    "showLocation": true,
    "showLocationLabel": true,
    "showSearch": true,
    "showWishlist": false,
    "showOrders": false,
    "showAccount": true,
    "showCart": true,
    "showNotifications": true,
    "showActionLabels": true,
    "showUtilityBar": true,
    "hideUtilityOnScroll": false,
    "showSocialLinks": true,
    "showSupportPhone": true,
    "showLanguage": true,
    "utilityText": null,
    "utilityBackgroundColor": null,
    "utilityTextColor": null,
    "actionItems": [
      {
        "id": "quick",
        "label": "Quick",
        "url": "/products/quick",
        "style": "soft",
        "icon": "solar:bolt-linear",
        "openInNewTab": false
      },
      {
        "id": "ecommerce",
        "label": "eCommerce",
        "url": "/products",
        "style": "outline"
      }
    ],
    "showCategoryNavigation": true,
    "navigationStyle": "icons",
    "navigationSource": "categories",
    "navigationScope": "all",
    "navigationScrollBehavior": "compact",
    "navigationScrollThreshold": 48,
    "navigationBackgroundColor": null,
    "navigationTextColor": null,
    "navigationActiveColor": null,
    "categoryLimit": 7,
    "showAllCategory": true,
    "navigationItems": [],
    "announcementEnabled": false,
    "announcementText": null,
    "announcementUrl": null,
    "announcementBackgroundColor": null,
    "announcementTextColor": null,
    "announcementDismissible": true
  }
}
```

## Admin controls

- Layout: `classic`, `stacked`, or `showcase`.
- Density: `compact` or `comfortable`.
- Container: `site`, `wide`, or `full`.
- Background: solid colour, gradient, or separate desktop/mobile images, position, `cover`/`fill` fitting, overlay colour and opacity, and content tone.
- Branding: desktop/mobile logo URLs and logo width.
- Elements: independently show or hide location, location label, search, wishlist, orders, account, cart, notifications, and labels.
- Utility row: independently control social links, support phone, language selector, optional text, and colours. Social URLs and support number continue to come from the existing `web` settings.
- Header buttons: up to four items with label, URL, optional Iconify icon, new-tab flag, and `solid`, `soft`, or `outline` style.
- Navigation: live categories or custom items, `pills`, `links`, or `icons`, home-only or all-page scope, active/background/text colours, category count, and scroll behavior.
- Announcement: text, URL, background/text colours, visibility, and dismissibility.

For custom navigation, send `navigationSource: "custom"` and fill `navigationItems`. An item accepts `id`, `label`, `url`, `openInNewTab`, optional `icon` such as `solar:shop-linear`, and optional `imageUrl`. Only relative URLs and `http`/`https` URLs are accepted. Category navigation calls `/categories?home=true`; each category's desktop navigation assets come from `home_appearance.desktop.icon`, `home_appearance.desktop.active_icon`, and `home_appearance.desktop.background_image`. The top-level `image` and `banner` remain compatibility fallbacks.

`navigationScrollBehavior` controls the sticky category row:

- `"compact"`: starts with the configured icon/pill/link style, then becomes a short text-link row after `navigationScrollThreshold` pixels. This matches the SnapBuy behavior.
- `"keep"`: keeps the full navigation row unchanged while scrolling.
- `"hide"`: closes the category row after the threshold and leaves the remaining sticky header visible.

Set `hideUtilityOnScroll: true` to slide the utility row upward with the category row. Set it to `false` when the social/support row must remain visible while scrolling.

Set `sticky: false` for a normal non-sticky header. When it is false, scroll behavior is not applied.

The main desktop/mobile logos come from `logoUrl` and `mobileLogoUrl`. If those fields are omitted, the storefront uses the existing backend `web.siteHeaderDarkLogo`. A selected category's header surface follows `home_appearance.desktop`; its nested `icon`, `active_icon`, and `background_image` fields supply the desktop assets. The All-category icon comes from the desktop fields in `home_general_settings`, with its app fields as fallbacks. Custom navigation images come from `navigationItems[].imageUrl`. The storefront only owns presentation and a safe Iconify fallback when the backend provides no icon.

The backend should return data only. It must not send HTML, CSS, scripts, Tailwind classes, or component names.
