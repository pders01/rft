---
id: lit-components
title: Build and review Lit components
kind: skill
invocation: explicit
intent: Apply Lit best practices for element definitions, reactive properties, rendering, lifecycle, events, styles, shadow DOM, and decorators.
triggers:
  - "implement or review a LitElement or ReactiveElement"
  - "debug Lit properties, updates, events, styles, slots, queries, or decorators"
domains: [lit, web-components, components, reactivity]
related: [lit, lit-templates, lit-data, lit-composition, lit-tooling, lit-ssr]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.
> Confirm installed versions and local conventions before changing code.

## Define a stable element API

- A Lit component is a custom `HTMLElement`. Give it a valid, globally unique
  hyphenated tag name, export the class, and define it in the same module with
  `@customElement()` or `customElements.define()`.
- For TypeScript elements, add the class to `HTMLElementTagNameMap` and publish its
  `.d.ts` files.
- Treat public reactive properties as owner-supplied input. Use `@state()` (normally
  private/protected) for implementation state. If user interaction changes a public
  property, update it and dispatch a semantic event; do not dispatch events merely
  because an owner set a property.
- Prefer properties for objects, arrays, functions, and other JavaScript values:
  `.items=${items}`. Attributes are strings and are most useful for markup-facing
  primitive configuration.
- Boolean attributes must default to `false`; presence means true. Prefer names such
  as `disabled`, not an `enabled` attribute that defaults true.
- Reflect properties only when DOM serialization, selectors, or CSS need the state.
  Reflection should be sparse, generally use `useDefault: true`, and should not
  serialize object/array properties.

## Preserve reactivity

Lit normally compares property references with strict inequality and batches changed
properties into one microtask update.

- Prefer immutable object/array updates so every consumer receives a new reference.
  Calling `requestUpdate()` after in-place mutation updates only that host; descendants
  passed the same reference may remain stale.
- Avoid custom setters unless synchronous normalization is truly required. Compute
  derived values in `willUpdate()` and perform post-render work in `updated()`.
- In plain JavaScript with static `properties`, initialize reactive properties in the
  constructor rather than instance class fields, which can shadow prototype accessors.
- Match the project's decorator mode:
  - Lit currently recommends TypeScript experimental decorators for compact output:
    `experimentalDecorators: true`, `useDefineForClassFields: false`; do not enable
    `emitDecoratorMetadata` just for Lit.
  - Standard decorators require supported TypeScript/Babel and `accessor` on decorated
    fields. Babel must use the supported `"2023-05"` decorator version.
  Do not mix syntax or silently alter compiler mode.

## Keep rendering deterministic

`render()` should depend on component properties, return the same description for the
same state, avoid state writes and side effects, and avoid imperative DOM mutation.
Event handlers should update reactive state; templates should express the resulting
DOM. Split complicated templates into small pure template methods or subcomponents.

Lifecycle placement:

- `constructor`: one-time, DOM-independent initialization; call `super()`.
- `connectedCallback`/`disconnectedCallback`: acquire and release external listeners,
  observers, intervals, and subscriptions; call the corresponding `super` methods.
  Internal declarative listeners need no manual removal.
- `willUpdate(changed)`: compute render inputs; it runs during SSR.
- `firstUpdated`: one-time client DOM work such as focus or observer setup.
- `updated(changed)`: client DOM measurement/effects. State writes here schedule a
  second update, so guard them carefully.
- `update`: rarely override; call `super.update(changed)` or rendering/reflection breaks.
- `updateComplete`: waits for this element, not its descendant tree. Prefer
  `ResizeObserver` for layout measurement; browser tests can await `updateComplete`,
  while whole-tree assertions may need an animation frame.

Always call `super` for standard custom-element lifecycle methods. Handle errors from
update hooks and awaited `updateComplete`; an uncaught lifecycle error rejects it.

## Events and component communication

- Add internal listeners declaratively: `@click=${this._onClick}`. Lit binds method
  listeners to the host. Use stable handlers rather than allocating needless closures
  in large repeated templates.
- Add `window`, `document`, and other external listeners while connected and remove the
  exact same listener while disconnected.
- Dispatch after relevant state has rendered when listeners need consistent DOM:
  mutate state, `await this.updateComplete`, then dispatch.
- Choose `bubbles` and `composed` deliberately. Events that must cross a shadow root and
  participate in delegation generally need both. Outside shadow DOM, composed events
  are retargeted to the host; use `composedPath()` only when crossing encapsulation is
  genuinely necessary.
- Prefer standard events when their semantics fit. Put custom payloads in
  `CustomEvent.detail` or use a typed `Event` subclass. Support cancellation with a
  cancelable event and `defaultPrevented` where callers need veto power.

## Shadow DOM, slots, queries, and styles

Use the default open shadow root unless an integration requirement outweighs DOM/style
encapsulation. Returning `this` from `createRenderRoot()` is generally discouraged.

- Render caller-owned light DOM through default/named `<slot>` elements. A whitespace
  text node counts as assigned content and suppresses fallback. Observe dynamic light
  DOM with `slotchange` and `assignedElements()`/`assignedNodes()`.
- Query internal DOM only after rendering using `renderRoot`, `@query`, `@queryAll`,
  `@queryAsync`, or `ref`. Cache a `@query` result only if conditional rendering can
  never replace that node.
- Put shared styles in `static styles = css\`...\`` for one-time evaluation and scoped,
  efficient application. Prefer CSS custom properties for per-instance theming.
- Treat `:host` and `::slotted()` declarations as defaults callers can override.
  `::slotted()` reaches direct slotted elements only, not their descendants.
- Use `classMap`/`styleMap` for dynamic sets. Avoid template `<style>` expressions and
  external shadow-root stylesheets unless their parsing cost/FOUC tradeoff is accepted.
- Interpolate only `css` results or numbers into `css` literals. `unsafeCSS()` is for
  developer-controlled values only; untrusted CSS can exfiltrate data.

## Review and verify

Exercise initial values, pre-upgrade property assignment, attribute conversion/removal,
reflection, immutable updates, rapid batched writes, reconnect cleanup, event
bubbling/composition/cancellation, every conditional shadow-DOM branch, slot fallback
and `slotchange`, focus and keyboard use, and CSS theming. Test in supported browsers,
not only a DOM shim.

Primary docs: [properties](https://lit.dev/docs/components/properties/),
[lifecycle](https://lit.dev/docs/components/lifecycle/),
[events](https://lit.dev/docs/components/events/),
[shadow DOM](https://lit.dev/docs/components/shadow-dom/),
[styles](https://lit.dev/docs/components/styles/), and
[decorators](https://lit.dev/docs/components/decorators/).
