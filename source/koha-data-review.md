---
id: koha-data-review
title: Review Koha database, system preference, and object changes
kind: skill
intent: Review Koha schema migrations, atomic updates, system preferences, DBIC mappings, Koha objects, and their tests as one coherent data change.
triggers:
  - "review a Koha database update"
  - "review a new Koha system preference"
  - "review Koha Object or DBIC changes"
  - "check schema parity or an atomic update"
domains: [koha, database, dbic, system-preferences, code-review, qa]
related: [koha-code-review, koha-api-review, koha-ui-review, koha-plugin-development, koha-skill-maintenance]
---

> **Guideline snapshot:** Refreshed `2026-07-18T10:07:31Z` from supplied Koha
> database-update, system-preference, object-model, testing, and coding guidance.
> At the start of every review, compare this timestamp with the current date. If it
> is more than 90 days old, warn that the skill may not reflect current community
> practice and ask for refreshed source material. Continue only if the user accepts
> that limitation.
>
> **Main-tree cross-check:** Data integration points were checked against Koha main
> at commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17). Main-tree
> conventions are additive evidence, not authority over the coding guidelines.

Apply this alongside `koha-code-review`. The coding guidelines are authoritative.
The supplemental how-to material and patterns observed in Koha main are additive:
they explain workflows and current integration points but cannot weaken or override
a guideline. If main and a guideline differ, review new code against the guideline
and treat existing code under the grandfather rule. Never copy an old example or a
prevalent main-tree pattern merely because it exists; both can preserve legacy names,
SQL style, and object APIs.

## Trace the complete change

Start with a change matrix:

```text
Concept | new install | existing install | DBIC/object | configuration/UI | tests
```

Follow every field, table, preference, permission, and relationship across all
applicable columns. The central QA question is whether a fresh installation and an
upgraded installation end in the same state.

## Schema and atomic updates

For structural changes, verify:

- The canonical install schema is updated for fresh installations.
- An executable atomic update produces the same structure and data for existing
  installations. Contributors add atomic updates; release managers later move them
  into release revision storage and assign versions.
- Column order remains aligned, using `AFTER`/`BEFORE` where the project requires it.
- The update follows the atomic-update skeleton currently present in main, records
  the bug number and one-line description, accepts the installer-provided `dbh` and
  `out` arguments, and reports meaningful output through that handle. Main currently
  provides `say_success`, `say_warning`, and `say_info` for semantic output.
- The update is idempotent: rerunning it causes no damage, duplicate data, errors, or
  misleading warnings. Use the checkout's existence helpers for tables, columns,
  primary/unique/foreign keys, and indexes where appropriate. `INSERT IGNORE` can be
  suitable for stable mandatory rows, but is not a substitute for reasoning about
  changed existing values.
- Atomic updates use SQL and installer helpers only. Do not call Koha business APIs,
  C4 routines, or DBIx::Class schema code whose future shape may no longer match the
  schema at that point in an upgrade.
- New fields have descriptive comments in the install schema. New tables have the
  current primary-key naming convention. Boolean fields use `TINYINT(1)` and receive
  the required DBIC boolean annotation.
- Changes to constrained column types or nullability safely remove and restore every
  affected foreign key.
- User-derived SQL values use placeholders. Review SQL capitalization, integer/date
  defaults, identifiers, and explicit `IN`/subquery behavior against the adopted
  coding guidelines rather than legacy examples.
- Mirrored/history tables are kept compatible—for example active, deleted, and
  modification tables representing the same entity.
- Added installer sample data is reflected in translated installer data where
  required.
- Contributors do not edit the application version or add release-manager revision
  files.

If DBIx::Class files need regeneration, main currently provides
`misc/devel/update_dbix_class_files.pl`; confirm its local options before running it.
Generated content above the “DO NOT MODIFY” boundary is not manually edited.
Contributor-supplied generated changes should be isolated as requested by current
release practice; hand-written supplements belong below that boundary.

Treat the coding guideline's atomic-update SQL exception according to its marked
status and report that status rather than silently resolving a policy ambiguity.

## System preferences

Main currently places English preference YAML under the staff administration
preference hierarchy, mandatory defaults in the installer syspref data, and
contributor revisions in the atomic-update directory. Use the actual neighboring
files at review time because groups and paths can move.

For an added preference, check the entire lifecycle:

- It has a variable-style name and is placed in the appropriate preference group in
  the English reference preference definition.
- YAML syntax and value types match neighboring current preferences. Values after a
  colon have required spacing, and labels containing colons are quoted correctly.
- The description is plain, clear, and translatable. Avoid English idioms and use
  typographic quotation glyphs where the translation guidance requires avoiding
  straight quote characters.
- A mandatory default exists for fresh installations and an idempotent atomic update
  supplies the equivalent default for existing installations.
- The supplemental workflow requires adding a new preference to usage statistics
  unless it can contain sensitive data; verify the current sharing list and preserve
  that privacy exception.
- Runtime checks in templates use `Koha.Preference()` rather than passing a value
  from Perl solely to test it in Template Toolkit.
- The preference is justified: behavior that should vary by library may need to be
  optional, but a preference should not conceal a design problem.
- Tests cover relevant values, commonly using the checkout's preference-mocking
  helper, and restore/isolate state.

For removal, verify all runtime uses and preference definitions are removed, fresh
install defaults are deleted, and an atomic update removes the stored value from
existing installations. Search for spelling variants and indirect consumers.

## Permissions and mandatory data

When permissions change, trace flag definitions, granular permissions, translated
labels/includes, fresh-install rows, upgrade behavior, controller/UI enforcement,
and tests. Hiding a control is not authorization; enforce permission at the action.
Apply the same fresh-versus-upgrade parity analysis to notices and other mandatory
rows.

## Koha objects and DBIC

- Prefer existing `Koha::Object(s)` classes for table CRUD. New singular and plural
  classes expose the correct DBIC result type and object class using conventions
  found in the current checkout.
- New table and key names follow the adopted database guideline, not historical
  examples that use a generic `id` or backticks.
- Methods and variables are `snake_case`. Methods accept a single object, ID,
  arrayref, or named hashref as appropriate; pass an already-loaded related object
  when that avoids a redundant fetch.
- Relationship accessors delegate to the DBIC relationship and wrap the result so
  prefetch, embeds, sorting, and counts remain possible. Do not replace a relationship
  with a new query by foreign key.
- DBIC relationship names and Koha accessors align. Hand-written aliases or filtered
  relationships stay below the generated boundary and preserve SQL-level prefetch.
- Use current constructors such as `_new_from_dbic` where established by the
  checkout; do not copy obsolete constructor names from examples.
- Domain failures use current `Koha::Exceptions`, not historical `carp`, `warn`, or
  undef-return patterns unless the surrounding API specifically requires otherwise.
- If DB-generated values are needed immediately after `store`, verify whether the
  object must refresh/discard changes, and test the actual behavior rather than
  relying on an old caveat.
- Review searches for query growth and N+1 behavior. Use explicit `-in` for external
  lists and database subqueries for key sets already represented by a result set.

## Tests and destructive-check safety

- New and changed routines receive focused tests with subtests and tightly scoped
  variables.
- Database-dependent tests use the checkout's transaction pattern so records roll
  back even when possible, and run only against an isolated development database.
- TestBuilder generates prerequisites, but important values are set explicitly.
  Random generated data and recursively-created relations must not accidentally
  determine the result.
- Cover success, absence, duplicate/idempotent execution, constraints, default and
  non-default preference values, permissions, and rollback/error behavior relevant
  to the change.
- Run the atomic update repeatedly in an expendable environment. Compare upgraded
  and fresh schema using the checkout's current comparison tooling only after
  confirming whether it drops or rewrites the database.
- Regenerate DBIC artifacts and inspect the diff for unintended schema drift.

## Reporting

Use the finding format from `koha-code-review`. Lead with data loss, upgrade failure,
security, and fresh/upgrade divergence. For each finding identify the missing side
of the change matrix. Separate adopted guideline violations from stale supplemental
examples and draft guidance. Finish with commands run, destructive checks not run,
manual upgrade verification, and a verdict.
