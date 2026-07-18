---
id: koha-debian-package-build
title: Build and validate Koha Debian packages
kind: skill
invocation: explicit
intent: Turn a committed Koha revision into traceable Debian packages using the current supported builder, then inspect and test the artifacts without confusing historical packaging recipes for present practice.
triggers:
  - "build Koha Debian packages"
  - "make a custom koha-common package"
  - "use koha-dpkg-docker"
  - "debug build-git-snapshot or a Koha package build"
domains: [koha, debian, packaging, build, deployment]
related: [koha-debian-packaging-review, koha-code-review, koha-data-review, koha-skill-maintenance]
---

> **Packaging snapshot:** Refreshed `2026-07-18T10:23:10Z` from supplied Koha
> Debian build, installation, and package-command guidance. At the start of every
> build, compare this timestamp with the current date. If it is more than 90 days
> old, warn that package infrastructure may have changed, ask for refreshed material,
> and continue with the stale snapshot only if the user accepts that limitation.
>
> **Main-tree cross-check:** Packaging integration points were checked against Koha
> main at commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17).

The Koha coding guidelines remain authoritative for packaged source. Supplied
packaging pages and current main are additive operational evidence. The supplied
“easy” pbuilder recipe explicitly declares itself obsolete and points to
`koha-dpkg-docker`; the older release-engineering mind dump is historical. Never run
its Squeeze/Buster, `apt-key`, personal signing-key, NFS, dput, reprepro, or rsync
commands as a current recipe.

## Define the build before running it

Record:

```text
source repo and HEAD:
target Koha branch/version:
target Debian release and architecture:
custom patch series:
package version/revision:
builder and builder revision:
output directory:
signing/publishing: no, unless explicitly authorized
test environment:
```

Refuse ambiguity about the source commit or target distribution. A package is not
reproducible if “whatever was in my working tree” or an implicit mutable image is the
only provenance.

## Choose the build path

### Preferred: koha-dpkg-docker

The supplied guidance identifies `koha-dpkg-docker` as the replacement for the
obsolete hand-built pbuilder workflow. Its commands were not included in the
snapshot and it was not present in the recorded local environment. Do not invent its
CLI.

1. Locate the user-provided local clone, installed command, or checked-out README.
2. Record its commit/image digest and read its complete local build documentation.
3. Use that version's documented command, environment variables, supported Debian
   suites, mount paths, output ownership, and signing behavior.
4. Map the generic preparation, provenance, artifact, and validation checks below
   onto that documented workflow.
5. If the builder is unavailable, ask the user to provide it or explicitly approve
   the legacy fallback. Do not fetch community infrastructure automatically.

### Legacy fallback: main-tree snapshot builder

Current main still contains `debian/build-git-snapshot`, and its own help describes
it as useful for local packages but unsuitable for upstreamable releases. Use it only
when the user deliberately chooses the legacy pbuilder path.

At the recorded main revision it:

- requires a clean Git state by default;
- archives **HEAD**, so uncommitted edits are not package input;
- temporarily edits the Debian changelog and restores it afterward;
- builds with `pdebuild --debbuildopts -sa`;
- can select build output, distribution, base tarball, version, Debian revision,
  urgency, auto-versioning, auto-changelog, Git checks, and debug output;
- auto-versioning appends a local timestamp and eight-character commit ID, then a
  Debian revision (default `-1`).

Read `debian/build-git-snapshot --help` in the target revision before constructing
the command. Main's short options currently include `-r` for build results, `-D` for
distribution, `-b` for a pbuilder base tarball, `-v` for version, `-i` for Debian
revision, and `-d` for debug. Do not rely on a historical copied command when help
differs.

## Prepare an immutable source

- Confirm branch, `git status --short --branch`, HEAD hash/date, remotes, and intended
  patch range. Untracked files matter because the legacy builder rejects them under
  its default `all` check, but they still are not included by `git archive HEAD`.
- Commit intended customizations. Never weaken Git checks merely to smuggle working
  tree changes into a build; they will not be archived.
- Review commits with the relevant Koha review skills and run focused tests and QA
  tools before spending time on packaging.
- Determine whether custom atomic updates are intentional. Current main's atomic
  update test skips its “no pending contributor updates” assertion when
  `CUSTOM_PACKAGE` is set. `CUSTOM_PACKAGE=1` is a narrowly scoped declaration for a
  custom package containing those updates—not a generic build-fix switch.
- Keep translation inputs explicit. Historical guidance says translations are a
  separate package/input; verify how the selected modern builder obtains them.
- Choose a Debian version that sorts after the package it should upgrade and before
  anything it must not supersede. Verify with `dpkg --compare-versions`; do not guess
  from lexical order. Distinguish upstream version, Debian revision, and local suffix.
- Use a dedicated output directory with enough disk space. Record free space and
  builder/cache identity before starting.

## Build safely

- Run builds in an isolated Debian environment matching the target suite, not on a
  production Koha host.
- Capture the exact command, environment overrides, builder revision/image digest,
  start/end time, source hash, and complete log.
- Do not expose signing keys or repository credentials to an untrusted build image.
  Build unsigned local artifacts unless signing was explicitly requested and a
  trusted signing design is supplied.
- Do not use `DEB_BUILD_OPTIONS=nocheck` as a routine speed-up. If the user explicitly
  accepts a no-check diagnostic build, label every resulting artifact unvalidated,
  preserve the original test failure, and never present it as release-ready.
- A successful command is not enough: identify warnings, skipped tests, network
  dependencies, generated-file drift, and which binary packages were actually
  produced.

## Understand main's package inputs

At the recorded main revision:

- `debian/control` is generated from `debian/control.in` by `debian/update-control`;
  dependency changes belong in the input/generator path, not only the generated file.
- `debian/list-deps` and `debian/bd-to-depends` derive Perl package dependencies and
  propagate build dependencies into runtime substvars.
- `debian/rules` runs the normal debhelper sequence, performs install-tree cleanup,
  generates DocBook manpages, and invokes the Debian DocBook verification test.
- package install manifests determine which templates, scripts, and generated
  manpages enter `koha-common`/`koha-core`.
- declared binary packages include `koha-common`, `koha`, dependency metapackages,
  and experimental core/full variants. Do not assume every build emits or should
  deploy every package.

Use `koha-debian-packaging-review` when changing any of those inputs.

## Validate artifacts before installation

Inventory `.deb`, `.changes`, `.buildinfo`, `.dsc`, source tarballs, and logs. For
each artifact record filename, size, checksum, package name, version, architecture,
and source commit/build provenance.

Where available, run:

- `dpkg-deb --info` to inspect control metadata and maintainer scripts;
- `dpkg-deb --contents` to verify expected files, modes, owners, scripts, templates,
  configuration, and manpages;
- `dpkg-deb --field` for package/version/dependency assertions;
- `lintian` against the changes/binary artifacts, recording its version and every
  override or unresolved finding;
- signature verification for signed `.changes`/`.dsc` files;
- `dpkg --compare-versions` against installed and repository candidate versions.

Confirm `debian/control` was regenerated from its input, no build secret or local
path entered an artifact, no unexpected translation or generated bundle is missing,
and package relationships resolve for the target suite.

## Test installation and upgrade

Use an expendable VM/container that resembles the supported target OS. Package
installation scripts manage users, databases, services, Apache configuration, and
instance directories; never trial them on production.

1. Snapshot/backup the test instance and record installed/candidate versions.
2. Prefer a local APT repository or an APT-supported local package install so
   dependencies are solved as one transaction. Historical `dpkg -i` followed by
   `apt-get -f install` is recovery-oriented, not proof of a clean dependency plan.
3. Test a fresh package install and an upgrade from the oldest supported relevant
   version. If applicable, test rollback from backup; Debian package downgrade alone
   does not undo database migrations.
4. Check package configuration status, service state, logs, Apache configuration,
   Plack/workers/indexers, database schema upgrade, permissions, and retained local
   configuration.
5. Create or use a disposable instance and verify staff/OPAC access plus the changed
   feature. Run package-provided commands using their installed `--help` or manpage,
   not a wiki synopsis.
6. Verify remove/purge behavior only in the disposable environment and explicitly
   check what happens to instance data and configuration.

The package guidance recommends release-number APT suites over moving code names to
avoid an unintended major upgrade. Before any real upgrade, inspect `apt-cache
policy`, back up, test elsewhere, and read the complete APT transaction.

## Diagnose by phase

Classify failures before changing flags:

1. **source/provenance** — dirty tree, wrong HEAD, missing committed patch;
2. **builder bootstrap** — unsupported suite, stale base image, repository/key/DNS;
3. **dependency resolution** — generated control stale, unavailable Perl/system
   package, wrong target suite;
4. **source build** — frontend assets, Perl configuration, tests, DocBook/manpages;
5. **debhelper assembly** — missing install-manifest path, permissions, generated
   files, maintainer scripts;
6. **artifact policy** — lintian, signatures, version ordering;
7. **installation/configuration** — pre/postinst, debconf, Apache/systemd, database;
8. **runtime** — schema, services, search, workers, translations, application logs.

Preserve the first failure. Do not repeatedly add broad bypasses until the package
“builds”; that destroys the evidence needed to fix it.

## Completion report

Report source and builder revisions, target suite/architecture, exact command and
environment, package version, artifact checksums, tests run/skipped, warnings,
installation/upgrade matrix, and publishing/signing status. Use one of:

- `build failed`;
- `artifacts built, not installation-tested`;
- `validated for local testing`;
- `release candidate` only when the user's release criteria, signing, and repository
  checks were explicitly completed.

Never sign, upload, publish, alter an APT repository, or install on a non-disposable
host without explicit authorization.
