import dotenv from "dotenv";
import { fs, path, exists, readJson, inside, identifier, canonicalPath } from "./io.mjs";
import { appendReferences, readAppendRules } from "./append-rules.mjs";
import { readOperatorConfiguration, resolveConfiguration } from "./configuration.mjs";

// Read simple output declarations without evaluating the host's config or comments.
function withoutComments(source) {
  let result = "";
  let quote;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      result += char;
      if (char === "\\") result += source[++index] || "";
      else if (char === quote) quote = undefined;
    } else if (["'", '"', "`"].includes(char)) { quote = char; result += char; }
    else if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") index++;
      result += "\n";
    } else if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index++;
      index++;
      result += " ";
    } else result += char;
  }
  return result;
}

export const deferredChecks = {
  schema: "not-implemented", workflowAudit: "not-implemented", publisher: "not-implemented",
  integrityAudit: "not-implemented", licence: "not-implemented", hostCompatibility: "not-implemented",
  apiCompatibility: "not-implemented", sourceVerification: "not-implemented",
  outputVerification: "not-implemented", deploymentHealth: "not-implemented",
};

export async function loadHost(root, options = {}) {
  root = await fs.realpath(root);
  const config = await readJson(path.join(root, "plugin-host.json"), {});
  const pkg = await readJson(path.join(root, "package.json"));
  const stateRoot = await canonicalPath(path.resolve(root, options.stateDir || config.stateDir || `${root}-plugin-state`));
  const relativeState = path.relative(root, stateRoot);
  if (!relativeState.startsWith(`..${path.sep}`) && relativeState !== ".." && !path.isAbsolute(relativeState)) {
    throw new Error("Plugin state/candidate releases must live outside the application source tree.");
  }
  const environment = { ...process.env };
  for (const name of [".env.production.local", ".env.local", ".env.production", ".env"]) {
    const file = path.join(root, name);
    if (await exists(file)) {
      for (const [key, value] of Object.entries(dotenv.parse(await fs.readFile(file)))) environment[key] ??= value;
    }
  }
  const routers = [];
  for (const router of ["pages", "app"]) {
    const directory = await exists(path.join(root, router)) ? router : `src/${router}`;
    if (await exists(path.join(root, directory))) routers.push({ router, directory });
  }
  let profile = options.profile || config.profile || "auto";
  if (profile === "auto") {
    if (routers.length !== 1) throw new Error("Choose --profile explicitly for a hybrid or ambiguous router configuration.");
    let deployment = config.deployment;
    if (!deployment && environment.NEXT_PUBLIC_SSR !== undefined) deployment = environment.NEXT_PUBLIC_SSR === "true" ? "server" : "export";
    deployment ||= config.defaultDeployment;
    if (!deployment) {
      let text = "";
      for (const name of ["next.config.ts", "next.config.mts", "next.config.js", "next.config.mjs", "next.config.cjs"]) {
        if (await exists(path.join(root, name))) text = await fs.readFile(path.join(root, name), "utf8");
      }
      text = withoutComments(text);
      const tokens = text.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[\w$]+|[^\s]/g) || [];
      const declarations = tokens.flatMap((token, index) => ["output", '"output"', "'output'"].includes(token) && tokens[index + 1] === ":" ? [tokens[index + 2]] : []);
      const output = declarations.length === 1 ? declarations[0].match(/^(["'])(export|standalone)\1$/) : null;
      if (output) deployment = output[2] === "export" ? "export" : "server";
      else if (declarations.length) throw new Error("Dynamic Next.js output configuration needs an explicit --profile or plugin-host.json profile.");
      else deployment = "server";
    }
    profile = `${routers[0].router}-${deployment}`;
  }
  if (!/^(pages|app)-(server|export)$/.test(profile)) throw new Error(`Unknown profile: ${profile}`);
  const [router, deployment] = profile.split("-");
  const routeDirectory = routers.find((item) => item.router === router)?.directory;
  if (!routeDirectory) throw new Error(`The selected ${router} router does not exist in this host.`);
  const profileConfig = config.profiles?.[profile] || {};
  const buildScript = deployment === "server" && pkg.scripts?.["build:ssr"] ? "build:ssr" : "build";
  return {
    root, stateRoot, pkg, config, profile, router, deployment, routeDirectory, routers,
    environment, pluginConfiguration: await readOperatorConfiguration(root),
    sourceDirectory: await exists(path.join(root, "src")) ? "src" : "",
    env: { NEXT_PUBLIC_SSR: deployment === "server" ? "true" : "false" },
    secretValues: Object.entries(environment).filter(([key, value]) => /token|secret|password|licen[cs]e|credential|api_?key/i.test(key) && value?.length >= 6).map(([, value]) => value),
    commands: { "host.build": { npmScript: buildScript }, ...config.commands, ...profileConfig.commands },
  };
}

export async function readPlugin(directory) {
  directory = await fs.realpath(directory);
  const manifest = await readJson(path.join(directory, "plugin.json"));
  identifier(manifest.id);
  if (typeof manifest.version !== "string" || !manifest.version) throw new Error("plugin.json needs a version.");
  const instructions = await readJson(inside(directory, manifest.instructions || "instructions.json"));
  if (!Array.isArray(instructions.steps)) throw new Error("instructions.json needs an ordered steps array.");
  return { directory, manifest, instructions, package: await readJson(path.join(directory, "package.json"), {}) };
}

export function applies(when, host, operation, manifest) {
  if (!when) return true;
  const values = {
    router: host.router, profile: host.profile, deployment: host.deployment,
    operation, rendering: manifest.rendering || (host.deployment === "export" ? ["ssg", "csr"] : ["ssr", "ssg", "csr"]),
  };
  return Object.entries(when).every(([key, expected]) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown instruction condition: ${key}`);
    const actual = [].concat(values[key]);
    return [].concat(expected).some((item) => actual.includes(item));
  });
}

export async function describePlan(host, plugins, operation) {
  const configurationSecrets = plugins.flatMap((plugin) => resolveConfiguration(host, plugin).privateStrings);
  const redact = (args, command) => {
    const secrets = [...host.secretValues, ...configurationSecrets, ...Object.entries(command.env || {})
      .filter(([key]) => /token|secret|password|licen[cs]e|credential|key/i.test(key)).map(([, value]) => String(value))];
    return args?.map((argument, index) => {
      if (index && /--?(?:token|secret|password|licen[cs]e|credential|api-?key)$/i.test(args[index - 1])) return "[redacted]";
      let value = argument;
      for (const secret of secrets) if (secret) value = value.replaceAll(secret, "[redacted]");
      return value.replace(/((?:token|secret|password|licen[cs]e|api[_-]?key)=)[^&\s]+/ig, "$1[redacted]");
    });
  };
  return {
    operation, profile: host.profile, router: host.router, deployment: host.deployment,
    stateDirectory: host.stateRoot, activation: "prepared-only unless --activate is supplied",
    plugins: await Promise.all(plugins.map(async (plugin) => ({
      id: plugin.manifest.id, version: plugin.manifest.version,
      configuration: (() => {
        const resolved = resolveConfiguration(host, plugin);
        return { publicKeys: Object.keys(resolved.public), installerKeys: Object.keys(resolved.installer) };
      })(),
      fileMappings: plugin.manifest.fileMappings || { "frontend-files": [
        { from: "src", to: "{pluginRoot}/src" }, { from: "assets (if present)", to: "{assetsRoot}" },
      ] },
      routes: (plugin.manifest.contributions?.routes || []).map(({ path: route, entry, adapters }) => ({ path: route, adapter: adapters?.[host.profile] || adapters?.[host.router] || { entry } })),
      appendRules: (await Promise.all(plugin.instructions.steps.filter((step) => step.action === "files.append" && applies(step.when, host, plugin.operation || operation, plugin.manifest)).flatMap((step) => appendReferences(step.with)).map(async (reference) => {
        const document = await readAppendRules(plugin, reference);
        return { reference, file: document.file, rules: document.rules.map((rule) => ({
          id: rule.id, target: rule.target, source: rule.source, position: rule.position || "end", anchor: rule.anchor,
          occurrence: rule.occurrence, inlineContent: typeof rule.content === "string",
          applies: applies(rule.when, host, plugin.operation || operation, plugin.manifest),
        })) };
      }))),
      steps: plugin.instructions.steps.map((step) => ({
        id: step.id, phase: step.phase, action: step.action,
        dependsOn: step.dependsOn, when: step.when,
        commandId: step.with?.commandId,
        applies: applies(step.when, host, plugin.operation || operation, plugin.manifest),
      })),
    }))),
    commands: Object.fromEntries(Object.entries(host.commands).map(([id, command]) => [id, {
      npmScript: command.npmScript, executable: command.executable, args: redact(command.args, command),
    }])),
    deferredChecks,
  };
}
