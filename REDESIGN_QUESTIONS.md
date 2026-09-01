# Redesign decisions and data gaps

## Customer support

- There is no `/redesign` counterpart for the customer support timeline. The live storefront tokens and the approved single-timeline support flow therefore define this screen until a dedicated redesign reference is added.

## Watch & Buy

- The current checkout has no `src/redesign/` counterpart for Watch & Buy. The live customer API and existing storefront tokens therefore define the first implementation.
- `/watch-and-buy` combines a vertically stacked heading and Stories rail with an Explore-style masonry grid whose equal-width tiles follow each reel's media ratio. Missing covers preview the video instead of showing an empty tile. Selecting a tile opens a full-screen, vertically snapping viewer at that item; media fits without cropping, audio preference persists while scrolling, and a back action returns to Explore. Story profiles and linked products open as overlays above the active reel so customers keep their feed position. Reels expose only supported actions: like, share, profile story, and linked products.
- Linked products open a responsive product sheet and continue to the existing PDP. Direct add-to-cart is intentionally deferred because the Watch & Buy response does not include minimum quantity, step size, addon requirements, or full stock rules.
- Comments, follows, saves, view counts, and product-filtered reels are not rendered because the customer API does not expose those contracts.
- Videos expose captions as visible post text, but the API does not return timed caption tracks. The player includes an empty WebVTT fallback until the contract supplies caption URLs.
