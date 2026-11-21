import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fixture, write, exec } from "./helpers/plugin-fixture.mjs";
import { restoreFile, missingSourceDirectories, pruneSourceDirectories } from "../scripts/plugin-system/source-state.mjs";

async function setup(t, profile) {
  const f = await fixture(t, profile);
  const input = async (id = "sample", version = "1.0.0", extra = {}) => {
    const source = await f.packageAt(id, version, extra);
    const destination = path.join(f.root, "plugins", id);
    await fs.cp(source, destination, { recursive: true });
    return destination;
  };
  const registry = () => fs.readFile(path.join(f.state, "registry.json"), "utf8").then(JSON.parse);
  const simple = (action, ...args) => f.run(action === "install" ? "install-all" : action === "uninstall" ? "uninstall-all" : action, ...args, "--json");
  const route = (id) => path.join(f.root, "src", profile?.startsWith("app") ? "app" : "pages", id, profile?.startsWith("app") ? "page.tsx" : "index.tsx");
  return { ...f, input, registry, simple, route };
}

test("simple install discovers packages, applies them, and skips unchanged packages without replacing revert", async (t) => {
  const f = await setup(t);
  const input = await f.input();
  const preview = await f.simple("install", "--dry-run");
  assert.equal(preview.status, "planned");
  await assert.rejects(fs.access(f.state), { code: "ENOENT" });
  assert.equal((await f.simple("install")).installed, 1);
  await fs.access(f.route("sample"));
  const before = await f.registry();
  await write(path.join(input, ".env.private"), "FAKE_TOKEN=excluded");
  await write(path.join(input, "node_modules/ignored.txt"), "excluded");
  assert.equal((await f.simple("install")).status, "unchanged");
  assert.deepEqual(await f.registry(), before);
  assert.equal((await fs.readdir(path.join(f.state, "operations"))).length, 1);
  assert.equal((await f.simple("revert")).status, "reverted");
});

test("only the latest batch reverts; earlier plugins and unrelated changes survive repeated revert and undo", async (t) => {
  const f = await setup(t);
  await f.input("first");
  await f.simple("install");
  await f.input("second"); await f.input("third");
  assert.equal((await f.simple("install")).installed, 2);
  await fs.appendFile(path.join(f.root, "src/plugins/first/src/Page.tsx"), "// Preserve operator edit\n");
  await write(path.join(f.root, "unrelated.txt"), "Keep");
  const preview = await f.simple("revert", "--dry-run");
  assert.equal(preview.status, "planned");
  await fs.access(f.route("second"));
  assert.equal((await f.simple("revert")).status, "reverted");
  assert.deepEqual(Object.keys((await f.registry()).plugins), ["first"]);
  await fs.access(f.route("first"));
  for (const id of ["second", "third"]) await assert.rejects(fs.access(f.route(id)), { code: "ENOENT" });
  assert.match(await fs.readFile(path.join(f.root, "src/plugins/first/src/Page.tsx"), "utf8"), /Preserve operator edit/);
  assert.equal(await fs.readFile(path.join(f.root, "unrelated.txt"), "utf8"), "Keep");
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
  assert.equal((await f.run("undo", "--json")).status, "nothing-to-revert");
  await fs.access(f.route("first"));
});

test("changed packages update automatically and revert restores the preceding version and registry", async (t) => {
  const f = await setup(t);
  await f.input(); await f.simple("install");
  const before = await f.registry();
  const beforePage = await fs.readFile(path.join(f.root, "src/plugins/sample/src/Page.tsx"));
  const input = await f.input("sample", "2.0.0");
  await write(path.join(input, "src/Page.tsx"), "export default function Page(){return <p>Version two</p>}\n");
  assert.equal((await f.simple("install")).updated, 1);
  assert.equal((await f.registry()).plugins.sample.version, "2.0.0");
  await f.simple("revert");
  const restored = await f.registry();
  assert.deepEqual(restored.plugins, before.plugins);
  assert.equal(restored.latestRelease, before.latestRelease);
  assert.equal(restored.local.appliedRelease, before.local.appliedRelease);
  assert.equal(restored.workflow.revertPoint, null);
  assert.deepEqual(await fs.readFile(path.join(f.root, "src/plugins/sample/src/Page.tsx")), beforePage);
});

test("uninstall all retains inputs, settings and namespace customizations; revert restores installed membership", async (t) => {
  const f = await setup(t);
  await f.input(); await f.simple("install");
  await write(path.join(f.root, "plugin-config.local.json"), { sample: { public: {} } });
  await write(path.join(f.root, "src/plugins/sample/operator.txt"), "Keep");
  assert.equal((await f.simple("uninstall")).removed, 1);
  assert.deepEqual((await f.registry()).plugins, {});
  await assert.rejects(fs.access(f.route("sample")), { code: "ENOENT" });
  for (const file of ["plugins/sample/plugin.json", "plugin-config.local.json", "src/plugins/sample/operator.txt"]) await fs.access(path.join(f.root, file));
  const point = (await f.registry()).workflow.revertPoint;
  assert.equal((await f.simple("uninstall")).status, "unchanged");
  assert.equal((await f.registry()).workflow.revertPoint, point);
  await f.simple("revert");
  assert.ok((await f.registry()).plugins.sample);
  await fs.access(f.route("sample"));
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
});

test("a new successful change unlocks a fresh point after revert", async (t) => {
  const f = await setup(t);
  await f.input(); await f.simple("install"); await f.simple("revert");
  await f.simple("install");
  assert.ok((await f.registry()).workflow.revertPoint);
  await f.simple("revert");
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
});

test("a failed candidate preserves the last successful operation and leaves new files unapplied", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.simple("install");
  const before = await f.registry();
  await f.input("second"); f.environment.FAIL_BUILD = "1";
  await assert.rejects(f.simple("install"), /Command failed/);
  assert.deepEqual(await f.registry(), before);
  await assert.rejects(fs.access(f.route("second")), { code: "ENOENT" });
  await f.simple("revert");
  await assert.rejects(fs.access(f.route("first")), { code: "ENOENT" });
});

test("revert preserves manual edits in affected files and keeps its point for a corrected retry", async (t) => {
  const f = await setup(t);
  await f.input(); await f.simple("install");
  const page = f.route("sample"); const original = await fs.readFile(page);
  await fs.appendFile(page, "// Manual edit\n");
  const point = (await f.registry()).workflow.revertPoint;
  await assert.rejects(f.simple("revert"), /unexpected edit/);
  assert.equal((await f.registry()).workflow.revertPoint, point);
  assert.match(await fs.readFile(page, "utf8"), /Manual edit/);
  await fs.writeFile(page, original);
  assert.equal((await f.simple("revert")).status, "reverted");
});

test("duplicate IDs and linked input folders fail before installing any package", async (t) => {
  const f = await setup(t);
  const input = await f.input();
  const duplicate = path.join(f.root, "plugins/duplicate");
  await fs.cp(input, duplicate, { recursive: true });
  await assert.rejects(f.simple("install"), /Duplicate plugin ID/);
  await assert.rejects(fs.access(f.route("sample")), { code: "ENOENT" });
  // Rename this known fixture input to remove the duplicate without deleting it.
  await fs.rename(duplicate, path.join(f.temporary, "duplicate-input"));
  await fs.symlink(input, path.join(f.root, "plugins/linked"), "junction");
  await assert.rejects(f.simple("install"), /Linked plugin input/);
});

test("discovery leaves previously installed packages whose input folder was removed intact", async (t) => {
  const f = await setup(t);
  const input = await f.input("first"); await f.simple("install");
  await fs.rename(input, path.join(f.temporary, "removed-input"));
  await f.input("second"); await f.simple("install");
  assert.deepEqual(Object.keys((await f.registry()).plugins).sort(), ["first", "second"]);
  await f.simple("revert");
  await fs.access(f.route("first"));
});

test("discovered disabled plugins are re-enabled by simple install", async (t) => {
  const f = await setup(t);
  const input = await f.input();
  await f.run("install", input);
  await f.run("disable", "sample");
  assert.equal((await f.simple("install")).enabled, 1);
  assert.equal((await f.registry()).plugins.sample.enabled, true);
  await fs.access(f.route("sample"));
});

test("public setting changes rebuild unchanged packages and remain operator-owned on revert", async (t) => {
  const f = await setup(t);
  await f.input("sample", "1.0.0", { configuration: { public: { defaults: { title: "First" } } } });
  await f.simple("install");
  await write(path.join(f.root, "plugin-config.local.json"), { sample: { public: { title: "Second" } } });
  assert.equal((await f.simple("install")).status, "completed");
  assert.equal(JSON.parse(await fs.readFile(path.join(f.root, "src/plugins/sample/config.json"), "utf8")).title, "Second");
  await f.simple("revert");
  assert.equal(JSON.parse(await fs.readFile(path.join(f.root, "src/plugins/sample/config.json"), "utf8")).title, "First");
  assert.match(await fs.readFile(path.join(f.root, "plugin-config.local.json"), "utf8"), /Second/);
});

test("a changed disabled package runs its update instructions and is enabled", async (t) => {
  const f = await setup(t); const initial = await f.input();
  await f.run("install", initial); await f.run("disable", "sample");
  const input = await f.input("sample", "2.0.0");
  const instructions = JSON.parse(await fs.readFile(path.join(input, "instructions.json"), "utf8"));
  instructions.steps.splice(1, 0, { id: "update-hook", phase: "integrate", action: "command.run", with: { commandId: "host.updated" }, when: { operation: "update" } });
  await write(path.join(input, "instructions.json"), instructions);
  f.config.commands["host.updated"] = { executable: "node", args: ["-e", "require('fs').writeFileSync('updated.txt','update ran')"] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const result = await f.simple("install"); assert.equal(result.updated, 1); assert.equal(result.enabled, 1);
  const registry = await f.registry(); assert.equal(registry.plugins.sample.version, "2.0.0");
  assert.equal(await fs.readFile(path.join(f.state, "releases", registry.latestRelease, "app/updated.txt"), "utf8"), "update ran");
});

test("root dependency changes synchronize automatically and revert preserves an absent lockfile", async (t) => {
  const f = await setup(t);
  delete f.config.commands["host.dependencies"];
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const baselinePackage = JSON.parse(await fs.readFile(path.join(f.root, "package.json"), "utf8"));
  baselinePackage.dependencies = { "previous-local-dependency": "file:fixtures/previous" };
  await write(path.join(f.root, "package.json"), baselinePackage);
  await write(path.join(f.root, "fixtures/previous/package.json"), { name: "previous-local-dependency", version: "1.0.0" });
  await write(path.join(f.root, "fixtures/dependency/package.json"), { name: "local-fixture-dependency", version: "1.0.0" });
  const input = await f.input();
  await write(path.join(input, "package.json"), { dependencies: { "local-fixture-dependency": "file:fixtures/dependency" } });
  await f.simple("install");
  await fs.access(path.join(f.root, "node_modules/local-fixture-dependency/package.json"));
  await fs.access(path.join(f.root, "package-lock.json"));
  await f.simple("revert");
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(f.root, "package.json"), "utf8")).dependencies, baselinePackage.dependencies);
  await assert.rejects(fs.access(path.join(f.root, "package-lock.json")), { code: "ENOENT" });
  await assert.rejects(fs.access(path.join(f.root, "node_modules/local-fixture-dependency")), { code: "ENOENT" });
  await fs.access(path.join(f.root, "node_modules/previous-local-dependency/package.json"));
  await fs.access(path.join(f.root, "fixtures/dependency/package.json"));
});

test("revert retry after dependency failure consumes only that point and cannot revert the earlier plugin", async (t) => {
  const f = await setup(t); await f.input("first"); await f.simple("install");
  await write(path.join(f.root, "scripts/dependencies.mjs"), `import fs from 'node:fs'; if(process.cwd()===${JSON.stringify(f.root)} && fs.existsSync('fail-revert')) process.exit(9);`);
  const input = await f.input("second"); await write(path.join(input, "package.json"), { dependencies: { extra: "1.0.0" } });
  await f.simple("install"); const point = (await f.registry()).workflow.revertPoint;
  await write(path.join(f.root, "fail-revert"), "1");
  await assert.rejects(f.simple("revert"), /Recovery is still pending/);
  assert.equal((await f.registry()).workflow.revertPoint, point);
  assert.ok((await f.registry()).workflow.pendingOperation);
  await fs.unlink(path.join(f.root, "fail-revert"));
  assert.equal((await f.simple("revert")).status, "reverted");
  assert.deepEqual(Object.keys((await f.registry()).plugins), ["first"]);
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
  await fs.access(f.route("first"));
});

test("configuration edited while building is re-read before any source apply", async (t) => {
  const f = await setup(t);
  await f.input("sample", "1.0.0", { configuration: { public: { defaults: { title: "Before" } } } });
  await write(path.join(f.root, "scripts/build.mjs"), `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(path.join(f.root, "plugin-config.local.json"))},JSON.stringify({sample:{public:{title:'After'}}}));`);
  await assert.rejects(f.simple("install"), /Public plugin configuration changed/);
  await assert.rejects(fs.access(f.route("sample")), { code: "ENOENT" });
  assert.deepEqual((await f.registry()).plugins, {});
  assert.equal((await f.registry()).workflow.revertPoint, null);
  assert.equal((await f.simple("install")).status, "completed");
});

test("latest revert removes only the latest append blocks in a shared API file", async (t) => {
  const f = await setup(t); const api = path.join(f.root, "src/routes/shared.ts");
  await write(api, "export const hostValue = 1;\n");
  const add = async (id) => {
    const folder = await f.input(id, "1.0.0", { appendRules: { api: "rules.json" } });
    await write(path.join(folder, "rules.json"), { rules: [{ id: "export", target: "src/routes/shared.ts", content: `export const ${id}Value = 1;` }] });
    const instructions = JSON.parse(await fs.readFile(path.join(folder, "instructions.json"), "utf8"));
    instructions.steps.splice(1, 0, { id: "append", phase: "integrate", action: "files.append", with: { rulesRef: "api" } });
    await write(path.join(folder, "instructions.json"), instructions);
  };
  await add("first"); await f.simple("install"); const previous = await fs.readFile(api);
  await add("second"); await f.simple("install"); assert.match(await fs.readFile(api, "utf8"), /secondValue/);
  await f.simple("revert"); assert.deepEqual(await fs.readFile(api), previous);
  await fs.access(f.route("first")); assert.equal((await f.simple("revert")).status, "nothing-to-revert");
});

test("empty commands do not create operation journals or a revert point", async (t) => {
  const f = await setup(t);
  await assert.rejects(f.simple("install", "missing", "--dry-run"), /No valid plugin IDs found/);
  assert.equal((await f.simple("install")).status, "unchanged");
  assert.equal((await f.simple("uninstall")).status, "unchanged");
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
  await assert.rejects(fs.access(path.join(f.state, "operations")), { code: "ENOENT" });
});

test("failed root dependency sync rolls back files and registry and preserves the earlier point", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.simple("install"); const before = await f.registry();
  await write(path.join(f.root, "scripts/dependencies.mjs"), `import fs from 'node:fs'; const root=${JSON.stringify(f.root)}; if(process.cwd()===root && JSON.parse(fs.readFileSync('package.json')).dependencies?.extra) process.exit(9);`);
  const input = await f.input("second"); await write(path.join(input, "package.json"), { dependencies: { extra: "1.0.0" } });
  await assert.rejects(f.simple("install"), /Command failed/);
  assert.deepEqual(await f.registry(), before);
  await fs.access(f.route("first")); await assert.rejects(fs.access(f.route("second")), { code: "ENOENT" });
  await assert.rejects(fs.access(path.dirname(f.route("second"))), { code: "ENOENT" });
  await assert.rejects(fs.access(path.join(f.root, "src/plugins/second")), { code: "ENOENT" });
});

test("pending dependency recovery blocks other mutations and restores the earlier revert point", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.simple("install"); const before = await f.registry();
  await write(path.join(f.root, "fail-dependencies"), "1");
  await write(path.join(f.root, "scripts/dependencies.mjs"), `import fs from 'node:fs'; if(process.cwd()===${JSON.stringify(f.root)} && fs.existsSync('fail-dependencies')) process.exit(9);`);
  const input = await f.input("second"); await write(path.join(input, "package.json"), { dependencies: { extra: "1.0.0" } });
  await assert.rejects(f.simple("install"), /Recovery is pending/);
  assert.ok((await f.registry()).workflow.pendingOperation);
  await assert.rejects(f.simple("install"), /needs recovery/);
  await assert.rejects(f.run("prune"), /needs recovery/);
  await assert.rejects(f.run("disable", "first"), /needs recovery/);
  await fs.unlink(path.join(f.root, "fail-dependencies"));
  assert.equal((await f.simple("revert")).status, "recovered");
  assert.equal((await f.registry()).workflow.revertPoint, before.workflow.revertPoint);
  assert.deepEqual((await f.registry()).plugins, before.plugins);
  await f.simple("revert");
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
});

test("interrupted mixed source state recovers the pending operation without walking older receipts", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.simple("install");
  const prior = await f.registry();
  await f.input("second"); await f.simple("install");
  const registry = await f.registry(); const id = registry.workflow.revertPoint;
  const file = path.join(f.state, "operations", id, "operation.json"); const op = JSON.parse(await fs.readFile(file, "utf8"));
  op.status = "applying"; op.recovery = "rollback";
  const receipt = JSON.parse(await fs.readFile(path.join(f.state, "local-transactions", op.transaction, "transaction.json"), "utf8"));
  registry.workflow = { revertPoint: prior.workflow.revertPoint, pendingOperation: id };
  registry.local = { ...receipt.beforeLocal, pendingTransaction: receipt.id };
  await write(file, op); await write(path.join(f.state, "registry.json"), registry);
  await restoreFile(f.root, receipt.changes[0].path, receipt.changes[0].before, f.state);
  assert.equal((await f.simple("revert")).status, "recovered");
  assert.deepEqual((await f.registry()).plugins, prior.plugins);
  await fs.access(f.route("first")); await assert.rejects(fs.access(f.route("second")), { code: "ENOENT" });
});

test("prune retains the single revert point's full registry and source dependencies", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.simple("install"); const first = await f.registry();
  await f.input("second"); await f.simple("install");
  const latest = await f.registry(); await f.run("prune", "--keep", "0");
  await fs.access(path.join(f.state, "operations", latest.workflow.revertPoint, "operation.json"));
  await assert.rejects(fs.access(path.join(f.state, "operations", first.workflow.revertPoint)), { code: "ENOENT" });
  await f.simple("revert"); await f.run("prune", "--keep", "0");
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
  await fs.access(f.route("first"));
});

test("later detailed mutations cannot make revert cross newer work", async (t) => {
  const f = await setup(t); await f.input(); await f.simple("install");
  await f.run("disable", "sample");
  await assert.rejects(f.simple("revert"), /will not undo an earlier operation/);
  await fs.access(f.route("sample"));
});

test("the exclusive lock covers the entire simple command and status remains readable", async (t) => {
  const f = await setup(t); await f.input();
  const ready = path.join(f.temporary, "build-ready");
  await write(path.join(f.root, "scripts/build.mjs"), `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(ready)},'1'); setTimeout(()=>{},1200);`);
  const running = f.simple("install");
  for (let attempt = 0; attempt < 200; attempt++) { if (await fs.access(ready).then(() => true).catch(() => false)) break; await new Promise((resolve) => setTimeout(resolve, 20)); }
  await fs.access(ready);
  await assert.rejects(f.simple("uninstall"), /Another job owns/);
  assert.ok((await f.run("status")).workflow.pendingOperation);
  await running;
  await assert.rejects(fs.access(path.join(f.state, "install.lock")), { code: "ENOENT" });
});

for (const profile of ["pages-export", "pages-server", "app-export", "app-server"]) {
  test(`simple install/revert keeps the ${profile} adapter`, async (t) => {
    const f = await setup(t, profile); await f.input(); await f.simple("install");
    await fs.access(f.route("sample")); await f.simple("revert");
    await assert.rejects(fs.access(f.route("sample")), { code: "ENOENT" });
    await assert.rejects(fs.access(path.dirname(f.route("sample"))), { code: "ENOENT" });
    await assert.rejects(fs.access(path.join(f.root, "src/plugins/sample")), { code: "ENOENT" });
    await fs.access(path.dirname(path.dirname(f.route("sample"))));
    await fs.access(path.join(f.root, "plugins/sample/plugin.json"));
  });
}

test("uninstall removes generated route, module and asset directories and revert recreates them", async (t) => {
  const f = await setup(t); const input = await f.input();
  await write(path.join(input, "assets/icons/demo.svg"), "<svg/>");
  await f.simple("install");
  const directories = [path.dirname(f.route("sample")), path.join(f.root, "src/plugins/sample"), path.join(f.root, "public/plugins/sample")];
  const before = await f.registry();
  await f.simple("uninstall", "--dry-run");
  for (const directory of directories) await fs.access(directory);
  assert.deepEqual(await f.registry(), before);
  await f.simple("uninstall");
  for (const directory of directories) await assert.rejects(fs.access(directory), { code: "ENOENT" });
  await fs.access(path.join(input, "plugin.json"));
  await f.simple("revert");
  for (const directory of directories) await fs.access(directory);
  assert.equal(await fs.readFile(path.join(f.root, "public/plugins/sample/icons/demo.svg"), "utf8"), "<svg/>");
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
});

test("uninstall preserves pre-existing empty directories and parent folders", async (t) => {
  const f = await setup(t);
  const input = await f.input("sample", "1.0.0", { contributions: { routes: [{ path: "/catalog/sample", entry: "src/Page.tsx" }] } });
  const preexisting = ["src/pages/catalog", "src/plugins/sample/src", "public/plugins"];
  for (const directory of preexisting) await fs.mkdir(path.join(f.root, directory), { recursive: true });
  await write(path.join(input, "assets/image.svg"), "<svg/>");
  await f.simple("install"); await f.simple("uninstall");
  for (const directory of preexisting) await fs.access(path.join(f.root, directory));
  await assert.rejects(fs.access(path.join(f.root, "src/pages/catalog/sample")), { code: "ENOENT" });
  await assert.rejects(fs.access(path.join(f.root, "public/plugins/sample")), { code: "ENOENT" });
});

test("directory cleanup preserves user content inside plugin folders", async (t) => {
  const f = await setup(t); await f.input(); await f.simple("install");
  const kept = ["src/pages/sample/notes.txt", "src/plugins/sample/custom/notes.txt"];
  for (const name of kept) await write(path.join(f.root, name), "Keep operator content");
  await f.simple("uninstall");
  for (const name of kept) assert.equal(await fs.readFile(path.join(f.root, name), "utf8"), "Keep operator content");
  await assert.rejects(fs.access(f.route("sample")), { code: "ENOENT" });
  await assert.rejects(fs.access(path.join(f.root, "src/plugins/sample/src")), { code: "ENOENT" });
  await f.simple("revert");
  await fs.access(f.route("sample"));
  for (const name of kept) await fs.access(path.join(f.root, name));
});

test("an updated route removes obsolete directories and latest revert restores only that update", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.simple("install");
  const input = await f.input("sample", "1.0.0", { contributions: { routes: [{ path: "/old/nested", entry: "src/Page.tsx" }] } });
  await f.simple("install");
  const manifest = path.join(input, "plugin.json");
  const value = JSON.parse(await fs.readFile(manifest, "utf8"));
  value.version = "2.0.0"; value.contributions.routes[0].path = "/new/nested";
  await write(manifest, value); await f.simple("install");
  await assert.rejects(fs.access(path.join(f.root, "src/pages/old")), { code: "ENOENT" });
  await fs.access(path.join(f.root, "src/pages/new/nested/index.tsx"));
  await f.simple("revert");
  await assert.rejects(fs.access(path.join(f.root, "src/pages/new")), { code: "ENOENT" });
  await fs.access(path.join(f.root, "src/pages/old/nested/index.tsx"));
  await fs.access(f.route("first"));
  assert.equal((await f.simple("revert")).status, "nothing-to-revert");
});

test("directory cleanup rejects roots, escaping paths and links before deleting any directory", async (t) => {
  const f = await setup(t);
  await fs.mkdir(path.join(f.root, "empty"));
  await fs.mkdir(path.join(f.temporary, "external"));
  await write(path.join(f.temporary, "external/keep.txt"), "Keep external content");
  await fs.symlink(path.join(f.temporary, "external"), path.join(f.root, "linked"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(pruneSourceDirectories(f.root, ["."]), /project root/);
  await assert.rejects(pruneSourceDirectories(f.root, ["empty", "../external"]), /escapes/);
  await assert.rejects(pruneSourceDirectories(f.root, ["empty", "linked"]), /Linked source path/);
  await assert.rejects(missingSourceDirectories(f.root, ["linked/new/file.mjs"]), /Linked source path/);
  await fs.access(path.join(f.root, "empty"));
  assert.equal(await fs.readFile(path.join(f.temporary, "external/keep.txt"), "utf8"), "Keep external content");
});

test("appending to a plugin-owned file keeps ownership hashes usable for update and uninstall", async (t) => {
  const f = await setup(t);
  const input = await f.input("sample", "1.0.0", { appendRules: { own: "rules/own.json" } });
  await write(path.join(input, "src/own.mjs"), "export const values = [];\n");
  await write(path.join(input, "rules/own.json"), { rules: [{ id: "own", target: "src/plugins/sample/src/own.mjs", content: 'values.push("appended");' }] });
  const instructions = JSON.parse(await fs.readFile(path.join(input, "instructions.json"), "utf8"));
  instructions.steps.splice(1, 0, { id: "append", phase: "integrate", action: "files.append", with: { rulesRef: "own" } });
  await write(path.join(input, "instructions.json"), instructions);
  await f.simple("install");
  const manifest = JSON.parse(await fs.readFile(path.join(input, "plugin.json"), "utf8"));
  manifest.version = "2.0.0"; await write(path.join(input, "plugin.json"), manifest);
  assert.equal((await f.simple("install")).updated, 1);
  assert.equal((await f.simple("uninstall")).removed, 1);
  await assert.rejects(fs.access(path.join(f.root, "src/plugins/sample")), { code: "ENOENT" });
});

for (const router of ["pages", "app"]) {
  test(`root-level ${router} keeps installed modules separate from input packages`, async (t) => {
    const f = await setup(t, `${router}-export`);
    await fs.mkdir(path.join(f.root, router));
    await fs.rmdir(path.join(f.root, "src", router));
    await fs.rmdir(path.join(f.root, "src"));
    const input = await f.input();
    const before = await fs.readFile(path.join(input, "src/Page.tsx"));
    await f.simple("install");
    await fs.access(path.join(f.root, "src/plugins/sample/src/Page.tsx"));
    await fs.access(path.join(f.root, router, "sample", router === "app" ? "page.tsx" : "index.tsx"));
    assert.deepEqual(await fs.readFile(path.join(input, "src/Page.tsx")), before);
    await f.simple("revert");
    await assert.rejects(fs.access(path.join(f.root, router, "sample")), { code: "ENOENT" });
    assert.deepEqual(await fs.readFile(path.join(input, "src/Page.tsx")), before);
  });
}

test("npm shortcuts and normal summaries require no paths or release IDs", async (t) => {
  const f = await setup(t); await f.input();
  const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
  const environment = { ...f.environment, PATH: `${path.dirname(process.execPath)}${path.delimiter}${f.environment.PATH}` };
  const result = await exec(process.execPath, [npm, "run", "plugins:install", "--", "--root", f.root], { env: environment, timeout: 120_000 });
  assert.match(result.stdout, /Plugin install\r?\n\r?\n  Installed {2}1/);
  assert.match(result.stdout, /\[1\] Discovering plugins/);
  const stages = [...result.stdout.matchAll(/^\[(\d+)\] (.+)$/gm)];
  assert.deepEqual(stages.map((stage) => Number(stage[1])), stages.map((_, index) => index + 1));
  for (const stage of ["Preparing an isolated", "sample: files.install", "Installing dependencies in the isolated", "Building the isolated", "Applying plugin changes", "Saving plugin state"]) assert.ok(result.stdout.includes(stage), stage);
  assert.doesNotMatch(result.stdout, /"release"|local-transactions/);
  await fs.access(f.route("sample"));
  const preview = await f.raw("revert", "--dry-run");
  assert.match(preview.stdout, /^Plugin revert preview\r?\n\r?\nRestore the state before the latest operation\./);
  assert.match(preview.stdout, /Files to restore\r?\n  /);
  const reverted = await exec(process.execPath, [npm, "run", "plugins:revert", "--", "--root", f.root], { env: environment, timeout: 120_000 });
  assert.match(reverted.stdout, /Reverted the latest operation/);
  assert.match(reverted.stdout, /\[1\] Checking the latest revert point/);
  assert.match(reverted.stdout, /\[2\] Restoring files/);
  const again = await f.raw("revert"); assert.match(again.stdout, /Nothing available to revert/);
  await exec(process.execPath, [npm, "run", "plugins:install", "--", "--root", f.root], { env: environment, timeout: 120_000 });
  const removed = await exec(process.execPath, [npm, "run", "plugins:uninstall", "--", "--root", f.root], { env: environment, timeout: 120_000 });
  assert.match(removed.stdout, /Plugin uninstall\r?\n\r?\n  Removed {2}1\r?\n\r?\nPackage folders and settings were kept\./);
  assert.match(removed.stdout, /Cleaning up empty plugin folders/);
  await assert.rejects(fs.access(f.route("sample")), { code: "ENOENT" });
});

test("npm shortcuts install and uninstall by manifest ID and list applied plugins", async (t) => {
  const f = await setup(t);
  const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
  const environment = { ...f.environment, PATH: `${path.dirname(process.execPath)}${path.delimiter}${f.environment.PATH}` };
  const shortcut = async (script, ...args) => {
    const { stdout } = await exec(process.execPath, [npm, "run", script, "--", "--root", f.root, ...args], { env: environment, timeout: 120_000 });
    return stdout;
  };
  const api = path.join(f.root, "src/routes/shared.ts");
  await write(api, "export const hostValue = 1;\n");
  for (const id of ["first", "second"]) {
    const folder = await f.input(id, "1.0.0", { appendRules: { api: "rules.json" } });
    await write(path.join(folder, "rules.json"), { rules: [{ id: "value", target: "src/routes/shared.ts", content: `export const ${id}Value = 1;` }] });
    const instructions = JSON.parse(await fs.readFile(path.join(folder, "instructions.json"), "utf8"));
    instructions.steps.splice(1, 0, { id: "append", phase: "integrate", action: "files.append", with: { rulesRef: "api" } });
    await write(path.join(folder, "instructions.json"), instructions);
  }
  const firstFolder = path.join(f.root, "plugins/first package");
  await fs.rename(path.join(f.root, "plugins/first"), firstFolder);
  await write(path.join(f.root, "plugins/broken/plugin.json"), "{");
  assert.match(await shortcut("plugins:list"), /Installed plugins\r?\n\r?\n  None/);
  await assert.rejects(f.raw("install-all", "first package", "--dry-run"), {
    code: 1,
    stdout: "",
    stderr: /The folder "first package" declares the ID "first"\.\r?\n\r?\nAvailable plugin IDs\r?\n  first\r?\n  second\r?\n\r?\nInstall with\r?\n  npm run plugins:install -- first/,
  });
  const preview = await f.simple("install", "first", "--dry-run");
  assert.deepEqual(preview.plan.changes.installed.map(({ id }) => id), ["first"]);
  await assert.rejects(fs.access(f.state), { code: "ENOENT" });
  const duplicate = path.join(f.root, "plugins/duplicate");
  await fs.cp(firstFolder, duplicate, { recursive: true });
  await assert.rejects(f.simple("install", "first"), /Duplicate plugin ID.*Specify the package folder/);
  await assert.rejects(f.registry(), { code: "ENOENT" });
  const folderPreview = await f.simple("install", "./plugins/first package", "--dry-run");
  assert.deepEqual(folderPreview.plan.changes.installed, preview.plan.changes.installed);
  await fs.rename(duplicate, path.join(f.temporary, "duplicate-input"));

  assert.match(await shortcut("plugins:install", "first"), /Plugin install\r?\n\r?\n  Target {2}"first"\r?\n\r?\n  Installed {2}1/);
  await fs.access(f.route("first"));
  await assert.rejects(fs.access(f.route("second")), { code: "ENOENT" });
  const firstOnly = await fs.readFile(api, "utf8");
  assert.match(firstOnly, /firstValue/);
  assert.doesNotMatch(firstOnly, /secondValue/);
  assert.equal((await f.simple("install", "second")).installed, 1);
  assert.match(await shortcut("plugins:list"), /Installed plugins\r?\n\r?\n  ID {6}Version {2}Status\r?\n  first {3}1\.0\.0 {4}enabled\r?\n  second {2}1\.0\.0 {4}enabled/);

  const both = await fs.readFile(api, "utf8");
  const removal = await f.simple("uninstall", "first", "--dry-run");
  assert.deepEqual(removal.plan.changes.removed, ["first"]);
  assert.equal(await fs.readFile(api, "utf8"), both);
  assert.match(await shortcut("plugins:uninstall", "first"), /Removed {2}1/);
  await assert.rejects(fs.access(f.route("first")), { code: "ENOENT" });
  await fs.access(f.route("second"));
  await fs.access(path.join(f.root, "plugins/first package/plugin.json"));
  const secondOnly = await fs.readFile(api, "utf8");
  assert.match(secondOnly, /secondValue/);
  assert.doesNotMatch(secondOnly, /firstValue/);
  assert.deepEqual((await f.run("list", "--json")).plugins, [{ id: "second", version: "1.0.0", enabled: true }]);
  assert.equal((await f.simple("revert")).status, "reverted");
  assert.equal(await fs.readFile(api, "utf8"), both);
  await fs.access(f.route("first"));
});

test("targeted changes use the applied membership even when another release was prepared", async (t) => {
  const f = await setup(t);
  await f.input("first"); await f.input("second");
  await f.simple("install");
  await f.run("uninstall", "second");
  const staged = await f.packageAt("staged");
  await f.run("install", staged);
  const before = await f.registry();
  const listIds = async () => (await f.run("list", "--json")).plugins.map(({ id }) => id);
  assert.deepEqual(await listIds(), ["first", "second"]);
  await assert.rejects(f.raw("uninstall-all", "staged"), {
    code: 1,
    stdout: "",
    stderr: /Plugin is not installed locally: staged\.\r?\n\r?\nInstalled plugin IDs\r?\n  first\r?\n  second\r?\n\r?\nUninstall with\r?\n  npm run plugins:uninstall -- <plugin-id>/,
  });
  await assert.rejects(f.simple("install", staged), /directly inside plugins/);
  await assert.rejects(f.simple("install", "./plugins/missing"), /No plugin.json found/);
  await assert.rejects(f.raw("install-all", "missing"), {
    code: 1,
    stdout: "",
    stderr: /Plugin "missing" not found\.\r?\n\r?\nAvailable plugin IDs\r?\n  first\r?\n  second\r?\n\r?\nInstall with\r?\n  npm run plugins:install -- <plugin-id>/,
  });
  assert.equal((await f.simple("install", "second")).status, "unchanged");
  assert.deepEqual(await f.registry(), before);

  await f.input("third");
  await f.simple("install", "third");
  assert.deepEqual(await listIds(), ["first", "second", "third"]);
  await assert.rejects(fs.access(f.route("staged")), { code: "ENOENT" });
  await f.simple("revert");
  assert.equal((await f.registry()).latestRelease, before.latestRelease);
  await f.simple("uninstall", "second");
  assert.deepEqual(await listIds(), ["first"]);
  await fs.access(f.route("first"));
  for (const id of ["second", "third", "staged"]) await assert.rejects(fs.access(f.route(id)), { code: "ENOENT" });
});

test("slow stages show elapsed progress and failed builds report rollback without polluting JSON mode", async (t) => {
  const f = await setup(t); await f.input();
  await write(path.join(f.root, "scripts/build.mjs"), "setTimeout(() => process.exit(7), 16_000);");
  await assert.rejects(f.raw("install-all"), (error) => {
    assert.match(error.stdout, /Building the isolated app/);
    assert.match(error.stdout, /Step \d+ still running \(15s elapsed\)/);
    assert.match(error.stdout, /Operation failed; rolling back its changes/);
    assert.doesNotMatch(error.stdout, /Plugin install\r?\n\r?\n  Installed/);
    return true;
  });
  await write(path.join(f.root, "scripts/build.mjs"), "process.exit(7);");
  await assert.rejects(f.raw("install-all", "--json"), (error) => {
    assert.doesNotMatch(error.stdout, /\[\d+\]|still running|rolling back/);
    return true;
  });
  assert.deepEqual((await f.registry()).plugins, {});
});
