---
id: lit-composition
title: Compose Lit components and reusable behavior
kind: skill
invocation: explicit
intent: Design Lit component boundaries and data flow, and choose slots, reactive controllers, or mixins for reusable behavior.
triggers:
  - "split or compose Lit components"
  - "design Lit properties, events, slots, controllers, or mixins"
  - "share lifecycle-aware behavior across Lit components"
domains: [lit, architecture, composition, controllers, mixins]
related: [lit, lit-components, lit-templates, lit-data]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.

## Draw component boundaries deliberately

Extract a component when a UI unit has its own state/template, is reused, does one
coherent job, or can expose a well-defined platform-style API. Do not fragment every
wrapper into a custom element: each boundary adds naming, public API, lifecycle,
shadow-DOM, and testing costs.

For a component tree:

- **Properties down:** the owner is the source of truth and sets child properties,
  especially for complex values. Prefer setting state to commanding children through
  methods.
- **Events up:** children dispatch semantic events for user interaction or asynchronous
  changes. The owner handles the event and passes resulting state back down.
- A shadow child must not reach up to mutate its host. Siblings should not directly
  coordinate; let their owner mediate events and properties, or use a scoped store when
  the tree is genuinely broad.
- Keep event names and payloads semantic at the dispatching component's abstraction
  level, not tied to an internal button or DOM implementation.

## Compose caller-owned content with slots

Use light-DOM children and slots when callers should own markup or elements. Document
named slots, accepted node types, fallback content, ordering, and whether dynamic
children are supported.

- Slot nodes remain in light DOM; do not treat them as host-owned internals.
- Listen to `slotchange` and use `assignedElements()`/`assignedNodes()` when dynamic
  children affect behavior.
- Whitespace can suppress fallback content. Ensure conditional child expressions render
  `nothing`/no node when fallback should appear.
- `::slotted()` styles only direct slotted elements and are overridable defaults.

Use properties instead when the component owns rendering and only needs structured
data. Avoid accepting both an object model and slotted markup for the same concern
unless precedence and synchronization are explicit.

## Prefer controllers for has-a behavior

A reactive controller is an object with its own identity/state that attaches to a
`ReactiveControllerHost`. Prefer it for reusable behavior involving external input,
observers, subscriptions, async work, animation, or host lifecycle.

- Store the host and call `host.addController(this)` in the controller constructor.
- Acquire resources in `hostConnected()`, release them in `hostDisconnected()`, read
  pre-update DOM in `hostUpdate()`, and read post-update DOM in `hostUpdated()`.
- Call `host.requestUpdate()` when controller output used by rendering changes.
- Type against the smallest host interface required. A generic controller may need only
  `addController`, `removeController`, `requestUpdate`, and `updateComplete`; require
  `LitElement` APIs only when actually used.
- Controllers can own controllers. Pass the same host to children so lifecycle and
  updates remain coordinated.
- Combine a controller with a directive when it needs a template element reference.
  Keep the controller's public API small and document host requirements and cleanup.
- Use the stable `@lit/task` controller rather than hand-writing common request state.

## Use mixins only for is-a behavior

A mixin creates a subclass and modifies the element's prototype/API. Choose it when the
result truly *is* the shared behavior or must override class/lifecycle methods. Prefer a
controller when isolated identity, multiple instances, contained APIs, or composition
without prototype collisions is valuable.

When a mixin is justified:

- Implement it as a subclass factory constrained to the necessary base type.
- Chain `super` for every standard custom-element lifecycle callback; for optional Lit
  reactive callbacks, call `super.method?.(...)` as appropriate.
- Document contracts requiring callers to merge styles or invoke template helpers.
- Avoid private/protected TypeScript inference traps; declare an explicit interface and
  return intersection constructor type when adding public/protected API.
- In TypeScript, apply decorators to a declared class inside the factory, then return
  that class; decorator use on an immediately returned anonymous class expression is
  unsupported.
- Consider duplicate application and ordering when combining multiple mixins.

## Architecture review

Trace state ownership and every write. For each public property/event/slot, state its
type, default, direction, timing, and ownership. Check that implementation details do
not leak through events, shadow queries, or CSS selectors. Exercise nested components,
reordering and dynamic slots, reconnect cleanup, multiple controller instances, mixin
ordering, and parent/child update timing.

Primary docs: [component composition](https://lit.dev/docs/composition/component-composition/),
[controllers](https://lit.dev/docs/composition/controllers/),
[mixins](https://lit.dev/docs/composition/mixins/), and
[shadow DOM slots](https://lit.dev/docs/components/shadow-dom/#slots).
