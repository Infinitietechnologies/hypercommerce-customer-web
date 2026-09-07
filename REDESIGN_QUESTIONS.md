# Redesign decisions and data gaps

## Customer support

- There is no `/redesign` counterpart for the customer support timeline. The live storefront tokens and the approved single-timeline support flow therefore define this screen until a dedicated redesign reference is added.

## Watch & Buy

- The current checkout has no `src/redesign/` counterpart for Watch & Buy. The live customer API and existing storefront tokens therefore define the first implementation.
- `/watch-and-buy` combines a vertically stacked heading and Stories rail with a regular Explore grid of 9:16 reel tiles. Each tile uses the API preview source and shows duration, caption, profile, and supported like count. Selecting a tile opens a centered, full-height, vertically snapping viewer at that item; media fills the player, audio preference persists while scrolling, double-tap likes, and close returns to Explore. Story profiles remain overlays above the active reel so customers keep their feed position.
- Reel- and story-linked products appear in the same persistent horizontal rail and continue to the existing PDP. Direct add-to-cart is intentionally deferred because the Watch & Buy response does not include minimum quantity, step size, addon requirements, or full stock rules.
- The approved viewer hierarchy uses a top back action and sound toggle, right-side like/share actions, seller identity plus caption above a compact bottom product rail, and a PDP action in place of direct add-to-cart until the API exposes full cart rules.
- Reel sharing uses the slug URL as the durable deep link, prefers the device share sheet for all installed apps, and exposes WhatsApp, Telegram, Facebook, X, email, and copy-link fallbacks through a responsive share sheet.
- Story progress starts after media readiness, uses the API `duration_ms` value when supplied (with a five-second fallback), follows real video playback, and pauses while the customer holds the story or browses its product rail.
- Comments, follows, saves, view counts, and product-filtered reels are not rendered because the customer API does not expose those contracts. The reference's view-count position uses the supported like count and heart icon rather than mislabelling likes as views.
- Videos expose captions as visible post text, but the API does not return timed caption tracks. The player includes an empty WebVTT fallback until the contract supplies caption URLs.
