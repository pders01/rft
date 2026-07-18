# refract

Author agent-adjacent knowledge once, in a neutral plaintext format you own,
and **derive** each consumer's artifact from it — Claude skills, MCP tool
definitions, docs pages. A Claude skill becomes one projection among many,
never the source.

```
source/*.md  ──build──▶  dist/skills/   ──install──▶  ~/.claude/skills/
(md + your               dist/mcp/                    your MCP registry
 frontmatter)            dist/docs/                   your docs site
```

The source tree is the single source of truth. The `dist/` tree is a
disposable build output — delete it and you lose nothing.

See [DESIGN.md](./DESIGN.md) for the full rationale.

## Requirements

- Node >= 20.6
- pnpm (pinned via `packageManager`; `corepack enable` will provide it)

## Quickstart

```sh
pnpm install

# 1. Author a source entry
cat > source/my-tool.md <<'EOF'
---
id: my-tool
title: My tool
kind: tool
intent: One line describing what this is for.
triggers:
  - "when to use it"
---

The body becomes the skill instructions / docs page content.
EOF

# 2. Build projections into dist/
pnpm build

# 3. Configure where artifacts install
cp refract.config.example.json refract.config.json
# the example installs into ./examples/ — a safe sandbox to start with

# 4. Build + copy artifacts into their targets
pnpm sync

# 5. Verify targets match what source would produce
pnpm check
```

The example config installs into `./examples/` (gitignored) so this first run
has no side effects outside the repo. See [Going live](#going-live) to point
adapters at your real locations.

## Source format

Markdown with YAML frontmatter. The frontmatter is the neutral schema; the
body is the content.

| Field      | Type     | Required | Purpose                                       |
|------------|----------|----------|-----------------------------------------------|
| `id`       | string   | yes      | Stable kebab-case slug; output names derive from it |
| `title`    | string   | yes      | Human-readable name                           |
| `kind`     | enum     | yes      | `tool` \| `skill` \| `snippet` \| `doc`       |
| `intent`   | string   | yes      | One-line "what this is for"; feeds descriptions |
| `triggers` | string[] | no       | When this should activate                     |
| `domains`  | string[] | no       | Faceting / filtering                          |
| `related`  | string[] | no       | Cross-links between entries                   |
| `invocation` | enum   | no       | `automatic` (default) or explicit user invocation only |

## Adapters

Each adapter projects a `NeutralEntry` into one consumer's format and writes
under `dist/<adapter>/`:

- **skills** — `dist/skills/<id>/SKILL.md` (handles `kind: skill` and `tool`)
- **mcp** — `dist/mcp/<id>.json` tool definition (handles `kind: tool`)
- **docs** — `dist/docs/<id>.md` page (handles every kind)

## Configuration

`refract.config.json` (gitignored; copy from `refract.config.example.json`):

```json
{
  "sourceDir": "source",
  "outDir": "dist",
  "targets": {
    "skills": "~/.claude/skills"
  }
}
```

`targets` maps an adapter name to an install destination. `~` and relative
paths are resolved. Adapters with no target are built but not installed.

### Going live

The example installs into `./examples/`. To make refract manage your real
Claude skills, point `skills` at your skills directory:

```json
{
  "targets": {
    "skills": "~/.claude/skills"
  }
}
```

> **Warning:** `pnpm sync` overwrites any file at the target whose path matches
> a source entry — e.g. a source `id: commits` overwrites
> `~/.claude/skills/commits/SKILL.md`. Point `skills` only at a directory you
> intend refract to own, and run `pnpm check` first to preview what would
> change.

## Commands

| Command       | Does                                                       |
|---------------|------------------------------------------------------------|
| `pnpm build`  | Parse + validate `source/`, project into `dist/`           |
| `pnpm sync`   | Build, then copy each adapter's output into its target     |
| `pnpm check`  | Build to a temp dir, fail if any target has drifted        |
| `pnpm clean`  | Remove `dist/`                                             |
| `pnpm test`   | Run the `node:test` suites via tsx                         |
| `pnpm typecheck` | `tsc --noEmit`                                          |

`check` diffs only the files the build produces, so unrelated files already in
a target (other skills under `~/.claude/skills`, say) are never flagged.

## License

[MIT](./LICENSE)
