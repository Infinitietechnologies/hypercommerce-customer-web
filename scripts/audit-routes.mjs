#!/usr/bin/env node
/**
 * Route + data audit.
 *
 * Walks every storefront route against a running dev server and reports whether
 * the page actually rendered data, rather than only whether it returned 200 —
 * an SSR fallback renders a perfectly healthy 200 with nothing on it.
 *
 *   node scripts/audit-routes.mjs [baseUrl]
 *
 * Signed-out by default. Add credentials to also audit the account area with a
 * real session — protected routes are then expected to return 200 with content
 * rather than redirect:
 *
 *   AUDIT_EMAIL=user@gmail.com AUDIT_PASSWORD=… node scripts/audit-routes.mjs
 */

const BASE = process.argv[2] || "http://localhost:3000";
const API =
  process.env.NEXT_PUBLIC_ADMIN_PANEL_URL?.replace(/\/$/, "") + "/api" ||
  "https://dev-hypercommerce.spa-point.in/api";

const TIMEOUT_MS = 60_000;

const get = async (url, opts = {}) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "manual", signal: ac.signal, ...opts });
    const body = res.status < 400 ? await res.text() : "";
    return { status: res.status, location: res.headers.get("location"), body };
  } catch (err) {
    return { status: 0, error: err.message, body: "" };
  } finally {
    clearTimeout(timer);
  }
};

/** Pull the SSR payload so we can inspect what the server actually sent. */
const nextData = (html) => {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
};

/** Rough count of meaningful content nodes so an empty page is visible. */
const contentSignals = (html) => {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    textLen: text.length,
    links: (html.match(/<a\s/g) || []).length,
    imgs: (html.match(/<img\s/g) || []).length,
    hasSkeleton: /skeleton/i.test(html),
    emptyWords: /no products|not found|no results|no items|empty|nothing here/i.test(text),
  };
};

const ROUTES = [
  ["/", "home"],
  ["/categories/", "category list"],
  ["/categories/accessories-1/", "category detail"],
  ["/brands/", "brand list"],
  ["/brands/nike/", "brand detail"],
  ["/stores/", "store list"],
  ["/stores/cena-enterprise/", "store detail"],
  ["/products/search/", "search"],
  ["/shopping-list/", "shopping list"],
  ["/cart/", "cart"],
  ["/login/", "login"],
  ["/register/", "register"],
  ["/forgot-password/", "forgot password"],
  ["/about-us/", "about"],
  ["/faqs/", "faqs"],
  ["/privacy-policy/", "privacy"],
  ["/terms-and-conditions/", "terms"],
  ["/shipping-policy/", "shipping policy"],
  ["/return-refund-policy/", "refund policy"],
  ["/seller-register/", "seller register"],
  ["/404/", "404 page", { expect: 404 }],
  // Protected — expected to redirect when signed out.
  ["/my-account/", "account", { protected: true }],
  ["/my-account/orders/", "orders", { protected: true }],
  ["/my-account/addresses/", "addresses", { protected: true }],
  ["/my-account/wallet/", "wallet", { protected: true }],
  ["/my-account/transactions/", "transactions", { protected: true }],
  ["/my-account/wishlists/", "wishlists", { protected: true }],
  ["/my-account/notifications/", "notifications", { protected: true }],
  ["/my-account/refer-and-earn/", "refer & earn", { protected: true }],
  ["/verify-email/", "verify email", { protected: true }],
];

const ENDPOINTS = [
  "/settings",
  "/categories",
  "/brands",
  "/stores",
  "/markets/products",
  "/faqs",
  "/home-layout?platform=web",
  "/home-layout?platform=app",
];

const pad = (s, n) => String(s).padEnd(n);

/** Sign in against the panel and return a cookie header, or null. */
const signIn = async () => {
  const email = process.env.AUDIT_EMAIL;
  const password = process.env.AUDIT_PASSWORD;
  if (!email || !password) return null;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, device_type: "web" }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.success || !json.access_token) {
    console.log(`!! sign-in failed: ${json?.message || res.status}\n`);
    return null;
  }
  return [
    `access_token=${encodeURIComponent(json.access_token)}`,
    `user=${encodeURIComponent(JSON.stringify(json.data))}`,
  ].join("; ");
};

const run = async () => {
  console.log(`\nBASE ${BASE}\nAPI  ${API}\n`);

  const cookie = await signIn();
  const authed = Boolean(cookie);
  console.log(authed ? "session: signed in\n" : "session: signed out\n");

  console.log("── BACKEND ENDPOINTS " + "─".repeat(46));
  for (const ep of ENDPOINTS) {
    const r = await get(API + ep);
    let note = "";
    if (r.status === 200) {
      try {
        const j = JSON.parse(r.body);
        const d = j.data;
        const n = Array.isArray(d)
          ? d.length
          : Array.isArray(d?.data)
            ? d.data.length
            : Array.isArray(d?.sections)
              ? d.sections.length
              : null;
        note = `success=${j.success}` + (n === null ? "" : ` items=${n}`);
      } catch {
        note = "non-JSON";
      }
    }
    const flag = r.status === 200 ? "ok  " : "FAIL";
    console.log(`${flag} ${pad(r.status, 4)} ${pad(ep, 34)} ${note}`);
  }

  console.log("\n── ROUTES " + "─".repeat(57));
  const problems = [];

  for (const [path, label, opts = {}] of ROUTES) {
    const r = await get(BASE + path, cookie ? { headers: { cookie } } : {});

    if (opts.protected && !authed) {
      const ok = r.status === 307 || r.status === 302;
      const toLogin = (r.location || "").includes("/login");
      const flag = ok && toLogin ? "ok  " : "WARN";
      if (!(ok && toLogin)) problems.push(`${path} — protected route did not redirect to /login (got ${r.status} ${r.location || ""})`);
      console.log(`${flag} ${pad(r.status, 4)} ${pad(path, 34)} ${label} → ${r.location || "no redirect"}`);
      continue;
    }

    if (opts.expect && r.status === opts.expect) {
      console.log(`ok   ${pad(r.status, 4)} ${pad(path, 34)} ${label} (expected)`);
      continue;
    }

    if (r.status !== 200) {
      const why = opts.protected
        ? `${path} — signed in but still ${r.status}${r.location ? " -> " + r.location : ""}`
        : `${path} — HTTP ${r.status}${r.error ? " " + r.error : ""}`;
      problems.push(why);
      console.log(`FAIL ${pad(r.status, 4)} ${pad(path, 34)} ${label} ${r.error || ""}`);
      continue;
    }

    const sig = contentSignals(r.body);
    const nd = nextData(r.body);
    const pageProps = nd?.props?.pageProps ?? {};
    const propKeys = Object.keys(pageProps);
    const nullProps = propKeys.filter((k) => pageProps[k] === null);

    const thin = sig.textLen < 400;
    const flag = thin ? "THIN" : "ok  ";
    if (thin) problems.push(`${path} — rendered only ${sig.textLen} chars of text`);
    if (nullProps.length) problems.push(`${path} — null SSR props: ${nullProps.join(", ")}`);

    console.log(
      `${flag} ${pad(200, 4)} ${pad(path, 34)} text=${pad(sig.textLen, 6)} links=${pad(sig.links, 4)} img=${pad(sig.imgs, 4)}` +
        (nullProps.length ? ` nullProps=[${nullProps.join(",")}]` : ""),
    );
  }

  console.log("\n── PROBLEMS " + "─".repeat(55));
  if (!problems.length) console.log("none");
  else problems.forEach((p, i) => console.log(`${i + 1}. ${p}`));
  console.log("");
};

run();
