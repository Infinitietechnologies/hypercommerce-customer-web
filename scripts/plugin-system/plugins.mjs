import { fileURLToPath } from "node:url";
import { fs, path } from "./io.mjs";
import { loadHost, readPlugin, deferredChecks } from "./plan.mjs";
import { readRegistry, readAppliedRelease, applyChange, planChange, selectRelease } from "./releases.mjs";
import { applyLocal, undoLocal } from "./local-project.mjs";
import { pruneState } from "./retention.mjs";
import { simpleWorkflow } from "./simple-workflow.mjs";
import { formatDetailedCommand, formatInstalledPlugins, formatSimpleOperation } from "./output.mjs";

const help = `HyperCommerce frontend plugin runner

Simple commands (complete the whole local operation):
  npm run plugins:install                     Install/update all packages in plugins/
  npm run plugins:install -- <plugin-id>      Install/update one plugin
  npm run plugins:list                        List locally applied plugin IDs and versions
  npm run plugins:uninstall                   Remove all installed contributions
  npm run plugins:uninstall -- <plugin-id>     Remove one plugin's contributions
  npm run plugins:revert                      Revert only the latest successful operation once

Usage: npm run plugins -- <command> [directories or IDs] [options]

  inspect <directory>       Read package metadata and ordered instructions
  plan <directories...>     Preview installation without running package code
  install <directories...>  Prepare and build a release containing new plugins
  update <directories...>   Prepare replacement plugin versions
  disable <IDs...>          Prepare a release without their contributions
  enable <IDs...>           Re-enable installed packages
  uninstall <IDs...>        Remove contributions while retaining package history
  apply --release <ID>      Apply a prepared candidate's source changes locally
  undo                     Undo the last local apply or recover a pending apply
  prune --keep <N>          Remove unprotected old state artifacts (default 3)
  activate --release <ID>   Activate a prepared release using a host command
  rollback --release <ID>   Select a previous prepared release
  list                     List locally applied plugins (use --json for structured output)
  status                   Show installed and active/prepared release state

Options:
  --profile <profile>       auto, pages-server, pages-export, app-server, app-export
  --dry-run                 Preview changes without a build or state changes
  --json                    Print the full result as JSON
  --text                    Print readable output even when redirected
  --activate                Run the configured host.activate command after building
  --root <directory>        Host project (defaults to this script's project)
  --state-dir <directory>   Release storage outside the host source tree
  --release <ID>            Release selected by apply, activate or rollback
  --keep <N>                Recent candidates/local transactions retained by prune
  --help, -h               Show this help

To select a specific input folder, use npm run plugins:install -- ./plugins/<folder>.
Default invocation creates only the empty plugins/ folder and displays status.
Use files.install for standalone modules and files.append for selected shared
source files. The installer is terminal-only; application hosting stays separate.
No init command or automatic sample generation is provided. Import folders; ZIP import
is deferred. Validation and verification are deferred and are never reported as
passed. Existing checks in the host build command continue to run.
`;

function parse(args) {
  const options = {};
  const positional = [];
  const values = { "--profile": "profile", "--root": "root", "--state-dir": "stateDir", "--release": "release", "--keep": "keep" };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--text") options.text = true;
    else if (argument === "--activate") options.activate = true;
    else if (Object.hasOwn(values, argument)) {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      options[values[argument]] = value;
    } else if (argument.startsWith("-")) throw new Error(`Unknown option: ${argument}`);
    else positional.push(argument);
  }
  return { options, command: positional.shift() || "status", targets: positional };
}

const controller = new AbortController();
let progressTimer;
function progressOptions(options) {
  if (options.json || options.dryRun) return options;
  let step = 0;
  return { ...options, onProgress(message) {
    clearInterval(progressTimer);
    const number = ++step;
    const started = Date.now();
    console.log(`[${number}] ${message}...`);
    progressTimer = setInterval(() => {
      console.log(`    Step ${number} still running (${Math.floor((Date.now() - started) / 1000)}s elapsed)...`);
    }, 15_000);
    progressTimer.unref();
  } };
}
const interrupt = () => controller.abort();
process.on("SIGINT", interrupt);
process.on("SIGTERM", interrupt);
try {
  const args = process.argv.slice(2);
  const { command, targets, options } = parse(args);
  if (options.help || command === "help") console.log(help);
  else {
    const root = path.resolve(options.root || fileURLToPath(new URL("../../", import.meta.url)));
    if (!args.length) await fs.mkdir(path.join(root, "plugins"), { recursive: true });
    const host = await loadHost(root, options);
    let result;
    let simpleAction;
    if (["install-all", "uninstall-all", "revert"].includes(command)) {
      if (options.release || options.activate) throw new Error("Simple commands take no release or activation arguments.");
      if (targets.length > (command === "revert" ? 0 : 1)) {
        throw new Error(command === "revert" ? "Revert takes no package arguments."
          : command === "install-all" ? "Specify one plugin ID or package directory, or omit it to install all."
            : "Specify one plugin ID, or omit it to uninstall all.");
      }
      simpleAction = command === "install-all" ? "install" : command === "uninstall-all" ? "uninstall" : "revert";
      result = await simpleWorkflow(host, simpleAction, progressOptions({ ...options, target: targets[0] }), controller.signal);
    } else if (command === "list") {
      if (targets.length || options.release || options.activate) throw new Error("List takes no package, release or activation arguments.");
      const registry = await readRegistry(host);
      const applied = await readAppliedRelease(host, registry);
      const plugins = Object.values(applied?.plugins || {})
        .map(({ id, version, enabled }) => ({ id, version, enabled }))
        .sort((a, b) => a.id.localeCompare(b.id));
      const pending = Boolean(registry.workflow?.pendingOperation || registry.local?.pendingTransaction);
      result = { plugins, pending };
    } else if (command === "status") {
      const registry = await readRegistry(host);
      result = { profile: host.profile, pluginDirectory: path.join(root, "plugins"), stateDirectory: host.stateRoot, ...registry, deferredChecks };
    } else if (command === "inspect") {
      if (targets.length !== 1) throw new Error("inspect needs one extracted plugin directory.");
      const plugin = await readPlugin(path.resolve(root, targets[0]));
      // Do not echo package configuration or potential credentials to the terminal.
      result = { id: plugin.manifest.id, version: plugin.manifest.version, steps: plugin.instructions.steps.map(({ id, phase, action, when }) => ({ id, phase, action, when })), deferredChecks };
    } else if (command === "plan") result = await planChange(host, "install", targets);
    else if (command === "apply") {
      if (!options.release || targets.length) throw new Error("apply requires --release <ID> and no package arguments.");
      result = await applyLocal(host, options.release, options, controller.signal);
    } else if (command === "undo") {
      if (targets.length) throw new Error("undo takes no package arguments.");
      if ((await readRegistry(host)).workflow) {
        simpleAction = "revert";
        result = await simpleWorkflow(host, "revert", progressOptions(options), controller.signal);
      } else result = await undoLocal(host, options);
    } else if (command === "prune") {
      if (targets.length) throw new Error("prune takes no package arguments.");
      result = await pruneState(host, options);
    } else if (["install", "update", "disable", "enable", "uninstall"].includes(command)) {
      result = options.dryRun ? await planChange(host, command, targets) : await applyChange(host, command, targets, options, controller.signal);
    } else if (["rollback", "activate"].includes(command)) {
      if (!options.release) throw new Error(`${command} requires --release <ID>.`);
      result = await selectRelease(host, command, options.release, options, controller.signal);
    } else throw new Error(`Unknown command: ${command}. Run npm run plugins -- --help.`);
    const textOutput = !options.json && (simpleAction || command === "list" || options.text || process.stdout.isTTY);
    if (!textOutput) console.log(JSON.stringify(result, null, 2));
    else if (command === "list") console.log(formatInstalledPlugins(result.plugins, result.pending));
    else if (simpleAction) console.log(`${options.dryRun ? "" : "\n"}${formatSimpleOperation(simpleAction, result, targets[0])}`);
    else console.log(formatDetailedCommand(command, result, options.dryRun));
  }
} catch (error) {
  console.error(`Plugin runner: ${error.message}`);
  process.exitCode = controller.signal.aborted ? 130 : 1;
} finally {
  clearInterval(progressTimer);
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", interrupt);
}
