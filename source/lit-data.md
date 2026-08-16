---
id: lit-data
title: Manage data and async work in Lit
kind: skill
invocation: explicit
intent: Choose and implement Lit state ownership, context, async Task controllers, and experimental signal integration without stale updates or leaks.
triggers:
  - "manage shared state or async data in Lit"
  - "use @lit/context, @lit/task, or @lit-labs/signals"
  - "debug stale data, races, subscriptions, loading, or error states in Lit"
domains: [lit, data, async, context, signals, state-management]
related: [lit, lit-components, lit-composition, lit-templates, lit-ssr]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.

## Choose the smallest state mechanism

1. Keep owner-provided input in public reactive properties.
2. Keep component-local implementation state in `@state()`/`state: true` fields.
3. Pass direct descendant data through properties and report user changes with events.
4. Use context for tree-scoped data needed by many or non-direct descendants.
5. Use `Task` for request/response async work with loading/error/race handling.
6. Introduce an external store/signals only for genuinely shared observable state.

Prefer immutable updates. Lit property, task-argument, and most context change detection
are identity based; in-place mutation commonly creates stale consumers.

## Async work with `@lit/task`

Use one `Task` per logical request/response operation. It gathers arguments after host
updates, runs when they change, tracks `INITIAL`, `PENDING`, `COMPLETE`, and `ERROR`,
ignores superseded results, and requests host updates.

```ts
private productTask = new Task(this, {
  args: () => [this.productId] as const,
  task: async ([id], {signal}) => {
    const response = await fetch(`/api/products/${id}`, {signal});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<Product>;
  },
});
```

- Write `args` and `task` as arrow functions when they use the host's `this`.
- Keep the argument tuple stable and complete. Empty args auto-run once; omitted args
  or `autoRun: false` means manual `.run()` mode.
- Forward the provided `AbortSignal` to `fetch`/supporting APIs and call
  `signal.throwIfAborted()` after uncancelable awaits. Ignoring stale results prevents
  wrong UI but does not save resources.
- Render all applicable states with `task.render({initial, pending, complete, error})`.
  Do not expose raw internal errors or omit retry/empty behavior where users need it.
- Chain tasks only when their dependency/status semantics are clear; sometimes one task
  awaiting sequential operations is simpler.
- `Task` fits finite operations, not open-ended event streams. Use a controller or
  async directive with explicit subscribe/unsubscribe lifecycle for streams.

## Context with `@lit/context`

Context avoids prop drilling and interoperates through the Web Components Context
Protocol's bubbling, composed `context-request` event.

- Define and export each typed context in its own module. Context matching uses `===`.
  Prefer `Symbol()` for a collision-proof context shared by importing one module;
  use a unique string or `Symbol.for()` only when independent module copies must match.
- Provide with `@provide({context})` or `ContextProvider`. Consume with
  `@consume({context, subscribe: true})` or `ContextConsumer` when ongoing updates are
  required; subscription is off by default.
- Make provider fields reactive if setting them should render the provider as well as
  notify consumers.
- Replace context values immutably. `ContextProvider.setValue(value, true)` can force a
  notification after deep mutation, but immutable replacement is easier to reason
  about.
- Use context for app/tree services, user/locale/theme/store, light-DOM plugins, and
  app-specific formatter/link functions—not as a default replacement for explicit
  component APIs.
- Scope tests with mock providers. Include late providers/upgrades only when needed;
  `ContextRoot` can redispatch unsatisfied requests.

## Signals are experimental

`@lit-labs/signals` and `@lit-labs/preact-signals` are Labs packages. Before adoption,
check current package status, changelog, proposal/polyfill version, analyzer support,
and missing features. Pin and test dependencies; do not present Labs APIs as stable Lit
core.

For the TC39-proposal integration:

- `SignalWatcher(LitElement)` tracks signals read during lifecycle/render and requests
  host updates.
- `watch(signal)` performs binding-level updates; the special signals `html` tag wraps
  signal bindings automatically. Prefer ordinary Lit rendering unless profiling shows
  large template logic/binding checks matter—Lit already writes only changed bindings.
- Ensure exactly one `signal-polyfill` copy (`npm ls signal-polyfill`, then dedupe).
  Multiple copies split the dependency graph and can silently break observation.
- Current limitations include no signal-aware `repeat()` and incomplete planned
  decorator/effect support. Verify these against the current release.

## Verification

Test initial/loading/success/empty/error/retry states; fast argument changes and stale
responses; abort behavior; disconnect/reconnect cleanup; immutable versus deep updates;
context provider nesting, absence, late availability, subscription, and test mocks; and
multiple signal consumers. Use browser tests and assert both rendered DOM and public
state/events.

Primary docs: [reactive properties](https://lit.dev/docs/components/properties/),
[context](https://lit.dev/docs/data/context/),
[async tasks](https://lit.dev/docs/data/task/),
[signals](https://lit.dev/docs/data/signals/), and
[Lit Labs](https://lit.dev/docs/libraries/labs/).
