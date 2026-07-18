import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { build } from "./build.ts";

let root: string;
let sourceDir: string;
let outDir: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "refract-test-"));
  sourceDir = path.join(root, "source");
  outDir = path.join(root, "dist");
  mkdirSync(sourceDir, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function writeSource(name: string, frontmatter: string, body: string): void {
  writeFileSync(
    path.join(sourceDir, name),
    `---\n${frontmatter}\n---\n\n${body}\n`,
  );
}

const toolFm = [
  "id: read-file",
  "title: Read a file",
  "kind: tool",
  "intent: Read a file from disk.",
  "triggers:",
  '  - "open file"',
].join("\n");

test("build projects a tool entry through skills, mcp, and docs", () => {
  writeSource("read-file.md", toolFm, "Pass an absolute path.");

  const report = build({ sourceDir, outDir });

  assert.deepEqual(report.errors, []);
  assert.equal(report.entries, 1);
  assert.equal(report.emittedByAdapter.skills, 1);
  assert.equal(report.emittedByAdapter.mcp, 1);
  assert.equal(report.emittedByAdapter.docs, 1);

  const skill = readFileSync(
    path.join(outDir, "skills", "read-file", "SKILL.md"),
    "utf8",
  );
  assert.match(skill, /^name: read-file$/m);
  assert.match(skill, /Triggers: open file\./);

  const mcp = JSON.parse(
    readFileSync(path.join(outDir, "mcp", "read-file.json"), "utf8"),
  );
  assert.equal(mcp.name, "read-file");
  assert.match(mcp.description, /Use when: open file\./);
  assert.deepEqual(mcp.inputSchema.required, []);
});

test("doc kind is skipped by skills and mcp, emitted by docs only", () => {
  writeSource(
    "guide.md",
    ["id: guide", "title: Guide", "kind: doc", "intent: Explain things."].join(
      "\n",
    ),
    "Content.",
  );

  const report = build({ sourceDir, outDir });

  assert.deepEqual(report.errors, []);
  assert.equal(report.emittedByAdapter.skills, 0);
  assert.equal(report.emittedByAdapter.mcp, 0);
  assert.equal(report.emittedByAdapter.docs, 1);
});

test("duplicate ids are reported and nothing is projected", () => {
  writeSource("a.md", toolFm, "First.");
  writeSource("b.md", toolFm, "Second.");

  const report = build({ sourceDir, outDir });

  assert.equal(report.errors.length, 1);
  assert.match(report.errors[0], /Duplicate id "read-file"/);
  assert.equal(report.emittedByAdapter.skills, 0);
});

test("an invalid entry aborts the build before any projection", () => {
  writeSource("good.md", toolFm, "Fine.");
  writeSource(
    "broken.md",
    ["id: broken", "title: Broken", "kind: doc"].join("\n"),
    "Missing intent.",
  );

  const report = build({ sourceDir, outDir });

  assert.ok(report.errors.length >= 1);
  assert.match(report.errors.join("\n"), /broken\.md/);
  assert.equal(report.emittedByAdapter.docs, 0);
});

test("docs frontmatter omits optional fields cleanly (no collapsed lines)", () => {
  writeSource(
    "minimal.md",
    [
      "id: minimal",
      "title: Minimal",
      "kind: doc",
      "intent: No optionals here.",
    ].join("\n"),
    "Body.",
  );

  build({ sourceDir, outDir });
  const doc = readFileSync(path.join(outDir, "docs", "minimal.md"), "utf8");

  assert.doesNotMatch(doc, /domains:/);
  assert.doesNotMatch(doc, /related:/);
  // intent line must stand alone, not glued to a following key or ---
  assert.match(doc, /^intent: "No optionals here\."$/m);
});

test("docs frontmatter renders optional list fields when present", () => {
  writeSource(
    "faceted.md",
    [
      "id: faceted",
      "title: Faceted",
      "kind: doc",
      "intent: Has facets.",
      "domains: [code, retrieval]",
      "related: [read-file]",
      "invocation: explicit",
    ].join("\n"),
    "Body.",
  );

  build({ sourceDir, outDir });
  const doc = readFileSync(path.join(outDir, "docs", "faceted.md"), "utf8");

  assert.match(doc, /^domains: \["code", "retrieval"\]$/m);
  assert.match(doc, /^related: \["read-file"\]$/m);
  assert.match(doc, /^invocation: explicit$/m);
});
