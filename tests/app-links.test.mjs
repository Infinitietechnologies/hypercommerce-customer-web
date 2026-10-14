import assert from "node:assert/strict";
import test from "node:test";

import {
  detectMobilePlatform,
  getAndroidIntentUrl,
  getCustomerAppLinks,
  getCustomerAppTarget,
} from "../src/helpers/appLinks.ts";

test("detects iPhones, iPads, and Android devices", () => {
  assert.equal(
    detectMobilePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"),
    "ios",
  );
  assert.equal(
    detectMobilePlatform("Mozilla/5.0 (Linux; Android 15)"),
    "android",
  );
  assert.equal(detectMobilePlatform("Mozilla/5.0", "MacIntel", 5), "ios");
  assert.equal(detectMobilePlatform("Mozilla/5.0", "MacIntel", 0), "other");
});

test("uses customer store links and never gives iOS a Play URL", () => {
  const links = getCustomerAppLinks(
    {
      customerAppScheme: "hypercommerce://",
      customerAppstoreLink:
        "https://play.google.com/store/apps/details?id=wrong.app",
      customerPlaystoreLink:
        "https://play.google.com/store/apps/details?id=com.hypercommerce.customer",
    },
    {
      appSectionAppstoreLink:
        "https://apps.apple.com/us/app/hypercommerce/id123456789",
    },
  );
  assert.equal(links.scheme, "hypercommerce");
  assert.equal(
    links.iosStoreUrl,
    "https://apps.apple.com/us/app/hypercommerce/id123456789",
  );
  assert.equal(links.androidPackage, "com.hypercommerce.customer");
  assert.equal(
    links.androidStoreUrl?.startsWith("https://play.google.com/"),
    true,
  );
});

test("accepts the configured customer TestFlight invitation on iOS", () => {
  const links = getCustomerAppLinks(
    {
      customerAppScheme: "customer-hypercommerce",
      customerAppstoreLink: "https://testflight.apple.com/join/NmyU7Sa6",
      customerPlaystoreLink:
        "https://play.google.com/store/apps/details?id=com.hyperCommerce.customer",
    },
    null,
  );
  assert.equal(
    links.iosStoreUrl,
    "https://testflight.apple.com/join/NmyU7Sa6",
  );
  assert.equal(links.androidPackage, "com.hyperCommerce.customer");
  assert.equal(
    getAndroidIntentUrl(
      getCustomerAppTarget(links.scheme, "/", "/"),
      links.androidPackage,
      links.androidStoreUrl,
    ),
    "intent://products#Intent;scheme=customer-hypercommerce;package=com.hyperCommerce.customer;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.hyperCommerce.customer;end",
  );
});

test("preserves product slug when opening an installed app", () => {
  const target = getCustomerAppTarget(
    "hypercommerce",
    "/share/products/[slug]",
    "/share/products/blue-shirt?open_app=1",
  );
  assert.equal(target, "hypercommerce://products?slug=blue-shirt");
  assert.equal(
    getCustomerAppTarget(
      "hypercommerce",
      "/products/[slug]",
      "/products/blue%20shirt",
    ),
    "hypercommerce://products?slug=blue%20shirt",
  );
  assert.equal(
    getAndroidIntentUrl(
      target,
      "com.hypercommerce.customer",
      "https://play.google.com/store/apps/details?id=com.hypercommerce.customer",
    ),
    "intent://products?slug=blue-shirt#Intent;scheme=hypercommerce;package=com.hypercommerce.customer;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.hypercommerce.customer;end",
  );
});

test("uses a valid legacy scheme when the customer scheme is blank", () => {
  const links = getCustomerAppLinks(
    { customerAppScheme: "  ", appScheme: "hypercommerce://" },
    null,
  );
  assert.equal(links.scheme, "hypercommerce");
});
