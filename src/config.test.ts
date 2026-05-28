import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { CONFIG_FILENAME, loadConfig } from "./config.ts";

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "refract-cfg-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeConfig(obj: unknown): void {
  writeFileSync(path.join(root, CONFIG_FILENAME), JSON.stringify(obj));
}

test("loadConfig returns resolved defaults when no file exists", () => {
  const cfg = loadConfig(root);
  assert.equal(cfg.sourceDir, path.join(root, "source"));
  assert.equal(cfg.outDir, path.join(root, "dist"));
  assert.deepEqual(cfg.targets, {});
});

test("loadConfig expands ~ in target paths", () => {
  writeConfig({ targets: { skills: "~/.claude/skills" } });
  const cfg = loadConfig(root);
  assert.equal(cfg.targets.skills, path.join(homedir(), ".claude", "skills"));
});

test("loadConfig resolves relative target paths against root", () => {
  writeConfig({ targets: { docs: "./site/docs" } });
  const cfg = loadConfig(root);
  assert.equal(cfg.targets.docs, path.join(root, "site", "docs"));
});

test("loadConfig keeps absolute target paths untouched", () => {
  writeConfig({ targets: { mcp: "/etc/mcp/tools" } });
  const cfg = loadConfig(root);
  assert.equal(cfg.targets.mcp, "/etc/mcp/tools");
});

test("loadConfig rejects unknown top-level keys", () => {
  writeConfig({ surprise: true });
  assert.throws(() => loadConfig(root), /surprise/);
});

test("loadConfig reports invalid JSON with the filename", () => {
  writeFileSync(path.join(root, CONFIG_FILENAME), "{ not json");
  assert.throws(() => loadConfig(root), /Invalid JSON in refract\.config\.json/);
});
