import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { promisify } from "node:util";

export const exec = promisify(execFile);
export const cli = fileURLToPath(new URL("../../scripts/plugin-system/plugins.mjs", import.meta.url));
export const write = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, typeof value === "string" ? value : JSON.stringify(value));
};

export async function fixture(t, profile = "pages-export") {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "hyperlocal-plugin-cli-"));
  const root = path.join(temporary, "host");
  const state = `${root}-plugin-state`;
  t.after(async () => {
    const resolved = path.resolve(temporary);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("hyperlocal-plugin-cli-"));
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 4, retryDelay: 50 });
  });
  const router = profile.split("-")[0];
  await fs.mkdir(path.join(root, "src", router), { recursive: true });
  await fs.mkdir(path.join(root, "plugins"));
  await write(path.join(root, "package.json"), { name: "plugin-fixture", version: "1.0.0", type: "module", scripts: { build: "node scripts/build.mjs" } });
  const config = { profile, commands: {
    "host.dependencies": { executable: "node", args: ["scripts/dependencies.mjs"] },
    "host.build": { executable: "node", args: ["scripts/build.mjs"] },
  } };
  await write(path.join(root, "plugin-host.json"), config);
  await write(path.join(root, "scripts/dependencies.mjs"), 'import { appendFileSync } from "node:fs"; appendFileSync("events.log", "dependencies\\n");');
  await write(path.join(root, "scripts/build.mjs"), 'import { appendFileSync, writeFileSync } from "node:fs"; if(process.env.FAIL_BUILD) process.exit(7); appendFileSync("events.log", "build\\n"); writeFileSync("built-mode.txt", process.env.NEXT_PUBLIC_SSR);');
  const environment = { ...process.env };
  delete environment.NEXT_PUBLIC_SSR;
  const execution = { timeoutMs: 120_000 };
  const raw = async (...args) => {
    try { return await exec(process.execPath, [cli, ...args, "--root", root], { timeout: execution.timeoutMs, maxBuffer: 1024 * 1024, env: environment }); }
    catch (error) { error.message += `\nFixture stdout:\n${error.stdout || ""}\nFixture stderr:\n${error.stderr || ""}`; throw error; }
  };
  const run = async (...args) => {
    const result = await raw(...args);
    return JSON.parse(result.stdout.slice(result.stdout.lastIndexOf("\n{\n") + 1));
  };
  const packageAt = async (id = "sample", version = "1.0.0", extra = {}) => {
    const directory = path.join(temporary, `${id}-${version}`);
    await write(path.join(directory, "plugin.json"), { id, version, contributions: { routes: [{ path: `/${id}`, entry: "src/Page.tsx" }] }, ...extra });
    await write(path.join(directory, "src/Page.tsx"), "export default function Page() { return null; }\n");
    await write(path.join(directory, "instructions.json"), { schemaVersion: 1, steps: [
      { id: "files", phase: "integrate", action: "files.install" },
      { id: "register", phase: "integrate", action: "contributions.register", dependsOn: ["files"] },
      { id: "dependencies", phase: "dependencies", action: "dependencies.ensure" },
      { id: "build", phase: "build", action: "command.run", with: { commandId: "host.build" } },
    ] });
    return directory;
  };
  return { temporary, root, state, config, environment, execution, raw, run, packageAt };
}

export async function serveNext(cwd, nextBinary) {
  const lease = createServer();
  await new Promise((resolve, reject) => { lease.once("error", reject); lease.listen(0, "127.0.0.1", resolve); });
  const port = lease.address().port;
  await new Promise((resolve) => lease.close(resolve));
  const child = spawn(process.execPath, [nextBinary, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd, env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
    windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let spawnError;
  child.stdout.on("data", (data) => { output = (output + data).slice(-20_000); });
  child.stderr.on("data", (data) => { output = (output + data).slice(-20_000); });
  child.on("error", (error) => { spawnError = error; });
  const closed = new Promise((resolve) => child.once("close", resolve));
  const stop = async () => {
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      if (process.platform === "win32") await exec("taskkill", ["/PID", String(child.pid), "/T", "/F"], { timeout: 5000, windowsHide: true }).catch(() => child.kill());
      else { try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill(); } }
    }
    await closed;
  };
  const baseURL = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (spawnError || child.exitCode !== null) throw new Error(`Next.js server failed: ${spawnError?.message || output}`);
      try { await fetch(`${baseURL}/client`, { signal: AbortSignal.timeout(1000) }); return { baseURL, stop }; }
      catch { await new Promise((resolve) => setTimeout(resolve, 50)); }
    }
    throw new Error(`Next.js server startup timed out: ${output}`);
  } catch (error) { await stop(); throw error; }
}
