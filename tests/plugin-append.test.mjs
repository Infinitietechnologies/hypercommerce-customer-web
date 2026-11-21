import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fixture, write } from "./helpers/plugin-fixture.mjs";

const original = "// Existing API module\n// PLUGIN_API_EXPORTS\nexport const existingApi = true;\n";
const target = "src/routes/api.ts";
const defaultRule = { id: "api-export", target, source: "rules/api.txt", position: "after", anchor: "// PLUGIN_API_EXPORTS" };
async function appendFixture(t, rules = [defaultRule]) {
  const f = await fixture(t);
  await write(path.join(f.root, target), original);
  await write(path.join(f.root, "src/routes/unrelated.ts"), original);
  const version = async (number = "1.0.0", snippet = "export const pluginApi = true;", pluginId = "sample") => {
    const source = await f.packageAt(pluginId, number, { appendRules: { api: "rules/api.json" } });
    await write(path.join(source, "rules/api.json"), { schemaVersion: 1, rules });
    await write(path.join(source, "rules/api.txt"), snippet);
    const file = path.join(source, "instructions.json");
    const workflow = JSON.parse(await fs.readFile(file, "utf8"));
    workflow.steps.splice(1, 0, { id: "append-api", phase: "integrate", action: "files.append", with: { rulesRef: "api" } });
    await write(file, workflow);
    return source;
  };
  return { ...f, version, source: await version() };
}

test("append plans name rule files and exact targets without editing the project", async (t) => {
  const f = await appendFixture(t);
  const plan = await f.run("plan", f.source);
  assert.equal(plan.plugins[0].appendRules[0].file, "rules/api.json");
  assert.equal(plan.plugins[0].appendRules[0].rules[0].target, target);
  assert.equal(await fs.readFile(path.join(f.root, target), "utf8"), original);
  await assert.rejects(fs.access(f.state), { code: "ENOENT" });
});

for (const position of ["start", "before", "after", "end"]) {
  test(`append ${position} preserves unrelated files and existing source`, async (t) => {
    const rule = { ...defaultRule, position };
    if (["start", "end"].includes(position)) delete rule.anchor;
    const f = await appendFixture(t, [rule]);
    const result = await f.run("install", f.source);
    const content = await fs.readFile(path.join(result.directory, target), "utf8");
    assert.match(content, /pluginApi/);
    if (["start", "before"].includes(position)) assert.ok(content.indexOf("pluginApi") < content.indexOf(defaultRule.anchor));
    else assert.ok(content.indexOf("pluginApi") > content.indexOf(defaultRule.anchor));
    assert.equal(await fs.readFile(path.join(result.directory, "src/routes/unrelated.ts"), "utf8"), original);
    assert.equal(await fs.readFile(path.join(f.root, target), "utf8"), original);
  });
}

test("repeating an identical managed rule does not duplicate additions", async (t) => {
  const f = await appendFixture(t);
  const file = path.join(f.source, "instructions.json");
  const workflow = JSON.parse(await fs.readFile(file, "utf8"));
  workflow.steps.splice(2, 0, { ...workflow.steps[1], id: "append-again" });
  await write(file, workflow);
  const result = await f.run("install", f.source);
  assert.equal((await fs.readFile(path.join(result.directory, target), "utf8")).split("export const pluginApi").length, 2);
  const job = JSON.parse(await fs.readFile(path.join(f.state, "jobs", `${result.release}.json`), "utf8"));
  assert.equal(job.steps.find((step) => step.id === "append-again").files[0].status, "unchanged");
});

test("CRLF targets retain their newline style with LF snippets", async (t) => {
  const f = await appendFixture(t);
  await fs.writeFile(path.join(f.root, target), original.replaceAll("\n", "\r\n"));
  const result = await f.run("install", f.source);
  assert.doesNotMatch(await fs.readFile(path.join(result.directory, target), "utf8"), /[^\r]\n/);
});

for (const directive of ["use client", "use server", "use strict"]) {
  test(`start insertion preserves the ${directive} directive prologue`, async (t) => {
    const f = await appendFixture(t, [{ ...defaultRule, position: "start", anchor: undefined }]);
    await write(path.join(f.root, target), `\uFEFF// Header\n"${directive}";\n${original}`);
    const result = await f.run("install", f.source);
    const content = await fs.readFile(path.join(result.directory, target), "utf8");
    assert.equal(content.charCodeAt(0), 0xFEFF);
    assert.ok(content.indexOf(`"${directive}";`) < content.indexOf("pluginApi"));
  });
}

for (const position of ["start", "before", "after", "end"]) {
  test(`multiple ${position} additions retain the declared rule order`, async (t) => {
    const rules = ["first", "second", "third"].map((id) => ({ id, target, position, content: `export const ${id} = true;`, ...(["before", "after"].includes(position) ? { anchor: defaultRule.anchor } : {}) }));
    const f = await appendFixture(t, rules);
    const result = await f.run("install", f.source);
    const content = await fs.readFile(path.join(result.directory, target), "utf8");
    assert.ok(content.indexOf("export const first") < content.indexOf("export const second"));
    assert.ok(content.indexOf("export const second") < content.indexOf("export const third"));
  });
}

for (const occurrence of ["first", "last", 2]) {
  test(`an explicit ${occurrence} occurrence selects a repeated anchor`, async (t) => {
    const f = await appendFixture(t, [{ ...defaultRule, occurrence }]);
    await write(path.join(f.root, target), `${defaultRule.anchor}\n// Middle\n${defaultRule.anchor}\n`);
    const result = await f.run("install", f.source);
    const content = await fs.readFile(path.join(result.directory, target), "utf8");
    if (occurrence === "first") assert.ok(content.indexOf("pluginApi") < content.indexOf("// Middle"));
    else assert.ok(content.indexOf("pluginApi") > content.indexOf("// Middle"));
  });
}

for (const scenario of ["missing-anchor", "repeated-anchor", "missing-target", "escaping-target", "control-target", "escaping-snippet", "unknown-position", "mixed-content"] ) {
  test(`append failure ${scenario} leaves source and registry selection unchanged`, async (t) => {
    const rule = { ...defaultRule };
    if (scenario === "missing-anchor") rule.anchor = "NOT_PRESENT";
    if (scenario === "missing-target") rule.target = "src/routes/missing.ts";
    if (scenario === "escaping-target") rule.target = "../outside.ts";
    if (scenario === "control-target") rule.target = "scripts/plugin-system/plugins.mjs";
    if (scenario === "escaping-snippet") rule.source = "../../outside.txt";
    if (scenario === "unknown-position") rule.position = "replace-everything";
    if (scenario === "mixed-content") rule.content = "export const extra = true;";
    const f = await appendFixture(t, [rule]);
    if (scenario === "repeated-anchor") await write(path.join(f.root, target), original + defaultRule.anchor);
    const before = await fs.readFile(path.join(f.root, target), "utf8");
    await assert.rejects(f.run("install", f.source));
    assert.equal(await fs.readFile(path.join(f.root, target), "utf8"), before);
    assert.equal((await f.run("status")).latestRelease, null);
  });
}

test("shared API/storage additions coexist with separate plugin modules", async (t) => {
  const apiTarget = "src/routes/api.mjs";
  const storageTarget = "src/lib/storage.mjs";
  const f = await appendFixture(t);
  await write(path.join(f.root, apiTarget), "export const existing = true;\n");
  await write(path.join(f.root, storageTarget), "// Shared storage helpers\n");
  await write(path.join(f.source, "src/feature.mjs"), 'export const feature = "Separate plugin module";');
  const manifest = JSON.parse(await fs.readFile(path.join(f.source, "plugin.json"), "utf8"));
  manifest.appendRules = { api: "rules/api.json", storage: "rules/storage.json" };
  await write(path.join(f.source, "plugin.json"), manifest);
  await write(path.join(f.source, "rules/api.json"), { rules: [{ id: "register", target: apiTarget, position: "start", content: 'export { feature } from "../plugins/sample/src/feature.mjs";' }] });
  await write(path.join(f.source, "rules/storage.json"), { rules: [
    { id: "save", target: storageTarget, content: 'export function savePlugin(value) { if (typeof window !== "undefined") window.localStorage.setItem("plugin:sample", JSON.stringify(value)); }' },
    { id: "load", target: storageTarget, content: 'export function loadPlugin() { if (typeof window === "undefined") return null; const value = window.localStorage.getItem("plugin:sample"); return value ? JSON.parse(value) : null; }' },
  ] });
  const file = path.join(f.source, "instructions.json");
  const workflow = JSON.parse(await fs.readFile(file, "utf8"));
  workflow.steps[1].with = { rulesRefs: ["api", "storage"] };
  await write(file, workflow);
  const result = await f.run("install", f.source);
  assert.equal((await import(pathToFileURL(path.join(result.directory, apiTarget)).href)).feature, "Separate plugin module");
  const storage = await import(pathToFileURL(path.join(result.directory, storageTarget)).href);
  assert.equal(storage.loadPlugin(), null);
  assert.doesNotThrow(() => storage.savePlugin({ onServer: true }));
  const oldWindow = globalThis.window;
  const saved = new Map();
  try {
    globalThis.window = { localStorage: { setItem: (key, value) => saved.set(key, value), getItem: (key) => saved.get(key) ?? null } };
    storage.savePlugin({ enabled: true });
    assert.deepEqual(storage.loadPlugin(), { enabled: true });
    assert.ok(saved.has("plugin:sample"));
  } finally { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; }
});

test("append-only packages need no src directory or standalone-file operation", async (t) => {
  const f = await appendFixture(t);
  const source = path.join(f.temporary, "append-only");
  await write(path.join(source, "plugin.json"), { id: "append-only", version: "1.0.0", appendRules: { api: "rules.json" } });
  await write(path.join(source, "instructions.json"), { steps: [{ id: "append", phase: "integrate", action: "files.append", with: { rulesRef: "api" } }] });
  await write(path.join(source, "rules.json"), { rules: [{ id: "api", target, content: "export const appendOnly = true;" }] });
  const result = await f.run("install", source);
  assert.match(await fs.readFile(path.join(result.directory, target), "utf8"), /appendOnly/);
});

test("updates, disabling and uninstalling rebuild only the selected additions", async (t) => {
  const f = await appendFixture(t);
  await f.run("install", f.source);
  const result = await f.run("update", await f.version("2.0.0", "export const newPluginApi = true;"));
  const content = await fs.readFile(path.join(result.directory, target), "utf8");
  assert.match(content, /newPluginApi/);
  assert.doesNotMatch(content, /export const pluginApi/);
  const disabled = await f.run("disable", "sample");
  assert.equal(await fs.readFile(path.join(disabled.directory, target), "utf8"), original);
  await f.run("enable", "sample");
  const removed = await f.run("uninstall", "sample");
  assert.equal(await fs.readFile(path.join(removed.directory, target), "utf8"), original);
});

test("several plugins can append to one file and retain correct ownership", async (t) => {
  const f = await appendFixture(t);
  const other = await f.version("1.0.0", "export const otherApi = true;", "other");
  const result = await f.run("install", f.source, other);
  assert.match(await fs.readFile(path.join(result.directory, target), "utf8"), /otherApi/);
  const disabled = await f.run("disable", "sample");
  const content = await fs.readFile(path.join(disabled.directory, target), "utf8");
  assert.match(content, /otherApi/);
  assert.doesNotMatch(content, /export const pluginApi/);
});

test("locally customized appended files are preserved on update", async (t) => {
  const f = await appendFixture(t);
  const result = await f.run("install", f.source);
  const file = path.join(result.directory, target);
  await fs.appendFile(file, "// Local customization\n");
  await assert.rejects(f.run("update", await f.version("2.0.0")), /locally modified/);
  assert.match(await fs.readFile(file, "utf8"), /Local customization/);
});

test("separate rule files may reuse rule IDs while preserving insertion order", async (t) => {
  const f = await appendFixture(t);
  const manifest = JSON.parse(await fs.readFile(path.join(f.source, "plugin.json"), "utf8"));
  manifest.appendRules.extra = "rules/extra.json";
  await write(path.join(f.source, "plugin.json"), manifest);
  await write(path.join(f.source, "rules/extra.json"), { rules: [{ ...defaultRule, source: undefined, content: "export const secondApi = true;" }] });
  const file = path.join(f.source, "instructions.json");
  const workflow = JSON.parse(await fs.readFile(file, "utf8"));
  workflow.steps[1].with = { rulesRefs: ["api", "extra"] };
  await write(file, workflow);
  const result = await f.run("install", f.source);
  const content = await fs.readFile(path.join(result.directory, target), "utf8");
  assert.ok(content.indexOf("export const pluginApi") < content.indexOf("export const secondApi"));
});

test("JSX blocks can be inserted into an existing component", async (t) => {
  const panel = "src/components/Panel.tsx";
  const f = await appendFixture(t, [{ id: "panel", target: panel, commentStyle: "jsx", position: "after", anchor: "{/* PLUGINS */}", content: "<span>Plugin result</span>" }]);
  await write(path.join(f.root, panel), "export default function Panel() { return <section>{/* PLUGINS */}</section>; }");
  const result = await f.run("install", f.source);
  assert.match(await fs.readFile(path.join(result.directory, panel), "utf8"), /\{\/\* hyperlocal-plugin:sample:api:panel:start \*\/\}/);
});

test("rule conditions can skip files belonging to a different router", async (t) => {
  const f = await appendFixture(t, [{ ...defaultRule, target: "src/app/not-present.ts", when: { router: "app" } }]);
  const result = await f.run("install", f.source);
  assert.equal(await fs.readFile(path.join(result.directory, target), "utf8"), original);
});

test("all rule files resolve before any selected file is written", async (t) => {
  const f = await appendFixture(t, [
    { ...defaultRule, id: "first" },
    { ...defaultRule, id: "invalid", anchor: "MISSING_ANCHOR" },
  ]);
  await assert.rejects(f.run("install", f.source), /Append anchor/);
  const jobNames = await fs.readdir(path.join(f.state, "jobs"));
  const job = JSON.parse(await fs.readFile(path.join(f.state, "jobs", jobNames[0]), "utf8"));
  assert.equal(await fs.readFile(path.join(f.state, job.directory, target), "utf8"), original);
});

test("an optional host appendTargets list restricts selected shared files", async (t) => {
  const f = await appendFixture(t);
  f.config.appendTargets = ["src/routes/unrelated.ts"];
  await write(path.join(f.root, "plugin-host.json"), f.config);
  await assert.rejects(f.run("install", f.source), /appendTargets/);
});

test("Windows case aliases for a shared file retain every addition", { skip: process.platform !== "win32" }, async (t) => {
  const f = await appendFixture(t, [
    { id: "first", target, content: "export const firstApi = true;" },
    { id: "second", target: "src/routes/API.ts", content: "export const secondApi = true;" },
  ]);
  const result = await f.run("install", f.source);
  const content = await fs.readFile(path.join(result.directory, target), "utf8");
  assert.match(content, /firstApi/);
  assert.match(content, /secondApi/);
});
