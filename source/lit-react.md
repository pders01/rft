---
id: lit-react
title: Integrate Lit components with React
kind: skill
invocation: explicit
intent: Build and review typed @lit/react wrappers, custom-event mappings, slot usage, and reactive-controller hooks for React consumers.
triggers:
  - "use a Lit web component from React"
  - "create or publish an @lit/react wrapper"
  - "adapt a Lit reactive controller into a React hook"
domains: [lit, react, web-components, integration, typescript]
related: [lit, lit-components, lit-composition, lit-tooling]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.
> React's custom-element behavior evolves independently. Check the installed React and
> `@lit/react` versions before assuming a wrapper is required or removing one.

## Decide who owns the adapter

Plain React can render custom-element tags, but framework/version behavior for complex
properties, custom events, SSR, and TypeScript JSX may differ. Prefer an idiomatic
wrapper when it is needed to set JavaScript properties, map DOM custom events to React
callbacks, or provide strong JSX types. A component vendor should normally publish the
wrapper so every consumer does not reinvent event/property mapping.

Import the module that defines the custom element. Keep the element class exported and
pass that exact class and tag to `createComponent()`:

```ts
export const ProductCard = createComponent({
  tagName: 'product-card',
  elementClass: ProductCardElement,
  react: React,
  events: {
    onProductSelect: 'product-select' as EventName<ProductSelectEvent>,
  },
});
```

- Match `tagName` to the class's actual registration.
- Map only public custom events. Use a consistent `on...` convention that does not
  collide with element properties or React's existing props.
- Cast event names to `EventName<SpecificEvent>` so callback payloads are accurately
  typed; do not erase custom `detail`/event subclass types to `any`.
- Verify that complex values become element properties, ordinary unknown props retain
  intended attribute behavior, refs reach the custom element, and handlers are replaced
  and removed correctly across rerenders/unmount.

## Slots and children

Wrapper children flow to the element's default slot. Put the standard `slot="name"`
attribute on real DOM children for named slots. React components do not necessarily
produce a DOM node that can carry `slot`; wrap one in an element with the slot attribute
when necessary. `display: contents` can remove a wrapper's layout box, but evaluate its
accessibility and browser behavior rather than applying it blindly.

Document slot names and child expectations in both web-component and React APIs. Do not
invent a parallel React-only composition model unless it provides clear value.

## Reactive controllers as hooks

`useController(React, host => new Controller(host))` adapts a Lit reactive controller
into React's lifecycle/update model. Wrap this in a purpose-specific hook that returns
only the controller data/actions React callers need.

- Construct through the provided factory so the adapter stores one controller/host.
- Ensure the controller already follows host connect/disconnect cleanup and requests
  updates through its host.
- Keep controller APIs framework-neutral; do not import React into the controller.
- Test nested controller composition and Strict Mode mount/unmount behavior with the
  installed React version.

## Packaging and verification

Declare compatible React, Lit, and adapter dependency/peer ranges according to project
policy; do not bundle duplicate React or Lit into a reusable wrapper package. Export
wrapper types and test the packed package in a clean React application.

Exercise primitive and object/array/function props, boolean values, all mapped custom
events and payloads, handler changes, default/named slots, refs, unmount cleanup,
TypeScript JSX, Strict Mode, and the project's server-render/hydration path. Test both
the underlying custom-element API and wrapper behavior so failures are localized.

Primary docs: [Lit React integration](https://lit.dev/docs/frameworks/react/),
[events](https://lit.dev/docs/components/events/),
[component composition](https://lit.dev/docs/composition/component-composition/), and
[reactive controllers](https://lit.dev/docs/composition/controllers/).
