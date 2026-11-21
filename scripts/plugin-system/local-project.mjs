import { randomUUID } from "node:crypto";
import { inside, identifier, readJson, writeJson, acquireHostLock, ownsHostLock, hashFile, exists } from "./io.mjs";
import { emptyLocalState, requireSettledLocalState, requireSettledOperation, snapshotFile, sameFileState, restoreFile, blobPath, missingSourceDirectories, pruneSourceDirectories } from "./source-state.mjs";
import { readRegistry, readRelease } from "./releases.mjs";
import { readPlugin } from "./plan.mjs";
import { publicConfigurationHash } from "./configuration.mjs";

const registryFile = (host) => inside(host.stateRoot, "registry.json");
const transactionFile = (host, id) => inside(host.stateRoot, `local-transactions/${identifier(id)}/transaction.json`);

async function requireCurrentConfiguration(host, release) {
  const plugins = [];
  for (const item of Object.values(release.plugins)) if (item.enabled) plugins.push(await readPlugin(inside(host.stateRoot, item.packagePath)));
  if (publicConfigurationHash(host, plugins) !== release.publicConfigurationHash) throw new Error("Public plugin configuration changed. Prepare a fresh candidate before applying it.");
}

async function planApply(host, id, registry) {
  requireSettledLocalState(registry, host);
  const release = await readRelease(host, id);
  if (release.sourceChanges?.version !== 1) throw new Error("This candidate has no local source record. Prepare it again with the current runner.");
  if (release.sourceChanges.projectRoot !== host.root) throw new Error("Candidate belongs to a different project root.");
  if (release.profile !== host.profile) throw new Error(`Select --profile ${release.profile} for this candidate.`);
  await requireCurrentConfiguration(host, release);
  const local = registry.local || emptyLocalState();
  const nextFiles = {};
  const changes = [];
  const names = [...new Set([...Object.keys(local.files), ...Object.keys(release.sourceChanges.files)])].sort();
  for (const name of names) {
    const previous = local.files[name];
    const incoming = release.sourceChanges.files[name];
    if (incoming) {
      const candidate = await snapshotFile(inside(host.stateRoot, release.directory), name, host.stateRoot, false);
      if (!sameFileState(candidate, incoming.after)) throw new Error(`Prepared candidate source was modified: ${name}`);
    }
    if (previous && incoming && !sameFileState(previous.original, incoming.before)) throw new Error(`Candidate baseline does not match the locally applied source: ${name}`);
    const expected = previous?.applied || incoming.before;
    const actual = await snapshotFile(host.root, name, host.stateRoot, false);
    if (!sameFileState(actual, expected)) throw new Error(`Local source changed since preparation: ${name}`);
    const after = incoming?.after || previous.original;
    if (incoming) nextFiles[name] = { original: incoming.before, applied: incoming.after };
    if (!sameFileState(actual, after)) changes.push({ path: name, before: actual, after });
  }
  const createdDirectories = await missingSourceDirectories(host.root, changes.filter((entry) => entry.after.hash !== null).map((entry) => entry.path));
  const directories = [...new Set([...(local.directories || []), ...createdDirectories])].sort();
  const nextDirectories = directories.filter((directory) => Object.keys(nextFiles).some((name) => name.startsWith(`${directory}/`)));
  const removedDirectories = directories.filter((directory) => !nextDirectories.includes(directory));
  return { release, local, nextFiles, changes, createdDirectories, nextDirectories, removedDirectories };
}

function displayPlan(plan, id) {
  return {
    release: id, status: "planned", changes: plan.changes.map((entry) => ({ path: entry.path, action: entry.after.hash === null ? "remove" : entry.before.hash === null ? "create" : "update" })),
    dependencyInstallRequired: plan.changes.some((entry) => ["package.json", "package-lock.json"].includes(entry.path)),
    directoryCleanup: plan.removedDirectories,
  };
}

async function dependencyFollowup(host, changes, direction = "after") {
  const dependencyInstallRequired = changes.some((entry) => ["package.json", "package-lock.json"].includes(entry.path));
  if (!dependencyInstallRequired) return { dependencyInstallRequired };
  const lock = changes.find((entry) => entry.path === "package-lock.json");
  const hasLock = lock ? lock[direction].hash !== null : await exists(inside(host.root, "package-lock.json"));
  return { dependencyInstallRequired, nextCommand: host.commands["host.dependencies"]
    ? "Run the configured dependency installation command in the checkout."
    : hasLock ? "npm ci --include=dev" : "npm install --include=dev" };
}

async function checkRecoveryFiles(host, receipt) {
  for (const entry of receipt.changes) {
    const actual = await snapshotFile(host.root, entry.path, host.stateRoot, false);
    if (!sameFileState(actual, entry.before) && !sameFileState(actual, entry.after)) throw new Error(`Recovery would overwrite an unexpected edit: ${entry.path}`);
    if (entry.before.hash && await hashFile(blobPath(host.stateRoot, entry.before.hash)) !== entry.before.hash) throw new Error(`Recovery backup is damaged: ${entry.path}`);
  }
}

async function restoreBefore(host, receipt) {
  await checkRecoveryFiles(host, receipt);
  for (const entry of receipt.changes) {
    const actual = await snapshotFile(host.root, entry.path, host.stateRoot, false);
    if (!sameFileState(actual, entry.before) && !sameFileState(actual, entry.after)) throw new Error(`Recovery would overwrite an unexpected edit: ${entry.path}`);
    await restoreFile(host.root, entry.path, entry.before, host.stateRoot);
  }
  await pruneSourceDirectories(host.root, receipt.createdDirectories || []);
}

export async function applyLocal(host, id, options = {}, signal) {
  if (options.dryRun) {
    const plan = await planApply(host, id, await readRegistry(host));
    return { ...displayPlan(plan, id), ...await dependencyFollowup(host, plan.changes) };
  }
  const unlock = await acquireHostLock(host);
  let receipt;
  try {
    const registry = await readRegistry(host);
    const plan = await planApply(host, id, registry);
    if (plan.local.appliedRelease === id) return { release: id, status: "already-applied", changes: [] };
    const transaction = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
    for (const change of plan.changes) {
      const backup = await snapshotFile(host.root, change.path, host.stateRoot);
      if (!sameFileState(backup, change.before)) throw new Error(`Source changed while planning apply: ${change.path}`);
      if (change.after.hash && await hashFile(blobPath(host.stateRoot, change.after.hash)) !== change.after.hash) throw new Error(`Candidate source backup is damaged: ${change.path}`);
    }
    receipt = {
      id: transaction, release: id, projectRoot: host.root, status: "applying", startedAt: new Date().toISOString(),
      beforeLocal: plan.local, afterLocal: { appliedRelease: id, lastTransaction: transaction, pendingTransaction: null, files: plan.nextFiles, directories: plan.nextDirectories }, changes: plan.changes,
      createdDirectories: plan.createdDirectories, removedDirectories: plan.removedDirectories,
    };
    await writeJson(transactionFile(host, transaction), receipt);
    registry.local = { ...plan.local, pendingTransaction: transaction };
    await writeJson(registryFile(host), registry);
    for (const change of plan.changes) {
      if (signal?.aborted) throw new Error("Local apply interrupted.");
      const actual = await snapshotFile(host.root, change.path, host.stateRoot, false);
      if (!sameFileState(actual, change.before)) throw new Error(`Source changed during apply: ${change.path}`);
      await restoreFile(host.root, change.path, change.after, host.stateRoot);
    }
    if (plan.removedDirectories.length) options.onProgress?.("Cleaning up empty plugin folders");
    await pruneSourceDirectories(host.root, plan.removedDirectories);
    receipt.status = "applied";
    await writeJson(transactionFile(host, transaction), receipt);
    registry.local = receipt.afterLocal;
    await writeJson(registryFile(host), registry);
    const result = displayPlan(plan, id);
    return { ...result, status: "applied", transaction, ...await dependencyFollowup(host, plan.changes) };
  } catch (error) {
    if (receipt) {
      receipt.error = error.message;
      try {
        await restoreBefore(host, receipt);
        const registry = await readRegistry(host);
        registry.local = receipt.beforeLocal;
        await writeJson(registryFile(host), registry);
        receipt.status = "rolled-back";
      } catch (recoveryError) {
        receipt.status = "needs-recovery";
        receipt.recoveryError = recoveryError.message;
      }
      await writeJson(transactionFile(host, receipt.id), receipt);
    }
    throw error;
  } finally { await unlock(); }
}

export async function undoLocal(host, options = {}) {
  const readPlan = async () => {
    const registry = await readRegistry(host);
    requireSettledOperation(registry, host);
    if (registry.workflow && !ownsHostLock(host)) throw new Error("Use npm run plugins:revert for the latest operation only.");
    const local = registry.local || emptyLocalState();
    const id = local.pendingTransaction || local.lastTransaction;
    if (!id) throw new Error("There is no local apply to undo.");
    const receipt = await readJson(transactionFile(host, id));
    if (receipt.projectRoot !== host.root) throw new Error("Local transaction belongs to another project.");
    await checkRecoveryFiles(host, receipt);
    return { registry, receipt };
  };
  if (options.dryRun) {
    const { receipt } = await readPlan();
    return { status: "planned", transaction: receipt.id, changes: receipt.changes.map(({ path: file }) => file), ...await dependencyFollowup(host, receipt.changes, "before") };
  }
  const unlock = await acquireHostLock(host);
  let receipt;
  try {
    const plan = await readPlan();
    receipt = plan.receipt;
    plan.registry.local = { ...plan.registry.local, pendingTransaction: receipt.id };
    await writeJson(registryFile(host), plan.registry);
    receipt.status = "undoing";
    await writeJson(transactionFile(host, receipt.id), receipt);
    await restoreBefore(host, receipt);
    plan.registry.local = structuredClone(receipt.beforeLocal);
    if (plan.registry.local.lastTransaction && !await exists(transactionFile(host, plan.registry.local.lastTransaction))) plan.registry.local.lastTransaction = null;
    await writeJson(registryFile(host), plan.registry);
    receipt.status = "undone";
    await writeJson(transactionFile(host, receipt.id), receipt);
    return { status: "undone", transaction: receipt.id, appliedRelease: receipt.beforeLocal.appliedRelease, ...await dependencyFollowup(host, receipt.changes, "before") };
  } catch (error) {
    if (receipt) { receipt.status = "needs-recovery"; receipt.error = error.message; await writeJson(transactionFile(host, receipt.id), receipt); }
    throw error;
  } finally { await unlock(); }
}
