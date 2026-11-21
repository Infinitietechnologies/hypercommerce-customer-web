import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";

export { fs, path };

export async function renameFile(source, destination) {
  for (let attempt = 0; ; attempt++) {
    try { await fs.rename(source, destination); return; }
    catch (error) {
      if (process.platform !== "win32" || !["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt >= 6) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
}

export async function exists(file) {
  try { await fs.access(file); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

export async function readJson(file, fallback) {
  try { return JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "")); }
  catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw new Error(`Cannot read ${file}: ${error.message}`, { cause: error });
  }
}

export async function writeJson(file, data, { mode = 0o600 } = {}) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode });
    await renameFile(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

// Destination containment is an execution boundary, not the deferred package audit.
export function inside(root, name) {
  const target = path.resolve(root, name);
  const relative = path.relative(root, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path escapes its destination: ${name}`);
  }
  return target;
}

export async function canonicalPath(file) {
  let ancestor = path.resolve(file);
  const missing = [];
  for (;;) {
    try { return path.join(await fs.realpath(ancestor), ...missing.reverse()); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.push(path.basename(ancestor));
      ancestor = parent;
    }
  }
}

export function hashValue(value) {
  return createHash("sha256").update(JSON.stringify(value) ?? "undefined").digest("hex");
}

export function isIdentifier(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]*$/i.test(value);
}

export function identifier(value) {
  if (!isIdentifier(value)) {
    throw new Error("A plugin/release ID must contain letters, numbers, dots, underscores or hyphens.");
  }
  return value;
}

export async function hashFile(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export async function files(root, prefix = "", options = {}) {
  const result = [];
  for (const entry of (await fs.readdir(inside(root, prefix), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(prefix, entry.name);
    if (options.excluded?.includes(relative.split(path.sep)[0])) continue;
    if (options.excludeEnvironment && /^\.env(?:\.|$)/.test(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Linked files are unsupported: ${relative}`);
    if (entry.isDirectory()) result.push(...await files(root, relative, options));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Unsupported file type: ${relative}`);
  }
  return result;
}

export async function treeHash(root, options = {}) {
  const hash = createHash("sha256");
  for (const file of await files(root, "", options)) hash.update(`${file.replaceAll(path.sep, "/")}\0${await hashFile(inside(root, file))}\0`);
  return hash.digest("hex");
}

export async function copyTree(source, destination, excluded = [], { excludeEnvironment = false } = {}) {
  const ignored = new Set(excluded);
  await fs.cp(source, destination, {
    recursive: true, force: false, errorOnExist: true,
    filter: async (entry) => {
      const relative = path.relative(source, entry);
      if (ignored.has(relative.split(path.sep)[0])) return false;
      if (excludeEnvironment && /^\.env(?:\.|$)/.test(path.basename(entry))) return false;
      if ((await fs.lstat(entry)).isSymbolicLink()) throw new Error(`Linked files are unsupported: ${entry}`);
      return true;
    },
  });
}

export async function acquireLock(stateRoot) {
  await fs.mkdir(stateRoot, { recursive: true, mode: 0o700 });
  const file = inside(stateRoot, "install.lock");
  const handle = await fs.open(file, "wx").catch((error) => {
    if (error.code === "EEXIST") throw new Error(`Another job owns ${file}. After an interrupted job, confirm its recorded PID has exited before removing this lock.`);
    throw error;
  });
  await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  return async () => { await handle.close(); await fs.unlink(file); };
}

// Only an orchestrator that acquired the filesystem lock can reuse it internally.
const lockedHosts = new WeakSet();
export const ownsHostLock = (host) => Boolean(host && lockedHosts.has(host));
export const acquireHostLock = (host) => ownsHostLock(host) ? Promise.resolve(async () => {}) : acquireLock(host.stateRoot);
export async function withHostLock(host, run) {
  const unlock = await acquireLock(host.stateRoot);
  lockedHosts.add(host);
  try { return await run(); }
  finally { lockedHosts.delete(host); await unlock(); }
}

async function npmExecutable() {
  const candidates = [process.env.npm_execpath,
    path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")];
  for (const directory of (process.env.PATH || "").split(path.delimiter)) {
    candidates.push(path.join(directory, "node_modules/npm/bin/npm-cli.js"));
    const executable = path.join(directory, "npm");
    if (await exists(executable)) candidates.push(await fs.realpath(executable));
  }
  for (const candidate of candidates) {
    if (candidate && /npm-cli\.js$/.test(candidate) && await exists(candidate)) return candidate;
  }
  throw new Error("Cannot locate npm-cli.js. Start this tool with npm run plugins.");
}

function redactStream(stream, destination, values) {
  const secrets = [...new Set(values)].filter(Boolean).sort((a, b) => b.length - a.length);
  const decoder = new StringDecoder("utf8");
  let buffer = "";
  const flush = (final = false) => {
    let output = "";
    let index = 0;
    while (index < buffer.length) {
      const remainder = buffer.slice(index);
      if (!final && secrets.some((secret) => secret.length > remainder.length && secret.startsWith(remainder))) break;
      const matched = secrets.find((secret) => remainder.startsWith(secret));
      if (matched) { output += "[redacted]"; index += matched.length; }
      else output += buffer[index++];
    }
    buffer = buffer.slice(index);
    if (output) destination.write(output);
  };
  stream.on("data", (data) => { buffer += decoder.write(data); flush(); });
  stream.on("end", () => { buffer += decoder.end(); flush(true); });
}

export async function execute(command, context, signal) {
  let executable = command.executable || process.execPath;
  let args = command.args || [];
  if (command.npmScript || command.npmArgs) {
    executable = process.execPath;
    args = [await npmExecutable(), ...(command.npmArgs || ["run", command.npmScript])];
  } else if (executable === "node") executable = process.execPath;
  if (!Array.isArray(args) || !args.every((arg) => typeof arg === "string")) throw new Error("Command args must be a string array.");
  const timeoutMs = Math.min(command.timeoutMs ?? 30 * 60_000, 60 * 60_000);
  if (!(timeoutMs > 0)) throw new Error("Command timeout must be positive.");
  if (signal?.aborted) throw new Error("Job interrupted.");
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: context.cwd, env: { ...process.env, ...context.env, ...command.env },
      shell: false, windowsHide: true, detached: process.platform !== "win32",
      stdio: context.redactions?.length ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    });
    if (context.redactions?.length) {
      redactStream(child.stdout, process.stdout, context.redactions);
      redactStream(child.stderr, process.stderr, context.redactions);
    }
    let failure;
    const stop = (message) => {
      if (failure) return;
      failure = new Error(message);
      if (!child.pid) return;
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore", shell: false });
        killer.on("error", () => child.kill());
        killer.on("close", (code) => { if (code !== 0) child.kill(); });
      } else {
        try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
      }
    };
    const timer = setTimeout(() => stop(`Command timed out after ${timeoutMs}ms.`), timeoutMs);
    const abort = () => stop("Job interrupted.");
    signal?.addEventListener("abort", abort, { once: true });
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); };
    child.once("error", (error) => { cleanup(); reject(error); });
    child.once("close", (code, killedBy) => {
      cleanup();
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`Command failed (${killedBy || code}).`));
      else resolve();
    });
  });
}
