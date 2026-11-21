import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { fixture, write } from "./helpers/plugin-fixture.mjs";
import { loadHost } from "../scripts/plugin-system/plan.mjs";
import { applyLocal } from "../scripts/plugin-system/local-project.mjs";
import { restoreFile, blobPath } from "../scripts/plugin-system/source-state.mjs";

const api = "src/routes/local-api.mjs";
const base = "// PLUGIN_EXPORTS\nexport const original = true;\n";
async function localFixture(t) {
  const f = await fixture(t);
  await write(path.join(f.root, api), base);
  const version = async (number = "1.0.0", extra = {}) => {
    const source = await f.packageAt("sample", number, { appendRules: { api: "rules.json" }, ...extra });
    await write(path.join(source, "rules.json"), { rules: [{ id: "api", target: api, anchor: "// PLUGIN_EXPORTS", position: "after", content: `export const pluginVersion = ${JSON.stringify(number)};` }] });
    const file = path.join(source, "instructions.json");
    const workflow = JSON.parse(await fs.readFile(file, "utf8"));
    workflow.steps.splice(1, 0, { id: "append", phase: "integrate", action: "files.append", with: { rulesRef: "api" } });
    await write(file, workflow);
    return source;
  };
  const registry = async () => JSON.parse(await fs.readFile(path.join(f.state, "registry.json"), "utf8"));
  const content = () => fs.readFile(path.join(f.root, api), "utf8");
  return { ...f, version, registry, content };
}

test("apply preview creates no receipt or checkout changes; apply and undo preserve originals", async (t) => {
  const f = await localFixture(t);
  const prepared = await f.run("install", await f.version());
  assert.equal(await f.content(), base);
  const beforeRegistry = await fs.readFile(path.join(f.state, "registry.json"), "utf8");
  const preview = await f.run("apply", "--release", prepared.release, "--dry-run");
  assert.ok(preview.changes.some((entry) => entry.path === api));
  assert.equal(await fs.readFile(path.join(f.state, "registry.json"), "utf8"), beforeRegistry);
  await assert.rejects(fs.access(path.join(f.state, "local-transactions")), { code: "ENOENT" });
  const applied = await f.run("apply", "--release", prepared.release);
  assert.equal(applied.status, "applied");
  assert.match(await f.content(), /pluginVersion/);
  await fs.access(path.join(f.root, "src/pages/sample/index.tsx"));
  assert.equal((await f.registry()).local.appliedRelease, prepared.release);
  assert.equal((await f.run("apply", "--release", prepared.release)).status, "already-applied");
  await f.run("undo");
  assert.equal(await f.content(), base);
  await assert.rejects(fs.access(path.join(f.root, "src/pages/sample/index.tsx")), { code: "ENOENT" });
});

test("a locally applied plugin can be updated, reapplied, undone and applied again", async (t) => {
  const f = await localFixture(t);
  const first = await f.run("install", await f.version());
  await f.run("apply", "--release", first.release);
  const second = await f.run("update", await f.version("2.0.0"));
  assert.match(await f.content(), /1\.0\.0/);
  await f.run("apply", "--release", second.release);
  assert.match(await f.content(), /2\.0\.0/);
  assert.doesNotMatch(await f.content(), /1\.0\.0/);
  await f.run("undo");
  assert.match(await f.content(), /1\.0\.0/);
  assert.equal((await f.registry()).local.appliedRelease, first.release);
  await f.run("apply", "--release", second.release);
  assert.match(await f.content(), /2\.0\.0/);
});

test("disable and uninstall restore shared source and remove only generated files", async (t) => {
  const f = await localFixture(t);
  const first = await f.run("install", await f.version());
  await f.run("apply", "--release", first.release);
  await write(path.join(f.root, "src/plugins/sample/custom.mjs"), "// Unrelated customization\n");
  const disabled = await f.run("disable", "sample");
  await f.run("apply", "--release", disabled.release);
  assert.equal(await f.content(), base);
  assert.match(await fs.readFile(path.join(f.root, "src/plugins/sample/custom.mjs"), "utf8"), /Unrelated customization/);
  const enabled = await f.run("enable", "sample");
  await f.run("apply", "--release", enabled.release);
  const removed = await f.run("uninstall", "sample");
  await f.run("apply", "--release", removed.release);
  assert.equal(await f.content(), base);
  await assert.rejects(fs.access(path.join(f.root, "src/plugins/sample/src/Page.tsx")), { code: "ENOENT" });
});

test("apply rejects stale source and preserves unrelated checkout edits", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  await fs.appendFile(path.join(f.root, api), "// Manual change\n");
  await assert.rejects(f.run("apply", "--release", release.release), /Local source changed/);
  assert.match(await f.content(), /Manual change/);
  await assert.rejects(fs.access(path.join(f.root, "src/pages/sample/index.tsx")), { code: "ENOENT" });
  await write(path.join(f.root, api), base);
  await write(path.join(f.root, "unrelated.txt"), "Preserve this");
  await f.run("apply", "--release", release.release);
  assert.equal(await fs.readFile(path.join(f.root, "unrelated.txt"), "utf8"), "Preserve this");
});

test("editing a locally managed file prevents a candidate from discarding it", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  await f.run("apply", "--release", release.release);
  await fs.appendFile(path.join(f.root, api), "// Preserve local edit\n");
  await assert.rejects(f.run("update", await f.version("2.0.0")), /Local managed file was modified/);
  await assert.rejects(f.run("undo"), /unexpected edit/);
  assert.match(await f.content(), /Preserve local edit/);
});

test("apply rejects modified candidate files", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  await fs.appendFile(path.join(release.directory, api), "// Candidate edit\n");
  await assert.rejects(f.run("apply", "--release", release.release), /Prepared candidate source was modified/);
  assert.equal(await f.content(), base);
});

test("a damaged source blob fails before checkout writes", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  const metadata = JSON.parse(await fs.readFile(path.join(f.state, "releases", release.release, "release.json"), "utf8"));
  await fs.writeFile(blobPath(f.state, metadata.sourceChanges.files[api].after.hash), "damaged");
  await assert.rejects(f.run("apply", "--release", release.release), /backup is damaged/);
  assert.equal(await f.content(), base);
});

test("pending interrupted apply blocks mutations and undo restores mixed before/after files", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  const applied = await f.run("apply", "--release", release.release);
  const receipt = JSON.parse(await fs.readFile(path.join(f.state, "local-transactions", applied.transaction, "transaction.json"), "utf8"));
  const registry = await f.registry();
  registry.local = { ...receipt.beforeLocal, pendingTransaction: receipt.id };
  await write(path.join(f.state, "registry.json"), registry);
  await restoreFile(f.root, receipt.changes[0].path, receipt.changes[0].before, f.state);
  await assert.rejects(f.run("update", await f.version("2.0.0")), /needs recovery/);
  await assert.rejects(f.run("prune", "--dry-run"), /needs recovery/);
  await f.run("undo");
  assert.equal(await f.content(), base);
  assert.equal((await f.registry()).local.pendingTransaction, null);
});

test("interrupted apply rolls back source files and the local pointer", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  const host = await loadHost(f.root);
  const controller = new AbortController();
  const watcher = watch(f.root, { recursive: true }, (_, filename) => { if (filename?.includes(".plugin-")) controller.abort(); });
  try { await assert.rejects(applyLocal(host, release.release, {}, controller.signal), /interrupted/); }
  finally { watcher.close(); }
  assert.equal(await f.content(), base);
  assert.equal((await f.registry()).local.appliedRelease, null);
  assert.equal((await f.registry()).local.pendingTransaction, null);
});

test("another project cannot use a local release/state directory", async (t) => {
  const f = await localFixture(t);
  const release = await f.run("install", await f.version());
  const other = await fixture(t);
  await assert.rejects(other.run("apply", "--release", release.release, "--state-dir", f.state), /another project/);
});

test("dependency source application does not run dependency commands in the checkout", async (t) => {
  const f = await localFixture(t);
  const source = await f.version();
  await write(path.join(source, "package.json"), { dependencies: { "fixture-dependency": "1.0.0" } });
  const originalMode = (await fs.stat(path.join(f.root, "package.json"))).mode;
  const release = await f.run("install", source);
  const applied = await f.run("apply", "--release", release.release);
  assert.equal(applied.dependencyInstallRequired, true);
  assert.ok(applied.nextCommand);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.root, "package.json"), "utf8")).dependencies["fixture-dependency"], "1.0.0");
  assert.equal((await fs.stat(path.join(f.root, "package.json"))).mode, originalMode);
  await assert.rejects(fs.access(path.join(f.root, "events.log")), { code: "ENOENT" });
  const undone = await f.run("undo");
  assert.equal(undone.dependencyInstallRequired, true);
  assert.ok(undone.nextCommand);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.root, "package.json"), "utf8")).dependencies, undefined);
});

test("default dependency follow-up uses ci with a lockfile and install when undo removes it", async (t) => {
  const f = await localFixture(t);
  delete f.config.commands["host.dependencies"];
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const release = await f.run("install", await f.version());
  assert.equal((await f.run("apply", "--release", release.release, "--dry-run")).nextCommand, "npm ci --include=dev");
  assert.equal((await f.run("apply", "--release", release.release)).nextCommand, "npm ci --include=dev");
  assert.equal((await f.run("undo", "--dry-run")).nextCommand, "npm install --include=dev");
  assert.equal((await f.run("undo")).nextCommand, "npm install --include=dev");
});

test("prune removes old unprotected candidates and preserves cache, jobs and latest source", async (t) => {
  const f = await localFixture(t);
  const first = await f.run("install", await f.version());
  const second = await f.run("update", await f.version("2.0.0"));
  const latest = await f.run("update", await f.version("3.0.0"));
  await write(path.join(f.state, "cache/npm/keep.txt"), "cache");
  const preview = await f.run("prune", "--keep", "1", "--dry-run");
  assert.ok(preview.remove.includes(path.join(f.state, "releases", first.release)));
  await fs.access(path.join(f.state, "releases", first.release));
  await f.run("prune", "--keep", "1");
  for (const old of [first, second]) await assert.rejects(fs.access(path.join(f.state, "releases", old.release)), { code: "ENOENT" });
  await fs.access(path.join(f.state, "releases", latest.release));
  assert.equal(await fs.readFile(path.join(f.state, "cache/npm/keep.txt"), "utf8"), "cache");
  assert.equal((await fs.readdir(path.join(f.state, "jobs"))).length, 3);
  assert.equal(await f.content(), base);
});

test("prune protects locally applied releases and retained undo; truncated undo history stays usable", async (t) => {
  const f = await localFixture(t);
  const first = await f.run("install", await f.version());
  await f.run("apply", "--release", first.release);
  const second = await f.run("update", await f.version("2.0.0"));
  await f.run("apply", "--release", second.release);
  const latest = await f.run("update", await f.version("3.0.0"));
  await f.run("prune", "--keep", "0");
  for (const release of [first, second, latest]) await fs.access(path.join(f.state, "releases", release.release));
  await f.run("undo");
  assert.match(await f.content(), /1\.0\.0/);
  assert.equal((await f.registry()).local.lastTransaction, null);
  await f.run("prune", "--keep", "0", "--dry-run");
});

test("cleanup plans fail safely on missing protected metadata", async (t) => {
  const f = await localFixture(t);
  const first = await f.run("install", await f.version());
  const latest = await f.run("update", await f.version("2.0.0"));
  await write(path.join(f.state, "releases", latest.release, "release.json"), "{broken");
  await assert.rejects(f.run("prune", "--keep", "0"), /Cannot read/);
  await fs.access(path.join(f.state, "releases", first.release));
});

test("pruning nested dependency links never deletes their external target", async (t) => {
  const f = await localFixture(t);
  const old = await f.run("install", await f.version());
  await f.run("update", await f.version("2.0.0"));
  const external = path.join(f.temporary, "external");
  await write(path.join(external, "sentinel.txt"), "preserved");
  await fs.mkdir(path.join(old.directory, "node_modules"));
  await fs.symlink(external, path.join(old.directory, "node_modules/external"), "junction");
  await f.run("prune", "--keep", "0");
  assert.equal(await fs.readFile(path.join(external, "sentinel.txt"), "utf8"), "preserved");
});

test("configuration resolves defaults, env and local values without shipping private settings", async (t) => {
  const f = await localFixture(t);
  f.environment.PLUGIN_PUBLIC_URL = "from-env";
  const source = await f.version("1.0.0", { configuration: {
    public: { defaults: { label: "default", enabled: false }, env: { apiUrl: "PLUGIN_PUBLIC_URL" }, required: ["apiUrl", "enabled"] },
    installer: { required: ["token"] },
  } });
  await write(path.join(f.root, "plugin-config.local.json"), { sample: { public: { apiUrl: "from-local" }, installer: { token: "private-fixture-token" } } });
  const result = await f.run("install", source);
  const config = JSON.parse(await fs.readFile(path.join(result.directory, "src/plugins/sample/config.json"), "utf8"));
  assert.deepEqual(config, { label: "default", enabled: false, apiUrl: "from-local" });
  await assert.rejects(fs.access(path.join(result.directory, "plugin-config.local.json")), { code: "ENOENT" });
  assert.ok(!(await fs.readFile(path.join(f.state, "registry.json"), "utf8")).includes("private-fixture-token"));
  assert.ok(!(await fs.readFile(path.join(f.state, "releases", result.release, "release.json"), "utf8")).includes("private-fixture-token"));
});

test("missing configuration reports names and malformed private JSON never echoes its contents", async (t) => {
  const f = await localFixture(t);
  const source = await f.version("1.0.0", { configuration: { public: { required: ["apiUrl"] } } });
  await assert.rejects(f.run("plan", source), /Missing configuration: sample.public.apiUrl/);
  await write(path.join(f.root, "plugin-config.local.json"), '{"sample":{"installer":{"token":"do-not-print-secret"} trailing');
  await assert.rejects(f.raw("status"), (error) => !error.stderr.includes("do-not-print-secret") && error.stderr.includes("Check its JSON syntax"));
});

test("private values are scoped to plugin commands and redacted across output chunks", async (t) => {
  const f = await localFixture(t);
  const secret = 'private-token-"quoted"';
  const source = await f.version("1.0.0", { configuration: { installer: { required: ["token"] } } });
  await write(path.join(f.root, "plugin-config.local.json"), { sample: { installer: { token: secret } } });
  f.config.commands["host.private"] = { executable: "node", args: ["-e", 'const s=JSON.parse(process.env.PLUGIN_INSTALLER_CONFIG); process.stdout.write(s.token.slice(0,5)); setTimeout(() => {process.stdout.write(s.token.slice(5)+"\\n"); process.stderr.write(JSON.stringify(s));}, 5);'] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await fs.appendFile(path.join(f.root, "scripts/build.mjs"), '\nwriteFileSync("build-config.txt", process.env.PLUGIN_INSTALLER_CONFIG || "absent");');
  const file = path.join(source, "instructions.json");
  const workflow = JSON.parse(await fs.readFile(file, "utf8"));
  workflow.steps.splice(2, 0, { id: "private", phase: "integrate", action: "command.run", with: { commandId: "host.private" } });
  await write(file, workflow);
  const raw = await f.raw("install", source);
  assert.ok(!raw.stdout.includes(secret) && !raw.stderr.includes(secret));
  assert.ok(!raw.stderr.includes(JSON.stringify(secret).slice(1, -1)));
  assert.match(raw.stdout, /\[redacted\]/);
  const result = JSON.parse(raw.stdout.slice(raw.stdout.lastIndexOf("\n{\n") + 1));
  assert.equal(await fs.readFile(path.join(result.directory, "build-config.txt"), "utf8"), "absent");
});

test("public configuration changes prevent stale apply and settings survive removal", async (t) => {
  const f = await localFixture(t);
  const source = await f.version("1.0.0", { configuration: { public: { defaults: { label: "first" } } } });
  const initial = await f.run("install", source);
  await write(path.join(f.root, "plugin-config.local.json"), { sample: { public: { label: "second" } } });
  await assert.rejects(f.run("apply", "--release", initial.release), /Public plugin configuration changed/);
  const updated = await f.run("update", source);
  await f.run("apply", "--release", updated.release);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.root, "src/plugins/sample/config.json"), "utf8")).label, "second");
  const removed = await f.run("uninstall", "sample");
  await f.run("apply", "--release", removed.release);
  await fs.access(path.join(f.root, "plugin-config.local.json"));
  await assert.rejects(fs.access(path.join(f.root, "src/plugins/sample/config.json")), { code: "ENOENT" });
});
