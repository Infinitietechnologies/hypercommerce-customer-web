import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fixture, write } from "./helpers/plugin-fixture.mjs";
import { execute } from "../scripts/plugin-system/io.mjs";

async function editWorkflow(source, edit) {
  const file = path.join(source, "instructions.json");
  const workflow = JSON.parse(await fs.readFile(file, "utf8"));
  edit(workflow);
  await write(file, workflow);
}

async function waitFor(file, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { await fs.access(file); return; } catch { await new Promise((resolve) => setTimeout(resolve, 25)); }
  }
  throw new Error(`Timed out waiting for ${file}`);
}

for (const args of [["--unknown"], ["--profile"], ["install"], ["update"], ["disable"], ["enable"], ["uninstall"], ["activate"], ["rollback"], ["inspect"], ["init"]]) {
  test(`CLI input failure: ${args.join(" ")} leaves the host untouched`, async (t) => {
    const f = await fixture(t);
    const before = await fs.readFile(path.join(f.root, "package.json"), "utf8");
    await assert.rejects(f.run(...args));
    assert.equal(await fs.readFile(path.join(f.root, "package.json"), "utf8"), before);
    assert.deepEqual(await fs.readdir(path.join(f.root, "plugins")), []);
  });
}

test("JSON files with a UTF-8 BOM can be read and installed", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  for (const name of ["plugin.json", "instructions.json"]) {
    const file = path.join(source, name);
    await fs.writeFile(file, `\uFEFF${await fs.readFile(file, "utf8")}`);
  }
  assert.equal((await f.run("install", source)).status, "prepared");
});

test("malformed input JSON is actionable and never replaces registry state", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  await write(path.join(source, "instructions.json"), "{broken");
  await assert.rejects(f.run("install", source), /Cannot read/);
  assert.equal((await f.run("status")).latestRelease, null);
});

test("automatic profile resolution respects production environment precedence and explicit selection", async (t) => {
  const f = await fixture(t);
  f.config.profile = "auto";
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await write(path.join(f.root, ".env.production.local"), "NEXT_PUBLIC_SSR=true\n");
  await write(path.join(f.root, ".env.local"), "NEXT_PUBLIC_SSR=false\n");
  assert.equal((await f.run("status")).profile, "pages-server");
  f.environment.NEXT_PUBLIC_SSR = "false";
  assert.equal((await f.run("status")).profile, "pages-export");
  assert.equal((await f.run("status", "--profile", "pages-server")).profile, "pages-server");
});

test("HyperCommerce uses static export by default and builds in the configured SSR mode", async (t) => {
  const f = await fixture(t);
  const hostConfig = JSON.parse(await fs.readFile(new URL("../plugin-host.json", import.meta.url), "utf8"));
  await write(path.join(f.root, "plugin-host.json"), { ...hostConfig, commands: f.config.commands });
  await fs.copyFile(new URL("../next.config.ts", import.meta.url), path.join(f.root, "next.config.ts"));
  assert.equal((await f.run("status")).profile, "pages-export");
  const source = await f.packageAt();
  const staticBuild = await f.run("install", source);
  assert.equal(await fs.readFile(path.join(staticBuild.directory, "built-mode.txt"), "utf8"), "false");

  await write(path.join(f.root, ".env.production.local"), "NEXT_PUBLIC_SSR=true\n");
  assert.equal((await f.run("status")).profile, "pages-server");
  const serverBuild = await f.run("update", source);
  assert.equal(await fs.readFile(path.join(serverBuild.directory, "built-mode.txt"), "utf8"), "true");
  assert.equal((await f.run("status", "--profile", "pages-export")).profile, "pages-export");
});

test("commented-out output settings do not change the auto profile", async (t) => {
  const f = await fixture(t);
  f.config.profile = "auto";
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await write(path.join(f.root, "next.config.mjs"), '// output: "export"\nexport default {};');
  assert.equal((await f.run("status")).profile, "pages-server");
  await write(path.join(f.root, "next.config.mjs"), 'const example = \'output: "export"\'; export default {};');
  assert.equal((await f.run("status")).profile, "pages-server");
});

for (const output of ["export", "standalone"]) {
  test(`auto profile reads a quoted static ${output} output declaration`, async (t) => {
    const f = await fixture(t);
    f.config.profile = "auto";
    await write(path.join(f.root, "plugin-host.json"), f.config);
    await write(path.join(f.root, "next.config.mjs"), `export default ${JSON.stringify({ output })};`);
    assert.equal((await f.run("status")).profile, output === "export" ? "pages-export" : "pages-server");
  });
}

test("dynamic output and hybrid routers require explicit profile selection", async (t) => {
  const f = await fixture(t);
  f.config.profile = "auto";
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await write(path.join(f.root, "next.config.mjs"), 'export default { output: process.env.DEPLOY_MODE };');
  await assert.rejects(f.run("status"), /explicit --profile/);
  await fs.mkdir(path.join(f.root, "src/app"));
  await assert.rejects(f.run("status"), /hybrid or ambiguous/);
  assert.equal((await f.run("status", "--profile", "pages-server")).profile, "pages-server");
});

test("root router directories work without a src directory", async (t) => {
  const f = await fixture(t);
  await fs.rename(path.join(f.root, "src/pages"), path.join(f.root, "pages"));
  await fs.rmdir(path.join(f.root, "src"));
  const result = await f.run("install", await f.packageAt());
  await fs.access(path.join(result.directory, "pages/sample/index.tsx"));
  await fs.access(path.join(result.directory, "src/plugins/sample/src/Page.tsx"));
});

test("state storage cannot resolve back into the source tree through a directory junction", async (t) => {
  const f = await fixture(t);
  const alias = path.join(f.temporary, "source-alias");
  await fs.symlink(f.root, alias, "junction");
  await assert.rejects(f.run("status", "--state-dir", alias), /source tree/);
  await assert.rejects(fs.access(path.join(f.root, "install.lock")), { code: "ENOENT" });
});

for (const id of ["constructor", "toString", "hasOwnProperty"]) {
  test(`plugin ID ${id} is treated as an own registry key`, async (t) => {
    const f = await fixture(t);
    const source = await f.packageAt(id);
    assert.equal((await f.run("install", source)).plugins[0].id, id);
    await f.run("disable", id);
    assert.equal((await f.run("status")).plugins[id].enabled, false);
    assert.deepEqual((await f.run("uninstall", id, "--dry-run")).changes.removed, [id]);
  });
}

test("installed identity rules reject duplicate installs and updates to absent IDs", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  await assert.rejects(f.run("update", source), /not installed/);
  await f.run("install", source);
  await assert.rejects(f.run("install", source), /is installed/);
  await assert.rejects(f.run("disable", "absent"), /not installed/);
});

test("inherited object properties are never treated as named host commands", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  await editWorkflow(source, (workflow) => { workflow.steps = [{ id: "unknown", phase: "integrate", action: "command.run", with: { commandId: "toString" } }]; });
  await assert.rejects(f.run("install", source), /Unknown, deferred, or lifecycle-only command/);
});

test("package snapshots omit all root environment files and are independent of the input directory", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  for (const name of [".env", ".env.production", ".env.development.local", ".env.custom"]) await write(path.join(source, name), "PRIVATE_TOKEN=fixture-only\n");
  await f.run("install", source);
  const stored = (await f.run("status")).plugins.sample.packagePath;
  const names = await fs.readdir(path.join(f.state, stored));
  assert.ok(!names.some((name) => name === ".env" || name.startsWith(".env.")));
  await fs.rename(source, `${source}-moved`);
  await f.run("disable", "sample");
  const enabled = await f.run("enable", "sample");
  await fs.access(path.join(enabled.directory, "src/pages/sample/index.tsx"));
});

test("custom mappings preserve binary assets without overwriting checkout files", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt("sample", "1.0.0", { fileMappings: { custom: [{ from: "binary.dat", to: "{assetsRoot}/nested/binary.dat" }] } });
  const bytes = Buffer.from([0, 255, 128, 1, 2]);
  await fs.writeFile(path.join(source, "binary.dat"), bytes);
  await editWorkflow(source, (workflow) => { workflow.steps[0].with = { mappingRef: "custom" }; });
  const result = await f.run("install", source);
  assert.deepEqual(await fs.readFile(path.join(result.directory, "public/plugins/sample/nested/binary.dat")), bytes);
  await assert.rejects(fs.access(path.join(f.root, "public/plugins")), { code: "ENOENT" });
});

test("nested linked package content is rejected before installation", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  const external = path.join(f.temporary, "external");
  await write(path.join(external, "untouched.txt"), "untouched");
  await fs.symlink(external, path.join(source, "src/linked"), "junction");
  await assert.rejects(f.run("install", source), /Linked files are unsupported/);
  assert.equal(await fs.readFile(path.join(external, "untouched.txt"), "utf8"), "untouched");
});

for (const location of ["src/app/sample/page.jsx", "src/app/(group)/sample/page.tsx", "src/pages/sample.tsx"]) {
  test(`route collisions preserve an existing URL at ${location}`, async (t) => {
    const f = await fixture(t, "app-server");
    await write(path.join(f.root, location), "export default function Existing() { return null; }");
    await assert.rejects(f.run("install", await f.packageAt()), /Route already exists/);
    assert.match(await fs.readFile(path.join(f.root, location), "utf8"), /Existing/);
    assert.equal((await f.run("status")).latestRelease, null);
  });
}

test("different dynamic parameter names cannot register the same route shape", async (t) => {
  const f = await fixture(t);
  await write(path.join(f.root, "src/pages/orders/[orderId].tsx"), "export default function Existing() { return null; }");
  const source = await f.packageAt("sample", "1.0.0", { contributions: { routes: [{ path: "/orders/[id]", entry: "src/Page.tsx" }] } });
  await assert.rejects(f.run("install", source), /Route already exists/);
});

test("translation merging preserves existing keys, and update detects customized plugin translations", async (t) => {
  const f = await fixture(t);
  await write(path.join(f.root, "public/locales/en.json"), { checkout: "Checkout" });
  const manifest = { contributions: { translations: [{ locale: "en", from: "en.json" }] } };
  const source = await f.packageAt("sample", "1.0.0", manifest);
  await write(path.join(source, "en.json"), { title: "Original" });
  await editWorkflow(source, (workflow) => workflow.steps.splice(2, 0, { id: "translations", phase: "integrate", action: "translations.merge" }));
  const initial = await f.run("install", source);
  const locale = path.join(initial.directory, "public/locales/en.json");
  const data = JSON.parse(await fs.readFile(locale, "utf8"));
  assert.equal(data.checkout, "Checkout");
  data["plugin:sample"].title = "Customized";
  await write(locale, data);
  const updated = await f.packageAt("sample", "2.0.0", manifest);
  await write(path.join(updated, "en.json"), { title: "New" });
  await assert.rejects(f.run("update", updated), /locally modified/);
  assert.equal(JSON.parse(await fs.readFile(locale, "utf8"))["plugin:sample"].title, "Customized");
});

test("dependency conflicts fail before dependency scripts or registry commit", async (t) => {
  const f = await fixture(t);
  const hostPkg = JSON.parse(await fs.readFile(path.join(f.root, "package.json"), "utf8"));
  hostPkg.dependencies = { react: "19.2.3" };
  await write(path.join(f.root, "package.json"), hostPkg);
  const source = await f.packageAt();
  await write(path.join(source, "package.json"), { dependencies: { react: "18.0.0" } });
  await assert.rejects(f.run("install", source), /Dependency react conflicts/);
  assert.equal((await f.run("status")).latestRelease, null);
});

test("a failed dependency command never runs the build", async (t) => {
  const f = await fixture(t);
  f.config.commands["host.dependencies"] = { executable: "node", args: ["-e", "process.exit(8)"] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await assert.rejects(f.run("install", await f.packageAt()), /Command failed \(8\)/);
  const jobNames = await fs.readdir(path.join(f.state, "jobs"));
  const job = JSON.parse(await fs.readFile(path.join(f.state, "jobs", jobNames[0]), "utf8"));
  assert.ok(!job.steps.some((step) => step.id === "build"));
});

test("skipped prerequisites stop dependent operations", async (t) => {
  const f = await fixture(t);
  const source = await f.packageAt();
  await editWorkflow(source, (workflow) => { workflow.steps[0].when = { router: "app" }; });
  await assert.rejects(f.run("install", source), /Unfinished prerequisite/);
});

for (const commandId of ["host.activate", "host.recover", "host.checkSource", "host.checkOutput", "unknown-command"]) {
  test(`workflow cannot invoke reserved or unknown command ${commandId}`, async (t) => {
    const f = await fixture(t);
    f.config.commands[commandId] = { executable: "node", args: ["-e", "process.exit(0)"] };
    // The unknown command stays unregistered; the others remain reserved even if configured.
    if (commandId === "unknown-command") delete f.config.commands[commandId];
    await write(path.join(f.root, "plugin-host.json"), f.config);
    const source = await f.packageAt();
    await editWorkflow(source, (workflow) => { workflow.steps = [{ id: "unsafe", phase: "integrate", action: "command.run", with: { commandId } }]; });
    await assert.rejects(f.run("install", source), /Unknown, deferred, or lifecycle-only command/);
  });
}

test("simultaneous real jobs serialize changes and permit read-only status", async (t) => {
  const f = await fixture(t);
  const ready = path.join(f.temporary, "ready.txt");
  f.config.commands["host.build"] = { executable: "node", args: ["-e", `require("fs").writeFileSync(${JSON.stringify(ready)}, "ready"); setTimeout(() => {}, 800);`] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const firstSource = await f.packageAt("first");
  const secondSource = await f.packageAt("second");
  const first = f.run("install", firstSource);
  // Attach a rejection handler immediately while the competing job is tested.
  first.catch(() => {});
  await waitFor(ready);
  assert.equal((await f.run("status")).latestRelease, null);
  await assert.rejects(f.run("install", secondSource), /Another job owns/);
  assert.equal((await first).status, "prepared");
  assert.equal((await f.run("install", secondSource)).plugins.length, 2);
});

test("a six-plugin batch builds once and records every successful step", async (t) => {
  const f = await fixture(t);
  const sources = [];
  for (let index = 0; index < 6; index++) sources.push(await f.packageAt(`plugin-${index}`));
  const result = await f.run("install", ...sources);
  assert.equal(result.plugins.length, 6);
  assert.equal(await fs.readFile(path.join(result.directory, "events.log"), "utf8"), "dependencies\nbuild\n");
  const job = JSON.parse(await fs.readFile(path.join(f.state, "jobs", `${result.release}.json`), "utf8"));
  assert.equal(job.steps.filter((step) => step.status === "completed").length, 24);
});

test("updating a disabled plugin retains its state until explicitly enabled", async (t) => {
  const f = await fixture(t);
  await f.run("install", await f.packageAt());
  await f.run("disable", "sample");
  const updated = await f.run("update", await f.packageAt("sample", "2.0.0"));
  assert.equal(updated.plugins[0].enabled, false);
  assert.equal(updated.plugins[0].version, "2.0.0");
  await assert.rejects(fs.access(path.join(updated.directory, "src/pages/sample/index.tsx")), { code: "ENOENT" });
  assert.equal((await f.run("enable", "sample")).plugins[0].version, "2.0.0");
});

test("standalone activation is journalled and a failed activation recovers the previous release", async (t) => {
  const f = await fixture(t);
  const marker = path.join(f.temporary, "activation.log");
  f.config.commands["host.activate"] = { executable: "node", args: ["-e", `if(process.env.FAIL_ACTIVATION && !process.env.PLUGIN_RECOVERY) process.exit(9); require("fs").appendFileSync(${JSON.stringify(marker)}, process.env.PLUGIN_RELEASE_DIR+"\\n");`] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const first = await f.run("install", await f.packageAt());
  await f.run("activate", "--release", first.release);
  assert.equal((await fs.readdir(path.join(f.state, "jobs"))).length, 2);
  const second = await f.run("update", await f.packageAt("sample", "2.0.0"));
  f.config.commands["host.activate"].env = { FAIL_ACTIVATION: "1" };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await assert.rejects(f.run("activate", "--release", second.release), /Command failed \(9\)/);
  assert.equal((await f.run("status")).activeRelease, first.release);
  assert.equal((await fs.readFile(marker, "utf8")).trim().split("\n").at(-1), first.directory);
});

test("failed activation plus failed recovery reports unknown deployment state", async (t) => {
  const f = await fixture(t);
  f.config.commands["host.activate"] = { executable: "node", args: ["-e", "process.exit(0)"] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  const first = await f.run("install", await f.packageAt(), "--activate");
  const second = await f.run("update", await f.packageAt("sample", "2.0.0"));
  f.config.commands["host.activate"] = { executable: "node", args: ["-e", "process.exit(9)"] };
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await assert.rejects(f.run("activate", "--release", second.release), /recovery also failed/);
  const status = await f.run("status");
  assert.equal(status.deploymentState, "unknown");
  assert.equal(status.activeRelease, null);
  assert.equal(status.lastKnownActiveRelease, first.release);
});

test("rollback dry-run changes neither selected release nor history", async (t) => {
  const f = await fixture(t);
  const first = await f.run("install", await f.packageAt());
  const second = await f.run("update", await f.packageAt("sample", "2.0.0"));
  const before = await fs.readFile(path.join(f.state, "registry.json"), "utf8");
  assert.equal((await f.run("rollback", "--release", first.release, "--dry-run")).release, first.release);
  assert.equal(await fs.readFile(path.join(f.state, "registry.json"), "utf8"), before);
  assert.equal((await f.run("status")).latestRelease, second.release);
});

test("corrupted registries are never silently reset", async (t) => {
  const f = await fixture(t);
  const registry = path.join(f.state, "registry.json");
  await write(registry, "{malformed");
  await assert.rejects(f.run("install", await f.packageAt()), /Cannot read/);
  assert.equal(await fs.readFile(registry, "utf8"), "{malformed");
});

test("AbortController interruption stops the command process tree", async (t) => {
  const f = await fixture(t);
  const ready = path.join(f.temporary, "child.pid");
  const controller = new AbortController();
  const promise = execute({ executable: "node", args: ["-e", `require("fs").writeFileSync(${JSON.stringify(ready)}, String(process.pid)); setInterval(() => {}, 1000);`] }, { cwd: f.root }, controller.signal);
  promise.catch(() => {});
  await waitFor(ready);
  const pid = Number(await fs.readFile(ready, "utf8"));
  controller.abort();
  await assert.rejects(promise, /interrupted/);
  assert.throws(() => process.kill(pid, 0), /ESRCH/);
});
