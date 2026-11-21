function table(rows) {
  const widths = rows[0].map((_, column) => rows.reduce((width, row) => Math.max(width, String(row[column]).length), 0));
  return rows.map((row) => {
    const cells = row.map((value, column) => String(value).padEnd(widths[column]));
    return `  ${cells.join("  ").trimEnd()}`;
  }).join("\n");
}

function block(title, ...sections) {
  return [title, ...sections.filter(Boolean)].join("\n\n");
}

function list(items) {
  return items.length ? items.map((item) => `  ${item}`).join("\n") : "  None";
}

function pathList(items) {
  const limit = 8;
  const shown = items.slice(0, limit);
  if (items.length > limit) shown.push(`… and ${items.length - limit} more. Use --json for the full list.`);
  return list(shown);
}

function pluginTable(plugins) {
  if (!plugins.length) return list([]);
  const rows = plugins.map(({ id, version, enabled }) => [id, version, enabled ? "enabled" : "disabled"]);
  return table([["ID", "Version", "Status"], ...rows]);
}

export function formatInstalledPlugins(plugins, pending) {
  return block("Installed plugins", pluginTable(plugins), pending && "A plugin operation is in progress or needs recovery.");
}

export function formatSimpleOperation(action, result, target) {
  const title = `Plugin ${action}${result.status === "planned" ? " preview" : ""}`;
  if (action === "revert") {
    if (result.status === "planned") {
      return block(title, result.recovering ? "Recover the interrupted operation." : "Restore the state before the latest operation.",
        result.changes.length ? `Files to restore\n${pathList(result.changes)}` : "No source files need to be restored.",
        "Preview only. No changes made.");
    }
    if (result.status === "reverted") {
      return block(title, "Reverted the latest operation.", "Revert becomes available after the next successful change.");
    }
    if (result.status === "recovered") {
      return block(title, "Recovered the interrupted operation.", "The previous revert point is available.");
    }
    return block(title, result.message);
  }

  const planned = result.status === "planned";
  const labels = action === "install" ? [
    [planned ? "Would install" : "Installed", result.installed],
    [planned ? "Would update" : "Updated", result.updated],
    [planned ? "Would enable" : "Enabled", result.enabled],
    [planned ? "Would skip" : "Skipped", result.skipped],
  ] : [[planned ? "Would remove" : "Removed", result.removed]];
  const counts = labels.filter(([, count]) => count > 0);
  const summary = counts.length ? table(counts) : result.message.replace(/^Preview: /, "");
  const scope = target ? `  Target  ${JSON.stringify(target)}` : "";
  let note = "";
  if (planned) note = "Preview only. No changes made.";
  else if (action === "uninstall" && result.removed) note = "Package folders and settings were kept.";
  return block(title, scope, summary, note);
}

export function formatDetailedCommand(command, result, dryRun) {
  if (command === "status") {
    const pending = result.workflow?.pendingOperation || result.local?.pendingTransaction;
    return block("Plugin status", table([
      ["Profile", result.profile],
      ["Applied release", result.local?.appliedRelease || "None"],
      ["Prepared release", result.latestRelease || "None"],
      ["Active release", result.activeRelease || "None"],
      ["Deployment", result.deploymentState],
    ]), result.latestRelease && `Prepared plugin set\n${pluginTable(Object.values(result.plugins))}`,
    pending && "A plugin operation is in progress or needs recovery.");
  }
  if (command === "inspect") {
    const steps = result.steps.map(({ id, phase, action }) => [id, phase, action]);
    return block(`Plugin ${result.id}`, table([["Version", result.version]]),
      steps.length ? table([["Step", "Phase", "Action"], ...steps]) : "No instruction steps.");
  }
  if (result.changes?.installed) {
    const { installed, removed } = result.changes;
    return block(`Plugin ${command === "plan" ? "install" : command} preview`, table([["Profile", result.profile]]),
      `Resulting plugin set\n${pluginTable(installed)}`,
      removed.length && `Plugins to remove\n${list(removed)}`, "Preview only. No changes made.");
  }

  const preview = dryRun ? " preview" : "";
  if (command === "prune") {
    return block(`Plugin prune${preview}`, `${dryRun ? "Paths to remove" : "Removed paths"}\n${pathList(result.remove)}`,
      dryRun && "Preview only. No changes made.");
  }
  const fields = [
    ["Result", result.status || "planned"],
    ["Release", result.release || result.appliedRelease],
    ["Candidate", result.directory],
    ["Profile", result.profile],
  ].filter(([, value]) => value);
  const changedFiles = Array.isArray(result.changes)
    ? `Source changes\n${pathList(result.changes.map((change) => typeof change === "string" ? change : `${change.action}  ${change.path}`))}`
    : "";
  return block(`Plugin ${command}${preview}`, table(fields), result.plugins && pluginTable(result.plugins),
    changedFiles, result.nextCommand && `Dependencies\n  ${result.nextCommand}`,
    dryRun && "Preview only. No changes made.");
}
