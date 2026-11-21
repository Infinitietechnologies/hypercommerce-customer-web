import { fs, path, exists, readJson, writeJson, inside, files, hashFile, hashValue, execute } from "./io.mjs";
import { applies } from "./plan.mjs";
import { applyAppendRules } from "./append-rules.mjs";
import { createSourceTracker } from "./source-state.mjs";
import { resolveConfiguration } from "./configuration.mjs";

export async function integrate(host, cwd, plugins, operation, job, signal, record, progress = () => {}) {
  const owned = {};
  const source = createSourceTracker(host, cwd);
  const registered = [];
  const appendState = new Map();
  const routeKey = (segments) => `/${segments.filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")) && !segment.startsWith("@"))
    .map((segment) => /^\[\[\.\.\.[^\]]+\]\]$/.test(segment) ? "[[...]]" : /^\[\.\.\.[^\]]+\]$/.test(segment) ? "[...]" : segment.replace(/\[[^\]]+\]/g, "[]")).join("/")}`;
  let existingRoutes;
  const getExistingRoutes = async () => {
    if (existingRoutes) return existingRoutes;
    existingRoutes = new Set();
    for (const router of host.routers) {
      for (const file of await files(inside(cwd, router.directory))) {
        if (!/\.(?:[jt]sx?|mjs)$/.test(file)) continue;
        const segments = file.replace(/\.(?:(?:static|ssr)\.)?(?:[jt]sx?|mjs)$/, "").split(path.sep);
        if (router.router === "app") {
          if (segments.pop() !== "page" || segments.some((segment) => segment.startsWith("_"))) continue;
        } else {
          if (segments.length === 1 && ["_app", "_document", "_error"].includes(segments[0])) continue;
          if (segments.at(-1) === "index") segments.pop();
        }
        existingRoutes.add(routeKey(segments));
      }
    }
    return existingRoutes;
  };
  const prepared = new Set();
  let dependenciesDone = false;
  let buildDone = false;
  const env = { ...host.env, PLUGIN_RELEASE_DIR: cwd, PLUGIN_PROFILE: host.profile };
  const writeOwned = async (pluginId, destination, content, { allowEmptyRegistry = false } = {}) => {
    const target = inside(cwd, destination);
    if (await exists(target) && owned[destination]?.pluginId !== pluginId) {
      const baseline = allowEmptyRegistry ? await readJson(target) : null;
      if (!Array.isArray(baseline) || baseline.length !== 0) throw new Error(`Destination already exists: ${destination}`);
    }
    await source.capture(destination);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
    owned[destination] = { pluginId, hash: await hashFile(target) };
  };
  // Input packages always live in root plugins/. Keep generated modules separate
  // even when the host uses root-level pages/ or app/ without an existing src/.
  const moduleSourceDirectory = host.sourceDirectory || "src";
  const moduleRoot = (plugin) => path.join(moduleSourceDirectory, "plugins", plugin.manifest.id);
  const copyOwned = async (plugin, source, destination) => {
    const item = inside(plugin.directory, source);
    if ((await fs.lstat(item)).isSymbolicLink()) throw new Error(`Linked source is unsupported: ${source}`);
    const entries = (await fs.stat(item)).isDirectory() ? await files(item) : [""];
    for (const entry of entries) {
      await writeOwned(plugin.manifest.id, path.join(destination, entry), await fs.readFile(inside(item, entry)));
    }
  };
  const prepareSource = async (plugin) => {
    if (prepared.has(plugin.manifest.id)) return;
    await copyOwned(plugin, "src", path.join(moduleRoot(plugin), "src"));
    if (await exists(path.join(plugin.directory, "assets"))) await copyOwned(plugin, "assets", path.join("public/plugins", plugin.manifest.id));
    prepared.add(plugin.manifest.id);
  };
  const installFiles = async (plugin, mappingRef = "frontend-files") => {
    await prepareSource(plugin);
    const mappings = Object.hasOwn(plugin.manifest.fileMappings || {}, mappingRef) ? plugin.manifest.fileMappings[mappingRef] : undefined;
    if (!mappings) {
      if (mappingRef !== "frontend-files") throw new Error(`Unknown file mapping: ${mappingRef}`);
      return;
    }
    for (const mapping of mappings) {
      if (!applies(mapping.when, host, plugin.operation || operation, plugin.manifest)) continue;
      const roots = { "{pluginRoot}": moduleRoot(plugin), "{assetsRoot}": path.join("public/plugins", plugin.manifest.id) };
      const token = Object.keys(roots).find((key) => mapping.to === key || mapping.to?.startsWith(`${key}/`));
      if (!token) throw new Error("File mappings must target {pluginRoot} or {assetsRoot}.");
      const destination = inside(inside(cwd, roots[token]), mapping.to.slice(token.length).replace(/^\//, ""));
      await copyOwned(plugin, mapping.from, path.relative(cwd, destination));
    }
  };
  const register = async (plugin) => {
    await prepareSource(plugin);
    if (registered.some((entry) => entry.id === plugin.manifest.id)) return;
    for (const route of plugin.manifest.contributions?.routes || []) {
      if (!applies(route.when, host, plugin.operation || operation, plugin.manifest)) continue;
      const adapter = route.adapters?.[host.profile] || route.adapters?.[host.router] || route;
      if (!adapter.entry) throw new Error(`Route ${route.path} has no ${host.profile} entry.`);
      const segments = String(route.path).split("/").filter(Boolean);
      if (!String(route.path).startsWith("/") || segments.some((part) => [".", ".."].includes(part) || /[\\:< >"|?*]/.test(part))) {
        throw new Error(`Unsupported route path: ${route.path}`);
      }
      const extension = adapter.extension || "tsx";
      if (!["tsx", "jsx", "ts", "js"].includes(extension)) throw new Error("Unsupported route file extension.");
      const directory = path.join(host.routeDirectory, ...segments);
      const destination = path.join(directory, `${host.router === "app" ? "page" : "index"}.${extension}`);
      const routeIndex = await getExistingRoutes();
      if (routeIndex.has(routeKey(segments))) throw new Error(`Route already exists: ${route.path}`);
      const source = inside(inside(cwd, moduleRoot(plugin)), adapter.entry);
      if (!await exists(source)) throw new Error(`Route entry has not been installed: ${adapter.entry}`);
      let specifier = path.relative(path.dirname(inside(cwd, destination)), source).replaceAll(path.sep, "/").replace(/\.[jt]sx?$/, "");
      if (!specifier.startsWith(".")) specifier = `./${specifier}`;
      const exports = ["default", ...(adapter.exports || [])];
      if (!exports.every((name) => /^[A-Za-z_$][\w$]*$/.test(name))) throw new Error("Invalid route export name.");
      const configNames = host.router === "app"
        ? ["dynamic", "dynamicParams", "revalidate", "fetchCache", "runtime", "preferredRegion", "maxDuration"] : ["config"];
      const routeConfig = Object.entries(adapter.config || {}).map(([name, value]) => {
        if (!configNames.includes(name)) throw new Error(`Unsupported ${host.router} route config export: ${name}`);
        if (exports.includes(name)) throw new Error(`Route export ${name} is declared twice.`);
        return `export const ${name} = ${JSON.stringify(value)};\n`;
      }).join("");
      await writeOwned(plugin.manifest.id, destination, `// Generated by the plugin installer.\nexport { ${[...new Set(exports)].join(", ")} } from ${JSON.stringify(specifier)};\n${routeConfig}`);
      routeIndex.add(routeKey(segments));
    }
    registered.push({ id: plugin.manifest.id, version: plugin.manifest.version, contributions: plugin.manifest.contributions || {} });
  };
  const translate = async (plugin) => {
    for (const translation of plugin.manifest.contributions?.translations || []) {
      const locale = translation.locale;
      if (!/^[a-z0-9_-]+$/i.test(locale)) throw new Error("Invalid translation locale.");
      const destination = path.join("public/locales", `${locale}.json`);
      const data = await readJson(inside(cwd, destination), {});
      const key = `plugin:${plugin.manifest.id}`;
      if (Object.hasOwn(data, key)) throw new Error(`Translation namespace already exists: ${key}`);
      const translationData = await readJson(inside(plugin.directory, translation.from));
      data[key] = translationData;
      // Locale files are merged only in the candidate; the original checkout is untouched.
      await source.capture(destination);
      await fs.mkdir(path.dirname(inside(cwd, destination)), { recursive: true });
      await fs.writeFile(inside(cwd, destination), `${JSON.stringify(data, null, 2)}\n`);
      owned[`${destination}#${key}`] = { pluginId: plugin.manifest.id, namespace: key, file: destination, hash: hashValue(translationData) };
    }
  };
  const dependencies = async () => {
    if (dependenciesDone) return;
    progress("Installing dependencies in the isolated app (this may take a few minutes)");
    const pkgFile = path.join(cwd, "package.json");
    await source.capture("package.json");
    await source.capture("package-lock.json");
    const pkg = await readJson(pkgFile);
    let changed = false;
    for (const plugin of plugins) {
      for (const section of ["dependencies", "devDependencies"]) {
        for (const [name, version] of Object.entries(plugin.package[section] || {})) {
          const current = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
          if (current !== undefined && current !== version) throw new Error(`Dependency ${name} conflicts with the host or another plugin.`);
          if (current === undefined) { pkg[section] ??= {}; pkg[section][name] = version; changed = true; }
        }
      }
    }
    if (changed) await writeJson(pkgFile, pkg, { mode: (await fs.stat(pkgFile)).mode & 0o777 });
    if (host.commands["host.dependencies"]) {
      await execute(host.commands["host.dependencies"], { cwd, env }, signal);
    } else {
      if (await exists(path.join(cwd, "pnpm-lock.yaml")) && !await exists(path.join(cwd, "package-lock.json"))) {
        throw new Error("Configure host.dependencies for this package manager; the default runner uses npm.");
      }
      const npmArgs = (args) => ({ npmArgs: [...args, "--cache", path.join(host.stateRoot, "cache/npm")] });
      if (changed || !await exists(path.join(cwd, "package-lock.json"))) {
        await execute(npmArgs(["install", "--package-lock-only", "--ignore-scripts"]), { cwd, env }, signal);
      }
      await execute(npmArgs(["ci", "--include=dev"]), { cwd, env }, signal);
    }
    dependenciesDone = true;
  };
  const build = async (timeoutMs) => {
    if (buildDone) return;
    await dependencies();
    progress("Building the isolated app");
    const registryFile = path.join(moduleSourceDirectory, "plugins", "registry.json");
    await writeOwned("host", registryFile, `${JSON.stringify(registered, null, 2)}\n`, { allowEmptyRegistry: true });
    await execute({ ...host.commands["host.build"], ...(timeoutMs ? { timeoutMs } : {}) }, { cwd, env }, signal);
    buildDone = true;
  };
  const completed = new Set();
  for (const plugin of plugins) {
    plugin.resolvedConfiguration = resolveConfiguration(host, plugin);
    if (plugin.resolvedConfiguration.hasPublic) {
      await writeOwned(`host-config:${plugin.manifest.id}`, path.join(moduleRoot(plugin), "config.json"), `${JSON.stringify(plugin.resolvedConfiguration.public, null, 2)}\n`);
    }
  }
  const phaseRank = { integrate: 0, dependencies: 1, build: 2 };
  const steps = plugins.flatMap((plugin) => plugin.instructions.steps.map((step, index) => ({ plugin, step, index })));
  // Merge at phase boundaries so a multi-plugin release installs dependencies and builds once.
  const phases = steps.map(({ step }) => Object.hasOwn(phaseRank, step.phase) ? phaseRank[step.phase] : undefined);
  if (phases.some((rank) => rank === undefined)) throw new Error("Unknown or deferred verification phase in instructions.json.");
  for (const plugin of plugins) {
    let previous = -1;
    let requestedBuild = false;
    for (const step of plugin.instructions.steps) {
      const rank = phaseRank[step.phase];
      if (rank < previous) throw new Error(`Instruction order conflicts with release phases: ${step.id}`);
      const isBuild = step.action === "command.run" && step.with?.commandId === "host.build";
      if (requestedBuild && !isBuild) throw new Error(`Instruction follows the final host.build request: ${step.id}`);
      requestedBuild ||= isBuild;
      previous = rank;
    }
  }
  const isBuildRequest = ({ step }) => step.action === "command.run" && step.with?.commandId === "host.build";
  steps.sort((a, b) => phaseRank[a.step.phase] - phaseRank[b.step.phase] || Number(isBuildRequest(a)) - Number(isBuildRequest(b)));
  for (const { plugin, step } of steps) {
    if (signal?.aborted) throw new Error("Job interrupted.");
    const key = `${plugin.manifest.id}:${step.id}`;
    if (!applies(step.when, host, plugin.operation || operation, plugin.manifest)) {
      job.steps.push({ pluginId: plugin.manifest.id, id: step.id, status: "skipped" });
      continue;
    }
    for (const dependency of step.dependsOn || []) {
      if (!completed.has(`${plugin.manifest.id}:${dependency}`)) throw new Error(`Unfinished prerequisite ${dependency} for ${key}`);
    }
    const timing = { pluginId: plugin.manifest.id, id: step.id, status: "running", startedAt: Date.now() };
    job.steps.push(timing);
    await record();
    try {
      if (!["dependencies.ensure", "command.run"].includes(step.action)) progress(`${plugin.manifest.id}: ${step.action}`);
      if (buildDone && !(step.action === "command.run" && step.with?.commandId === "host.build")) throw new Error("No operations may run after the host build.");
      if (step.action === "files.install") await installFiles(plugin, step.with?.mappingRef);
      else if (step.action === "files.append") timing.files = await applyAppendRules({
        plugin, host, cwd, options: step.with, operation: plugin.operation || operation,
        owned, applies, state: appendState, capture: (name) => source.capture(name),
      });
      else if (step.action === "contributions.register") await register(plugin);
      else if (step.action === "translations.merge") await translate(plugin);
      else if (step.action === "dependencies.ensure") await dependencies();
      else if (step.action === "command.run") {
        const commandId = step.with?.commandId;
        if (commandId === "host.build") await build(step.timeoutMs);
        else if (commandId === "host.dependencies") await dependencies();
        else {
          const command = Object.hasOwn(host.commands, commandId) ? host.commands[commandId] : undefined;
          if (!command || ["host.checkSource", "host.checkOutput", "host.activate", "host.recover"].includes(commandId)) throw new Error(`Unknown, deferred, or lifecycle-only command: ${commandId}`);
          const configuration = plugin.resolvedConfiguration;
          progress(`${plugin.manifest.id}: running ${commandId}`);
          await execute({ ...command, ...(step.timeoutMs ? { timeoutMs: step.timeoutMs } : {}) }, {
            cwd, env: { ...env, PLUGIN_ID: plugin.manifest.id, PLUGIN_PUBLIC_CONFIG: JSON.stringify(configuration.public), PLUGIN_INSTALLER_CONFIG: JSON.stringify(configuration.installer) },
            redactions: configuration.privateStrings,
          }, signal);
        }
      } else throw new Error(`Unsupported action: ${step.action}`);
      completed.add(key);
      timing.status = "completed";
    } catch (error) { timing.status = "failed"; throw error; }
    finally { timing.durationMs = Date.now() - timing.startedAt; await record(); }
  }
  await build();
  const appendHashes = new Map();
  for (const ownership of Object.values(owned)) {
    if (ownership.kind !== "append") continue;
    if (!appendHashes.has(ownership.file)) appendHashes.set(ownership.file, await hashFile(inside(cwd, ownership.file)));
    ownership.hash = appendHashes.get(ownership.file);
  }
  for (const [name, ownership] of Object.entries(owned)) {
    if (ownership.namespace || ownership.kind === "append") continue;
    const file = (ownership.file || name).replaceAll(path.sep, "/");
    if (appendHashes.has(file)) ownership.hash = appendHashes.get(file);
  }
  return { owned, contributions: registered, sourceChanges: await source.finish() };
}
