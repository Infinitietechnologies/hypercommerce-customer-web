import { randomUUID } from "node:crypto";
import { fs, path, exists, readJson, writeJson, inside, identifier, treeHash, hashFile, hashValue, copyTree, acquireHostLock, execute } from "./io.mjs";
import { readPlugin, describePlan, deferredChecks } from "./plan.mjs";
import { integrate } from "./workflow.mjs";
import { requireSettledLocalState, restoreCandidateBaseline } from "./source-state.mjs";
import { publicConfigurationHash } from "./configuration.mjs";

const emptyRegistry = () => ({ schemaVersion: 1, latestRelease: null, activeRelease: null, lastKnownActiveRelease: null, deploymentState: "not-activated", plugins: {}, history: [] });
export const readRegistry = async (host) => {
  const registry = await readJson(path.join(host.stateRoot, "registry.json"), emptyRegistry());
  if (registry.projectRoot && registry.projectRoot !== host.root) throw new Error("This state directory belongs to another project root.");
  return registry;
};
const snapshotExclusions = [".git", "node_modules", ".next", "out", ".env", ".env.local", ".env.production.local"];
export const packageContentHash = (directory) => treeHash(directory, { excluded: snapshotExclusions, excludeEnvironment: true });
const hostExclusions = [".git", "node_modules", ".next", "out", "dist", "build", "coverage", "plugins", "plugin-config.local.json"];

async function snapshot(host, plugin) {
  const temporary = inside(host.stateRoot, `packages/staging-${randomUUID()}`);
  await copyTree(plugin.directory, temporary, snapshotExclusions, { excludeEnvironment: true });
  const hash = await treeHash(temporary);
  const stored = inside(host.stateRoot, `packages/${plugin.manifest.id}-${hash}`);
  if (await exists(stored)) await fs.rm(inside(host.stateRoot, path.relative(host.stateRoot, temporary)), { recursive: true });
  else await fs.rename(temporary, stored);
  return { id: plugin.manifest.id, version: plugin.manifest.version, enabled: true, packagePath: path.relative(host.stateRoot, stored), packageHash: hash };
}

async function resolveChange(host, operation, targets, basePlugins) {
  const plugins = operation === "clear" ? {} : structuredClone(basePlugins);
  const incoming = [];
  if (["install", "update", "sync"].includes(operation)) {
    if (!targets.length && operation !== "sync") throw new Error(`${operation} needs at least one extracted plugin directory.`);
    for (const target of targets) {
      const plugin = await readPlugin(path.resolve(host.root, target));
      const previous = Object.hasOwn(plugins, plugin.manifest.id) ? plugins[plugin.manifest.id] : undefined;
      if (operation === "install" && previous) throw new Error(`${plugin.manifest.id} is installed; use update.`);
      if (operation === "update" && !previous) throw new Error(`${plugin.manifest.id} is not installed; use install.`);
      if (incoming.some((item) => item.manifest.id === plugin.manifest.id)) throw new Error("A release cannot contain two inputs with the same plugin ID.");
      plugin.operation = operation === "sync" ? !previous ? "install" : previous.enabled ? "update" : "enable" : operation;
      if (operation === "sync" && previous && !previous.enabled && previous.packageHash !== await packageContentHash(plugin.directory)) plugin.operation = "update";
      incoming.push(plugin);
      plugins[plugin.manifest.id] = { id: plugin.manifest.id, version: plugin.manifest.version, enabled: operation === "sync" ? true : previous?.enabled ?? true, input: plugin };
    }
  } else if (operation !== "clear") {
    if (!targets.length) throw new Error(`${operation} needs at least one plugin ID.`);
    for (const id of targets) {
      identifier(id);
      if (!Object.hasOwn(plugins, id)) throw new Error(`Plugin is not installed: ${id}`);
      if (operation === "uninstall") delete plugins[id];
      else plugins[id].enabled = operation === "enable";
    }
  }
  const enabled = [];
  for (const item of Object.values(plugins)) {
    if (item.enabled) {
      const plugin = item.input || await readPlugin(inside(host.stateRoot, item.packagePath));
      plugin.operation = item.input ? item.input.operation : operation === "enable" && targets.includes(item.id) ? "enable" : "install";
      enabled.push(plugin);
    }
  }
  return { plugins, incoming, enabled };
}

async function activate(host, release, previous, signal) {
  const command = host.commands["host.activate"];
  if (!command) throw new Error("Activation needs a host-owned host.activate command in plugin-host.json. The prepared release remains available.");
  const cwd = inside(host.stateRoot, release.directory);
  try {
    await execute(command, { cwd, env: {
      ...host.env, PLUGIN_RELEASE_DIR: cwd, PLUGIN_PROFILE: release.profile,
      PLUGIN_PREVIOUS_RELEASE_DIR: previous ? inside(host.stateRoot, previous.directory) : "",
    } }, signal);
  } catch (error) {
    if (previous) {
      try {
        await execute(host.commands["host.recover"] || command, { cwd: inside(host.stateRoot, previous.directory), env: {
          ...host.env, PLUGIN_RELEASE_DIR: inside(host.stateRoot, previous.directory),
          PLUGIN_PROFILE: previous.profile, PLUGIN_RECOVERY: "true",
        } });
      } catch {
        const failure = new Error("Activation failed and recovery also failed. Inspect the deployment service; active state is unknown.");
        failure.deploymentUnknown = true;
        throw failure;
      }
      error.recovered = true;
    } else error.deploymentUnknown = true;
    throw error;
  }
}

async function recordDeploymentFailure(host, error) {
  if (!error.deploymentUnknown && !error.recovered) return;
  const registry = await readRegistry(host);
  if (error.deploymentUnknown) {
    registry.lastKnownActiveRelease = registry.activeRelease || registry.lastKnownActiveRelease || null;
    registry.activeRelease = null;
    registry.deploymentState = "unknown";
  } else registry.deploymentState = "recovered";
  registry.activationError = error.message;
  await writeJson(inside(host.stateRoot, "registry.json"), registry);
}

export async function applyChange(host, operation, targets, options, signal) {
  const unlock = await acquireHostLock(host);
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const jobFile = inside(host.stateRoot, `jobs/${id}.json`);
  const job = { id, operation, profile: host.profile, status: "running", startedAt: Date.now(), steps: [], deferredChecks };
  const record = () => writeJson(jobFile, job);
  try {
    const registry = await readRegistry(host);
    requireSettledLocalState(registry, host);
    const baseRelease = options.fromLocal ? registry.local?.appliedRelease : registry.latestRelease;
    const previous = baseRelease ? await readRelease(host, baseRelease) : null;
    const basePlugins = options.fromLocal ? previous?.plugins || {} : registry.plugins;
    const change = await resolveChange(host, operation, targets, basePlugins);
    if (previous) {
      for (const [file, ownership] of Object.entries(previous.owned || {})) {
        if (!ownership.hash) continue;
        const installed = inside(inside(host.stateRoot, previous.directory), ownership.file || file);
        const currentHash = !await exists(installed) ? null : ownership.namespace
          ? hashValue((await readJson(installed))[ownership.namespace]) : await hashFile(installed);
        if (currentHash !== ownership.hash) {
          throw new Error(`Installed artifact was locally modified: ${file}. Preserve that customization before preparing another release.`);
        }
      }
    }
    for (const plugin of change.incoming) {
      const enabled = change.plugins[plugin.manifest.id].enabled;
      change.plugins[plugin.manifest.id] = { ...await snapshot(host, plugin), enabled };
    }
    // Always execute immutable snapshots, including for packages added in this job.
    const enabled = [];
    for (const item of Object.values(change.plugins)) {
      if (item.enabled) {
        const plugin = await readPlugin(inside(host.stateRoot, item.packagePath));
        const input = change.incoming.find((entry) => entry.manifest.id === item.id);
        plugin.operation = input ? input.operation : operation === "enable" && targets.includes(item.id) ? "enable" : "install";
        enabled.push(plugin);
      }
    }
    job.plugins = Object.values(change.plugins).map(({ id: pluginId, version, enabled: isEnabled }) => ({ id: pluginId, version, enabled: isEnabled }));
    job.directory = `releases/${id}/app`;
    await record();
    const cwd = inside(host.stateRoot, job.directory);
    options.onProgress?.("Preparing an isolated copy of the app");
    await copyTree(host.root, cwd, hostExclusions);
    await restoreCandidateBaseline(host, cwd, registry);
    const generated = await integrate(host, cwd, enabled, operation, job, signal, record, options.onProgress);
    const release = { id, directory: job.directory, profile: host.profile, createdAt: new Date().toISOString(), plugins: change.plugins,
      publicConfigurationHash: publicConfigurationHash(host, enabled), ...generated, deferredChecks };
    await writeJson(inside(host.stateRoot, `releases/${id}/release.json`), release);
    // Commit the prepared release first, so a failed deployment can still be retried.
    const nextRegistry = { ...registry, projectRoot: host.root, plugins: change.plugins, latestRelease: id,
      history: [...registry.history, { id, operation, profile: host.profile, at: release.createdAt }] };
    await writeJson(inside(host.stateRoot, "registry.json"), nextRegistry);
    job.status = "prepared";
    if (options.activate) {
      const previous = registry.activeRelease ? await readRelease(host, registry.activeRelease) : null;
      await activate(host, release, previous, signal);
      nextRegistry.activeRelease = id;
      nextRegistry.lastKnownActiveRelease = id;
      nextRegistry.deploymentState = "active";
      delete nextRegistry.activationError;
      await writeJson(inside(host.stateRoot, "registry.json"), nextRegistry);
      job.status = "activated";
    }
    return { release: id, directory: cwd, status: job.status, plugins: job.plugins, deferredChecks };
  } catch (error) {
    job.status = "failed"; job.error = error.message;
    await recordDeploymentFailure(host, error);
    throw error;
  }
  finally {
    job.durationMs = Date.now() - job.startedAt;
    try { await record(); } finally { await unlock(); }
  }
}

export async function readRelease(host, id) {
  identifier(id);
  return readJson(inside(host.stateRoot, `releases/${id}/release.json`));
}

export async function readAppliedRelease(host, registry) {
  const id = registry.local?.appliedRelease;
  return id ? readRelease(host, id) : null;
}

export async function selectRelease(host, operation, id, options, signal) {
  const release = await readRelease(host, id);
  const registry = await readRegistry(host);
  if (release.profile !== host.profile) throw new Error(`Select --profile ${release.profile} for this release.`);
  if (options.dryRun) return { operation, release: id, directory: inside(host.stateRoot, release.directory), profile: release.profile, deferredChecks };
  const unlock = await acquireHostLock(host);
  const jobId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const jobFile = inside(host.stateRoot, `jobs/${jobId}.json`);
  const job = { id: jobId, operation, release: id, profile: host.profile, status: "running", startedAt: Date.now(), deferredChecks };
  try {
    await writeJson(jobFile, job);
    const current = await readRegistry(host);
    requireSettledLocalState(current, host);
    if (options.activate || operation === "activate") {
      const previous = current.activeRelease ? await readRelease(host, current.activeRelease) : null;
      await activate(host, release, previous, signal);
      current.activeRelease = id;
      current.lastKnownActiveRelease = id;
      current.deploymentState = "active";
      delete current.activationError;
    }
    current.plugins = release.plugins;
    current.latestRelease = id;
    current.history.push({ id, operation, at: new Date().toISOString() });
    await writeJson(inside(host.stateRoot, "registry.json"), current);
    job.status = options.activate || operation === "activate" ? "activated" : "prepared";
    return { release: id, previous: registry.latestRelease, status: job.status, deferredChecks };
  } catch (error) {
    job.status = "failed"; job.error = error.message;
    await recordDeploymentFailure(host, error);
    throw error;
  } finally {
    job.durationMs = Date.now() - job.startedAt;
    try { await writeJson(jobFile, job); } finally { await unlock(); }
  }
}

export async function planChange(host, operation, targets, options = {}) {
  const registry = await readRegistry(host);
  const basePlugins = options.fromLocal ? (await readAppliedRelease(host, registry))?.plugins || {} : registry.plugins;
  const change = await resolveChange(host, operation, targets, basePlugins);
  return { ...await describePlan(host, change.enabled, operation), changes: {
    installed: Object.values(change.plugins).map(({ id, version, enabled }) => ({ id, version, enabled })),
    removed: Object.keys(basePlugins).filter((id) => !Object.hasOwn(change.plugins, id)),
  } };
}
