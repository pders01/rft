---
id: lit
title: Route Lit development work
kind: skill
intent: Apply current Lit best practices and load only the focused guidance needed for components, templates, data, composition, SSR, localization, tooling, or React integration.
triggers:
  - "the user asks to create, change, debug, test, review, or publish Lit code"
  - "the repository uses LitElement, lit-html, or packages under lit, @lit, or @lit-labs"
domains: [lit, web-components, routing, frontend]
related: [lit-components, lit-templates, lit-data, lit-composition, lit-ssr, lit-localization, lit-tooling, lit-react]
---

Use this router when the request or repository has specific Lit evidence: imports
from `lit`, `lit-html`, `@lit/*`, or `@lit-labs/*`; classes extending
`LitElement`/`ReactiveElement`; or Lit tagged templates. Do not activate merely
because prose contains the ordinary word “lit” or because a project uses generic
custom elements.

> **Documentation snapshot:** Crawled the current Lit 3 guide on `2026-08-16`
> from [`lit/lit.dev` commit `697feba`](https://github.com/lit/lit.dev/tree/697feba856f5fc9284a7f5e2df52a6a690260aab/packages/lit-dev-content/site/docs/v3).
> The focused skills summarize the guide rather than replacing it. If this crawl is
> over 120 days old, or installed package APIs disagree, check the current
> [Lit docs](https://lit.dev/docs/) and package changelogs before relying on details.

## Load focused guidance

Read the smallest relevant set before substantive work. Links are relative to this
skill directory.

- Element definitions, properties, lifecycle, events, styles, shadow DOM, and
  decorators: [lit-components](../lit-components/SKILL.md)
- Template expressions, conditionals, lists, directives, DOM references, and
  injection safety: [lit-templates](../lit-templates/SKILL.md)
- Async tasks, shared context, signals, and choosing state ownership:
  [lit-data](../lit-data/SKILL.md)
- Component boundaries, slots, properties-down/events-up, controllers, and mixins:
  [lit-composition](../lit-composition/SKILL.md)
- Server rendering, hydration, browser-only code, and SSR-safe lifecycles:
  [lit-ssr](../lit-ssr/SKILL.md)
- `@lit/localize`, message design, extraction, runtime mode, and transform mode:
  [lit-localization](../lit-localization/SKILL.md)
- Browser testing, development/production builds, publishing, compatibility, and
  Lit 2→3 upgrades: [lit-tooling](../lit-tooling/SKILL.md)
- React wrappers, event typing, slots, and reactive controllers as hooks:
  [lit-react](../lit-react/SKILL.md)

Combine skills when boundaries overlap. A localized, server-rendered data component,
for example, needs components, templates, data, localization, SSR, and tooling.

## Official documentation map

Use this map to jump to primary material when a detail is not captured in a focused
skill.

- [Getting started](https://lit.dev/docs/getting-started/),
  [what Lit is](https://lit.dev/docs/), and generated API references for
  [LitElement](https://lit.dev/docs/api/LitElement/),
  [ReactiveElement](https://lit.dev/docs/api/ReactiveElement/), and
  [templates](https://lit.dev/docs/api/templates/)
- **Components:** [overview](https://lit.dev/docs/components/overview/),
  [defining](https://lit.dev/docs/components/defining/),
  [properties](https://lit.dev/docs/components/properties/),
  [rendering](https://lit.dev/docs/components/rendering/),
  [styles](https://lit.dev/docs/components/styles/),
  [lifecycle](https://lit.dev/docs/components/lifecycle/),
  [shadow DOM](https://lit.dev/docs/components/shadow-dom/),
  [events](https://lit.dev/docs/components/events/), and
  [decorators](https://lit.dev/docs/components/decorators/)
- **Templates:** [overview](https://lit.dev/docs/templates/overview/),
  [expressions](https://lit.dev/docs/templates/expressions/),
  [conditionals](https://lit.dev/docs/templates/conditionals/),
  [lists](https://lit.dev/docs/templates/lists/),
  [built-in directives](https://lit.dev/docs/templates/directives/), and
  [custom directives](https://lit.dev/docs/templates/custom-directives/)
- **Composition and data:** [composition](https://lit.dev/docs/composition/overview/),
  [component composition](https://lit.dev/docs/composition/component-composition/),
  [controllers](https://lit.dev/docs/composition/controllers/),
  [mixins](https://lit.dev/docs/composition/mixins/),
  [context](https://lit.dev/docs/data/context/),
  [tasks](https://lit.dev/docs/data/task/), and
  [signals](https://lit.dev/docs/data/signals/)
- **Special cases:** [localization](https://lit.dev/docs/localization/overview/),
  [SSR](https://lit.dev/docs/ssr/overview/),
  [React](https://lit.dev/docs/frameworks/react/), and
  [standalone lit-html](https://lit.dev/docs/libraries/standalone-templates/)
- **Delivery:** [tools](https://lit.dev/docs/tools/overview/),
  [adding Lit](https://lit.dev/docs/tools/adding-lit/),
  [starter kits](https://lit.dev/docs/tools/starter-kits/),
  [development](https://lit.dev/docs/tools/development/),
  [testing](https://lit.dev/docs/tools/testing/),
  [production](https://lit.dev/docs/tools/production/),
  [publishing](https://lit.dev/docs/tools/publishing/),
  [requirements](https://lit.dev/docs/tools/requirements/),
  [Lit Labs](https://lit.dev/docs/libraries/labs/), and
  [Lit 3 upgrade](https://lit.dev/docs/releases/upgrade/)

## Baseline for every Lit change

1. Inspect the installed Lit version, compiler/decorator mode, browser targets, and
   whether the code is an application or a reusable package. Do not rewrite project
   conventions from memory.
2. Keep rendering declarative and deterministic: state changes schedule rendering;
   `render()` describes DOM and has no side effects.
3. Follow the platform: properties carry JavaScript data down, DOM events communicate
   user-driven changes up, shadow DOM encapsulates implementation, and slots compose
   caller-owned children.
4. Use the narrowest stable API. Treat every `@lit-labs/*` package as experimental;
   verify its current status, version, limitations, and changelog before adoption.
5. Verify in a real browser. Test public properties/attributes/events, update timing,
   shadow DOM and slots, keyboard/accessibility behavior, failure/empty/loading states,
   and cleanup after disconnect. Static inspection cannot prove browser behavior.
6. When reporting, separate documented Lit requirements, web-platform requirements,
   project conventions, and optional performance advice. Cite the relevant primary
   doc for non-obvious claims.
