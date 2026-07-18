---
id: koha-contribution-workflow
title: Navigate the Koha contribution workflow
kind: skill
invocation: explicit
intent: Prepare reproducible bug reports and move Koha patches through authoring, sign-off, QA, release, backport, documentation, and closure without conflating roles or changing community state without consent.
triggers:
  - "prepare a Koha bug report"
  - "get this Koha patch ready for sign-off"
  - "what status should this Koha bug have"
  - "help move a Koha contribution through review"
domains: [koha, workflow, bugzilla, signoff, qa, release]
related: [koha-code-review, koha-development-radar, koha-skill-maintenance]
---

> **Workflow snapshot:** Refreshed `2026-07-18T10:23:10Z` from supplied Koha bug
> reporting, commit, sign-off, QA, and development-workflow guidance. At the start of
> every workflow task, compare this timestamp with the current date. If it is more
> than 90 days old, warn that tracker fields or community practice may have changed,
> ask for refreshed material, and continue only if the user accepts that limitation.
>
> **Main-tree cross-check:** Commit and test integration points were checked against
> Koha main at commit `1265f905234946d67f7112932f9b274c47faf152`
> (2026-07-17). Tracker state cannot be inferred from a Git checkout.

The coding guidelines are authoritative for code and commits. Workflow documents are
additive community process. Do not fetch or alter community infrastructure unless the
user explicitly requests and authorizes it. Drafting a report, review, status comment,
or sign-off is not permission to submit it, amend commits, upload patches, assign QA,
or transition tracker state.

## Keep the roles distinct

Track the actual people/organizations serving as:

- bug reporter;
- patch writer;
- independent patch signer/tester;
- QA team member;
- Release Manager;
- Release Maintainer for each supported branch;
- documentation contributor;
- bug closer.

The patch writer should not sign their own patch. The signer and QA reviewer are
different people, preferably providing independent organizational perspectives. The
supplied workflow allows same-organization QA after a patch has waited a month only
when the signer is from another organization, while retaining Release Manager
judgment. Do not assume the agent or current user holds a privileged community role.

## Report a reproducible issue

Before drafting a new report:

1. Reproduce on a recent relevant build and record the exact version/commit.
2. Search supplied/local issue information if available for duplicates. Do not access
   the community tracker without permission.
3. Reduce to one problem per report and separate observed facts from hypotheses.
4. Remove patron data, credentials, private URLs, and other sensitive information
   from logs, screenshots, exports, and sample records.

Draft:

- **Summary:** concise, searchable description of the problem—not the proposed fix.
- **Component/version/platform/OS:** exact environment and other versions tested.
- **Severity:** impact-based. Reserve blocker/critical for release-blocking, crash,
  data-loss, or similarly severe outcomes; distinguish bugs, enhancements, and truly
  new features. A cosmetically small issue requiring broad workflow/schema change may
  need enhancement treatment.
- **Overview and setup:** preferences, permissions, sample data, search engine,
  language, browser, package/source deployment, and topology needed to reproduce.
- **Steps to reproduce:** minimal numbered actions.
- **Actual result:** exact behavior, messages, and relevant sanitized logs.
- **Expected result:** observable correct behavior.
- **Regression/range:** known-good and known-bad versions when available.
- **Additional information:** frequency, scope, screenshots, test data, and safe
  durable context.

External links can disappear; include enough evidence for the report to remain useful
without them. Enhancements should explain user value and affected workflows, not only
implementation.

## Prepare the patch series

- Every commit begins `Bug <number>: ` and does one reviewable job. Follow-up and QA
  follow-up wording follows `koha-code-review`.
- Keep functional change, refactoring/reindentation, generated DBIC artifacts, and
  unrelated guideline cleanup separate when the coding guidelines or release process
  require reviewers to distinguish them.
- Commit bodies explain the problem and solution and contain a self-sufficient
  `Test plan:`. Essential test information belongs in commits, not only tracker
  comments.
- Call out documentation, preference, permission, cron, schema, configuration,
  package, and upgrade consequences.
- Run focused tests, QA Test Tools, and domain review skills over the exact series.
- Material AI assistance receives the required trailer and is communicated during
  testing/review as required by the coding guidelines.
- Attach/upload behavior is a user-authorized workflow step. Prefer locally available
  current tooling and inspect its help rather than copying old transport commands.

When ready for independent testing, the patch writer supplies the patch and moves the
report to **Needs Signoff**. Do neither automatically.

## Independent sign-off

A signer verifies advertised functionality, not full QA compliance:

1. Apply the exact series to its intended base and record base/HEAD.
2. Follow the complete test plan.
3. Exercise obvious omissions and record anomalies.
4. Confirm the behavior works as described and decide whether anomalies block
   progression.
5. Add `Signed-off-by:` plus a brief factual account of what was tested only after
   successful independent verification.

If it no longer applies, the workflow status is **Patch doesn't apply**. If it applies
but testing fails, provide detailed reproduction and use **Failed QA** for a concrete
problem; reserve **In Discussion** for a disagreement requiring broader input. Do not
mark a technical failure “In Discussion” merely to soften it.

A successful signer uploads/provides the signed series and transitions to **Signed
Off**, but only through authorized community tooling and with explicit user consent.
A revised patch invalidates prior testing unless the signer verifies the new series.

## QA

QA reviews patches already signed off and combines functional testing with code,
guideline, architecture, security, test, and workflow review.

- Claim/assign QA according to current tracker practice before duplicating work.
- Apply `koha-code-review` and every routed specialist skill.
- Run QA Test Tools and focused tests over the exact commits.
- Look beyond the test plan: all libraries/configurations, changed workflows, logs,
  duplication, unrelated scope, database fresh/upgrade parity, warnings, regressions,
  and side effects.
- Require adequate commit messages, test plans, documentation, and formal metadata.
- Explain every failure with enough detail to reproduce and continue work.

A successful authorized QA reviewer adds their sign-off and transitions to **Passed
QA**. Concrete issues transition to **Failed QA**; unresolved policy/design disputes
go **In Discussion**. Only recognized QA/Release roles normally mark Passed QA, with
the supplied packaging-role exception for build-process patches. The agent must not
claim these roles.

## Release and downstream lifecycle

The supplied workflow continues:

```text
Passed QA → RM review/sign-off → Pushed to main → stable backports in order →
Needs documenting → RESOLVED/FIXED → CLOSED/FIXED after release
```

Release Maintainers independently decide whether a main change is applicable and
safe for each stable/older/LTS branch; main acceptance does not guarantee backport.
When a pushed change is incomplete:

- revert and request a corrected patch on the original report, or
- file and link a new bug for a defect/side effect in the new functionality.

Do not report defects in already-pushed new functionality as endless revisions of the
original implementation bug. Documentation completion and actual release determine
later closure states.

## Produce a workflow report

Return:

- current known stage and evidence;
- missing prerequisites;
- role/independence constraints;
- exact local checks performed;
- proposed next status and why;
- draft tracker comment or commit text, clearly marked as draft;
- actions requiring explicit authorization;
- stale or uncertain tracker conventions.

Never state that a patch is signed off, Passed QA, pushed, backported, documented, or
released without evidence from an authorized actor or supplied tracker state.
