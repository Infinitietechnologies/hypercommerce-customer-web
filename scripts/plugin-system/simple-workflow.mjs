import { randomUUID } from "node:crypto";
import { fs, path, inside, identifier, isIdentifier, exists, readJson, writeJson, hashValue, hashFile, withHostLock, execute } from "./io.mjs";
import { loadHost, readPlugin } from "./plan.mjs";
import { readRegistry, readAppliedRelease, applyChange, planChange, packageContentHash } from "./releases.mjs";
import { applyLocal, undoLocal } from "./local-project.mjs";
import { emptyLocalState, requireSettledLocalState, snapshotFile, sameFileState, blobPath, sourcePath } from "./source-state.mjs";
import { publicConfigurationHash } from "./configuration.mjs";

const registryFile = (host) => inside(host.stateRoot, "registry.json");
const operationFile = (host, id) => inside(host.stateRoot, `operations/${identifier(id)}/operation.json`);
const transactionFile = (host, id) => inside(host.stateRoot, `local-transactions/${identifier(id)}/transaction.json`);
const saveOperation = (host, operation) => writeJson(operationFile(host, operation.id), operation);
const identity = (registry) => {
  const value = { ...registry };
  delete value.workflow;
  return hashValue(value);
};

async function discover(host, target) {
  const root = inside(host.root, "plugins");
  const selectedId = target && !/[\\/]/.test(target) ? target : null;
  const selected = target && !selectedId ? path.resolve(host.root, target) : null;
  if (selected && path.relative(root, path.dirname(selected))) throw new Error("Choose one package directory directly inside plugins/.");
  const stat = await fs.lstat(root).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
  if (stat?.isSymbolicLink()) throw new Error("The plugins input folder cannot be a symbolic link.");
  const entries = stat ? await fs.readdir(root, { withFileTypes: true }) : [];
  const result = [];
  const availableIds = new Set();
  let folderId;
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const directory = inside(root, entry.name);
    if (selected && path.relative(selected, directory)) continue;
    if (entry.isSymbolicLink()) {
      if (selectedId) continue;
      throw new Error(`Linked plugin input is unsupported: ${entry.name}`);
    }
    if (!entry.isDirectory()) continue;
    const manifestFile = inside(directory, "plugin.json");
    if (selectedId) {
      const manifestStat = await fs.lstat(manifestFile).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
      if (!manifestStat?.isFile()) continue;
      const manifest = await readJson(manifestFile).catch((error) => {
        if (error.cause instanceof SyntaxError) return null;
        throw error;
      });
      const id = manifest?.id;
      if (!isIdentifier(id)) continue;
      availableIds.add(id);
      if (entry.name === selectedId) folderId = id;
      if (id !== selectedId) continue;
      if (result.length) throw new Error(`Duplicate plugin ID in plugins/: ${selectedId}. Specify the package folder, such as ./plugins/${entry.name}.`);
    } else if (!await exists(manifestFile)) continue;
    const plugin = await readPlugin(directory);
    if (result.some((item) => item.manifest.id === plugin.manifest.id)) throw new Error(`Duplicate plugin ID in plugins/: ${plugin.manifest.id}. Keep one input version per ID.`);
    plugin.contentHash = await packageContentHash(plugin.directory);
    result.push(plugin);
  }
  if (selectedId && result.length === 0) {
    const lines = [`Plugin ${JSON.stringify(selectedId)} not found.`];
    if (availableIds.size) {
      if (folderId) lines.push(`The folder ${JSON.stringify(selectedId)} declares the ID "${folderId}".`);
      lines.push("", "Available plugin IDs", ...[...availableIds].sort().map((id) => `  ${id}`));
      lines.push("", "Install with", `  npm run plugins:install -- ${folderId || "<plugin-id>"}`);
    } else {
      lines.push("", "No valid plugin IDs found in plugins/. Check the plugin.json files.");
    }
    throw new Error(lines.join("\n"));
  }
  if (selected && result.length === 0) throw new Error(`No plugin.json found in package directory: ${target}`);
  return result;
}

async function planOperation(host, action, registry, target) {
  if (registry.workflow?.pendingOperation) throw new Error("An incomplete plugin operation needs recovery.\n\nRecover with\n  npm run plugins:revert");
  requireSettledLocalState(registry, host);
  const applied = await readAppliedRelease(host, registry);
  const basePlugins = target ? applied?.plugins || {} : registry.plugins;
  if (action === "uninstall") {
    if (target) {
      identifier(target);
      if (!Object.hasOwn(basePlugins, target)) {
        const ids = Object.keys(basePlugins).sort();
        const lines = [`Plugin is not installed locally: ${target}.`, "", "Installed plugin IDs"];
        if (ids.length) {
          lines.push(...ids.map((id) => `  ${id}`), "", "Uninstall with", "  npm run plugins:uninstall -- <plugin-id>");
        } else {
          lines.push("  None");
        }
        throw new Error(lines.join("\n"));
      }
      return { operation: "uninstall", targets: [target], counts: { removed: 1 }, needed: true };
    }
    const ids = [...new Set([...Object.keys(registry.plugins), ...Object.keys(applied?.plugins || {})])];
    return { operation: "clear", targets: [], counts: { removed: ids.length }, needed: ids.length > 0 };
  }
  const inputs = await discover(host, target);
  const targets = [];
  const counts = { installed: 0, updated: 0, enabled: 0, skipped: 0 };
  for (const plugin of inputs) {
    const previous = Object.hasOwn(basePlugins, plugin.manifest.id) ? basePlugins[plugin.manifest.id] : null;
    if (previous?.enabled && previous.packageHash === plugin.contentHash) counts.skipped++;
    else {
      targets.push(plugin.directory);
      if (!previous) counts.installed++;
      else {
        if (!previous.enabled) counts.enabled++;
        if (previous.packageHash !== plugin.contentHash) counts.updated++;
      }
    }
  }
  const enabled = [];
  for (const item of Object.values(basePlugins)) if (item.enabled) enabled.push(await readPlugin(inside(host.stateRoot, item.packagePath)));
  const configurationChanged = targets.length === 0 && enabled.length > 0 && publicConfigurationHash(host, enabled) !== applied?.publicConfigurationHash;
  const pendingCandidate = !target && Boolean(registry.latestRelease && registry.latestRelease !== registry.local?.appliedRelease);
  return { operation: "sync", targets, counts, needed: targets.length > 0 || configurationChanged || pendingCandidate || Boolean(applied && applied.profile !== host.profile) };
}

function outcome(action, plan, status) {
  const counts = plan.counts;
  const message = action === "uninstall"
    ? counts.removed ? `Uninstalled ${counts.removed} plugin(s). Package folders and settings were retained.` : "No installed plugins to remove."
    : !plan.needed ? counts.skipped ? `Skipped ${counts.skipped} unchanged plugin(s).` : "No plugin packages found in plugins/."
      : `Installed ${counts.installed}; updated ${counts.updated}; enabled ${counts.enabled}; skipped ${counts.skipped} unchanged plugin(s).`;
  return { status, ...counts, message };
}

async function transactionFor(host, operation, registry) {
  const candidate = operation.transaction || registry.local?.pendingTransaction || registry.local?.lastTransaction;
  if (!candidate || !operation.release) return null;
  const receipt = await readJson(transactionFile(host, candidate));
  if (receipt.release !== operation.release) {
    if (operation.transaction) throw new Error("The latest operation's source receipt does not match.");
    return null;
  }
  if (receipt.projectRoot !== host.root) throw new Error("Source receipt belongs to another project.");
  return receipt;
}

async function checkFiles(host, receipt, direction, mixed = false) {
  for (const entry of receipt?.changes || []) {
    const actual = await snapshotFile(host.root, entry.path, host.stateRoot, false);
    if (!sameFileState(actual, entry[direction]) && !(mixed && sameFileState(actual, entry.after))) {
      throw new Error(`Operation would overwrite an unexpected edit: ${entry.path}`);
    }
    const expected = entry[direction];
    if (expected.hash && await hashFile(blobPath(host.stateRoot, expected.hash)) !== expected.hash) throw new Error(`Operation backup is damaged: ${entry.path}`);
  }
}

async function unlinkRemovedDependencyLinks(host, receipt, direction) {
  const previous = receipt?.changes.find((entry) => entry.path === "package.json")?.[direction === "after" ? "before" : "after"];
  if (!previous?.hash) return;
  const oldPackage = await readJson(blobPath(host.stateRoot, previous.hash));
  const current = await readJson(inside(host.root, "package.json"));
  const names = (pkg) => new Set(["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].flatMap((key) => Object.keys(pkg[key] || {})));
  const kept = names(current);
  const modules = inside(host.root, "node_modules");
  // npm can retain extraneous file: links without a lockfile. Remove only links
  // for dependencies removed by this transaction, never their external targets.
  for (const name of names(oldPackage)) {
    if (kept.has(name) || !/^(?:@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/i.test(name)) continue;
    const target = inside(modules, name);
    if (target === modules) continue;
    await sourcePath(host.root, path.relative(host.root, path.join(path.dirname(target), ".plugin-link-check")));
    const stat = await fs.lstat(target).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
    if (stat?.isSymbolicLink()) await fs.unlink(target);
  }
}

async function syncDependencies(host, signal, receipt, direction = "after") {
  const hasLock = await exists(inside(host.root, "package-lock.json"));
  if (!host.commands["host.dependencies"] && !hasLock) await unlinkRemovedDependencyLinks(host, receipt, direction);
  const command = host.commands["host.dependencies"] || { npmArgs: hasLock
    ? ["ci", "--include=dev", "--cache", inside(host.stateRoot, "cache/npm")]
    : ["install", "--include=dev", "--package-lock=false", "--cache", inside(host.stateRoot, "cache/npm")] };
  await execute(command, { cwd: host.root, env: host.env }, signal);
  if (!host.commands["host.dependencies"] && !hasLock) await execute({ npmArgs: ["prune", "--include=dev", "--package-lock=false", "--cache", inside(host.stateRoot, "cache/npm")] }, { cwd: host.root, env: host.env }, signal);
}

async function restoreOperation(host, operation, consume, signal, progress = () => {}) {
  progress(consume ? "Restoring files from the latest operation" : "Recovering the interrupted operation");
  operation.recovery = consume ? "revert" : "rollback";
  operation.status = consume ? "reverting" : "rolling-back";
  await saveOperation(host, operation);
  const current = await readRegistry(host);
  const receipt = await transactionFor(host, operation, current);
  if (receipt) {
    await checkFiles(host, receipt, "before", true);
    if ([current.local?.pendingTransaction, current.local?.lastTransaction].includes(receipt.id)) await undoLocal(host);
    else {
      if (hashValue(current.local || emptyLocalState()) !== hashValue(operation.beforeRegistry.local || emptyLocalState())) throw new Error("Local state no longer matches the latest operation.");
      await checkFiles(host, receipt, "before");
    }
  }
  if (operation.dependenciesChanged) {
    progress("Restoring project dependencies");
    await syncDependencies(host, signal, receipt, "before");
  }
  if (receipt) await checkFiles(host, receipt, "before");
  const restored = { ...operation.beforeRegistry, projectRoot: host.root, workflow: {
    revertPoint: consume ? null : operation.beforeRegistry.workflow?.revertPoint || null, pendingOperation: null,
  } };
  await writeJson(registryFile(host), restored);
  operation.status = consume ? "reverted" : "failed";
  await saveOperation(host, operation);
}

async function revertPlan(host, registry) {
  const pending = registry.workflow?.pendingOperation;
  const id = pending || registry.workflow?.revertPoint;
  if (!id) return null;
  const operation = await readJson(operationFile(host, id));
  if (operation.projectRoot !== host.root) throw new Error("Revert point belongs to another project.");
  if (operation.profile !== host.profile) throw new Error(`Choose --profile ${operation.profile} to recover this operation.`);
  if (!pending && (operation.status !== "completed" || identity(registry) !== identity(operation.afterRegistry))) {
    throw new Error("Plugin state changed after the latest operation. Revert will not undo an earlier operation.");
  }
  const receipt = await transactionFor(host, operation, registry);
  await checkFiles(host, receipt, "before", true);
  return { operation, pending, receipt };
}

export async function simpleWorkflow(host, action, options = {}, signal) {
  const progress = options.onProgress || (() => {});
  if (!["install", "uninstall", "revert"].includes(action)) throw new Error("Unknown simple plugin action.");
  if (action === "revert") {
    const run = async () => {
      const registry = await readRegistry(host);
      if (registry.workflow?.pendingOperation || registry.workflow?.revertPoint) progress("Checking the latest revert point");
      const plan = await revertPlan(host, registry);
      if (!plan) return { status: "nothing-to-revert", message: "Nothing available to revert." };
      if (options.dryRun) return { status: "planned", action, recovering: Boolean(plan.pending), changes: plan.receipt?.changes.map((entry) => entry.path) || [], message: "Preview: restore only the latest operation." };
      const { operation, pending } = plan;
      registry.workflow = { ...registry.workflow, pendingOperation: operation.id };
      await writeJson(registryFile(host), registry);
      try {
        const consume = !pending || operation.recovery === "revert";
        await restoreOperation(host, operation, consume, signal, progress);
        return { status: consume ? "reverted" : "recovered", message: consume ? "Reverted the latest operation. Earlier plugins were preserved. Revert is now locked until the next successful change." : "Recovered the interrupted operation. The previous successful revert point was preserved." };
      } catch (error) {
        operation.status = "needs-recovery";
        await saveOperation(host, operation);
        throw new Error(`${error.message}\n\nRecovery is still pending. Resolve the cause, then retry with\n  npm run plugins:revert`);
      }
    };
    return options.dryRun ? run() : withHostLock(host, run);
  }
  const run = async () => {
    if (!options.target) progress(action === "install" ? "Discovering plugins and checking for changes" : "Checking installed plugins");
    const before = await readRegistry(host);
    const plan = await planOperation(host, action, before, options.target);
    const changeOptions = { fromLocal: Boolean(options.target), onProgress: progress };
    if (options.dryRun) return { ...outcome(action, plan, "planned"), message: `Preview: ${outcome(action, plan, "planned").message}`, ...(plan.needed ? { plan: await planChange(host, plan.operation, plan.targets, changeOptions) } : {}) };
    if (!plan.needed) return outcome(action, plan, "unchanged");
    const operation = {
      id: `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`, projectRoot: host.root,
      action, profile: host.profile, status: "preparing", recovery: "rollback", beforeRegistry: before,
    };
    await saveOperation(host, operation);
    await writeJson(registryFile(host), { ...before, projectRoot: host.root, workflow: { ...before.workflow, pendingOperation: operation.id } });
    try {
      const prepared = await applyChange(host, plan.operation, plan.targets, changeOptions, signal);
      operation.release = prepared.release;
      const currentHost = await loadHost(host.root, { profile: host.profile, stateDir: host.stateRoot });
      host.pluginConfiguration = currentHost.pluginConfiguration;
      host.environment = currentHost.environment;
      progress("Checking source changes before applying them");
      const preview = await applyLocal(host, prepared.release, { dryRun: true }, signal);
      operation.dependenciesChanged = preview.dependencyInstallRequired;
      operation.status = "applying";
      await saveOperation(host, operation);
      progress("Applying plugin changes to the project");
      const applied = await applyLocal(host, prepared.release, { onProgress: progress }, signal);
      operation.transaction = applied.transaction;
      operation.status = "synchronizing";
      await saveOperation(host, operation);
      if (operation.dependenciesChanged) {
        progress("Synchronizing project dependencies");
        await syncDependencies(host, signal, await transactionFor(host, operation, await readRegistry(host)));
      }
      progress("Saving plugin state and the latest revert point");
      const current = await readRegistry(host);
      await checkFiles(host, await transactionFor(host, operation, current), "after");
      operation.afterRegistry = current;
      operation.status = "completed";
      await saveOperation(host, operation);
      current.workflow = { revertPoint: operation.id, pendingOperation: null };
      await writeJson(registryFile(host), current);
      return { ...outcome(action, plan, "completed"), revertAvailable: true };
    } catch (error) {
      progress("Operation failed; rolling back its changes");
      try { await restoreOperation(host, operation, false, undefined, progress); }
      catch {
        operation.status = "needs-recovery";
        await saveOperation(host, operation);
        throw new Error(`${error.message}\n\nRecovery is pending. Resolve the cause, then retry with\n  npm run plugins:revert`);
      }
      throw error;
    }
  };
  return options.dryRun ? run() : withHostLock(host, run);
}
