---
id: koha-debian-packaging-review
title: Review Koha Debian packaging changes
kind: skill
invocation: explicit
intent: Review changes to Koha Debian metadata, dependencies, maintainer scripts, service integration, instance commands, documentation, and upgrade behavior before building packages.
triggers:
  - "review Koha Debian packaging changes"
  - "review a change under debian"
  - "review a koha-common command"
  - "check a Koha package dependency or maintainer script"
domains: [koha, debian, packaging, code-review, qa]
related: [koha-debian-package-build, koha-code-review, koha-data-review, koha-skill-maintenance]
---

> **Packaging snapshot:** Refreshed `2026-07-18T10:23:10Z` from supplied Koha
> Debian build, installation, and package-command guidance. At the start of every
> review, compare this timestamp with the current date. If it is more than 90 days
> old, warn that package infrastructure may have changed, ask for refreshed material,
> and continue with the stale snapshot only if the user accepts that limitation.
>
> **Main-tree cross-check:** Packaging integration points were checked against Koha
> main at commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17).

Apply `koha-code-review` to packaged source and scripts. The coding guidelines are
authoritative. Packaging/installation guidance and current main are additive: they
explain intended behavior and integration, but historical commands and existing
legacy packaging do not override guidelines.

## Establish scope and package impact

Review the selected commit range and map each changed file to:

```text
source metadata | dependency generation | build rules | install manifest |
maintainer script/debconf | service/config template | admin command/manpage |
test | generated output
```

Then identify affected binary packages, install/upgrade/remove phases, supported
Debian suites, architectures, existing instances, and new installations. Package
review is lifecycle review; a script that works after a fresh install can still break
an upgrade or purge.

## Current main integration model

At the recorded main revision:

- `debian/control.in` is the source template and `debian/update-control` generates
  `debian/control` using `debian/list-deps`;
- `debian/bd-to-depends` feeds dependency substvars during `dh_gencontrol`;
- `debian/rules` owns build/install cleanup and DocBook manpage generation;
- `.install`, `.dirs`, `.links`, `.docs`, defaults, init/systemd, cron, logrotate,
  debconf templates, and maintainer scripts determine package lifecycle behavior;
- administrative scripts live under `debian/scripts`, shared shell behavior lives in
  `koha-functions.sh`, XML source under `debian/docs` generates man section 8, and
  install manifests place both commands and manpages;
- package families include `koha-common`, site-specific `koha`, dependency
  metapackages, and experimental core/full variants;
- `debian/build-git-snapshot` remains a legacy local-package path, while supplied
  guidance names `koha-dpkg-docker` as the current replacement workflow.

Confirm all of this in the reviewed revision. Do not hard-code the snapshot when main
has moved.

## Generated and duplicated surfaces

A packaging change is incomplete when only one projection is updated.

- Dependency changes update their true source/generator and regenerate control.
  Compare generated output and explain intentional ordering or alternatives.
- A new/renamed command updates the relevant install manifests, bash completion,
  DocBook/manpage source, package documentation, shared helper assumptions, and tests.
- A new template/configuration file is installed into every intended package variant
  with correct destination, ownership, mode, substitution, and conffile behavior.
- Service changes keep systemd/init compatibility promised by supported targets and
  update enable/disable/status/restart paths and documentation.
- Removed commands or options clean up links, completion, docs, package manifests,
  maintainer scripts, and upgrade transitions. Deprecation should be explicit when
  users need migration time.
- Generated files are regenerated, not hand-edited as the sole change.

Search all packaging manifests rather than assuming `koha-common` is the only owner;
main currently duplicates many command/template entries for `koha-core`.

## Dependencies

- Establish why the dependency is build-time, runtime, optional, alternative, or
  suite-specific. Do not add a heavy service dependency when a Suggests/Recommends or
  experimental/full package boundary is intended.
- Verify the Debian package exists with a compatible version in every supported
  target suite. Perl module presence in `cpanfile` does not prove Debian package
  availability or naming.
- Understand main's unusual propagation of build dependencies into Koha runtime
  substvars before changing it. Check both generated control and final binary fields.
- Alternatives use correct Debian relationship syntax and reflect actually supported
  implementations.
- Avoid accidental dependency cycles, forced database/search-engine choices, and
  upgrades that remove a working provider.
- Build in a clean target environment; a developer host with extra packages masks
  missing dependencies.

## Maintainer scripts and debconf

Review `preinst`, `postinst`, `prerm`, `postrm`, package config, and debconf templates
for every applicable invocation: install, configure, upgrade from supported versions,
failed/partial configure, abort paths, remove, purge, and reinstall.

- Scripts are noninteractive except through debconf, handle unset values, quote shell
  data, propagate failures intentionally, and are idempotent where package managers
  can rerun them.
- Preserve administrator configuration and instance data. Distinguish package-owned
  defaults from per-instance state and conffiles.
- Never assume one instance. Use the shared list/foreach helpers safely and handle no
  instances, disabled instances, unusual valid names, and partial instances.
- Database migration is backed up/tested and cannot be “rolled back” merely by
  downgrading the package.
- User/group, directory, permissions, symlink, Apache, systemd/init, cron, logrotate,
  and service operations have safe upgrade transitions.
- Starting/restarting services during package configuration is deliberate and
  failure behavior is understandable. Avoid leaving a half-configured package with
  silently stale daemons.
- Secrets do not enter logs, process arguments unnecessarily, generated artifacts,
  or world-readable files.
- Remove versus purge semantics are explicit; never delete library data on ordinary
  removal.

## Administrative commands

Treat installed command behavior as an API used by operators and automation.

- Preserve documented exit codes, stdout/stderr distinction, quiet/verbose behavior,
  option compatibility, and multi-instance semantics.
- Validate instance names and permissions, quote every expansion, and avoid unsafe
  `eval`, globbing, temporary files, pipelines, and partial loops.
- Prefer shared package helpers rather than divergent copies. Ensure a failure for
  one instance does not produce a misleading global success.
- `--help` and generated manpages describe current options. The supplied command
  synopsis is explicitly secondary to installed manpages, inline help, and current
  script source.
- Deprecated wrapper commands are not revived accidentally; use current aggregate
  commands where main provides them.
- Test commands in an expendable package installation with zero, one, and multiple
  instances, including disabled services and names containing allowed edge-case
  characters.

Package commands can create/remove instances, restore databases, change passwords,
reindex, and control services. Do not execute destructive commands merely to inspect
them; read source/help first and obtain explicit authorization for disposable
integration tests.

## Installation and upgrade contract

The package guidance describes `koha-common` as the normal multi-instance package and
package-created instances as a coordinated set of system users, databases, per-site
configuration/state, Apache sites, search services, Plack/workers, logs, and caches.
Review changes against that whole contract.

Cover:

- clean install with no instance;
- first instance creation;
- upgrade with an active representative instance;
- multiple enabled/disabled instances;
- package configure rerun and interrupted-upgrade recovery;
- remove and purge semantics;
- database schema update and service reload/restart;
- retained local configuration and debconf answers;
- package version ordering and APT candidate selection.

A moving APT suite can cause automatic major upgrades; supplied operational guidance
recommends version-specific suites. Packaging changes should not assume every operator
tracks the same suite style.

## Tests and static checks

Run narrow source tests plus:

- regenerate control and compare the result;
- shell syntax/static analysis appropriate to the scripts;
- `xt/verify-debian-docbook.t` and manpage generation for command docs;
- a clean package build through `koha-debian-package-build`;
- lintian and binary content/control inspection;
- fresh-install and supported-upgrade tests in disposable target systems;
- command help/manpage parity and representative lifecycle tests;
- QA Test Tools for the exact commit range.

Do not skip package tests to obtain a green review. `CUSTOM_PACKAGE=1` only addresses
the intentional presence of custom atomic updates, and `DEB_BUILD_OPTIONS=nocheck`
produces an explicitly unvalidated diagnostic artifact.

## Findings

Use the finding format from `koha-code-review`. Lead with data loss, broken upgrades,
remote-code/privilege issues, unresolvable dependencies, and unconfigurable packages;
then lifecycle inconsistency, missing projections/docs/tests, and compatibility.
State whether each point comes from an authoritative coding guideline, Debian/package
contract, current-main integration, or additive operational guidance. Finish with
build revision, target suite matrix, artifact/install tests, skipped destructive
checks, and verdict.
