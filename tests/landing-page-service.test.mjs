import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/services/landingPage.ts", import.meta.url),
  "utf8"
);
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const calls = [];
const mockLandingPage = {
  title: "Summer Sale",
  slug: "summer-sale",
  html: "<section><h1>Summer Sale</h1></section>",
  css: "h1 { color: red; }",
  show_header_footer: true,
  is_active: true,
  updated_at: "2026-10-30T10:00:00.000000Z",
};

const api = {
  get: async (...args) => {
    calls.push(["GET", ...args]);
    return {
      data: {
        success: true,
        message: "Landing page fetched successfully",
        data: mockLandingPage,
      },
    };
  },
};

const exports = {};
runInNewContext(output, {
  exports,
  require: (id) => (id === "./client" ? { api } : {}),
  console,
});

test("getLandingPage calls /go/:slug with correct encoded url and params", async () => {
  calls.length = 0;
  const result = await exports.getLandingPage("summer sale", {
    market: "us",
    access_token: "token123",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.title, mockLandingPage.title);
  assert.equal(result.data.slug, mockLandingPage.slug);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "GET");
  assert.equal(calls[0][1], "/go/summer%20sale");
  assert.equal(calls[0][2].params.access_token, "token123");
  assert.equal(calls[0][2].params.market, "us");
});

test("getLandingPage handles 404 response properly", async () => {
  calls.length = 0;
  api.get = async () => {
    const error = new Error("Not Found");
    error.response = {
      status: 404,
      data: { message: "Landing page not found" },
    };
    throw error;
  };

  const result = await exports.getLandingPage("non-existent");
  assert.equal(result.success, false);
  assert.equal(result.message, "Landing page not found");
  assert.equal(result.data, null);
});

test("getLandingPage handles generic network error gracefully", async () => {
  calls.length = 0;
  api.get = async () => {
    throw new Error("Network Error");
  };

  const result = await exports.getLandingPage("error-slug");
  assert.equal(result.success, false);
  assert.equal(result.message, "Unable to load the landing page.");
  assert.equal(result.data, null);
});

test("formatLandingCss properly scopes universal selector and body to avoid header/footer misalignment", async () => {
  const landingPageViewSource = readFileSync(
    new URL("../src/views/LandingPageView.tsx", import.meta.url),
    "utf8"
  );

  const match = landingPageViewSource.match(/const formatLandingCss = \([\s\S]*?\n\};\n/);
  assert.ok(match, "formatLandingCss should exist in LandingPageView.tsx");

  const transpiled = ts.transpileModule(match[0] + "\nexports.formatLandingCss = formatLandingCss;", {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const testExports = {};
  runInNewContext(transpiled, { exports: testExports });

  const inputCss = `* { margin-left: 0px; margin-right: 0px; } body { margin: 0; background: red; } .swiper { width: 100%; }`;
  const scoped = testExports.formatLandingCss(inputCss);

  assert.ok(scoped.includes(".custom-landing-page * {"), "Universal selector must be scoped");
  assert.ok(!scoped.includes("body {"), "body selector must be replaced");
  assert.ok(scoped.includes(".custom-landing-page {"), "body must be replaced with .custom-landing-page");
  assert.ok(scoped.includes(".custom-landing-page .swiper {"), "classes must be scoped");
});
