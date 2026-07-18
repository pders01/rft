---
id: koha-plugin-development
title: Develop and review Koha plugins
kind: skill
intent: Design, implement, package, and review Koha plugins and core plugin hooks against current contracts, security boundaries, API/UI guidelines, lifecycle behavior, and focused tests.
triggers:
  - "develop a Koha plugin"
  - "review a Koha plugin"
  - "add or use a Koha plugin hook"
  - "build or inspect a kpz"
domains: [koha, plugins, hooks, api, extension-development, code-review]
related: [koha-code-review, koha-api-review, koha-ui-review, koha-data-review, koha-skill-maintenance]
---

> **Plugin snapshot:** Refreshed `2026-07-18T10:23:10Z` from supplied Koha plugin
> and hook guidance. At the start of every plugin task, compare this timestamp with
> the current date. If it is more than 90 days old, warn that hooks and plugin
> infrastructure may have changed, ask for refreshed material, and continue with the
> stale snapshot only if the user accepts that limitation.
>
> **Main-tree cross-check:** Plugin integration points were checked against Koha main
> at commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17).

The Koha coding guidelines are authoritative for core changes and the baseline for
plugin quality. Supplemental plugin pages and main are additive. Hook tables age
quickly: an “implemented” or “under development” label in the snapshot is not proof
of the contract in the target Koha version. Verify against that version's call site,
core tests, and plugin base/loader code.

## Define compatibility and extension shape

Record:

```text
plugin class/namespace/version:
supported Koha minimum/maximum and tested versions:
entry points: tool/report | hook(s) | REST | static assets | background jobs | ILL
stored data/schema:
permissions and users:
external services/data leaving Koha:
installation/upgrade/uninstall plan:
kpz build source and release provenance:
```

Choose the smallest extension surface. A plugin can provide a staff tool/report,
inject namespaced REST/static routes, implement core hooks, add UI fragments/assets,
register background work, or act as an ILL backend. Do not use a global JS hook when
a scoped server-side hook or namespaced API is safer.

## Confirm the runtime boundary

At the recorded main revision:

- plugins are globally gated by `enable_plugins` and loaded from configured plugin
  directories;
- restrictions and restart behavior have dedicated configuration controls;
- plugin classes derive from `Koha::Plugins::Base`, expose metadata through their
  constructor, and are discovered by registered methods;
- enabled plugin loading is cached and occurs early in process startup;
- lifecycle methods include install, upgrade, configure, enable/disable, and
  uninstall;
- core test fixtures and focused plugin suites live under the test tree, including a
  broad test plugin and a Kitchen Sink package fixture.

Read the target revision's `Koha::Plugins`, Base, Loader, Handler, Methods, relevant
call site, and focused test before coding. Do not derive an API solely from the
community hook table or copy test-plugin code without checking whether it is testing
legacy behavior.

A `.kpz` installs executable Perl and may include templates, static assets, API
controllers, migration code, and background jobs. Treat installation as privileged
code deployment, not content upload. Review source and provenance before enabling it.

## Metadata, layout, and lifecycle

- Use a stable `Koha::Plugin::...` class and collision-resistant namespace. Metadata
  accurately states name, author, description, plugin version, Koha compatibility,
  update date, and namespace required by the features used.
- The constructor supplies metadata and delegates to the base class according to the
  target version's current fixture.
- Keep plugin dependencies explicit. Do not assume a module installed on the build
  machine exists in package deployments.
- `install` creates only owned, namespaced resources and returns success only after a
  complete install. `upgrade` handles every supported installed version, is safe to
  retry, and advances stored version only after success.
- `uninstall` has a documented data-retention policy. Never destroy library/plugin
  data merely because code is disabled or upgraded. Destructive removal requires an
  explicit user decision and safe failure behavior.
- Name plugin database tables with the base class's qualified-name mechanism to avoid
  collisions. Use placeholders and transactions where appropriate; maintain fresh
  install versus upgrade parity.
- Store secrets using an appropriate protected mechanism, never in metadata, source,
  templates, logs, job payloads, browser JavaScript, or distributable archives.
- Test install, failed install, reinstall, each upgrade path, failed upgrade,
  enable/disable, process restart, uninstall-with-data, and deliberate purge.

## Implement or consume a hook

For every hook, make a contract card from the **target checkout**:

```text
method and call site:
when/how often/order:
arguments and which are mutable references:
return values and aggregation:
exception isolation/failure semantics:
transaction and object state:
performance budget:
first/last supported versions:
tests proving the contract:
```

- Inspect `Koha::Plugins->call`, `GetPlugins`, and the concrete call site. The generic
  dispatcher catches plugin exceptions and continues in current main, but individual
  direct-dispatch paths may differ.
- Match exact argument ownership. The coding guideline requires references when
  adding a core hook so each plugin receives data modified by preceding plugins.
  Document mutation ordering and test multiple plugins, not only one.
- Do not refetch data already passed as an object. Do not retain mutable objects or
  plaintext credentials beyond the synchronous call.
- Before-hooks must not leave partial mutation when they reject an operation.
  After-hooks must handle committed/deleted object state documented by the call site.
- Hooks on circulation, cataloging, authentication, payments, notices, or account
  actions are high-risk. Test permissions, privacy, failure, duplicate invocation,
  and transaction boundaries.
- Keep synchronous hooks fast. The supplied guidance recommends asynchronous work
  for expensive after-action integrations; enqueue a minimal durable job rather than
  block circulation or record saves on a remote service.
- Treat “under development” hooks as unavailable unless the target checkout contains
  the call site and tests. Avoid shipping against an unmerged contract.
- When adding a hook to Koha core, update focused core tests and supplied hook
  documentation, use one referenced argument payload where possible, and apply the
  full `koha-code-review` process.

## REST and static routes

Apply `koha-api-review`. At the recorded main revision, enabled plugin routes are
merged under `/api/v1/contrib/<api_namespace>...`; static plugin routes add a
`/static` segment. Core rejects attempts to overwrite an existing contributed route
and can validate the merged OpenAPI v2 specification.

- Namespace is stable, unique, URL-safe, and not user-controlled.
- Return the route structure expected by the target plugin router. Validate the full
  merged spec, not only the fragment.
- Every non-public operation has explicit Koha authorization and tests for anonymous,
  wrong-permission, and correct-permission users.
- “Public” contributed routes need deliberate threat modeling. Current core tests
  show plugin public routes can behave independently of the general anonymous-request
  preference; never assume that preference protects them.
- Validate all path/query/body input, map object fields through API conventions,
  document every response, prevent IDOR/data leakage, and rate/size-limit expensive
  operations as needed.
- Static paths cannot traverse outside owned files, expose source/configuration, or
  serve active user-controlled content. Set correct content types and cache policy.
- Test disabled plugins, invalid specs, namespace collisions, startup/reload, and
  multiple plugins.

## UI, templates, and assets

Apply `koha-ui-review` to plugin output.

- Escape values by context and scrub user-authored HTML. Hook-returned HTML is a trust
  boundary even though it originates in installed code.
- Global OPAC/staff head or JavaScript hooks affect every page: avoid them when a
  scoped hook works, use CSP-compatible assets, and prevent duplicate initialization.
- Do not weaken CSP with unsafe inline code. Keep translation, accessibility,
  responsive behavior, and current Bootstrap/Koha components consistent.
- Tool/report/configure pages enforce permissions server-side, include CSRF for state
  changes, use `cud-` operations where core form conventions apply, and do not rely
  on a hidden menu entry for access control.
- Plugin include paths and templates cannot shadow core templates unexpectedly.
  Resolve bundled files through current base helpers instead of hard-coded install
  paths.
- Translation support in the supplied plugin overview is described as non-standard;
  document the plugin's chosen extraction/catalog/runtime strategy and test it rather
  than claiming core-wide convention.

## Background jobs and process caches

At the recorded main revision, background-task registration requires metadata
namespace and a `background_tasks` mapping from task code to class or richer task
definition. Verify current accepted shape in core and its tests.

- Task codes/classes are namespaced and stable across upgrades while queued jobs may
  still exist.
- Payloads are minimal, serializable, versioned when needed, and contain IDs rather
  than sensitive full records.
- Jobs are idempotent or safely retryable, report progress/failure, enforce the same
  authorization assumptions as enqueueing, and handle plugin disable/uninstall.
- Test unknown/stale task mappings, retries, worker crash, duplicate execution,
  upgrade with queued jobs, and removal.
- Supplied guidance notes workers cache plugin code/task mappings; restart workers
  after install/upgrade when required by target configuration. Do not assume web
  process reload also refreshes workers.
- Provide a usable job status/detail experience or document current core limitations.

## Build and inspect the kpz

Use the plugin project's supplied build/release configuration; no canonical build CLI
was included in the snapshot, so do not invent one.

- Build from a clean committed revision and record source hash, toolchain, command,
  and plugin version.
- List archive contents before installation. Reject absolute paths, `..` traversal,
  unexpected executables, secrets, editor/build caches, vendored unknown binaries,
  and files outside the plugin namespace.
- Ensure metadata version matches the artifact/release, required templates/assets and
  migration modules are present, and development tests/credentials are excluded.
- Record checksum/signature and release provenance. Automated CI release examples are
  additive patterns, not proof that an artifact is trustworthy.
- Install only in an isolated Koha instance first; back up before testing upgrade or
  uninstall and restart relevant processes.

## Tests and review output

Test against minimum, current target, and maximum-supported Koha versions where
claimed. Include focused unit tests plus install/upgrade/uninstall, hook contract,
multiple-plugin ordering, disabled plugin, permissions, CSRF, API merged spec, UI,
background worker, external-service failure/timeouts, and kpz contents.

Report findings with the format from `koha-code-review`. Lead with arbitrary code or
path traversal, authorization/privacy/payment failures, destructive lifecycle bugs,
core workflow outages, invalid API injection, and non-idempotent jobs/migrations.
State target Koha commit/version, plugin artifact checksum, hooks verified directly,
processes restarted, tests run, compatibility gaps, and whether the result is source-
reviewed, artifact-reviewed, or installation-tested.
