# Redesign decisions and data gaps

## Watch & Buy

- The current checkout has no `src/redesign/` counterpart for Watch & Buy. The live customer API and existing storefront tokens therefore define the first implementation.
- `/watch-and-buy` combines a Stories rail with an Explore-style masonry grid of reel covers. Selecting a cover opens a full-screen, vertically snapping Reels viewer at that item, where the user can continue scrolling. Statuses use the existing 24-hour profile grouping; Reels expose only supported actions: like, share, profile story, and linked products.
- Linked products open a responsive product sheet and continue to the existing PDP. Direct add-to-cart is intentionally deferred because the Watch & Buy response does not include minimum quantity, step size, addon requirements, or full stock rules.
- Comments, follows, saves, view counts, and product-filtered reels are not rendered because the customer API does not expose those contracts.
- Videos expose captions as visible post text, but the API does not return timed caption tracks. The player includes an empty WebVTT fallback until the contract supplies caption URLs.
