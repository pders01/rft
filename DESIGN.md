---
title: refract — design document
status: draft
date: 2026-05-28
---

# refract

A tool that treats plaintext files as the single source of truth and derives
consumer-specific artifacts (Claude skills, MCP tool definitions, docs pages, …)
as disposable build outputs.

## 1. Problem

Agent-adjacent knowledge — tool descriptions, skills, snippets, prompt fragments —
tends to get authored directly in whatever format the *consumer* requires. A Claude
skill is authored as a `SKILL.md` with the loader's exact frontmatter and directory
layout; an MCP tool def is authored as JSON; a docs page is authored for the site
generator. The same underlying knowledge then exists in several hand-maintained
copies that drift.

The goal is to invert this: author once, in a neutral format you own, and **derive**
each consumer's artifact from it. A Claude skill becomes one projection among many,
never the source.

## 2. Goals and non-goals

### Goals

- Plaintext files are the authoritative store. Nothing is authoritative that isn't a
  file you can open in an editor and `grep`.
- Source schema is neutral and owned by the author, not by any one consumer.
- Each output format is produced by a small, independent **adapter**.
- The build is reproducible and the output tree is disposable — deleting `dist/`
  loses nothing.
- Search operates over the source tree, never over derived artifacts.
- Validation fails loudly at build time, not at "the consumer won't load it" time.

### Non-goals

- Not a runtime, agent loop, or framework. It is a build tool.
- Not a database. No embeddings, no index as source of truth. An index, if any, is a
  rebuildable cache.
- Not a monorepo. It is one small package.
- No attempt to auto-infer a consumer's required fields. Mapping is explicit per
  adapter, because only the author knows how their neutral fields map to, e.g., a
  skill's `description`.

## 3. Core model

```
   source/*.md  ──parse──▶  NeutralEntry  ──validate──▶  ┌─ skillAdapter   ─▶ dist/skills/
   (md + your                 (typed object)             ├─ mcpAdapter     ─▶ dist/mcp/
    frontmatter)                                         └─ docsAdapter    ─▶ dist/docs/
```

Three stages:

1. **Parse** — read each source file into `{ data, content }` using a frontmatter
   parser.
2. **Validate** — coerce `data` into a typed `NeutralEntry`. Reject malformed or
   under-specified entries here.
3. **Project** — for each enabled adapter, transform the `NeutralEntry` into the
   files that consumer requires, written under that adapter's output subtree.

The neutral schema is deliberately a **superset** of what any single target needs.
Every adapter is therefore a *lossy projection downward* — it picks the fields it
cares about and maps them. An adapter never has to guess upward at information the
source didn't carry; if a required target field can't be derived, the adapter errors.

## 4. Source format

Markdown with YAML frontmatter. The frontmatter is the author's neutral schema; the
body is the content.

```markdown
---
id: search-codebase
title: Search the codebase
kind: tool
intent: Find code by meaning across the repository.
triggers:
  - "where is X defined"
  - "find the function that does Y"
domains: [code, retrieval]
related: [read-file, list-symbols]
---

Detailed body. For a skill this becomes the instructions; for an MCP def it may be
summarized into a description; for a docs page it is the page content.
```

The exact field set is the one design decision worth getting right early, since
everything downstream projects from it. A reasonable starting schema:

| Field      | Type       | Required | Purpose                                              |
|------------|------------|----------|------------------------------------------------------|
| `id`       | string     | yes      | Stable slug; output filenames derive from it         |
| `title`    | string     | yes      | Human-readable name                                  |
| `kind`     | enum       | yes      | `tool` \| `skill` \| `snippet` \| `doc`              |
| `intent`   | string     | yes      | One-line "what this is for" — feeds skill/MCP desc   |
| `triggers` | string[]   | no       | When this should activate; used by skill description |
| `domains`  | string[]   | no       | Faceting / filtering                                 |
| `related`  | string[]   | no       | Cross-links between entries                          |

Keep the schema small and additive. Adding a field is cheap; adapters ignore fields
they don't consume.

## 5. The build step

The loop is trivial; the value lives entirely in the adapters.

```
load all source files
for each file:
    { data, content } = parse(file)
    entry = validate(data, content)        # throws on bad input
    for each enabled adapter:
        adapter.emit(entry, outDir)         # writes files under dist/<adapter>/
```

### Adapter contract

An adapter is a pure-ish function plus a name:

```ts
interface Adapter {
  name: string;                                   // e.g. "skills"
  emit(entry: NeutralEntry, outDir: string): void; // writes the consumer's files
}
```

`emit` is small because all the hard parsing is already done. The Claude-skill
adapter is illustrative:

- map `title` → skill `name`
- compose `intent` + `triggers` → skill `description`
- create `dist/skills/<id>/SKILL.md` with the loader's required frontmatter
- write `entry.content` as the skill body
- (optionally) lay out the directory the loader expects

That is on the order of 30 lines. The MCP adapter emits a JSON tool definition; the
docs adapter emits a page for the site generator. Each adapter knows exactly one
consumer's conventions and nothing else.

### Worked adapter sketch (Claude skill)

```ts
const skillAdapter: Adapter = {
  name: "skills",
  emit(entry, outDir) {
    const description = [
      entry.intent,
      entry.triggers?.length
        ? `Triggers: ${entry.triggers.join("; ")}.`
        : "",
    ].filter(Boolean).join(" ");

    const fm = [
      "---",
      `name: ${entry.id}`,
      `description: ${JSON.stringify(description)}`,
      "---",
      "",
    ].join("\n");

    const dir = path.join(outDir, "skills", entry.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "SKILL.md"), fm + entry.content);
  },
};
```

If `intent` is missing, validation already rejected the entry upstream, so the
adapter can assume its required inputs exist.

## 6. Validation

Validation sits between parse and project, on the `NeutralEntry`. It enforces the
neutral schema (required fields present, enums valid, types correct) so that a broken
source file fails at build time with a clear message naming the file and field —
rather than silently producing a skill the loader rejects.

Adapters may add a second, target-specific check: if a particular adapter needs a
field the neutral schema treats as optional, that adapter validates its own
precondition and errors with a message that names both the entry and the adapter.

## 7. Search

Search runs over the **source tree only**.

- Content: `rg "query" source/`
- Metadata facets via frontmatter: `rg "^domains:.*code" source/`

This is keyword/BM25-style matching, not vector search — appropriate when you roughly
recall the words used. If relevance ranking over file-order becomes necessary, add a
**rebuildable** index (e.g. a Tantivy index) as a cache derived from the source.
The index is never authoritative; delete it anytime and the source is untouched.

The derived `dist/` tree is excluded from search so results are never polluted by
generated artifacts.

## 8. Stack

| Concern          | Choice            | Rationale                                             |
|------------------|-------------------|------------------------------------------------------|
| Language         | TypeScript        | Same language as adjacent tooling; single-language adapters |
| Run              | `tsx`             | No build-step ceremony for a build tool              |
| Frontmatter parse| `gray-matter`     | De-facto parser; returns `{ data, content }`         |
| Schema validation| `zod`             | Typed `NeutralEntry`, fail-loud at parse time        |
| Body AST (later) | `unified`/`remark`| Only if AST-level body transforms are ever needed    |

Dependencies stay minimal: parser, validator, and Node's `fs`. Packaged as a single
small package, **not** a monorepo — the loop is a handful of lines and a monorepo
would be ceremony fighting the premise.

## 9. Repository layout

```
refract/
  src/
    schema.ts        # zod NeutralEntry + types
    parse.ts         # gray-matter wrapper → { data, content }
    build.ts         # the load → validate → project loop
    adapters/
      skills.ts      # Claude skill adapter
      mcp.ts         # MCP tool-def adapter
      docs.ts        # docs-page adapter
      index.ts       # registry of enabled adapters
  source/            # authored .md files (the source of truth)
  dist/              # generated output (gitignored, disposable)
  package.json
```

## 10. Open decisions

- **Schema scope.** Lock the neutral field set before writing more than one adapter,
  since adapters depend on it. Start minimal (§4) and extend additively.
- **Adapter enablement.** Config file vs. CLI flags vs. per-entry opt-in (`kind`
  could gate which adapters run). Simplest first: run all registered adapters; let
  each skip entries whose `kind` it doesn't handle.
- **Index.** Defer until file-order search actually hurts. When added, make it a
  watch-and-rebuild cache, never a source.
- **Cross-links.** `related` is captured but its meaning per target is undecided —
  in docs it might be hyperlinks; in skills it may be ignored. Decide per adapter.

## 11. Naming

Working name **refract** — single input, many outputs. Alternatives considered:
`distill` (projecting down to each target's essentials), `prism`, `fanout`,
`provenance`. Skill-specific names (`skillsmith`, `skillforge`) were rejected because
they over-commit to one output and contradict the design's central claim that a skill
is just one derivation.
