import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEntry } from "./schema.ts";

const valid = {
  id: "search-codebase",
  title: "Search the codebase",
  kind: "tool",
  intent: "Find code by meaning.",
  triggers: ["where is X"],
  domains: ["code"],
  related: ["read-file"],
};

test("buildEntry accepts a valid entry and trims content", () => {
  const entry = buildEntry(valid, "\n  body text  \n", "a.md");
  assert.equal(entry.id, "search-codebase");
  assert.equal(entry.kind, "tool");
  assert.equal(entry.content, "body text");
  assert.equal(entry.sourcePath, "a.md");
});

test("buildEntry rejects missing required field with file + field name", () => {
  const { id, ...noId } = valid;
  assert.throws(() => buildEntry(noId, "x", "bad.md"), (err: Error) => {
    assert.match(err.message, /bad\.md/);
    assert.match(err.message, /id/);
    return true;
  });
});

test("buildEntry rejects a non-kebab-case id", () => {
  assert.throws(
    () => buildEntry({ ...valid, id: "Not Slug" }, "x", "f.md"),
    /kebab-case/,
  );
});

test("buildEntry rejects an unknown kind enum value", () => {
  assert.throws(
    () => buildEntry({ ...valid, kind: "widget" }, "x", "f.md"),
    /kind/,
  );
});

test("buildEntry rejects unknown frontmatter keys (strict schema)", () => {
  assert.throws(
    () => buildEntry({ ...valid, surprise: true }, "x", "f.md"),
    /surprise/,
  );
});

test("buildEntry allows optional fields to be absent", () => {
  const minimal = {
    id: "bare",
    title: "Bare",
    kind: "doc",
    intent: "Minimal.",
  };
  const entry = buildEntry(minimal, "body", "m.md");
  assert.equal(entry.triggers, undefined);
  assert.equal(entry.domains, undefined);
});
