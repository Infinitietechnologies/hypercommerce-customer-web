import { fs, path, inside, exists, readJson, acquireHostLock } from "./io.mjs";
import { readRegistry } from "./releases.mjs";
import { requireSettledLocalState } from "./source-state.mjs";

const releaseId = /^\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{8}$/;

async function entries(host, name) {
  const directory = inside(host.stateRoot, name);
  if (!await exists(directory)) return [];
  if ((await fs.lstat(directory)).isSymbolicLink()) throw new Error(`Linked cleanup namespace is unsupported: ${name}`);
  const result = await fs.readdir(directory, { withFileTypes: true });
  if (result.some((entry) => entry.isSymbolicLink())) throw new Error(`Linked cleanup target in ${name}; resolve it before pruning.`);
  return result;
}

function addFileBlobs(destination, changes) {
  for (const change of Object.values(changes || {})) {
    for (const state of [change.before, change.after, change.original, change.applied]) if (state?.hash) destination.add(state.hash);
  }
}

async function cleanupPlan(host, options) {
  const keep = options.keep === undefined ? 3 : Number(options.keep);
  if (!Number.isSafeInteger(keep) || keep < 0) throw new Error("--keep must be a non-negative integer.");
  const registry = await readRegistry(host);
  requireSettledLocalState(registry, host);
  const releases = (await entries(host, "releases")).filter((entry) => entry.isDirectory() && releaseId.test(entry.name)).map((entry) => entry.name).sort().reverse();
  const transactions = (await entries(host, "local-transactions")).filter((entry) => entry.isDirectory() && releaseId.test(entry.name)).map((entry) => entry.name).sort().reverse();
  const operations = (await entries(host, "operations")).filter((entry) => entry.isDirectory() && releaseId.test(entry.name)).map((entry) => entry.name).sort().reverse();
  const protectedReleases = new Set([registry.latestRelease, registry.activeRelease, registry.lastKnownActiveRelease, registry.local?.appliedRelease].filter(Boolean));
  const retainedTransactions = new Set([...transactions.slice(0, keep), registry.local?.lastTransaction].filter(Boolean));
  const retainedOperations = new Set([...operations.slice(0, keep), registry.workflow?.revertPoint].filter(Boolean));
  const packages = new Set(Object.values(registry.plugins).map((plugin) => plugin.packagePath.replaceAll("\\", "/")));
  const blobs = new Set();
  addFileBlobs(blobs, registry.local?.files);
  for (const id of retainedOperations) {
    const operation = await readJson(inside(host.stateRoot, `operations/${id}/operation.json`));
    if (operation.projectRoot !== host.root) throw new Error("Cleanup operation belongs to another project.");
    if (operation.release) protectedReleases.add(operation.release);
    if (operation.transaction) retainedTransactions.add(operation.transaction);
    for (const snapshot of [operation.beforeRegistry, operation.afterRegistry]) {
      if (!snapshot) continue;
      for (const release of [snapshot.latestRelease, snapshot.activeRelease, snapshot.lastKnownActiveRelease, snapshot.local?.appliedRelease]) if (release) protectedReleases.add(release);
      if (snapshot.local?.lastTransaction) retainedTransactions.add(snapshot.local.lastTransaction);
      for (const item of Object.values(snapshot.plugins)) packages.add(item.packagePath.replaceAll("\\", "/"));
      addFileBlobs(blobs, snapshot.local?.files);
    }
  }
  for (const id of retainedTransactions) {
    const receipt = await readJson(inside(host.stateRoot, `local-transactions/${id}/transaction.json`));
    if (receipt.projectRoot !== host.root) throw new Error("Cleanup transaction belongs to another project.");
    for (const value of [receipt.release, receipt.beforeLocal?.appliedRelease, receipt.afterLocal?.appliedRelease]) if (value) protectedReleases.add(value);
    addFileBlobs(blobs, receipt.changes);
    addFileBlobs(blobs, receipt.beforeLocal?.files);
    addFileBlobs(blobs, receipt.afterLocal?.files);
  }
  const retainedReleases = new Set([...releases.slice(0, keep), ...protectedReleases]);
  for (const id of retainedReleases) {
    const file = inside(host.stateRoot, `releases/${id}/release.json`);
    if (!await exists(file) && !protectedReleases.has(id)) continue; // Failed candidate retained by count.
    const release = await readJson(file);
    if (release.sourceChanges && release.sourceChanges.projectRoot !== host.root) throw new Error("Cleanup release belongs to another project.");
    for (const plugin of Object.values(release.plugins)) packages.add(plugin.packagePath.replaceAll("\\", "/"));
    addFileBlobs(blobs, release.sourceChanges?.files);
  }
  const remove = releases.filter((id) => !retainedReleases.has(id)).map((id) => `releases/${id}`);
  remove.push(...transactions.filter((id) => !retainedTransactions.has(id)).map((id) => `local-transactions/${id}`));
  remove.push(...operations.filter((id) => !retainedOperations.has(id)).map((id) => `operations/${id}`));
  for (const entry of await entries(host, "packages")) {
    if (!entry.isDirectory() || !(/^[a-z0-9][a-z0-9._-]*-[a-f0-9]{64}$/i.test(entry.name) || /^staging-[a-f0-9-]{36}$/.test(entry.name))) continue;
    if (!packages.has(`packages/${entry.name}`)) remove.push(`packages/${entry.name}`);
  }
  for (const entry of await entries(host, "blobs")) if (entry.isFile() && /^[a-f0-9]{64}$/.test(entry.name) && !blobs.has(entry.name)) remove.push(`blobs/${entry.name}`);
  return { status: "planned", keep, protectedReleases: [...protectedReleases], remove: remove.map((name) => inside(host.stateRoot, name)) };
}

export async function pruneState(host, options = {}) {
  if (options.dryRun) return cleanupPlan(host, options);
  const unlock = await acquireHostLock(host);
  try {
    const plan = await cleanupPlan(host, options);
    // Plan all retained references successfully before the first deletion.
    for (const absolute of plan.remove) {
      const relative = path.relative(host.stateRoot, absolute);
      if (!relative) throw new Error("Refusing to remove the state root.");
      const target = inside(host.stateRoot, relative);
      if (!await exists(target)) continue;
      const stat = await fs.lstat(target);
      if (stat.isSymbolicLink()) throw new Error("Refusing to follow a linked cleanup target.");
      inside(host.stateRoot, path.relative(host.stateRoot, await fs.realpath(target)));
      await fs.rm(target, { recursive: stat.isDirectory(), force: false, maxRetries: 3, retryDelay: 50 });
    }
    return { ...plan, status: "pruned" };
  } finally { await unlock(); }
}
