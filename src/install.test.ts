import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import type { Config } from "./config.ts";
import { installTargets } from "./install.ts";

let root: string;
let outDir: string;
let targetDir: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "refract-install-"));
  outDir = path.join(root, "dist");
  targetDir = path.join(root, "live", "skills");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function config(targets: Record<string, string>): Config {
  return {
    root,
    sourceDir: path.join(root, "source"),
    outDir,
    targets,
  };
}

function emit(adapter: string, rel: string, content: string): void {
  const full = path.join(outDir, adapter, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

test("installTargets copies an adapter subtree into its target", () => {
  emit("skills", path.join("commits", "SKILL.md"), "skill body");

  const report = installTargets(config({ skills: targetDir }));

  assert.equal(report.installed.length, 1);
  assert.equal(report.installed[0].files, 1);
  assert.equal(report.installed[0].target, targetDir);

  const copied = readFileSync(
    path.join(targetDir, "commits", "SKILL.md"),
    "utf8",
  );
  assert.equal(copied, "skill body");
});

test("installTargets reports a configured adapter with nothing built", () => {
  const report = installTargets(config({ skills: targetDir }));
  assert.deepEqual(report.missing, ["skills"]);
  assert.equal(report.installed.length, 0);
});

test("installTargets counts files recursively across entries", () => {
  emit("skills", path.join("a", "SKILL.md"), "a");
  emit("skills", path.join("b", "SKILL.md"), "b");

  const report = installTargets(config({ skills: targetDir }));
  assert.equal(report.installed[0].files, 2);
});

test("installTargets is a no-op when no targets are configured", () => {
  emit("skills", path.join("commits", "SKILL.md"), "x");
  const report = installTargets(config({}));
  assert.deepEqual(report.installed, []);
  assert.deepEqual(report.missing, []);
});
