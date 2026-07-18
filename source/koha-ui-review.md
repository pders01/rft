---
id: koha-ui-review
title: Review a Koha interface patch
kind: skill
intent: Review Koha staff and OPAC interface changes for established interaction patterns, translation, accessibility, security, templates, and current main-tree integration.
triggers:
  - "review a Koha UI patch"
  - "review Koha template changes"
  - "check a Koha staff interface"
  - "review a Koha form, table, modal, or page layout"
domains: [koha, ui, templates, accessibility, translation, code-review, qa]
related: [koha-code-review, koha-data-review, koha-plugin-development, koha-skill-maintenance]
---

> **Guideline snapshot:** Refreshed `2026-07-18T10:07:31Z` from supplied Koha
> interface-pattern and coding guidance. At the start of every review, compare this
> timestamp with the current date. If it is more than 90 days old, warn that the
> skill may not reflect current community practice and ask for refreshed source
> material. Continue only if the user accepts that limitation.
>
> **Main-tree cross-check:** UI integration points were checked against Koha main at
> commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17). Main-tree
> conventions are additive evidence, not authority over the coding guidelines.

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
  not merely a desired color. Non-blocking information does not masquerade as a
  failure; a blocked/destructive decision is visually and textually clear.
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
- Password controls set the required autocomplete mode. Do not disable useful
  autocomplete indiscriminately.
- Every state-changing form includes `csrf-token.inc`, uses a stateful method, and
  carries an `op` beginning `cud-`. GET forms remain stateless.
- Server-side code repeats validation and authorization; client-side validation is
  progressive enhancement.
- Create and edit preserve expected values and distinguish immutable identifiers.
  Cancel returns somewhere predictable without changing data.

## Translation, terminology, and output safety

- UI strings live in templates or translation-aware JavaScript, not Perl controllers.
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
- Use current `Koha.addPrefs`/`Koha.addPermissions` integration where applicable
  rather than inventing globals.
- Bind events in JavaScript, never inline attributes. New linked user strings use
  Koha's JS i18n functions; embedded strings use the template-supported form.
- Use the current API client for resource fetching where supported, and handle
  failure visibly rather than only logging it.
- Avoid page-specific CSS when existing Bootstrap/Koha utility and component classes
  express the design. Check staff and OPAC themes, narrow viewports, zoom, and high
  contrast.
- New JavaScript is Prettier-formatted, passes project lint/tidy checks, and includes
  required JSDoc.

## Verification

Run the narrow controller/unit test and relevant author tests. Current main includes
checks for template validity/tidiness, TT/JavaScript formatting, YAML, licensing, and
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
