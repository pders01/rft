---
id: lit-tooling
title: Test, build, upgrade, and publish Lit code
kind: skill
invocation: explicit
intent: Apply Lit guidance for browser testing, development and production builds, compatibility, Lit 3 migration, and reusable package publishing.
triggers:
  - "configure, test, build, upgrade, or publish a Lit project"
  - "debug multiple Lit versions, browser support, module resolution, or package output"
domains: [lit, testing, build, publishing, migration, tooling]
related: [lit, lit-components, lit-templates, lit-ssr, lit-localization, lit-react]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.
> Tool examples age quickly; first inspect the package manager, installed versions,
> existing build/test stack, and target browsers.

## Distinguish applications from libraries

Applications should bundle/minify/hash/compress for their deployment. Reusable npm
component libraries should publish deduplicable modern modules and leave bundling,
minification, optimization, and polyfill selection to the consuming application.
Do not apply application build advice to a published package.

Lit 3 is ES2021 and supports modern browsers with custom elements, shadow DOM,
`<template>`, and required DOM APIs. Tools must resolve bare package specifiers. IE11
and Classic Edge are not supported by Lit 3; use a supported version/target decision,
not a partial untested transpilation claim.

## Development feedback

- Opt into Lit's `"development"` export condition locally for readable code and runtime
  warnings; production is the default. Never accidentally ship the dev condition.
- Investigate multiple-core-version warnings with browser version globals and package
  manager dependency trees, then dedupe. Different compatible Lit versions can
  interoperate, but duplicate bytes are still a packaging smell.
- Use ESLint plus a Lit template plugin and a Lit-aware editor/type-checking plugin to
  catch malformed templates and invalid bindings that browsers may silently repair.
- Match TypeScript/decorator settings to component guidance. Do not modernize decorator
  mode as an unrelated edit.

## Browser-first testing

Lit components depend on actual custom elements, shadow DOM, events, slots, focus,
layout, and browser parsing. Run component tests in real target browser engines; a DOM
shim alone is not recommended as evidence of user behavior.

A test should create/fixture the element, set public properties/attributes, append it,
await its update, assert public state/events and shadow/light DOM behavior, then remove
it and verify cleanup. Cover:

- defaults, attribute/property conversion, reflection, immutable updates, and batched
  writes;
- loading/empty/error/success and reconnect/disconnect;
- bubbling/composed/cancelable events, slots, focus, keyboard, and accessibility tree;
- conditional/list identity, async races, and dangerous template sinks;
- supported Chromium, Firefox/ESR, and Safari versions as project requirements demand.

Await `element.updateComplete` for that host. It does not wait for descendants; use a
browser scheduling point or explicit child promises when whole-tree completion matters.
Use visual/E2E tests for layout, theming, responsive states, and integration—not as a
replacement for focused component tests.

## Production applications

Use the project's established modern bundler. Ensure it resolves bare specifiers and
selects production exports. Typical optimizations are module bundling, JS minification,
modern output, hashed assets, Brotli/gzip, and optionally minifying HTML inside Lit
tagged literals. Measure bundle and runtime impact rather than adding directives or
compiler transforms speculatively.

Check for duplicate Lit copies after bundling and ensure development-only warnings/code
are absent. For SSR, preserve Node/browser export conditions and hydration import order.

## Publishing reusable components

- Publish standard ES2021 ESM, compiling TypeScript/decorators/nonstandard syntax but
  not downleveling to legacy code. Include file extensions in relative imports.
- Set package metadata/exports consistently and publish `.d.ts`/maps. Add
  `HTMLElementTagNameMap` entries for TypeScript-authored tags.
- Self-define each element in the declaring module and export its class for typing and
  subclassing. Tag and class registrations must be globally unique.
- Do not import polyfills from library modules; document APIs that may need them and use
  polyfills only in development/tests.
- Do not bundle Lit into normal npm library output. It prevents consumer deduplication
  and can break Node/browser conditional exports. Keep any CDN bundle clearly separate.
- Test the packed tarball from a clean consumer, not only source files in the monorepo.

## Lit 2 to Lit 3 checks

Lit 3 removed IE11 support, publishes ES2021, requires modern decorator tooling for the
new modes, removed deprecated APIs, and moved hydration support to
`@lit-labs/ssr-client`. Before migration, enable/fix existing deprecations, read all
intermediate changelogs, update TypeScript as required, and test package consumers.

Common code changes include replacing `UpdatingElement` with `ReactiveElement`,
importing decorators from `lit/decorators.js`, updating query-assigned decorator
signatures, and moving experimental hydration imports. Lit 2 and 3 are largely
interoperable, so broaden library peer ranges only after testing both.

## Verification commands

Discover repository scripts first, then run its typecheck, lint, unit/component tests,
production build, package/exports checks, and bundle analysis. For a library also run
`npm pack --dry-run` (or package-manager equivalent), install the tarball into a clean
fixture, and verify JS, types, definitions, and no duplicate/bundled Lit.

Primary docs: [development](https://lit.dev/docs/tools/development/),
[testing](https://lit.dev/docs/tools/testing/),
[production](https://lit.dev/docs/tools/production/),
[publishing](https://lit.dev/docs/tools/publishing/),
[requirements](https://lit.dev/docs/tools/requirements/), and
[upgrade guide](https://lit.dev/docs/releases/upgrade/).
