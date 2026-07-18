---
id: koha-skill-maintenance
title: Maintain the Koha community skills
kind: skill
invocation: explicit
intent: Add, refresh, and reorganize the Koha development skills without losing authority, provenance, temporal warnings, task-oriented boundaries, or consistency across overlapping reviews.
triggers:
  - "update the Koha skills"
  - "add Koha development guidance to these skills"
  - "refresh the Koha guideline snapshot"
  - "review the Koha skills for consistency"
domains: [koha, skills, maintenance, knowledge-management]
related: [koha-community, koha-code-review, koha-api-review, koha-data-review, koha-ui-review, koha-contribution-workflow, koha-development-radar, koha-plugin-development, koha-debian-package-build, koha-debian-packaging-review]
---

Use this skill when changing the Koha development/review skill set itself. Its job is
to preserve a coherent, auditable projection of supplied community knowledge—not to
turn every source page into a skill or silently elevate historical examples into
policy.

> **Maintenance snapshot:** Refreshed `2026-07-18T10:46:43Z` while curating the
> supplied Koha development guidance.
>
> **Main-tree cross-check:** Integration points were checked against Koha main at
> commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17).

At the start of maintenance, compare both records with the current date and local
main. If either is more than 90 days old for the requested work, warn before relying
on it, ask for refreshed material, and continue with the stale snapshot only if the
user accepts that limitation. Do not fetch community infrastructure; use material
supplied by the user and the explicitly provided local checkout. Ask for a new
authoritative snapshot when needed.

## Authority and evidence model

Maintain this precedence explicitly in every affected skill:

1. **Coding guidelines are authoritative.** Preserve adopted, draft, proposed,
   revised, deprecated, and grandfather statuses. Supplemental material cannot
   weaken or override a coding rule.
2. **Current Koha main is additive implementation evidence.** Use it to verify paths,
   scripts, helpers, component APIs, tests, and representative modern patterns.
   Existing code can be legacy or grandfathered; frequency is not authority.
3. **Other supplied community guidance is additive context.** It explains workflow,
   interface patterns, examples, and operational practice. Examples may be old.
4. **Agent recommendations are clearly recommendations.** Never present a general
   best practice as a Koha rule without supplied evidence.

When sources disagree, do not silently choose. Keep the coding guideline, inspect
main to understand current integration, and either omit the conflicting example or
label the conflict and its temporal status. Preserve useful historical migration
information only when it helps recognize or update old patches.

## Organize by task, not source document

Before adding a skill, identify the user task, activation trigger, distinct workflow,
and expected output. Add information to an existing skill when it supports the same
task. Create a focused skill only when selective activation prevents a large general
checklist from obscuring relevant instructions.

The maintained review architecture is:

- `koha-community` — the sole automatically advertised global router; recognizes
  Koha work independent of checkout location and loads hidden specialists by relative
  reference.
- `koha-code-review` — orchestrator and common coding, contribution, testing, and QA
  review.
- `koha-api-review` — REST contract, specification, controller, authorization, and
  API tests.
- `koha-data-review` — schema, upgrade parity, atomic updates, system preferences,
  DBIC/objects, and data tests.
- `koha-ui-review` — staff/OPAC interaction patterns, templates, translation,
  accessibility, and browser verification.
- `koha-contribution-workflow` — bug reporting, patch submission, independent
  sign-off, QA, release/backport states, documentation, and closure.
- `koha-development-radar` — concise, nested day/week/month/cycle briefings from a
  pinned local Git history using landing time and grouped bug series.
- `koha-plugin-development` — plugin lifecycle, hook contracts, contributed APIs/UI,
  background jobs, kpz review, and compatibility.
- `koha-debian-package-build` — reproducible package builds, artifact inspection,
  installation/upgrade validation, and diagnosis.
- `koha-debian-packaging-review` — package metadata, dependencies, lifecycle scripts,
  services, administrative commands, and generated projections.
- `koha-skill-maintenance` — authority, refresh, consistency, and build process for
  this set.

Set specialist entries to `invocation: explicit`; only `koha-community` should use
automatic invocation. This maps to Agent Skills' `disable-model-invocation` metadata,
so specialists remain available as slash commands without adding all descriptions to
every system prompt. The router must link to each sibling `SKILL.md` by a relative
path and load the smallest relevant set.

Prefer conditional routing from the general review skill over duplicating every
specialized checklist in it. Some overlap is intentional for high-risk invariants
such as CSRF, authorization, escaping, tests, and draft status; wording and severity
must remain compatible.

## Refresh workflow

1. Inventory all newly supplied material before editing. Record its topic, apparent
   age, normative status, overlap, contradictions, and likely target task.
2. Inspect the explicitly provided local main checkout without modifying it. Record
   branch, HEAD commit, commit date, working-tree state, and relevant current files.
   Untracked local files are not evidence of main.
3. Re-read affected source skills completely. Search all Koha skills for duplicated
   claims, rule IDs, old paths, timestamps, main hashes, and source-specific names.
4. Build a claim table for substantive additions:

   ```text
   Claim | authority/status | affected tasks | main evidence | conflict/staleness
   ```

5. Update the smallest coherent set of skills. Rephrase source prose into actionable
   review procedure; do not paste long examples when a check and current integration
   point are enough.
6. Update the guideline refresh timestamp only when the relevant supplied guidance
   was actually reviewed. Update the main cross-check hash/date only after inspecting
   that revision for the affected integration points. Do not mechanically stamp all
   skills if only one domain was refreshed.
7. Keep provenance generic in consumer output: describe the kind of supplied
   guidance, not temporary ingestion filenames.
8. Rebuild and inspect generated artifacts, then report what changed and what remains
   uncertain. Do not install/sync skills unless explicitly asked.

## Temporal behavior

Every review skill based on a snapshot must visibly state:

- a UTC refresh timestamp;
- the kind of guidance represented;
- a 90-day stale check that asks for refreshed material and requires acceptance
  before proceeding with an old snapshot;
- when main was consulted, the exact commit and commit date;
- that main and supplemental guidance are additive while coding guidelines remain
  authoritative.

A future refresh should preserve old timestamps in version control, not in prose.
Never claim freshness based only on touching wording or rebuilding output.

## Writing rules

- Source files use the neutral frontmatter schema: stable kebab-case `id`, title,
  `kind: skill`, concise intent, realistic triggers, domains, and related skill IDs.
- Descriptions should activate on user intent, not mention every rule in the body.
- Instructions are imperative, scoped, and evidence-aware. Require agents to state
  review ranges, commands actually run, manual gaps, and source status.
- Use exact Koha rule IDs where supplied. Never invent IDs for additive patterns.
- Distinguish “must,” “should,” examples, historical notes, draft/proposed rules, and
  agent recommendations.
- Do not encode machine-specific absolute paths in consumer skills. A user-provided
  local checkout may be inspected during maintenance, but resulting instructions
  refer generically to the reviewed checkout.
- Avoid brittle line numbers and exhaustive current-file inventories. Prefer stable
  concepts plus a few verified integration locations.
- Never instruct an agent to amend commits, sign off, upload patches, alter tracker
  state, run destructive database checks, or sync skills without explicit consent.
- Keep source ingestion names and community URLs out of generated prose unless a URL
  itself is essential to the workflow and supplied as current authoritative data.

## Cross-skill consistency audit

On every material refresh, verify:

- all routing references point to existing skill IDs and relative skill files;
- exactly one Koha skill (`koha-community`) permits automatic model invocation;
- authority language agrees across skills;
- stale thresholds and “continue only with acceptance” behavior agree;
- the general skill does not mislabel specialized additive patterns as adopted rules;
- API success statuses, bodies, and Location behavior agree everywhere;
- schema and fresh/upgrade parity requirements agree between general and data review;
- CSRF, escaping, permissions, and state-changing GET guidance agree between general
  and UI review;
- test safety, TestBuilder randomness, transactions, and QA-tool claims agree;
- old Swagger/JSON, object constructors, Bootstrap markup, SQL style, packaging,
  plugin hook, and workflow examples have not re-entered as current requirements;
- obsolete pbuilder/repository/signing recipes are never presented as the modern
  package workflow, and modern builder commands are not invented without its docs;
- plugin hooks are verified against target-version call sites and tests rather than a
  static hook list;
- workflow skills preserve independent roles and never imply authority to mutate the
  tracker, commits, uploads, or sign-offs;
- development radar windows use committer time, one endpoint, non-overlapping bands,
  grouped bug series, and an evidence-derived cycle boundary;
- main-tree examples are never used to grandfather newly added violations.

## Validation

From the refract repository:

1. Run `pnpm build` and inspect every generated Koha `SKILL.md`, not just source.
2. Run `pnpm test`, `pnpm typecheck`, and `git diff --check`.
3. Search generated Koha skills for temporary ingestion filenames, machine-specific
   paths, stale hashes/timestamps, broken related IDs, and contradictory authority
   wording.
4. Confirm generated descriptions remain within adapter limits and frontmatter parses.
5. Treat `pnpm check` separately: it compares configured install targets and may
   legitimately report drift before the user chooses to sync.

Report validation failures honestly. Generated target drift is not a build failure,
and a successful build is not proof that the curated guidance is accurate.
