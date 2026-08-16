---
id: lit-templates
title: Write safe and efficient Lit templates
kind: skill
invocation: explicit
intent: Apply Lit template syntax, directive, list, conditional, DOM-reference, custom-directive, performance, and injection-safety guidance.
triggers:
  - "write or review Lit html or svg tagged templates"
  - "choose a Lit directive, render a list, or fix an expression"
  - "review unsafeHTML, unsafeSVG, unsafeStatic, templateContent, or unsafeCSS use"
domains: [lit, templates, directives, security, performance]
related: [lit, lit-components, lit-data, lit-composition, lit-ssr, lit-localization]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.

## Start with ordinary templates

Use `html`/`svg` tagged literals as declarative descriptions, not string-built HTML.
Keep static markup in the literal and dynamic data in valid expression positions.
Lit's normal text, attribute, and property bindings do not parse expression strings as
HTML, which is an important XSS boundary.

Choose the binding by semantics:

```ts
html`<p>${text}</p>`                    // child/text
html`<img alt=${alt}>`                 // string attribute
html`<button ?disabled=${blocked}>`    // boolean attribute
html`<x-list .items=${items}></x-list>`// JavaScript property
html`<button @click=${this.onClick}>`  // event listener
html`<input ${ref(this.inputRef)}>`     // element directive
```

- Use `nothing` to remove child content or an attribute; `ifDefined(value)` is
  convenient attribute-only sugar for null/undefined removal. Avoid emitting invalid
  URL attributes while one segment is missing.
- Bind editable controls via properties (`.value`, `.checked`), not dynamic children.
  Use `.innerText` for controlled `contenteditable` content.
- Keep templates well-formed when every expression is replaced by an empty value.
  Expressions cannot normally be tag names, attribute names, comment content, or
  dynamic content inside `<template>`.
- Use linting and Lit-aware editor tooling because browsers silently repair much
  malformed HTML.

## Conditionals and lists

Prefer normal JavaScript—ternaries, `if`/`switch`, helper functions, `map`, or loops—
until a directive provides a concrete benefit.

- `map()` or array `.map()` is smaller and faster for ordinary positional lists.
- Use `repeat(items, key, template)` when insertions/reorders should move existing DOM,
  when item DOM is expensive, or when uncontrolled DOM state (focus, selection,
  checkbox state) must stay attached to identity. Keys must be stable and unique.
- Do not use unkeyed `repeat`; use `map` unless keyed diffing/Dom stability is needed.
- Use `cache()` only for frequently toggled, large templates worth retaining in memory.
- Use `keyed(key, value)` when a key change must deliberately discard all reused DOM.
- Use `guard(deps, fn)` for measured expensive computation with identity-stable,
  preferably immutable dependencies—not as routine decoration.
- Use `live()` only when external code or user edits can change live DOM and the bound
  value must overwrite it. Avoid it where binding performs type conversion.

## Pick narrow directives

Import each directive from its own module so bundlers include only what is used.

- Styling: `classMap` and `styleMap` must be the sole expression in their respective
  attributes, though static text may surround them.
- Flow: `when`, `choose`, `map`, `repeat`, `join`, `range`, `ifDefined`.
- Identity/work: `cache`, `keyed`, `guard`, `live`.
- DOM access: `ref`; prefer declarative rendering and reserve refs for focus,
  measurement, and imperative library integration.
- Async presentation: `until` for promise placeholders; `asyncAppend` and
  `asyncReplace` for async iterables. For request lifecycle, errors, cancellation, and
  races, prefer `@lit/task` over ad hoc promise rendering.

## Enforce the trust boundary

Treat every API named `unsafe*` as a security-sensitive sink.

- Never pass user input, URL/query values, unsanitized database/CMS content, or other
  attacker-influenced strings to `unsafeHTML`, `unsafeSVG`, `unsafeStatic`, or
  `unsafeCSS`.
- `templateContent()` is also dangerous when its `<template>` was created from an
  untrusted string.
- Prefer ordinary child expressions, which render strings as text. If rich external
  content is a real requirement, define and review a sanitizer/trusted-types policy at
  the application boundary before it reaches Lit; do not claim that an `unsafe*`
  directive sanitizes anything.
- `literal`/static expressions are appropriate for developer-controlled structural
  configuration such as a rarely changing tag choice. Reactive static values cause
  full template reparsing, DOM replacement, and a permanently cached template variant;
  do not use them for normal dynamic values.

During review, trace each dangerous value back to its origin and transformation. A
comment saying “trusted” is not evidence.

## Custom directives

Write one only when a normal function or built-in directive is insufficient.

- A simple directive/function should return a renderable value.
- Extend `Directive` for persistent state or part/DOM access; validate the expected
  `PartType` in the constructor.
- Keep declarative, SSR-capable output in `render()`. Use `update()` only for required
  DOM access and return `noChange` after an imperative no-op/update; `undefined` clears
  the part.
- Extend `AsyncDirective` only for out-of-band updates. Use `setValue()`, release all
  subscriptions/resources in `disconnected()`, restore them in `reconnected()`, and
  check `isConnected` before subscribing because updates can arrive while disconnected.
- Remember SSR calls directive constructors and `render()`, but not `update()` or async
  connection callbacks.

## Verification

Test first render and repeated updates, null/undefined/empty-string behavior, property
versus attribute types, conditional branch swaps, keyed reorder/insert/delete, focus
and uncontrolled input state, async replacement/cancellation, disconnect cleanup, and
every dangerous sink with adversarial input. Profile before adding caching or guards.

Primary docs: [expressions](https://lit.dev/docs/templates/expressions/),
[lists](https://lit.dev/docs/templates/lists/),
[conditionals](https://lit.dev/docs/templates/conditionals/),
[built-in directives](https://lit.dev/docs/templates/directives/), and
[custom directives](https://lit.dev/docs/templates/custom-directives/).
