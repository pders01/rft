---
id: koha-community
title: Route Koha community development work
kind: skill
intent: Recognize Koha community development tasks and load only the relevant specialist workflow, wherever the work occurs—not only inside a particular checkout.
triggers:
  - "the user mentions Koha development, QA, packaging, plugins, or its release workflow"
  - "the repository or task is clearly part of the Koha ecosystem"
domains: [koha, routing, context-management]
related: [koha-code-review, koha-api-review, koha-data-review, koha-ui-review, koha-contribution-workflow, koha-development-radar, koha-plugin-development, koha-debian-package-build, koha-debian-packaging-review, koha-skill-maintenance]
---

Use this router when the user explicitly asks about Koha or the task is clearly part
of its ecosystem. It is intentionally location-independent: Koha work can happen in
core, a plugin repository, packaging infrastructure, a testing environment, release
work, or a discussion with no checkout at all.

Do not activate merely because a project uses Perl, REST, Debian, Git, or the generic
word “library.” Require Koha-specific evidence in the request, repository metadata,
module names, paths, package names, or surrounding conversation.

## Load specialist instructions

Before doing substantive work, read the smallest relevant set of specialist skills
using the relative links below. References are relative to this router's skill
directory.

- General patch review, coding guidelines, tests, commits, and QA:
  [koha-code-review](../koha-code-review/SKILL.md)
- REST/OpenAPI routes, controllers, contracts, and API tests:
  [koha-api-review](../koha-api-review/SKILL.md)
- Schema, atomic updates, preferences, DBIC, and Koha objects:
  [koha-data-review](../koha-data-review/SKILL.md)
- Staff/OPAC templates, UX, translation, and accessibility:
  [koha-ui-review](../koha-ui-review/SKILL.md)
- Bug reports, submission, sign-off, QA status, release, and backport workflow:
  [koha-contribution-workflow](../koha-contribution-workflow/SKILL.md)
- Recent-development day/week/month/cycle briefing:
  [koha-development-radar](../koha-development-radar/SKILL.md)
- Plugin lifecycle, hooks, contributed routes, jobs, and kpz artifacts:
  [koha-plugin-development](../koha-plugin-development/SKILL.md)
- Building and installation-testing Debian packages:
  [koha-debian-package-build](../koha-debian-package-build/SKILL.md)
- Reviewing Debian metadata, dependencies, scripts, services, and commands:
  [koha-debian-packaging-review](../koha-debian-packaging-review/SKILL.md)
- Refreshing or reorganizing this skill set:
  [koha-skill-maintenance](../koha-skill-maintenance/SKILL.md)

Combine skills when the task crosses boundaries. A database-backed REST endpoint, for
example, needs the general, API, and data review workflows. A plugin-provided staff
page may need plugin, API, UI, and general guidance.

The specialist skills are hidden from automatic model invocation to keep unrelated
sessions clean, but remain directly available to users as `/skill:koha-...` commands.
This router is the only Koha description that should normally appear in the global
system prompt.
