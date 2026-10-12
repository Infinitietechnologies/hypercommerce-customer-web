# Redesign decisions and data gaps

## Shared cart links

- This checkout has no `/redesign` counterpart for sharing a cart. The existing cart page and `/design-system` primitives define the Share action and recipient sheet.
- The API documentation confirms `POST /user/cart/share`, `GET /user/cart/shared-lists/{token}`, and `POST /user/cart/shared-lists/{token}/import`, all authenticated and without request bodies. Its success schemas document only `data: null`, so the exact token, preview item, and import result payloads remain unverified. The storefront validates the token and every preview item before displaying or sharing them; the live response should be checked against the panel resource when it becomes available.
- Shared links use `/shared-cart/?token=…` so both static export and SSR deployments can open them. Signed-out recipients see a sign-in action before the authenticated preview request.
- The header cart drawer is the guest/offline cart. Because the documented share endpoints require authentication, guests share a self-contained `/shared-cart/?guest=…` link on the current customer site origin containing product and variant identifiers, quantities, and addon identifiers. Recipients resolve current product data through the public catalog API before adding anything, so prices and availability come from their active market. Unavailable lines are counted and left out while available lines remain selectable. Guest recipients add to their offline cart; signed-in recipients use the regular add-to-cart API so addon choices are preserved.
- The documented `POST /user/cart/share` and `POST /user/cart/shared-lists/{token}/import` accept no item selection. New links from both guest and signed-in carts use the self-contained item format so recipients can choose exactly which items to add. Existing server-token links remain readable through the documented APIs and retain their all-items import behavior. The creator sheet displays a short link label and copies the full URL only on request.

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
