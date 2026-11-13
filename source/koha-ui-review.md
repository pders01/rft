---
id: koha-ui-review
title: Review a Koha interface patch
kind: skill
invocation: explicit
intent: Review Koha staff and OPAC interface changes for established interaction patterns, translation, accessibility, security, templates, and current main-tree integration.
triggers:
  - "review a Koha UI patch"
  - "review Koha template changes"
  - "check a Koha staff interface"
  - "review a Koha form, table, modal, or page layout"
domains: [koha, ui, templates, accessibility, translation, code-review, qa]
related: [koha-code-review, koha-data-review, koha-plugin-development, koha-skill-maintenance]
---

> **Supplemental snapshot:** Refreshed `2026-11-13T18:47:32Z` from the Koha wiki
> interface-pattern guidance. At the start of every review, compare this
> timestamp with the current date. If it is more than 90 days old, warn that the
> skill may not reflect current community practice and ask for refreshed source
> material. Continue only if the user accepts that limitation.
>
> **Main-tree cross-check:** UI integration points were checked against Koha main at
> commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17). Main-tree
> conventions are additive evidence, not authority over the coding guidelines.
>
> **General guideline snapshot:** Reviewed `2026-11-13T18:54:37Z` from a
> user-supplied Koha wiki export identifying revision `40849` (last edited
> 2026-10-14). No current Koha checkout was provided, so the main-tree cross-check
> was not renewed.

Check the general-guideline baseline and main-tree date independently of this wiki
refresh. If either relevant baseline is more than 90 days old, warn, ask for refreshed
material or a current checkout, and continue on that baseline only with the user's
explicit acceptance. A recent supplemental refresh does not make those records current.

Apply this alongside `koha-code-review`. The coding guidelines are authoritative;
the interface-pattern material and current main show established user experience and
integration points but cannot override a guideline. Existing main templates contain
legacy and transitional patterns. Use nearby modern pages to understand components,
then assess new lines against the guidelines.

## Understand the interaction first

State the user, task, interface (staff or OPAC), entry point, successful outcome,
and destructive or permission-sensitive actions. Walk the full state machine:

```text
list/view → create/edit/action → validation/error → success/cancel → resulting view
```

Review every state, not just the template shown in the diff. Verify controller data,
server-side authorization, API calls, empty states, and JavaScript-enhanced behavior.

The refreshed interface guidance mixes Bootstrap generations and legacy examples:
its breadcrumb/modal sections reference Bootstrap 5, while other links, tab output,
and button examples retain older conventions. Some sample forms omit modern CSRF
and operation handling. Treat those as examples of interaction flow, not copy-ready
markup; use the target checkout and authoritative coding rules to resolve details.

## Page structure and orientation

- Use the current shared header, sub-header, main-container, menu, and breadcrumb
  wrappers rather than recreating their markup. At the recorded main cross-check,
  staff pages commonly use `header.inc`, `sub-header.inc`, `WRAPPER breadcrumbs`,
  breadcrumb-item wrappers, and `main-container.inc`; verify local usage because
  these components evolve.
- Header search choices should be relevant and unambiguous. Prefer the module's most
  useful search and avoid overcrowding it with low-value defaults.
- Breadcrumbs orient users to the module and current page, include useful workflow
  ancestors, and repeat the page identity. Mark only the current item active.
- The document title puts unique page/action information first, followed by section,
  administration/module, and Koha context.
- The visible `h1`, document title, and active breadcrumb describe the same state.
- OPAC pages contain exactly one `.maincontent` region as required by the coding
  guideline.
- Prefer current layout wrappers and Bootstrap generation in main over copying raw
  grids from an older example. Preserve logical source order and responsive behavior
  when a custom grid is genuinely needed.

## Messages, errors, and workflow state

- Informational, success, warning, and error presentation matches the semantic state,
  not merely a desired color. The interface guidance uses `alert alert-info` for
  non-blocking information and `alert alert-warning` for a blocked action or required
  decision; verify target-version components rather than inventing variants from
  color alone. A blocked/destructive decision is visually and textually clear.
- Messages explain what happened and what the user can do next without exposing
  internals. Check logs separately for developer detail.
- Validation errors are associated with their fields, understandable without color,
  and preserved after submission along with safe user input.
- Empty lists explain that no records exist and offer the primary creation action
  when the user has permission.
- Success returns users to the most useful resulting view and avoids accidental
  duplicate submission.

## Views, actions, and controls

Treat a **view** as a way to inspect a record and an **action** as something done to
it. Group views with navigation and actions in toolbars or row-action controls.

- List pages normally present the primary “New …” action, heading, then data table or
  empty state. More than a couple of row actions may belong in a menu.
- Create/edit forms focus on submit or cancel and do not retain an unrelated list
  toolbar. Non-editable identifiers are rendered as text rather than disabled inputs
  that imply editability.
- Use links for navigation and buttons/forms for state changes. A link that submits
  a form follows the adopted `form-submit.js` guideline.
- Button hierarchy reflects consequence: one clear primary submit, ordinary
  secondary actions, and explicit destructive confirmation. Icon-only controls have
  accessible names; decorative icons are hidden from assistive technology.
- Radio buttons and checkboxes have correctly associated labels and a fieldset/legend
  for grouped choices where appropriate.
- Destructive actions require a clear confirmation naming the affected object. The
  confirmation itself uses POST with CSRF protection and a `cud-` operation; cancel
  is safe navigation and causes no state change.
- Keyboard interaction, focus order, and shortcuts do not conflict with browser or
  assistive-technology behavior.

## Forms

- Labels and control IDs match. Required controls have the HTML `required` attribute,
  visible required indication, and established validation classes when using Koha's
  validation plugin.
- Use appropriate native input semantics, except follow the coding guideline to
  avoid `type="number"` in favor of text plus `inputmode="numeric"` and an optional
  integer pattern.
- Follow HTML10's stated policy: authentication password fields use
  `autocomplete="off"`; new/confirmation fields may use `new-password`. Identify
  this as Koha policy, not a guarantee that browsers prevent saved credentials.
  Do not expand the rule into disabling autocomplete on unrelated fields.
- Every state-changing form includes `csrf-token.inc`, uses a stateful method, and
  carries an `op` beginning `cud-`. GET forms remain stateless.
- Server-side code repeats validation and authorization; client-side validation is
  progressive enhancement.
- Create and edit preserve expected values and distinguish immutable identifiers.
  Cancel returns somewhere predictable without changing data.

## Translation, terminology, and output safety

- UI strings live in templates or translation-aware JavaScript, not Perl controllers.
- HTML1 forbids `>` comparisons inside HTML tags, not every TT conditional
  attribute. Preserve balanced tags (`HTML11`) and Koha's XHTML-style tag closing.
  For a hash key colliding with a TT virtual method, use `item('key')` (`HTML6`).
- Use sentence case, canonical library terminology, inclusive language, and
  gender-neutral phrasing.
- Keep text separate from markup. Wrap text as required by current translation
  extraction patterns, and use placeholder-aware translation functions when values
  occur inside sentences.
- Every TT value has its context-appropriate `html`, `uri`, `url`, or justified
  `$raw` filter. User-authored HTML is scrubbed with the correct profile before raw
  rendering.
- Dates use `KohaDates`; preferences use `Koha.Preference()` in TT; assets use the
  `Asset` plugin.
- Do not copy untranslated literals or obsolete translation syntax from an existing
  page merely because it is grandfathered.

## Tables, tabs, dialogs, and modals

- Tables have real headers, meaningful captions/context where needed, stable empty
  behavior, and correctly escaped renderers. Sorting/searching use the semantic data,
  not only rendered markup.
- Row actions remain keyboard reachable and authorized. API-backed tables handle
  loading, empty, error, and permission states.
- Use current tab wrappers so tab links and panels remain paired. Tab labels are
  translation-friendly, one tab is active, and keyboard/ARIA behavior comes from the
  shared component rather than custom code.
- Use the Bootstrap generation and modal markup currently adopted by main. A modal
  has an accessible name, focus management, keyboard dismissal where safe, and a
  visible close/cancel path. Destructive confirmation is not weakened by accidental
  backdrop dismissal.
- Printable modals use the current shared printing asset and printable class only
  after checking the current implementation.

## JavaScript and CSS

- Prefer shared or linked JavaScript. Embedded blocks use a CSP nonce and the footer
  mechanism. Keep TT-derived setup data in its own script block and ordinary tidy
  JavaScript free of TT expressions, following the coding guideline's separation
  pattern.
- Use `Koha.addPrefs`/`Koha.addPermissions` as described by JS19 where the target
  version supports them, rather than inventing globals. Keep the setup block and
  ordinary JS separate; JS1's nonce requirement still applies even if a sample
  second script omits it.
- Use vanilla JavaScript or Vue for new/refactored core code (`JS21`); retained
  jQuery support for *UserJS and plugins does not justify new core jQuery code.
  Do not rewrite untouched legacy code merely to remove jQuery.
- JS7's older jQuery-ready examples and JS10's jQuery-validation requirement coexist
  with JS21 in the snapshot. Preserve HTML `required` and the existing validation
  contract; surface a new/refactored form's unresolved validation choice to QA
  rather than silently declaring either rule repealed.
- Bind events in JavaScript, never inline attributes. New linked user strings use
  Koha's JS i18n functions; embedded strings use the template-supported form.
- Select/match using stable data attributes, IDs, or appropriate classes, never
  translated visible GUI text (`JS20`). Test the behavior in another language.
- For link-triggered form submission, use JS16's `form-submit.js` mechanism; verify
  that the target version includes it globally or explicitly load it for older
  backports. POST submission includes CSRF; do not use GET for a mutation.
- Use the current API client for resource fetching where supported, and handle
  failure visibly rather than only logging it.
- Avoid page-specific CSS when existing Bootstrap/Koha utility and component classes
  express the design. Check staff and OPAC themes, narrow viewports, zoom, and high
  contrast.
- New JavaScript is Prettier-formatted, passes project lint/tidy checks, and includes
  required JSDoc. JS17's double-quote rule is **draft**, independently of actual
  formatter requirements. JS6's trailing-comma restriction still has a legacy IE
  rationale; flag a conflict with target tooling rather than silently removing it.

## Verification

Run the narrow controller/unit test and relevant author tests. The historical main
cross-check found checks for template validity/tidiness, TT/JavaScript formatting, YAML, licensing, and
missing CSRF tokens; discover exact commands in the checkout. Then manually verify:

- keyboard-only use and visible focus;
- accessible names, headings, landmarks, errors, and modal focus;
- narrow and wide layouts plus zoom;
- translated or expanded strings;
- empty, one-row, many-row, error, and permission-denied states;
- JavaScript disabled where a non-JS fallback is required;
- create, edit, cancel, validation, and destructive confirmation;
- no browser-console errors or failed network requests.

Do not claim accessibility or responsive correctness from static inspection alone.

## Reporting

Use the finding format from `koha-code-review`. Lead with security, inaccessible
workflows, data-changing UI errors, and broken translation; then inconsistency and
maintainability. Cite coding rule IDs where available. Label interface-pattern advice
as additive rather than inventing a rule ID. Record browsers/viewports and assistive
checks actually performed, manual gaps, and the verdict.
