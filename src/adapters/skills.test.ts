import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import type { NeutralEntry } from "../schema.ts";
import { skillAdapter } from "./skills.ts";

let outDir: string;

beforeEach(() => {
  outDir = mkdtempSync(path.join(tmpdir(), "refract-skill-"));
});

afterEach(() => {
  rmSync(outDir, { recursive: true, force: true });
});

function entry(over: Partial<NeutralEntry> = {}): NeutralEntry {
  return {
    id: "x",
    title: "X",
    kind: "skill",
    intent: "Do the thing.",
    content: "Body.",
    sourcePath: "x.md",
    ...over,
  };
}

test("skill adapter composes description from intent + triggers", () => {
  skillAdapter.emit(entry({ triggers: ["when A", "when B"] }), outDir);
  const skill = readFileSync(
    path.join(outDir, "skills", "x", "SKILL.md"),
    "utf8",
  );
  assert.match(skill, /description: "Do the thing\. Triggers: when A; when B\."/);
});

test("skill adapter omits Triggers clause when none given", () => {
  skillAdapter.emit(entry(), outDir);
  const skill = readFileSync(
    path.join(outDir, "skills", "x", "SKILL.md"),
    "utf8",
  );
  assert.match(skill, /description: "Do the thing\."/);
  assert.doesNotMatch(skill, /Triggers:/);
});

test("skill adapter errors when description exceeds 1024 chars", () => {
  const longIntent = "x".repeat(1100);
  assert.throws(
    () => skillAdapter.emit(entry({ intent: longIntent }), outDir),
    /\[skills\].*x\.md.*1024/,
  );
});

test("skill adapter supports skill and tool kinds, not doc", () => {
  assert.equal(skillAdapter.supports!(entry({ kind: "skill" })), true);
  assert.equal(skillAdapter.supports!(entry({ kind: "tool" })), true);
  assert.equal(skillAdapter.supports!(entry({ kind: "doc" })), false);
});
