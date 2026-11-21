#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const git = (args) => execFileSync("git", args, {
  cwd: root, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
}).trim();

// Isolated installer candidates have no Git directory and must not alter host Git.
if (!existsSync(path.join(root, ".git"))) {
  console.log("Git hook setup skipped outside a checkout.");
} else {
  const repository = git(["rev-parse", "--show-toplevel"]);
  const canonical = (value) => process.platform === "win32" ? realpathSync(value).toLowerCase() : realpathSync(value);
  if (canonical(repository) !== canonical(root)) {
    throw new Error("Git hook setup must run at the storefront repository root.");
  }
  let existing = "";
  try { existing = git(["config", "--get", "core.hooksPath"]); } catch { /* No custom path. */ }
  if (existing && existing !== ".githooks") {
    console.warn(`Existing core.hooksPath is ${existing}. Add npm run check:plugin-commit to that pre-commit hook.`);
  } else {
    chmodSync(path.join(root, ".githooks/pre-commit"), 0o755);
    git(["config", "--local", "core.hooksPath", ".githooks"]);
    console.log("Storefront plugin commit check enabled through .githooks.");
  }
}
