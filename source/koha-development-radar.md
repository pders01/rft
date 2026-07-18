---
id: koha-development-radar
title: Build a Koha development radar from Git history
kind: skill
intent: Produce a concise, evidence-based briefing of what recently landed in Koha by examining Git history at day, week, month, and release-cycle zoom levels.
triggers:
  - "what changed recently in Koha"
  - "catch me up on Koha development"
  - "summarize the last day, week, month, or cycle"
  - "give me a Koha development radar"
domains: [koha, git, changelog, release-cycle, briefing]
related: [koha-contribution-workflow, koha-code-review, koha-skill-maintenance]
---

> **Radar workflow snapshot:** Refreshed `2026-07-18T10:32:30Z` after checking the
> shape of Koha main history and release-cycle markers. If this is more than 90 days
> old, verify that commit subjects and cycle markers still follow the assumed shape;
> the history itself must always be queried live from the supplied local checkout.
>
> **Main-tree cross-check:** The workflow was checked against Koha main at commit
> `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17).

Use this skill to answer “what has been happening?” quickly without dumping a raw
changelog. Query the local repository only; do not fetch automatically. State that
the briefing covers the selected local ref and how stale that ref may be.

## Establish the observation point

Record:

```text
repository:
ref and resolved commit:
ref commit time:
wall-clock as-of time and timezone:
working tree state:
remote relationship, if locally known:
cycle boundary and how detected:
```

Default to the user's requested ref. Otherwise use the checked-out branch if it is a
credible development branch, or a locally available main-tracking ref. Resolve it to
a hash before querying so every interval describes one immutable history.

Do not equate local `main`, `upstream/main`, and the live community repository. Report
only what is available locally, for example: “local upstream/main at `<hash>`, last
updated `<committer date>`; no fetch performed.” Uncommitted files are outside the
radar.

Use the briefing's wall-clock timestamp as the common interval endpoint. Git's
`--since` selection follows **committer time**, which is what matters for when a
change landed. Display both committer and author dates only when the distinction
explains an old patch series landing now. Never summarize “recent development” by
formatted author date while filtering by committer date without saying so.

## Define the windows

Default zoom levels are:

- **last day:** endpoint minus 24 hours;
- **last week:** endpoint minus 7 days;
- **last month:** endpoint minus 30 days;
- **cycle to date:** the current development-cycle marker through the endpoint.

Use exact UTC timestamps in commands and print the human-readable boundaries. Do not
let four separate invocations drift to four different “now” values. Treat bands as
half-open `[start, end)` ranges and assign a commit exactly on a boundary once. Since
Git date-option inclusivity can be surprising, partition the one collected structured
history in memory by parsed committer timestamps instead of trusting four overlapping
log invocations.

“Last cycle” is ambiguous. For a catch-up briefing, default to **current cycle to
date**, because it explains the code being developed now. If the user asks for the
**last completed cycle**, use the previous cycle-start marker through (but not
including) the current cycle-start marker. Label the choice in the heading.

### Detect the Koha cycle

Prefer repository evidence over a hard-coded May/November date:

1. Search reachable commit subjects, newest first, for the explicit start-of-release-
   cycle DB revision marker.
2. Cross-check nearby version changes in `Koha.pm` and the preceding “Koha X.Y is
   here” release commit.
3. Use the marker's **committer time** as the current-cycle boundary.
4. For a completed cycle, use the previous marker up to (but not including) the next.
5. If markers are absent, tags are stale, or evidence conflicts, state that clearly
   and ask for a boundary or use a disclosed calendar approximation. Never silently
   manufacture a cycle from the newest tag.

At the recorded main cross-check, an explicit “Start of a new release cycle” DBRev
commit was more reliable than local release tags, which lagged the version recorded
in `Koha.pm`. This is a discovery strategy, not a permanent boundary.

## Collect once, then zoom

Retrieve enough history for the largest window in one structured pass. A useful
starting shape is:

```sh
git log <resolved-ref> --no-merges \
  --since='<cycle-start-UTC>' --until='<as-of-UTC>' \
  --format='%H%x09%cI%x09%aI%x09%an%x09%s'
```

Also collect, as needed:

- commit bodies for unclear or high-impact series;
- `--name-status` or `--stat` to classify touched areas;
- the combined diff for a complete bug series;
- parent/range information for reverts and follow-ups;
- version/cycle commits and database revisions.

Do not parse human-decorated default log output. Avoid `--all`: it double-counts or
mixes unlanded topic branches with the selected development history. Exclude merge
commits by default, but mention meaningful merges if this repository starts using
them for development units.

## Use disjoint zoom bands

The default narrative is nested but non-repetitive:

1. **Last 24 hours** — detailed account of the newest landing batch.
2. **Earlier this week** — changes from day 2 through day 7.
3. **Earlier this month** — changes from day 8 through day 30.
4. **Earlier this cycle** — changes from cycle start through day 31.

For every heading, also show the cumulative total for the named window, such as
“103 commits / 24 bug series in the last 7 days.” The bullets beneath it describe
only the disjoint band not already covered above. This gives genuine zoom levels
without repeating the same change four times.

If the cycle is younger than a month or a shorter band is empty, collapse it and say
so. If the user asks for independent cumulative summaries, provide those instead and
accept the repetition.

## Group commits into developments

A Koha development is usually a bug-number series, not one commit. Group all commits
with the same `Bug N` subject prefix across the largest selected range, preserving
mainline order. Fold follow-ups, QA follow-ups, tests, DB revisions, and formatting
commits into the parent development unless they represent a distinct outcome.

Handle separately:

- commits with no bug number;
- explicit reverts;
- release/cycle/version changes;
- database revision commits whose functional commits may be earlier in the series;
- the same bug returning in separate landing batches.

Count both **commits** and **distinct bug series**. A busy batch of QA follow-ups is
not the same as that many independent features. Do not rank importance by commit
count alone.

For each notable series:

1. Read the full subject sequence.
2. Inspect changed paths and aggregate diffstat.
3. Read the commit body or focused diff when the outcome is not clear.
4. State the user/developer-visible result in one sentence.
5. Add short qualifiers only when useful: regression test, schema change, preference,
   REST contract, dependency, security, revert, deprecation, or follow-up.

Do not claim intent, impact, compatibility, or bug severity from a terse subject
alone. Say “appears to” or omit the claim when the diff was not inspected deeply
enough.

## Build themes, not a file inventory

Classify series using both paths and semantics, for example:

- circulation, holds, patrons, cataloging, acquisitions, serials, ERM/ILL;
- OPAC/staff UX, accessibility, translation;
- REST/API, plugins, background jobs;
- database/schema, search/indexing, performance;
- tests/QA/build, dependencies, packaging, security;
- release engineering, reversions, and cleanup.

Choose three to seven themes supported by multiple or especially consequential
series. Mention isolated minor changes under “Also landed” rather than forcing every
commit into a grand narrative.

Surface cross-cutting signals:

- repeated follow-ups in one area;
- a revert after a recent dependency or behavior change;
- clusters of regressions/tests;
- new preferences, migrations, API contracts, hooks, or dependencies;
- work continuing from an older author date;
- areas with unusually concentrated activity.

These are observations, not judgments about contributors or patch quality.

## Keep the briefing concise

Default output:

```markdown
# Koha development radar
As of … | ref … @ … | cycle … | local history only; no fetch

## 30-second orientation
- 3–5 bullets describing the dominant movement and biggest watch item.

## Last 24 hours — N commits / M bug series
- **Bug N — outcome.** Optional impact qualifier. (`short-hash`)

## Earlier this week — 7-day cumulative N/M
- themes and notable developments not repeated above

## Earlier this month — 30-day cumulative N/M
- themes and notable developments not repeated above

## Earlier this cycle — cycle cumulative N/M
- major arc, completed foundations, and direction of travel

## Watch list
- migrations, reverts, dependency/API/configuration changes worth knowing about

## Method and gaps
- exact boundaries, cycle detection, exclusions, stale ref, and depth of inspection
```

Budget roughly:

- last day: up to 8 development bullets;
- earlier week: up to 6;
- earlier month: up to 6;
- earlier cycle: up to 5 major arcs;
- watch list: up to 5.

Prefer one concrete sentence over several vague bullets. Include short hashes and bug
numbers for traceability, but no community URLs unless supplied/requested. Name
contributors only when the user asks or authorship is materially relevant; this is a
development briefing, not a leaderboard.

## Accuracy checks

Before answering:

- verify all boundaries use committer time and one endpoint;
- ensure disjoint bands neither overlap nor leave gaps;
- reconcile cumulative commit and distinct-series counts;
- check each cited hash is reachable from the resolved ref;
- verify grouped series did not merge unrelated no-bug commits;
- distinguish reverts from fixes and DBRev commits from the underlying feature;
- avoid calling an authored-old but newly committed patch “old”;
- state whether bodies, paths, or diffs were inspected;
- disclose that no fetch occurred and quantify local-ref staleness.

This is an orientation tool, not release notes, QA review, or a promise that every
landed change is production-ready. Route requests to assess correctness to
`koha-code-review` and requests about tracker/release status to
`koha-contribution-workflow`.
