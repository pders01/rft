---
id: lit-ssr
title: Author and review Lit server rendering
kind: skill
invocation: explicit
intent: Keep Lit templates and components server-renderable and hydrate them safely while respecting Lit SSR's Labs status and lifecycle limits.
triggers:
  - "server-render or hydrate Lit components"
  - "use @lit-labs/ssr or @lit-labs/ssr-client"
  - "fix browser globals or async behavior during Lit SSR"
domains: [lit, ssr, hydration, node, web-components]
related: [lit, lit-components, lit-templates, lit-data, lit-tooling]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.
> Lit SSR and SSR client support are Labs packages under active development. Check
> current package docs, limitations, versions, and changelogs before implementation.

## Establish the rendering contract

Lit SSR renders templates/components to static HTML, including declarative shadow DOM,
using a minimal Node DOM shim. Decide whether the output is static only or hydrated for
interaction, whether streaming is required, and what browsers need declarative-shadow-
DOM fallback.

Current documented limitations include unsupported async component work during render,
support only for Lit components using shadow DOM, partial DOM emulation, and evolving
custom-element interoperability. Do not design around a Labs limitation without
rechecking the installed release.

## Author SSR-safe components

The server calls only a subset of lifecycle:

- **Called:** element constructor, property `hasChanged`, `willUpdate`, `render`;
  controller constructor; directive constructor and `render`.
- **Not called:** connected/disconnected/attribute/adopted callbacks, `shouldUpdate`,
  `update`, `firstUpdated`, `updated`; controller host lifecycle; directive `update`,
  `disconnected`, and `reconnected`.

Therefore:

- Keep constructors, `hasChanged`, `willUpdate`, component `render`, and directive
  `render` free of browser-only APIs beyond the documented shim and free of required
  client side effects.
- Put imperative DOM measurement/mutation in client-only lifecycle such as `updated()`.
- Guard simple environment differences with capability checks or Lit's `isServer`.
  For substantial differences, expose browser and `"node"` conditional exports.
- Keep server render synchronous. Preload async data before constructing the top-level
  template and pass it as data. Async directives do not produce server results;
  `until()` renders its highest-priority non-Promise placeholder.
- Keep custom directives' declarative output in `render()`; `update()` is client-only.
- Test SSR explicitly with `@lit-labs/testing`/a supported setup rather than assuming a
  browser test proves Node importability.

## Render on the server

Import component definition modules before rendering so the server custom-element
registry knows them, then call `render()` from `@lit-labs/ssr`.

The returned `RenderResult` is a synchronous iterable that may contain nested iterables
or Promises:

- Prefer `RenderResultReadable` when streaming to an HTTP/server API.
- Use `collectResult()` when a complete string is needed and async values are allowed.
- Use `collectResultSync()` only when awaiting is impossible; it throws on Promises.

Choose global rendering when a shared registry/global state across requests is safe.
Use VM-module isolation only when needed and after checking current Node support and its
module-graph performance cost.

Never bundle Lit into a published component package by default. Conditional exports
select different Node/browser Lit modules; an inline bundle freezes the environment it
was built for. Mark `lit` and related dependencies external, or deliberately publish
separate Node and browser entry points.

## Hydrate on the client

- Standalone templates must call `hydrate(template(initialData), container)` with the
  same initial template/data used by the server before later `render()` calls.
- Lit components need their definitions loaded and
  `@lit-labs/ssr-client/lit-element-hydrate-support.js` loaded **before** `lit` or any
  component importing it. Preserve this import order through bundling.
- Verify declarative shadow DOM support for target browsers. If a polyfill is required,
  apply it after server HTML is parsed and control first paint to avoid unstyled/layout-
  shift flashes.
- Ensure server and client locale, data, template structure, and custom-element
  definitions agree. Treat hydration mismatch as a correctness bug, not a warning to
  suppress.

## Verification

Test server import with no browser globals; streamed and collected output; declarative
shadow roots and styles; escaped untrusted content; identical initial server/client
data; event listener restoration; component upgrade order; no duplicate render DOM;
no-JavaScript static behavior; polyfilled and native declarative shadow DOM; errors,
empty data, and concurrent requests; and package conditional exports. Record Labs
versions in bug reports.

Primary docs: [SSR overview](https://lit.dev/docs/ssr/overview/),
[authoring](https://lit.dev/docs/ssr/authoring/),
[server usage](https://lit.dev/docs/ssr/server-usage/),
[client usage](https://lit.dev/docs/ssr/client-usage/), and
[DOM emulation](https://lit.dev/docs/ssr/dom-emulation/).
