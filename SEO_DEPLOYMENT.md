# SEO in the delivered HTML

The storefront has two build modes. `NEXT_PUBLIC_SSR=false` sets `output: "export"` in `next.config.ts`. Apache then rewrites every `/products/{slug}/` request to the same `out/products/[slug]/index.html` file. That file cannot contain a unique product title, description, or product body. The same limitation applies to dynamic brand, category, store, and video pages. Browser JavaScript can update the DOM after loading, but View Page Source shows the original response.

The app root now writes fallback titles and descriptions into the exported HTML for standard pages, including home, categories, brands, stores, and the information pages. This is an interim improvement for static hosting. It does not make dynamic detail pages SEO ready.

## Recommended deployment

Run the existing Next.js server mode on a host that supports a persistent Node.js process (for example, a VPS or a managed Next.js host):

1. Set `NEXT_PUBLIC_SSR=true`, `NEXT_PUBLIC_ADMIN_PANEL_URL`, and `NEXT_PUBLIC_SITE_URL` in the deployment environment. `NEXT_PUBLIC_SITE_URL` must be the public storefront origin.
2. Install dependencies with `npm ci` and run `npm run build` on that host. Do not serve the `out/` directory.
3. Run `npm run start` (the configured port is 3002), with HTTPS and the public domain routed to that process by the host or reverse proxy.
4. Deploy through the Node host's build and release mechanism. The repository's `npm run deploy` script uses FTP and is designed around a static host; its SSR branch excludes `.next` and `node_modules` and does not start a Node process.
5. Confirm the backend API is reachable from the Next.js server. Product details and their metadata are fetched by `getServerSideProps` for each request.

## Acceptance check

Open View Page Source for the homepage, a category, a real product, a store, and a policy page. In the HTML response's `<head>`, each public page should have one meaningful `<title>`, one `<meta name="description">`, and the expected canonical URL. Product titles and descriptions must differ between two product slugs. A missing product should return HTTP 404.

The same check without a browser:

```bash
curl -fsSL https://your-storefront-domain.com/products/a-real-slug/ \
  | grep -oE '<title[^>]*>[^<]*</title>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>'
```

If the host serves only static files, generate a separate HTML file for every public slug at build time with `getStaticPaths` and `getStaticProps`, and rebuild when catalog or SEO fields change. That approach also needs a plan for new products and market-specific data. A single generic `[slug]` export cannot satisfy the requested source-code check.
