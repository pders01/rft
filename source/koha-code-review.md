---
id: koha-code-review
title: Review a Koha patch against the coding guidelines
kind: skill
intent: Review a Koha patch for guideline regressions across Perl, templates, JavaScript, SQL, security, tests, accessibility, and contribution hygiene.
triggers:
  - "review this Koha patch"
  - "check this diff against the Koha coding guidelines"
  - "sign off or QA a Koha change"
  - "look for Koha coding guideline violations"
domains: [koha, code-review, qa]
related: [koha-api-review, koha-data-review, koha-ui-review, koha-plugin-development, koha-debian-packaging-review, koha-contribution-workflow, koha-skill-maintenance]
---

> **Guideline snapshot:** Refreshed `2026-07-18T10:07:31Z` from the supplied
> general Koha coding guidelines. At the start of every review, compare this
> timestamp with the current date. If it is more than 90 days old, warn that the
> skill may not reflect current community guidelines and ask for refreshed source
> material. Continue only if the user accepts that limitation; never silently treat
> an old snapshot as current.
>
> **Main-tree cross-check:** Integration points were checked against Koha main at
> commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17). Main-tree
> conventions are additive evidence, not authority over the coding guidelines.

The coding guidelines are authoritative. Use current main to locate integration
points, tests, helpers, and representative implementations, but do not infer that a
prevalent legacy pattern overrides a guideline. Apply the grandfather rule to
existing code and review newly introduced behavior against the guidelines.

Review the proposed Koha change, not the entire surrounding codebase. Apply the
coding guidelines to lines and behavior introduced or changed by the patch.
Existing violations are not blockers unless the patch worsens or depends on them.
Recommend unrelated cleanup as a separate patch, never mixed into the bug fix.
Treat rules explicitly marked **draft**, **proposed**, **revised title**, or
**deprecated** according to that status; do not present a proposal as an adopted
requirement.

## Review procedure

1. Establish the review range. Prefer the user-specified commits; otherwise inspect
   the working-tree and staged diffs. State exactly what was reviewed.
2. Read the complete changed functions, templates, schemas, and tests—not only the
   diff hunks—when context affects correctness.
3. Classify changed files and apply the relevant sections below.
4. Run focused checks already provided by the checkout where practical. Do not
   invent command results. Separate findings proven by inspection, failures from
   executed checks, and items requiring manual verification.
5. Review behavior and regressions as well as formatting. A guideline checklist is
   not a substitute for understanding the change.
6. Route domain-specific changes to the focused review skills as well:
   - REST specifications/controllers: `koha-api-review`
   - staff or OPAC interface/templates: `koha-ui-review`
   - schema, atomic updates, system preferences, or object-model changes:
     `koha-data-review`
   - plugin packages, plugin hooks, or contributed routes: `koha-plugin-development`
   - Debian metadata, maintainer scripts, package commands, or services:
     `koha-debian-packaging-review`
   - bug reporting, submission, sign-off, tracker status, or release progression:
     `koha-contribution-workflow`

## Contribution and commit checks

Review every commit independently, not only the aggregate diff:

- The subject starts `Bug <number>: `, followed by a clear summary. The community
  guidance recommends fewer than 50 characters where practical; do not turn that
  recommendation into an absolute failure.
- Follow-ups identify themselves immediately after the colon using the established
  wording. QA follow-ups identify the QA role.
- The body explains the problem and the chosen change, wrapping ordinary prose near
  72 characters where practical.
- A usable `Test plan:` can be followed by a Koha-familiar tester who does not know
  this feature. For a fix, it should establish the failure before the patch and the
  corrected behavior afterward when practical. It need not end with “Sign off.”
- Documentation notes call out new preferences, permissions, cron jobs, or other
  release-documentation needs.
- Credit is expressed with appropriate trailers such as `Sponsored-by:`,
  `Co-authored-by:`, `Mentored-by:`, `Reported-by:`, `Thanks-to:`, or `Rescued-by:`.
  A sign-off includes `Signed-off-by:` and a brief account of what was tested.
- Material AI/LLM assistance uses
  `Assisted-by: <ModelName> <Version> (<Vendor>)`; routine completion, linting, and
  static analysis do not require it. A human remains responsible for verification.

Do not amend commits, add sign-offs, upload patches, or change tracker status unless
explicitly asked. Reviewing readiness is not authorization to perform workflow
transitions.

## Baseline checks

- Every commit references `Bug <number>` at the beginning of its message.
- New scripts and modules carry the GPLv3+ licence statement.
- Text files use four spaces, not tabs. Large reindentation or stylistic refactoring
  unrelated to the functional change belongs in a separate commit.
- New terminology is consistent internally and in the UI. Use sentence case,
  gender-neutral pronouns, and inclusive language.
- New cookies or changed cookie behavior update the cookie documentation.
- Performance or cache claims include before/after benchmarks.

## Perl and Koha architecture

For changed Perl, check:

- New Perl is tidy using the repository `.perltidyrc`, uses `Modern::Perl`, passes
  the configured Perlcritic level 5 checks, and fixes rather than suppresses
  warnings.
- Koha namespace names use `UpperCamelCase` modules and `snake_case` methods and
  variables. New modules go under `Koha::`, not deprecated `C4::`.
- Prefer object-oriented `Koha::Object(s)` APIs for table CRUD where available.
  Koha namespace modules should not reference C4 except `C4::Context`.
- Relationship accessors use the existing DBIC relationship so prefetch remains
  possible; do not issue a fresh `find` by foreign key from the accessor.
- New methods/functions take one database ID, arrayref, or hashref of named
  arguments rather than long positional lists. Avoid needless exports.
- Use direct object notation (`CGI->new`), `constant` for read-only values, and
  `Koha::Exceptions` rather than `die` or `croak` for domain failures.
- Prefer `use` at the top of the file. `require` is reserved for runtime module
  names, unavoidable circular dependencies, or another QA-confirmed exception.
- Global state in modules and CGI scripts is forbidden because it is not
  Plack-friendly.
- CRUD actions should generally live together in one CGI script.
- New command-line or cron scripts use `Koha::Script` or `Koha::Script -cron`.
- New/changed routines have accurate POD and focused tests. New tests use subtests,
  create their own data (for example with TestBuilder), and do not rely on optional
  sample data. Seek close to complete statement coverage for the changed behavior.
- New plugin hooks pass arguments by reference so each plugin sees changes made by
  prior plugins.

## Templates, UI, and accessibility

For `.tt`, `.inc`, HTML, notices, and UI strings, check:

- Template Toolkit structure is syntactically valid and HTML tags are not opened in
  mutually exclusive branches and closed only once outside them.
- UI HTML and translatable interface strings are defined in templates rather than
  embedded in Perl controllers.
- Dates use the `KohaDates` plugin and are supplied in ISO form.
- System preferences are read with `Koha.Preference()` in templates rather than
  passed from a controller solely for the check.
- JavaScript and CSS links use the `Asset` plugin.
- Every displayed template variable has an appropriate `html`, `uri`, `url`, or
  justified `$raw` filter. User-authored HTML is scrubbed before `$raw` rendering.
- Authentication password fields use an appropriate `autocomplete` value;
  new-password and confirmation fields use `new-password`.
- New or updated default notices use Template Toolkit.
- Every OPAC page has exactly one `.maincontent` block.
- Avoid `input type="number"`; use text with `inputmode="numeric"` and, when useful,
  an integer pattern.
- Put unique information first in `<title>` elements.
- UI labels use sentence case, not title case.

## JavaScript

- Prefer linked JavaScript. Embedded scripts require a CSP nonce and belong at the
  template end using the established footer mechanism.
- Do not intermingle TT expressions with ordinary JavaScript in the same script
  block. Put TT-derived values in a dedicated setup block and consume those values
  from tidy JavaScript.
- Embedded user-facing strings use `_()`; linked-file strings use Koha's `__`/plural
  i18n functions. Keep markup out of translated strings and use `format()` for
  placeholders so translators can reorder them.
- Attach events in JavaScript, not `onload`, `onclick`, or other HTML event
  attributes.
- Forms use Koha's jQuery validation conventions and retain HTML `required` as a
  non-JavaScript fallback.
- Add no new jQueryUI dependencies.
- New JS files are Prettier-formatted and document classes/functions with JSDoc,
  including parameter and return types.
- Form-submission links use `form-submit.js` conventions where applicable.
- Follow the established Vue resource save-navigation pattern when changing those
  resources.
- Run the repository ESLint/Prettier checks applicable to the changed files.

## Database and SQL

- Installer SQL causes no foreign-key violations. New tables have a primary key
  named `<table>_id`.
- Avoid SQL92 keywords for identifiers, MySQL backticks, zero-date defaults, and
  quotes around integer literals. SQL keywords are uppercase.
- User-derived values always use placeholders.
- Prefer explicit `-in`/`-not_in` for lists of external values in DBIC. If values
  already come from a database result set and the column is a key, prefer a subquery
  instead of materializing IDs into Perl. A bare arrayref produces OR conditions and
  is appropriate only when OR is intentional.
- Do not add SQL to CGI scripts. SQL belongs in the relevant module, except for
  accepted contexts such as reports and command-line special-purpose SQL. Atomic
  update guidance in the supplied guidelines is marked draft and should be reported
  as such.
- Every added field is documented with a comment in `kohastructure.sql`.
- Boolean columns are `TINYINT(1)` and have the manual `is_boolean => 1` DBIC
  annotation below the generated section.
- When changing a constrained column's type or nullability, safely remove and restore
  its foreign-key constraints.
- Date/action field naming follows `<action>_date`, with past-tense actions, while
  noting that the database naming rule is draft.

## Security and state changes

Treat these as high priority:

- Stateful forms and requests (`POST`, `PUT`, `DELETE`, `PATCH`) carry a valid CSRF
  token. POST forms include `csrf-token.inc` and an appropriate operation value.
  Stateless methods must not use an `op` beginning with `cud-`.
- All untrusted template values are escaped. `$raw` is acceptable only with a clear
  trust argument or after the appropriate `C4::Scrubber`/`HtmlScrubber` profile.
- Check authorization at the server-side action, not only by hiding UI controls.
- Check for SQL injection, unsafe redirects, path traversal, leaked patron data,
  insecure direct object access, and state changes performed by GET.
- If the change embeds AI functionality, it must be optional and off by default,
  avoid data leakage, support multiple providers including self-hosting, and make
  cost/performance implications clear.

## Action logs and deprecations

- New action-log data changes use the standard JSON diff: preserve the original
  object/data and pass both original and modified values to `logaction`.
- Do not add or enhance `/svc` endpoints; use the REST API.
- New modules do not use C4. New indexing changes target DOM Zebra rather than GRS-1.
- Staff/OPAC bibliographic display changes target XSLT, not deprecated non-XSLT
  templates.

## Functional testing and QA workflow

- Walk through the supplied test plan and then test important behavior it omits:
  permissions, empty and boundary cases, alternate libraries/configurations,
  regressions, side effects, logs, and changed workflows.
- Determine whether optional behavior should be controlled by configuration rather
  than imposed on every library.
- Run the checkout's focused tests first. Database-dependent tests can modify the
  configured database; run them only in an isolated development environment and use
  the test suite's transaction conventions.
- Use TestBuilder-created records rather than optional sample data, but set values
  relevant to the assertion explicitly because generated values are random and
  recursively-created related rows may not be valid in every Koha business context.
- Run the QA Test Tools over the exact commit range when available. In a configured
  testing container this is commonly `qa`; other environments may expose
  `koha-qa.pl`. Discover options locally rather than assuming copied setup commands
  are current. A tool failure normally blocks QA, but still explain the concrete
  failure instead of treating tool output as self-explanatory.
- Functional sign-off confirms the test plan and advertised behavior. QA additionally
  reviews code, guidelines, tests, database parity, warnings, duplication, scope,
  and wider side effects. Keep those roles distinct in the verdict.

## Reporting format

Lead with findings, ordered by severity:

```text
[blocker|major|minor] path/to/file:line — concise problem (RULE-ID)
Why it matters: concrete failure, regression, security risk, or adopted rule.
Suggested fix: smallest in-scope correction.
```

Use exact rule IDs when available (`HTML9`, `PERL17`, `SEC1`, and so on). Clearly
label draft/proposed guidance. Do not report preference-only style opinions as
violations. Then include:

- **Checks run:** command and result.
- **Manual verification needed:** behavior not established by static review.
- **Verdict:** `pass`, `pass with non-blocking notes`, or `changes requested`.
- **Scope note:** identify pre-existing issues deliberately excluded.

If there are no findings, say so explicitly, but mention remaining test or manual
verification gaps. AI-assisted review or QA must be communicated clearly in the
Bugzilla discussion when used materially.
