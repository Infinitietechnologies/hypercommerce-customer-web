import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM does not provide __dirname by default. Create it from import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Panel origin the storefront talks to; falls back to allowing any https API
// host so a missing env var cannot silently produce a policy that blocks the API.
const panelOrigin = (process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "").replace(
  /\/+$/,
  "",
);

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  // next/script and the gateway SDKs inject inline script; a static export has
  // no server to mint nonces, so 'unsafe-inline' is unavoidable here.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://js.paystack.co https://checkout.flutterwave.com https://*.googleapis.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${panelOrigin} https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.razorpay.com https://api.stripe.com`.trim(),
  "frame-src 'self' https://api.razorpay.com https://js.stripe.com https://checkout.paystack.com https://checkout.flutterwave.com",
].join("; ");

function generateHtaccess() {
  const outputPath = path.join(__dirname, "out", ".htaccess");

  // Construct the .htaccess content
  const htaccessContent = `ErrorDocument 404 /404.html

  <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # The dynamic product export creates this directory without an index route.
    RewriteRule ^products/?$ - [R=404,L]
     
    # Dynamic routes (Index pages)
    RewriteRule ^brands/?$ brands/index.html [L]
    RewriteRule ^categories/?$ categories/index.html [L]
    RewriteRule ^delivery-zones/?$ delivery-zones/index.html [L]
    RewriteRule ^feature-sections/?$ feature-sections/index.html [L]
    RewriteRule ^my-account/orders/?$ my-account/orders/index.html [L]
    RewriteRule ^stores/?$ stores/index.html [L]
     
    # Dynamic routes (Slug pages)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^brands/([^/]+)/?$ brands/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^categories/([^/]+)/?$ categories/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^delivery-zones/([^/]+)/?$ delivery-zones/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^feature-sections/([^/]+)/?$ feature-sections/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^my-account/orders/([^/]+)/?$ my-account/orders/[slug]/index.html [L]

    # Exclude 'search' from products slug rule
    RewriteCond %{REQUEST_URI} !^/products/search
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^products/([^/]+)/?$ products/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^stores/([^/]+)/?$ stores/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^share/products/([^/]+)/?$ share/products/[slug]/index.html [L]
    
    # If the request is not for a valid directory
    RewriteCond %{REQUEST_FILENAME} !-d
    # If the request is not for a valid file
    RewriteCond %{REQUEST_FILENAME} !-f
    # If the request is not for a valid link
    RewriteCond %{REQUEST_FILENAME} !-l

    # Rewrite all other URLs to index.html
    RewriteRule . index.html [L]
  </IfModule>

  <IfModule mod_headers.c>
    # Mirrors the securityHeaders block in next.config.ts, which only applies
    # when the app runs as a server. The shipped build is a static export, so
    # the host has to set them.
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(self), interest-cohort=()"
    Header always set Cross-Origin-Resource-Policy "cross-origin"
    Header always set X-DNS-Prefetch-Control "on"

    # Report-only first: the storefront loads gateway SDKs (Razorpay, Stripe,
    # Paystack, Flutterwave), Firebase and the admin-configurable header/footer
    # scripts, so the allow-list has to be confirmed against a real page load
    # before this becomes enforcing. Flip the header name to
    # Content-Security-Policy once the browser console reports no violations.
    Header always set Content-Security-Policy-Report-Only "${csp}"
  </IfModule>`;

  // Write the content to .htaccess file
  fs.writeFileSync(outputPath, htaccessContent.trim());
  console.log(".htaccess file has been generated successfully.");
}

// Call the function to generate .htaccess
generateHtaccess();
