---
id: commits
title: Commit message conventions
kind: skill
intent: Write commit messages using Conventional Commits unless the project sets its own.
triggers:
  - "write a commit message"
  - "commit these changes"
domains: [git, workflow]
---

Use Conventional Commits unless the project has its own convention. Use
`-`-delimited bullet points in the body. Keep line lengths around 80 chars max.

The scope is **optional** — the parentheses notation means "insert a scope
here if one applies," not "a scope is required." Include it when the change
targets one clear area; omit it for repo-wide or cross-cutting changes.

```
<type>(<optional scope>): <title>

- item 1
- item 2
- item 3
```

A scoped and an unscoped subject are both valid:

```
feat(parser): handle empty frontmatter
chore: bump pnpm to 10.33.0
```

Do not use subheadings like:

```
<type>(<optional scope>): <title>

Subheading:
  - item 1
  - item 2
```

Group under a bulleted subheading instead, and use it sparingly:

```
<type>(<optional scope>): <title>

- Subheading
  - item 1
  - item 2
```
