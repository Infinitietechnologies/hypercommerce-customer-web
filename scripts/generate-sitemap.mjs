import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import axios from "axios";

config({ path: [".env.local", ".env"] });

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const apiUrl = (process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "").replace(
  /\/$/,
  "",
);
const publicDir = join(process.cwd(), "public");
const sitemapDir = join(publicDir, "sitemaps");
const feedDir = join(publicDir, "feeds");
const maxEntries = 45_000;
const pageSize = 100;

if (!siteUrl || !apiUrl) {
  console.warn(
    "NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_ADMIN_PANEL_URL are required; skipping SEO asset generation.",
  );
  process.exit(0);
}

mkdirSync(sitemapDir, { recursive: true });
mkdirSync(feedDir, { recursive: true });

const xml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
const text = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const absolute = (path) =>
  /^https?:\/\//i.test(path || "")
    ? path
    : `${siteUrl}/${String(path || "").replace(/^\//, "")}`;
const canonical = (path) =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}${path.endsWith("/") ? "" : "/"}`;
const isoDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

class ChunkedSitemap {
  constructor(prefix, namespaces = "") {
    this.prefix = prefix;
    this.namespaces = namespaces;
    this.files = [];
    this.count = 0;
    this.currentPath = "";
  }

  open() {
    const filename = `${this.prefix}-${this.files.length + 1}.xml`;
    this.currentPath = join(sitemapDir, filename);
    this.files.push(filename);
    this.count = 0;
    writeFileSync(
      this.currentPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${this.namespaces}>\n`,
    );
  }

  add(entry) {
    if (!this.currentPath || this.count >= maxEntries) {
      if (this.currentPath) appendFileSync(this.currentPath, "</urlset>\n");
      this.open();
    }
    appendFileSync(this.currentPath, entry);
    this.count += 1;
  }

  close() {
    if (this.currentPath) appendFileSync(this.currentPath, "</urlset>\n");
  }
}

const urlEntry = (loc, lastmod, priority) =>
  `  <url>\n    <loc>${xml(loc)}</loc>\n    <lastmod>${xml(isoDate(lastmod))}</lastmod>\n    <priority>${priority}</priority>\n  </url>\n`;

const fetchAllPages = async (endpoint, params, visit) => {
  let page = 1;
  while (true) {
    const response = await axios.get(`${apiUrl}/api${endpoint}`, {
      params: { ...params, page, per_page: pageSize },
    });
    const payload = response.data?.data;
    const items = payload?.data || [];
    for (const item of items) visit(item);
    if (!items.length || page >= Number(payload?.last_page || 1)) break;
    page += 1;
  }
};

const conditionFor = (slug = "") => {
  const value = slug.toLowerCase();
  if (value.includes("refurb") || value.includes("renewed"))
    return "refurbished";
  if (value.includes("used") || value.includes("pre-owned")) return "used";
  if (value.includes("new")) return "new";
  return "";
};

const main = async () => {
  const settingsResponse = await axios.get(`${apiUrl}/api/settings`);
  const allSettings = settingsResponse.data?.data || [];
  const web = allSettings.find((item) => item.variable === "web")?.value || {};
  const market = allSettings.find((item) => item.variable === "markets")?.value
    ?.default?.code;
  const params = market ? { market } : {};
  const today = new Date().toISOString();

  const core = new ChunkedSitemap("core");
  [
    ["/", "1.0"],
    ["/about-us/", "0.7"],
    ["/brands/", "0.8"],
    ["/categories/", "0.9"],
    ["/faqs/", "0.6"],
    ["/privacy-policy/", "0.4"],
    ["/return-refund-policy/", "0.4"],
    ["/seller-register/", "0.6"],
    ["/shipping-policy/", "0.4"],
    ["/stores/", "0.8"],
    ["/terms-and-conditions/", "0.4"],
    ["/watch-and-buy/", "0.8"],
  ].forEach(([path, priority]) =>
    core.add(urlEntry(canonical(path), today, priority)),
  );
  core.close();

  const collections = new ChunkedSitemap("collections");
  await fetchAllPages("/categories", params, (item) => {
    if (item.slug)
      collections.add(
        urlEntry(canonical(`/categories/${item.slug}`), item.updated_at, "0.7"),
      );
  });
  await fetchAllPages("/brands", params, (item) => {
    if (item.slug)
      collections.add(
        urlEntry(canonical(`/brands/${item.slug}`), item.updated_at, "0.6"),
      );
  });
  await fetchAllPages("/stores", params, (item) => {
    if (item.slug)
      collections.add(
        urlEntry(canonical(`/stores/${item.slug}`), item.updated_at, "0.7"),
      );
  });
  collections.close();

  const products = new ChunkedSitemap("products");
  const images = new ChunkedSitemap(
    "images",
    ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
  );
  const feedPath = join(feedDir, "google-merchant.xml");
  if (web.merchantFeedEnabled) {
    writeFileSync(
      feedPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>\n<title>${xml(web.siteName || "Store")} products</title>\n<link>${xml(siteUrl)}</link>\n<description>${xml(web.metaDescription || web.shortDescription || "Product catalog")}</description>\n`,
    );
  } else {
    writeFileSync(
      feedPath,
      '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Google Merchant feed is disabled in Web Settings. -->\n',
    );
  }

  let feedItems = 0;
  let skippedIdentifiers = 0;
  await fetchAllPages(
    "/markets/products",
    {
      ...params,
      include_shipping: web.merchantFeedEnabled ? 1 : 0,
      country_iso2: web.merchantTargetCountry || undefined,
    },
    (product) => {
      if (!product.slug) return;
      const link = canonical(`/products/${product.slug}`);
      products.add(urlEntry(link, product.updated_at, "0.8"));
      const productImages = [
        product.main_image,
        ...(product.additional_images || []),
      ].filter(Boolean);
      if (productImages.length) {
        images.add(
          `  <url>\n    <loc>${xml(link)}</loc>\n${productImages
            .slice(0, 1000)
            .map(
              (image) =>
                `    <image:image><image:loc>${xml(absolute(image))}</image:loc><image:title>${xml(product.title)}</image:title></image:image>`,
            )
            .join("\n")}\n  </url>\n`,
        );
      }

      if (!web.merchantFeedEnabled) return;
      const condition = conditionFor(product.product_condition?.slug) || "new";
      for (const variant of product.variants || []) {
        const regularPrice = Number(variant.price || 0);
        const salePrice = Number(variant.special_price || 0);
        const currency = variant.currency_code;
        if (!regularPrice || !currency || !product.main_image) continue;
        const validGtin = /^\d{8}$|^\d{12,14}$/.test(variant.barcode || "");
        if (!validGtin) skippedIdentifiers += 1;
        const item = [
          ["g:id", `${product.uuid}-${variant.id}`],
          ["g:item_group_id", product.uuid],
          [
            "g:title",
            variant.title && variant.title !== product.title
              ? `${product.title} - ${variant.title}`
              : product.title,
          ],
          [
            "g:description",
            text(
              product.short_description || product.description || product.title,
            ),
          ],
          ["g:link", link],
          ["g:image_link", absolute(product.main_image)],
          [
            "g:availability",
            variant.availability && (variant.stock == null || variant.stock > 0)
              ? "in_stock"
              : "out_of_stock",
          ],
          ["g:price", `${regularPrice.toFixed(2)} ${currency}`],
          ["g:condition", condition],
          ["g:brand", product.brand_name || ""],
          ["g:gtin", validGtin ? variant.barcode : ""],
          ["g:identifier_exists", validGtin ? "yes" : "no"],
          ["g:product_type", product.category_name || ""],
          ["g:adult", web.merchantAdultContent ? "yes" : "no"],
        ];
        if (salePrice > 0 && salePrice < regularPrice) {
          item.push(["g:sale_price", `${salePrice.toFixed(2)} ${currency}`]);
        }
        const shipping = product.shipping_details;
        if (
          shipping?.country &&
          shipping.currency_code &&
          Number.isFinite(Number(shipping.rate))
        ) {
          item.push([
            "g:shipping",
            `<g:country>${xml(shipping.country)}</g:country><g:price>${xml(
              `${Number(shipping.rate).toFixed(2)} ${shipping.currency_code}`,
            )}</g:price>`,
          ]);
        }
        for (const image of productImages.slice(1, 11)) {
          item.push(["g:additional_image_link", absolute(image)]);
        }
        appendFileSync(
          feedPath,
          `  <item>\n${item
            .filter(([, value]) => value !== "")
            .map(([tag, value]) =>
              tag === "g:shipping"
                ? `    <${tag}>${value}</${tag}>`
                : `    <${tag}>${xml(value)}</${tag}>`,
            )
            .join("\n")}\n  </item>\n`,
        );
        feedItems += 1;
      }
    },
  );
  products.close();
  images.close();
  if (web.merchantFeedEnabled) appendFileSync(feedPath, "</channel></rss>\n");

  const videos = new ChunkedSitemap(
    "videos",
    ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
  );
  let cursor = null;
  const seenCursors = new Set();
  do {
    const response = await axios.get(`${apiUrl}/api/watch-and-buy/reels`, {
      params: { ...params, per_page: 50, ...(cursor ? { cursor } : {}) },
    });
    const data = response.data?.data || {};
    for (const reel of data.items || []) {
      if (!reel.slug || !reel.video_url || !reel.cover_url) continue;
      const link = canonical(`/watch-and-buy/${reel.slug}`);
      videos.add(
        `  <url>\n    <loc>${xml(link)}</loc>\n    <video:video>\n      <video:thumbnail_loc>${xml(absolute(reel.cover_url))}</video:thumbnail_loc>\n      <video:title>${xml(reel.caption || `Watch & Buy with ${reel.profile?.username || "seller"}`)}</video:title>\n      <video:description>${xml(reel.caption || "Shoppable product video")}</video:description>\n      <video:content_loc>${xml(absolute(reel.video_url))}</video:content_loc>\n      <video:publication_date>${xml(isoDate(reel.published_at))}</video:publication_date>\n${reel.duration_ms ? `      <video:duration>${Math.max(1, Math.round(reel.duration_ms / 1000))}</video:duration>\n` : ""}    </video:video>\n  </url>\n`,
      );
    }
    const nextCursor = data.meta?.next_cursor || null;
    if (!nextCursor || seenCursors.has(nextCursor)) break;
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  } while (cursor);
  videos.close();

  const sitemapFiles = [
    ...core.files,
    ...collections.files,
    ...products.files,
    ...images.files,
    ...videos.files,
  ];
  writeFileSync(
    join(publicDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles
      .map(
        (file) =>
          `  <sitemap><loc>${xml(`${siteUrl}/sitemaps/${file}`)}</loc><lastmod>${today}</lastmod></sitemap>`,
      )
      .join("\n")}\n</sitemapindex>\n`,
  );

  console.log(
    `SEO assets generated: ${sitemapFiles.length} sitemap files, ${feedItems} Merchant items.`,
  );
  if (skippedIdentifiers) {
    console.warn(
      `${skippedIdentifiers} feed items have identifier_exists=no because no valid GTIN was available.`,
    );
  }
};

main().catch((error) => {
  console.error(
    "SEO asset generation failed:",
    error.response?.data || error.message,
  );
  process.exit(1);
});
