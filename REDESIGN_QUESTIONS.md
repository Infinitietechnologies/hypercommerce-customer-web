# Redesign decisions and data gaps

## Storefront font setting

- The web admin offers a Google Font Family field. The storefront reads `web.googleFontFamily` from the existing `GET /settings` response and applies it to body and display typography; an empty or invalid value retains the current bundled fonts.
- The linked API documentation redirects to the admin login in this environment, the direct `GET /api/settings/web` request is blocked, and the sibling panel repository is unavailable in this checkout. Confirm the exact field name and a populated response against the panel before relying on a production font selection.

## Customer app links

- This checkout has no `/redesign` counterpart for the open-app sheet. The existing storefront sheet and theme tokens remain the visual reference.
- The web can open an installed customer app only when the app registers the configured `customerAppScheme` (or legacy `appScheme`); Android also uses the package ID from the configured Google Play URL. iOS accepts an Apple App Store or TestFlight fallback, and Android accepts a Google Play fallback. Confirm the native app's registered scheme and package against these settings on physical devices.
- The dev admin's customer app and web Play Store links now both use the user-confirmed HyperCommerce package `com.hyperCommerce.customer`. The configured scheme remains `customer-hypercommerce`; confirm that the installed Android and iOS builds register it. The iOS TestFlight link remains the existing dev invite at the user's request. Native app launch still requires a physical-device check.
- An Android user with an installed app reports that the Open in App action reaches the Play Store fallback. The web now renders Chrome's intent URI as a direct tapped link. If the fallback persists, inspect the installed build's application ID and browser-accessible intent filter for `customer-hypercommerce://home` (plus the product target); the storefront cannot register a missing native handler.

## Shared cart links

- This checkout has no `/redesign` counterpart for sharing a cart. The existing cart page and `/design-system` primitives define the Share action and recipient sheet.
- The API documentation confirms `POST /user/cart/share`, `GET /user/cart/shared-lists/{token}`, and `POST /user/cart/shared-lists/{token}/import`, all authenticated and without request bodies. Its success schemas document only `data: null`, so the exact token, preview item, and import result payloads remain unverified. The storefront validates the token and every preview item before displaying or sharing them; the live response should be checked against the panel resource when it becomes available.
- Shared links use `/cart/shared-lists/{token}/`, matching the backend-generated customer link shape. Signed-out recipients see a sign-in action before the authenticated preview request.
- Vercel and Apache hosts rewrite the token path to the static shared-cart page while keeping the original URL in the browser. Static export cannot prebuild a page for arbitrary tokens, so the view reads the token from the visible pathname.
- The header cart drawer is the guest/offline cart. Its share action opens sign-in and sends the customer to `/cart/` after authentication. Only the authenticated cart creates links through `POST /user/cart/share`.
- The documented share and import endpoints accept no item selection, so links contain the whole server cart and importing adds the whole shared list. The creator sheet shows a short link label and copies the full URL on request. The link uses the current customer site origin.

## Order details

- The referenced `src/redesign/`, `THEME_REDESIGN.md` and `GAP_ANALYSIS.md` are absent from this checkout. The existing storefront components and slate theme are the visual baseline for the approved combined product/timeline/return/refund card.
- Customer order responses add an optional `refunds` collection without changing existing fields. Item displays use refund allocations, not the order-wide refund amount or original payment method. Settled obligations retain their allocated quantity/amount and resolve their payment status and destination through `settled_by_refund_id`.

## Seller registration

- There is no `src/redesign/` counterpart for the seller registration landing page. The existing storefront layout and design tokens therefore remain authoritative while section titles, subtitles, labels, item copy, and media are populated from the seller landing API. Benefit images are optional and fall back to the existing static icons when no uploaded image is configured.

## Customer support

- There is no `/redesign` counterpart for the customer support timeline. The live storefront tokens and the approved single-timeline support flow therefore define this screen until a dedicated redesign reference is added.

## Watch & Buy

- The current checkout has no `src/redesign/` counterpart for Watch & Buy. The live customer API and existing storefront tokens therefore define the first implementation.
- `/watch-and-buy` combines a vertically stacked heading and Stories rail with a regular Explore grid of 9:16 reel tiles. Each tile uses the API preview source and shows duration, caption, profile, and supported like count. Selecting a tile opens a centered, full-height, vertically snapping viewer at that item; media fills the player, audio preference persists while scrolling, double-tap likes, and close returns to Explore. Selecting the profile inside a reel keeps the viewer open and narrows it to that seller's reels, matching the customer app; stories remain accessible from the Stories rail.
- Reel- and story-linked products appear in the same persistent horizontal rail and continue to the existing PDP. Direct add-to-cart is intentionally deferred because the Watch & Buy response does not include minimum quantity, step size, addon requirements, or full stock rules.
- The approved viewer hierarchy uses a top back action and sound toggle, right-side like/share actions, seller identity plus caption above a compact bottom product rail, and a PDP action in place of direct add-to-cart until the API exposes full cart rules.
- Reel sharing uses the configured public storefront origin plus the reel slug as the durable deep link, preventing localhost links from reaching external recipients. Mobile-width browsers with Web Share support open the device share sheet directly for installed apps such as Instagram, TikTok, and Snapchat; the URL is embedded in the outgoing message, reel artwork is attached when the browser supports file sharing, and slug pages publish reel-specific Open Graph/Twitter imagery for rich link previews. Share artwork resolves in order from reel cover, image preview, seller profile, then linked-product image so every available fallback remains attractive. Desktop and unsupported devices get a larger reel-preview sheet with creator, caption, product count, WhatsApp, Telegram, Facebook, X, Threads, Pinterest, Reddit, LinkedIn, email, and copy-link options. Every desktop option uses the platform's standard web share or compose URL instead of a native-app handoff; below the 1024px header cutover, the existing native share flow remains primary. Copying falls back to selection-based browser copying when the modern Clipboard API is unavailable, and a failed native share degrades to the platform sheet or a copied link instead of a dead end.
- Double-clicking or double-tapping a reel likes it with a heart burst at the interaction point. On desktop, vertical wheel gestures over the surrounding black viewer area navigate the centered reel feed while the document stays locked.
- Explore reel tiles stay visually stable under hover and use the compact play-duration badge plus pointer cursor to communicate that the whole tile opens the reel without obscuring its artwork.
- Story progress starts after media readiness, uses the API `duration_ms` value when supplied (with a five-second fallback), follows real video playback, and pauses while the customer holds the story or browses its product rail.
- Comments, follows, saves, view counts, and product-filtered reels are not rendered because the customer API does not expose those contracts. The reference's view-count position uses the supported like count and heart icon rather than mislabelling likes as views.
- Videos expose captions as visible post text, but the API does not return timed caption tracks. The player includes an empty WebVTT fallback until the contract supplies caption URLs.
