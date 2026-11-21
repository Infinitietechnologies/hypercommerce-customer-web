import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cli, exec, fixture, write, serveNext } from "./helpers/plugin-fixture.mjs";

test("help and status do not initialize plugin contents or release state", async (t) => {
  const f = await fixture(t);
  const result = await exec(process.execPath, [cli, "--help"]);
  assert.match(result.stdout, /No init command/);
  const status = await f.run("status");
  assert.equal(status.latestRelease, null);
  assert.equal(status.deferredChecks.licence, "not-implemented");
  assert.match((await f.raw("status", "--text")).stdout, /^Plugin status\r?\n\r?\n  Profile\s+pages-export/);
  assert.deepEqual(await fs.readdir(path.join(f.root, "plugins")), []);
  await assert.rejects(fs.access(f.state), { code: "ENOENT" });
});

test("inspect, plan and dry-run do not execute instructions or write release state", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  const before = await fs.readFile(path.join(f.root, "package.json"), "utf8");
  assert.equal((await f.run("inspect", source)).id, "sample");
  assert.match((await f.raw("inspect", source, "--text")).stdout, /Step\s+Phase\s+Action\r?\n  files\s+integrate\s+files.install/);
  assert.match((await f.raw("plan", source, "--text")).stdout, /^Plugin install preview[\s\S]*Resulting plugin set[\s\S]*sample\s+1\.0\.0\s+enabled/);
  for (const args of [["plan", source], ["install", source, "--dry-run"]]) {
    const plan = await f.run(...args);
    assert.equal(plan.plugins[0].steps.length, 4);
    assert.equal(plan.profile, "pages-export");
  }
  await assert.rejects(fs.access(f.state), { code: "ENOENT" });
  assert.equal(await fs.readFile(path.join(f.root, "package.json"), "utf8"), before);
});

for (const profile of ["pages-export", "pages-server", "app-export", "app-server"]) {
  test(`${profile}: generates the selected adapter and preserves the source host`, async (t) => {
    const f = await fixture(t, profile);
    const source = await f.packageAt();
    const result = await f.run("install", source);
    const router = profile.split("-")[0];
    const route = path.join(result.directory, "src", router, "sample", router === "app" ? "page.tsx" : "index.tsx");
    assert.match(await fs.readFile(route, "utf8"), /export \{ default \}/);
    assert.equal(await fs.readFile(path.join(result.directory, "built-mode.txt"), "utf8"), profile.endsWith("server") ? "true" : "false");
    assert.equal(await fs.readFile(path.join(result.directory, "events.log"), "utf8"), "dependencies\nbuild\n");
    await assert.rejects(fs.access(path.join(f.root, "src", router, "sample")), { code: "ENOENT" });
    assert.deepEqual(await fs.readdir(path.join(f.root, "plugins")), []);
    assert.equal(result.status, "prepared");
    assert.equal((await f.run("status")).activeRelease, null);
  });
}

test("a plugin batch runs dependency installation and the build only once", async (t) => {
  const f = await fixture(t);
  const second = await f.packageAt("second");
  f.config.commands["host.beforeBuild"] = { executable: "node", args: ["-e", 'require("fs").appendFileSync("events.log", "before-build\\n")'] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const workflow = JSON.parse(await fs.readFile(path.join(second, "instructions.json"), "utf8"));
  workflow.steps.splice(3, 0, { id: "before-build", phase: "build", action: "command.run", with: { commandId: "host.beforeBuild" } });
  await write(path.join(second, "instructions.json"), workflow);
  const result = await f.run("install", await f.packageAt("first"), second);
  assert.equal(result.plugins.length, 2);
  assert.equal(await fs.readFile(path.join(result.directory, "events.log"), "utf8"), "dependencies\nbefore-build\nbuild\n");
  assert.equal(JSON.parse(await fs.readFile(path.join(result.directory, "src/plugins/registry.json"), "utf8")).length, 2);
});

test("updates, disabling, enabling, removal and release selection preserve history", async (t) => {
  const f = await fixture(t);
  const initial = await f.run("install", await f.packageAt());
  const updated = await f.run("update", await f.packageAt("sample", "2.0.0"));
  assert.equal(updated.plugins[0].version, "2.0.0");
  const disabled = await f.run("disable", "sample");
  assert.equal(disabled.plugins[0].enabled, false);
  await assert.rejects(fs.access(path.join(disabled.directory, "src/pages/sample/index.tsx")), { code: "ENOENT" });
  assert.equal((await f.run("enable", "sample")).plugins[0].enabled, true);
  assert.deepEqual((await f.run("uninstall", "sample")).plugins, []);
  await f.run("rollback", "--release", initial.release);
  const status = await f.run("status");
  assert.equal(status.plugins.sample.version, "1.0.0");
  assert.equal(status.history.length, 6);
});

test("failed builds leave registry state intact and release the job lock", async (t) => {
  const f = await fixture(t);
  const initial = await f.run("install", await f.packageAt());
  f.config.commands["host.build"].env = { FAIL_BUILD: "1" };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await assert.rejects(f.run("update", await f.packageAt("sample", "2.0.0")), /Command failed \(7\)/);
  const status = await f.run("status");
  assert.equal(status.latestRelease, initial.release);
  assert.equal(status.plugins.sample.version, "1.0.0");
  await assert.rejects(fs.access(path.join(f.state, "install.lock")), { code: "ENOENT" });
  const jobs = await fs.readdir(path.join(f.state, "jobs"));
  const results = await Promise.all(jobs.map((file) => fs.readFile(path.join(f.state, "jobs", file), "utf8")));
  assert.ok(results.some((text) => JSON.parse(text).status === "failed"));
});

test("deferred verification steps fail clearly without committing a release", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  await write(path.join(source, "instructions.json"), { steps: [{ id: "future", phase: "verify-source", action: "command.run", with: { commandId: "host.checkSource" } }] });
  await assert.rejects(f.run("install", source), /deferred verification phase/);
  assert.equal((await f.run("status")).latestRelease, null);
});

test("named host commands, conditions and translation namespaces execute in order", async (t) => {
  const f = await fixture(t);
  f.config.commands["host.marker"] = { executable: "node", args: ["-e", 'require("fs").appendFileSync("events.log", "marker\\n")'] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const source = await f.packageAt("sample", "1.0.0", { contributions: { translations: [{ locale: "en", from: "en.json" }] } });
  await write(path.join(source, "en.json"), { title: "Example" });
  const workflow = JSON.parse(await fs.readFile(path.join(source, "instructions.json"), "utf8"));
  workflow.steps.splice(2, 0,
    { id: "translate", phase: "integrate", action: "translations.merge" },
    { id: "marker", phase: "integrate", action: "command.run", with: { commandId: "host.marker" }, when: { profile: "pages-export" } },
    { id: "skip", phase: "integrate", action: "not-supported", when: { router: "app" } });
  await write(path.join(source, "instructions.json"), workflow);
  const result = await f.run("install", source);
  assert.equal(await fs.readFile(path.join(result.directory, "events.log"), "utf8"), "marker\ndependencies\nbuild\n");
  assert.equal(JSON.parse(await fs.readFile(path.join(result.directory, "public/locales/en.json"), "utf8"))["plugin:sample"].title, "Example");
});

test("unknown commands, failed prerequisites and escaping mappings cannot modify the host", async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run("init"), /Unknown command/);
  const source = await f.packageAt("sample", "1.0.0", { fileMappings: { "frontend-files": [{ from: "src/Page.tsx", to: "{pluginRoot}/../../package.json" }] } });
  await assert.rejects(f.run("install", source), /Path escapes/);
  await write(path.join(source, "instructions.json"), { steps: [{ id: "register", phase: "integrate", action: "contributions.register", dependsOn: ["missing"] }] });
  await assert.rejects(f.run("install", source), /Unfinished prerequisite/);
  assert.deepEqual(await fs.readdir(path.join(f.root, "plugins")), []);
});

test("a held lock prevents concurrent mutation", async (t) => {
  const f = await fixture(t);
  await write(path.join(f.state, "install.lock"), { pid: process.pid });
  await assert.rejects(f.run("install", await f.packageAt()), /Another job owns/);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.state, "install.lock"), "utf8")).pid, process.pid);
});

test("locally customized generated artifacts are preserved on update", async (t) => {
  const f = await fixture(t);
  const installed = await f.run("install", await f.packageAt());
  const route = path.join(installed.directory, "src/pages/sample/index.tsx");
  await fs.appendFile(route, "// Local customization\n");
  await assert.rejects(f.run("update", await f.packageAt("sample", "2.0.0")), /locally modified/);
  assert.match(await fs.readFile(route, "utf8"), /Local customization/);
  assert.equal((await f.run("status")).latestRelease, installed.release);
});

test("dependency declarations are combined in the candidate without changing the checkout", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  await write(path.join(source, "package.json"), { dependencies: { example: "1.0.0" }, peerDependencies: { react: "^19" } });
  const result = await f.run("install", source);
  const candidate = JSON.parse(await fs.readFile(path.join(result.directory, "package.json"), "utf8"));
  assert.equal(candidate.dependencies.example, "1.0.0");
  assert.equal(JSON.parse(await fs.readFile(path.join(f.root, "package.json"), "utf8")).dependencies, undefined);
});

test("default npm dependency and build commands work without a platform shell", async (t) => {
  const f = await fixture(t);
  f.config.commands = {};
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const result = await f.run("install", await f.packageAt());
  assert.equal(result.status, "prepared");
  assert.equal(await fs.readFile(path.join(result.directory, "events.log"), "utf8"), "build\n");
  await fs.access(path.join(result.directory, "package-lock.json"));
  await assert.rejects(fs.access(path.join(f.root, "package-lock.json")), { code: "ENOENT" });
});

test("plan output redacts command credentials", async (t) => {
  const f = await fixture(t);
  f.config.commands["host.private"] = { executable: "node", args: ["--token", "private-token", "api_key=other-secret"], env: { API_KEY: "other-secret" } };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const plan = await f.run("plan", await f.packageAt());
  assert.ok(!JSON.stringify(plan).includes("private-token"));
  assert.ok(!JSON.stringify(plan).includes("other-secret"));
});

test("timeouts stop child commands, preserve the previous release and release locks", async (t) => {
  const f = await fixture(t);
  f.config.commands["host.build"] = { executable: "node", args: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 100 };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await assert.rejects(f.run("install", await f.packageAt()), /timed out/);
  assert.equal((await f.run("status")).latestRelease, null);
  await assert.rejects(fs.access(path.join(f.state, "install.lock")), { code: "ENOENT" });
});

test("activation is explicit and uses only host-controlled deployment hooks", async (t) => {
  const f = await fixture(t);
  const prepared = await f.run("install", await f.packageAt());
  await assert.rejects(f.run("activate", "--release", prepared.release), /host.activate/);
  f.config.commands["host.activate"] = { executable: "node", args: ["-e", 'require("fs").writeFileSync("activated.txt", process.env.PLUGIN_RELEASE_DIR)'] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const activated = await f.run("activate", "--release", prepared.release);
  assert.equal(activated.status, "activated");
  assert.equal((await f.run("status")).activeRelease, prepared.release);
});

if (process.env.PLUGIN_NEXT_SMOKE === "1") {
  for (const profile of ["pages-export", "pages-server", "app-export", "app-server"]) {
    test(`Next.js compilation/runtime: ${profile} dynamic route and client component`, async (t) => {
      const f = await fixture(t, profile);
      f.execution.timeoutMs = 300_000;
      const repository = fileURLToPath(new URL("../", import.meta.url));
      const isApp = profile.startsWith("app");
      const isExport = profile.endsWith("export");
      await write(path.join(f.root, "next.config.mjs"), `export default ${JSON.stringify({ ...(isExport ? { output: "export" } : {}), experimental: { cpus: 2 } })};`);
      await write(path.join(f.root, "scripts/dependencies.mjs"), `import { symlinkSync } from "node:fs"; symlinkSync(${JSON.stringify(path.join(repository, "node_modules"))}, "node_modules", "junction");`);
      if (isApp) await write(path.join(f.root, "src/app/layout.jsx"), 'export default function Layout({children}) { return <html><body>{children}</body></html>; }');
      const exports = isApp ? (isExport ? ["generateStaticParams"] : []) : (isExport ? ["getStaticProps", "getStaticPaths"] : ["getServerSideProps"]);
      const adapter = { entry: "src/Page.jsx", extension: "jsx", exports, ...(isApp && !isExport ? { config: { dynamic: "force-dynamic" } } : {}) };
      const source = await f.packageAt("sample", "1.0.0", { configuration: { public: { defaults: { label: "Configured plugin" } } }, appendRules: { api: "rules/api.json" }, contributions: { routes: [
        { path: "/sample/[id]", adapters: { [profile]: adapter } },
        { path: "/client", entry: "src/Client.jsx", extension: "jsx" },
      ] } });
      await write(path.join(f.root, "src/plugin-api.js"), "// PLUGIN_API_EXPORTS\nexport const existingApi = true;\n");
      await write(path.join(source, "rules/api.json"), { rules: [{ id: "api-export", target: "src/plugin-api.js", source: "rules/api.txt", position: "after", anchor: "// PLUGIN_API_EXPORTS" }] });
      await write(path.join(source, "rules/api.txt"), 'export function pluginApiValue() { return "Plugin API result"; }');
      const instructionsFile = path.join(source, "instructions.json");
      const instructions = JSON.parse(await fs.readFile(instructionsFile, "utf8"));
      instructions.steps.splice(1, 0, { id: "append-api", phase: "integrate", action: "files.append", with: { rulesRef: "api" } });
      await write(instructionsFile, instructions);
      await fs.unlink(path.join(source, "src/Page.tsx"));
      const dataExports = isApp
        ? (isExport ? 'export async function generateStaticParams() { return [{id:"first"}]; }' : "")
        : (isExport ? 'export async function getStaticProps() { return {props:{marker:"built"}}; } export async function getStaticPaths() { return { paths:[{params:{id:"first"}}], fallback:false }; }' : 'export async function getServerSideProps(context) { return {props:{marker:context.req.headers["x-plugin-test"]}}; }');
      const page = isApp && !isExport
        ? 'import { headers } from "next/headers"; export default async function Page() { const context = await headers(); return <main>Plugin route {context.get("x-plugin-test")} {pluginApiValue()} {settings.label}</main>; }'
        : 'export default function Page({marker="built"}) { return <main>Plugin route {marker} {pluginApiValue()} {settings.label}</main>; }';
      await write(path.join(source, "src/Page.jsx"), `import settings from "../config.json"; import { pluginApiValue } from "../../../plugin-api"; ${page} ${dataExports}`);
      await write(path.join(source, "src/Client.jsx"), '\'use client\'; import settings from "../config.json"; import {useState} from "react"; export default function Client() {const [count,setCount] = useState(0); return <button onClick={() => setCount(count + 1)}>Client plugin {count} {settings.label}</button>;}');
      f.config.commands["host.build"] = { executable: "node", args: [path.join(repository, "node_modules/next/dist/bin/next"), "build", "--webpack"], timeoutMs: 240_000, env: { NEXT_TELEMETRY_DISABLED: "1" } };
      await write(path.join(f.root, "plugin-host.json"), f.config);
      await fs.cp(source, path.join(f.root, "plugins/sample"), { recursive: true });
      assert.equal((await f.run("install-all", "--json")).status, "completed");
      const registry = await f.run("status");
      const result = { release: registry.latestRelease, directory: path.join(f.state, "releases", registry.latestRelease, "app") };
      for (const file of ["src/plugin-api.js", "src/plugins/sample/config.json", "src/plugins/sample/src/Page.jsx"]) {
        assert.deepEqual(await fs.readFile(path.join(f.root, file)), await fs.readFile(path.join(result.directory, file)));
      }
      if (isExport) {
        assert.match(await fs.readFile(path.join(result.directory, "out/sample/first.html"), "utf8"), /Plugin route/);
        assert.match(await fs.readFile(path.join(result.directory, "out/sample/first.html"), "utf8"), /Plugin API result/);
        assert.match(await fs.readFile(path.join(result.directory, "out/sample/first.html"), "utf8"), /Configured plugin/);
        assert.match(await fs.readFile(path.join(result.directory, "out/client.html"), "utf8"), /Client plugin/);
        assert.match(await fs.readFile(path.join(result.directory, "out/client.html"), "utf8"), /Configured plugin/);
      }
      else {
        const manifest = JSON.parse(await fs.readFile(path.join(result.directory, ".next/prerender-manifest.json"), "utf8"));
        assert.equal(manifest.routes["/sample/first"], undefined);
        const server = await serveNext(result.directory, path.join(repository, "node_modules/next/dist/bin/next"));
        try {
          for (const marker of ["first-request", "second-request"]) {
            const response = await fetch(`${server.baseURL}/sample/first`, { headers: { "x-plugin-test": marker } });
            assert.equal(response.status, 200);
            const html = await response.text();
            assert.match(html, new RegExp(marker));
            assert.match(html, /Plugin API result/);
            assert.match(html, /Configured plugin/);
          }
          const client = await fetch(`${server.baseURL}/client`);
          assert.equal(client.status, 200);
          const clientHtml = await client.text();
          assert.match(clientHtml, /Client plugin/);
          assert.match(clientHtml, /Configured plugin/);
        } finally { await server.stop(); }
      }
      await f.run("revert", "--json");
      assert.equal(await fs.readFile(path.join(f.root, "src/plugin-api.js"), "utf8"), "// PLUGIN_API_EXPORTS\nexport const existingApi = true;\n");
    });
  }
}
