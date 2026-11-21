import { createHash, randomUUID } from "node:crypto";
import { fs, path, inside, exists, hashFile, renameFile, ownsHostLock } from "./io.mjs";

export const emptyLocalState = () => ({ appliedRelease: null, lastTransaction: null, pendingTransaction: null, files: {} });
export function requireSettledOperation(registry, host) {
  if (registry.workflow?.pendingOperation && !ownsHostLock(host)) throw new Error("An incomplete plugin operation needs recovery. Run npm run plugins:revert.");
}
export function requireSettledLocalState(registry, host) {
  requireSettledOperation(registry, host);
  if (registry.local?.pendingTransaction) throw new Error("A local source transaction needs recovery. Run plugins undo before another mutation.");
}

export async function sourcePath(root, name) {
  const target = inside(root, name);
  const relative = path.relative(root, target);
  if (!relative) throw new Error("A source operation must name a file, not the project root.");
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    const stat = await fs.lstat(cursor).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
    if (!stat) continue;
    if (stat.isSymbolicLink()) throw new Error(`Linked source path is unsupported: ${name}`);
    if (cursor !== target && !stat.isDirectory()) throw new Error(`Source parent is not a directory: ${name}`);
    if (cursor === target && !stat.isFile()) throw new Error(`Source target is not a regular file: ${name}`);
  }
  return target;
}

export async function missingSourceDirectories(root, files) {
  const missing = new Set();
  for (const name of files) {
    let directory = path.dirname(await sourcePath(root, name));
    while (directory !== root) {
      const stat = await fs.lstat(directory).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
      if (stat) break;
      missing.add(path.relative(root, directory).replaceAll(path.sep, "/"));
      directory = path.dirname(directory);
    }
  }
  return [...missing].sort();
}

export async function pruneSourceDirectories(root, names) {
  const directories = [...new Set(names)].map((name) => {
    const target = inside(root, name);
    if (target === root) throw new Error("Directory cleanup cannot remove the project root.");
    return { name, target };
  }).sort((a, b) => b.target.split(path.sep).length - a.target.split(path.sep).length);
  // Check all paths before removing anything, including parent links/junctions.
  for (const { target } of directories) await sourcePath(root, path.relative(root, path.join(target, ".plugin-directory-check")));
  const removed = [];
  for (const { name, target } of directories) {
    await sourcePath(root, path.relative(root, path.join(target, ".plugin-directory-check")));
    try { await fs.rmdir(target); removed.push(name); }
    catch (error) { if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code)) throw error; }
  }
  return removed;
}

export function blobPath(stateRoot, hash) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid source blob identity.");
  return inside(stateRoot, `blobs/${hash}`);
}

export async function snapshotFile(root, name, stateRoot, store = true) {
  const target = await sourcePath(root, name);
  if (!await exists(target)) return { hash: null, mode: null };
  const content = await fs.readFile(target);
  const hash = createHash("sha256").update(content).digest("hex");
  if (store) {
    const blob = blobPath(stateRoot, hash);
    await fs.mkdir(path.dirname(blob), { recursive: true, mode: 0o700 });
    await fs.writeFile(blob, content, { flag: "wx", mode: 0o600 }).catch(async (error) => {
      if (error.code !== "EEXIST") throw error;
      if (await hashFile(blob) !== hash) throw new Error(`Source backup is damaged: ${name}`);
    });
  }
  return { hash, mode: (await fs.stat(target)).mode & 0o777 };
}

export const sameFileState = (left, right) => left.hash === right.hash && (left.hash === null || left.mode === right.mode);

export async function restoreFile(root, name, state, stateRoot) {
  const target = await sourcePath(root, name);
  if (state.hash === null) {
    if (await exists(target)) await fs.unlink(target);
    return;
  }
  const blob = blobPath(stateRoot, state.hash);
  if (await hashFile(blob) !== state.hash) throw new Error(`Source backup is damaged: ${name}`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await sourcePath(root, name);
  const temporary = path.join(path.dirname(target), `.plugin-${randomUUID()}.tmp`);
  try {
    await fs.copyFile(blob, temporary);
    await fs.chmod(temporary, state.mode);
    await renameFile(temporary, target);
  } finally { await fs.rm(temporary, { force: true }); }
}

export async function restoreCandidateBaseline(host, cwd, registry) {
  requireSettledLocalState(registry, host);
  for (const [name, entry] of Object.entries(registry.local?.files || {})) {
    const actual = await snapshotFile(host.root, name, host.stateRoot, false);
    if (!sameFileState(actual, entry.applied)) throw new Error(`Local managed file was modified: ${name}. Reconcile it before preparing a candidate.`);
  }
  for (const [name, entry] of Object.entries(registry.local?.files || {})) await restoreFile(cwd, name, entry.original, host.stateRoot);
  await pruneSourceDirectories(cwd, registry.local?.directories || []);
}

export function createSourceTracker(host, cwd) {
  const originals = new Map();
  return {
    async capture(name) {
      const relative = path.relative(cwd, inside(cwd, name)).replaceAll(path.sep, "/");
      if (!originals.has(relative)) originals.set(relative, await snapshotFile(cwd, relative, host.stateRoot));
    },
    async finish() {
      const changes = {};
      for (const [name, before] of originals) {
        const after = await snapshotFile(cwd, name, host.stateRoot);
        if (!sameFileState(before, after)) changes[name] = { before, after };
      }
      return { version: 1, projectRoot: host.root, files: changes };
    },
  };
}
