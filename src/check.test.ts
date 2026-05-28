import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { checkTargets } from "./check.ts";
import type { Config } from "./config.ts";

let root: string;
let builtOut: string;
let target: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "refract-check-"));
  builtOut = path.join(root, "built");
  target = path.join(root, "target");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function config(targets: Record<string, string>): Config {
  return { root, sourceDir: path.join(root, "source"), outDir: builtOut, targets };
}

function write(dir: string, rel: string, content: string): void {
  const full = path.join(dir, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

test("checkTargets reports no drift when target matches build", () => {
  write(builtOut, path.join("skills", "commits", "SKILL.md"), "same");
  write(target, path.join("commits", "SKILL.md"), "same");

  const report = checkTargets(config({ skills: target }), builtOut);
  assert.deepEqual(report.drift, []);
  assert.equal(report.ok, 1);
});

test("checkTargets flags a changed file as drift", () => {
  write(builtOut, path.join("skills", "commits", "SKILL.md"), "new");
  write(target, path.join("commits", "SKILL.md"), "old");

  const report = checkTargets(config({ skills: target }), builtOut);
  assert.equal(report.drift.length, 1);
  assert.equal(report.drift[0].reason, "changed");
  assert.equal(report.ok, 0);
});

test("checkTargets flags a built file missing from the target", () => {
  write(builtOut, path.join("skills", "commits", "SKILL.md"), "x");

  const report = checkTargets(config({ skills: target }), builtOut);
  assert.equal(report.drift.length, 1);
  assert.equal(report.drift[0].reason, "missing");
});

test("checkTargets ignores unrelated files already in the target", () => {
  write(builtOut, path.join("skills", "commits", "SKILL.md"), "x");
  write(target, path.join("commits", "SKILL.md"), "x");
  // a foreign skill the build never produced must not count as drift
  write(target, path.join("other-skill", "SKILL.md"), "not ours");

  const report = checkTargets(config({ skills: target }), builtOut);
  assert.deepEqual(report.drift, []);
  assert.equal(report.ok, 1);
});
