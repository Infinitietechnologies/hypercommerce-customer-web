import { fs, path, inside, identifier, readJson, hashFile } from "./io.mjs";

export function appendReferences(options = {}) {
  const references = options.rulesRefs ?? (options.rulesRef === undefined ? [] : [options.rulesRef]);
  if (!Array.isArray(references) || !references.length || references.some((value) => typeof value !== "string" || !value)) {
    throw new Error("files.append needs rulesRef or an ordered rulesRefs array.");
  }
  return references;
}

export async function readAppendRules(plugin, reference) {
  const references = plugin.manifest.appendRules || {};
  if (!Object.hasOwn(references, reference) || typeof references[reference] !== "string") {
    throw new Error(`Unknown append rules reference: ${reference}`);
  }
  const file = references[reference];
  const document = await readJson(inside(plugin.directory, file));
  if (!Array.isArray(document.rules)) throw new Error(`Append rules file needs a rules array: ${file}`);
  return { file, rules: document.rules };
}

async function selectedTarget(cwd, name, allowedTargets) {
  if (typeof name !== "string" || !name) throw new Error("An append rule needs an explicit target file.");
  const requested = inside(cwd, name);
  if ((await fs.lstat(requested)).isSymbolicLink()) throw new Error(`Linked append target is unsupported: ${name}`);
  const absolute = inside(cwd, path.relative(cwd, await fs.realpath(requested)));
  const relative = path.relative(cwd, absolute).replaceAll(path.sep, "/");
  const first = relative.split("/")[0];
  if ([".git", ".next", "node_modules", "out", "dist", "build", "coverage"].includes(first)
    || relative.startsWith("scripts/plugin-system/") || /^\.env(?:\.|$)/.test(path.basename(relative))
    || !/\.(?:[cm]?[jt]sx?|css|scss)$/.test(relative)) {
    throw new Error(`Append target must be a source file outside installer/control/build files: ${name}`);
  }
  const comparePath = (value) => process.platform === "win32" ? value.toLowerCase() : value;
  if (allowedTargets && !allowedTargets.some((target) => comparePath(inside(cwd, target)) === comparePath(absolute))) {
    throw new Error(`Append target is not in the host's appendTargets: ${name}`);
  }
  return { absolute, relative };
}

function startOffset(content) {
  let offset = content.startsWith("\uFEFF") ? 1 : 0;
  if (content.startsWith("#!", offset)) {
    const end = content.indexOf("\n", offset);
    offset = end === -1 ? content.length : end + 1;
  }
  // Imports must follow Next.js client/server directives and the JS directive prologue.
  for (;;) {
    const trivia = content.slice(offset).match(/^(?:\s|\/\/[^\r\n]*(?:\r?\n|$)|\/\*[\s\S]*?\*\/)*/)[0];
    const directive = content.slice(offset + trivia.length).match(/^(["'])(?:use client|use server|use strict)\1[ \t]*(?:;[ \t]*|\r?\n|$)/);
    if (!directive) return offset;
    offset += trivia.length + directive[0].length;
  }
}

function anchorOffset(content, rule, eol) {
  if (typeof rule.anchor !== "string" || !rule.anchor) throw new Error(`Append rule needs a literal anchor: ${rule.id}`);
  const anchor = rule.anchor.replace(/\r\n|\r|\n/g, eol);
  const matches = [];
  for (let index = content.indexOf(anchor); index !== -1; index = content.indexOf(anchor, index + anchor.length)) matches.push(index);
  const occurrence = rule.occurrence ?? "unique";
  if (!matches.length || (occurrence === "unique" && matches.length !== 1)) throw new Error(`Append anchor must occur exactly once unless occurrence is specified: ${rule.id}`);
  const ordinal = occurrence === "first" || occurrence === "unique" ? 0 : occurrence === "last" ? matches.length - 1
    : Number.isInteger(occurrence) && occurrence > 0 ? occurrence - 1 : -1;
  if (ordinal < 0 || ordinal >= matches.length) throw new Error(`Append anchor occurrence is unavailable: ${rule.id}`);
  return matches[ordinal] + (rule.position === "after" ? anchor.length : 0);
}

function insert(content, source, plugin, reference, rule, cursors) {
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const style = rule.commentStyle || "block";
  if (!["block", "jsx"].includes(style)) throw new Error(`Unknown append commentStyle: ${style}`);
  const comment = (tag) => style === "jsx" ? `{/* ${tag} */}` : `/* ${tag} */`;
  const prefix = `hyperlocal-plugin:${plugin.manifest.id}:${encodeURIComponent(reference)}:${rule.id}`;
  const begin = comment(`${prefix}:start`);
  const end = comment(`${prefix}:end`);
  const snippet = source.replace(/^\uFEFF/, "").replace(/\r\n|\r|\n/g, eol).replace(/(?:\r?\n)+$/, "");
  const block = `${begin}${eol}${snippet}${eol}${end}`;
  const position = rule.position || "end";
  if (!["start", "end", "before", "after"].includes(position)) throw new Error(`Unknown append position: ${position}`);
  const cursorKey = JSON.stringify([position, rule.anchor, rule.occurrence]);
  const remember = (result) => {
    if (!["start", "after"].includes(position)) return;
    const previous = cursors.get(cursorKey);
    if (!previous || result.indexOf(end) >= result.indexOf(previous)) cursors.set(cursorKey, end);
  };
  const beginIndex = content.indexOf(begin);
  const endIndex = content.indexOf(end);
  if (beginIndex !== -1 || endIndex !== -1) {
    if (beginIndex < 0 || endIndex < beginIndex || content.indexOf(begin, beginIndex + 1) !== -1 || content.indexOf(end, endIndex + 1) !== -1) throw new Error(`Incomplete or repeated managed append markers: ${rule.id}`);
    if (content.slice(beginIndex, endIndex + end.length) !== block) throw new Error(`Managed append block differs from the requested rule: ${rule.id}`);
    remember(content);
    return { content, status: "unchanged" };
  }
  let offset;
  if (["start", "end"].includes(position)) {
    if (rule.anchor !== undefined) throw new Error(`Start/end append must not specify an anchor: ${rule.id}`);
    offset = position === "start" ? startOffset(content) : content.length;
  } else offset = anchorOffset(content, { ...rule, position }, eol);
  const previous = cursors.get(cursorKey);
  if (["start", "after"].includes(position) && previous && content.indexOf(previous) >= offset) offset = content.indexOf(previous) + previous.length;
  const leading = offset > 0 && content[offset - 1] !== "\n" ? eol : "";
  const result = content.slice(0, offset) + leading + block + eol + content.slice(offset);
  remember(result);
  return { content: result, status: "appended" };
}

export async function applyAppendRules({ plugin, host, cwd, options, operation, owned, applies, state, capture }) {
  const pending = new Map();
  const selected = new Map();
  const results = [];
  for (const reference of appendReferences(options)) {
    const { rules } = await readAppendRules(plugin, reference);
    const ids = new Set();
    for (const rule of rules) {
      identifier(rule.id);
      if (ids.has(rule.id)) throw new Error(`Duplicate append rule ID: ${rule.id}`);
      ids.add(rule.id);
      if (!applies(rule.when, host, operation, plugin.manifest)) { results.push({ reference, id: rule.id, status: "skipped" }); continue; }
      if (!selected.has(rule.target)) selected.set(rule.target, await selectedTarget(cwd, rule.target, host.config.appendTargets));
      const { absolute, relative } = selected.get(rule.target);
      let file = pending.get(relative);
      if (!file) {
        if (!(await fs.lstat(absolute)).isFile()) throw new Error(`Append target must be an existing regular file: ${rule.target}`);
        const original = await fs.readFile(absolute, "utf8");
        if (!state.has(relative)) state.set(relative, new Map());
        file = { absolute, original, content: original, owners: [], cursors: new Map(state.get(relative)) };
        pending.set(relative, file);
      }
      if ((typeof rule.source === "string") === (typeof rule.content === "string")) throw new Error(`Append rule needs exactly one of source or content: ${rule.id}`);
      const source = typeof rule.content === "string" ? rule.content : await fs.readFile(inside(plugin.directory, rule.source), "utf8");
      const inserted = insert(file.content, source, plugin, reference, rule, file.cursors);
      file.content = inserted.content;
      file.owners.push({ pluginId: plugin.manifest.id, ruleId: rule.id, reference });
      results.push({ reference, id: rule.id, target: relative, status: inserted.status });
    }
  }
  // All selected rules resolve before writes, and each target is written at most once per step.
  for (const [relative, file] of pending) {
    await capture(relative);
    if (file.content !== file.original) await fs.writeFile(file.absolute, file.content);
    state.set(relative, file.cursors);
    const hash = await hashFile(file.absolute);
    for (const owner of file.owners) owned[`${relative}#append:${owner.pluginId}:${owner.reference}:${owner.ruleId}`] = {
      ...owner, kind: "append", file: relative, hash,
    };
  }
  return results;
}
