import { hashValue, readJson, path } from "./io.mjs";

function privateStrings(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === "object") return Object.values(value).flatMap(privateStrings);
  const text = String(value);
  return text ? [text, ...(typeof value === "string" ? [JSON.stringify(value).slice(1, -1)] : [])] : [];
}

export async function readOperatorConfiguration(root) {
  try { return await readJson(path.join(root, "plugin-config.local.json"), {}); }
  catch { throw new Error("Cannot read plugin-config.local.json. Check its JSON syntax and file access."); }
}

export function resolveConfiguration(host, plugin, { requireInstaller = true } = {}) {
  const declaration = plugin.manifest.configuration || {};
  const supplied = Object.hasOwn(host.pluginConfiguration, plugin.manifest.id) ? host.pluginConfiguration[plugin.manifest.id] : {};
  const resolveSection = (section) => {
    const spec = declaration[section] || {};
    let values = { ...spec.defaults };
    for (const [key, variable] of Object.entries(spec.env || {})) {
      if (typeof variable !== "string") throw new Error(`Configuration env reference must be a variable name: ${plugin.manifest.id}.${section}.${key}`);
      if (host.environment[variable] !== undefined) values = { ...values, [key]: host.environment[variable] };
    }
    values = { ...values, ...supplied?.[section] };
    if (section !== "installer" || requireInstaller) {
      for (const key of spec.required || []) if (!Object.hasOwn(values, key) || values[key] === undefined || values[key] === null || values[key] === "") {
        throw new Error(`Missing configuration: ${plugin.manifest.id}.${section}.${key}`);
      }
    }
    return values;
  };
  const publicValues = resolveSection("public");
  const installer = resolveSection("installer");
  return {
    public: publicValues, installer,
    hasPublic: Boolean(declaration.public) || Object.keys(supplied?.public || {}).length > 0,
    privateStrings: privateStrings(installer),
  };
}

export function publicConfigurationHash(host, plugins) {
  const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
  return hashValue(plugins.map((plugin) => ({ id: plugin.manifest.id, public: canonical(resolveConfiguration(host, plugin, { requireInstaller: false }).public) })));
}
