---
id: lit-localization
title: Localize Lit applications and components
kind: skill
invocation: explicit
intent: Design extractable Lit messages and choose, configure, build, and verify @lit/localize runtime or transform mode.
triggers:
  - "localize or internationalize Lit UI"
  - "use @lit/localize or lit-localize"
  - "fix message extraction, locale switching, XLIFF, or localized rendering"
domains: [lit, localization, i18n, xliff, build]
related: [lit, lit-components, lit-templates, lit-tooling, lit-ssr]
---

> Based on the Lit 3 guide crawled `2026-08-16` at `lit/lit.dev@697feba`.

## Design translatable messages

Wrap complete user-facing messages in `msg()`. Use `msg(str\`...${value}\`)` for a
plain string with expressions and `msg(html\`...\`)` only when translators need markup
inside the sentence.

- Keep grammatical phrases intact; do not concatenate translated fragments or assume
  English word order/plurals.
- Prefer markup outside the message:
  `html\`<button>${msg('Launch rocket')}</button>\``. Include markup inside only when
  its position is part of the phrase, such as emphasis around an expression.
- Add a useful `desc` for translator context. Identical generated IDs must have
  identical descriptions.
- Lit hashes content/markup/expression positions into default IDs. Override `id` when
  identical source text has different meanings, and keep explicit IDs stable.
- Use BCP 47 locale tags. Keep source, target, active, document `lang`/`dir`, formatting,
  and server/client locale selection coherent; `@lit/localize` translates messages but
  does not replace locale-aware date/number/plural design.

## Re-evaluate messages during render

`msg()` returns an ordinary string/template for the currently active locale; its result
is not independently reactive. Evaluate it on every relevant render.

Do not freeze a translated field initializer:

```ts
// Wrong: captures the locale at construction.
label = msg('Default label');
```

Render the fallback (`this.label ?? msg('Default label')`) or expose a getter that calls
`msg()`. In runtime mode, apply `@localized()` or call
`updateWhenLocaleChanges(this)` in the constructor so locale completion requests a
render.

## Choose an output mode

Start with **runtime mode** unless requirements clearly favor transform mode.

- Runtime mode generates one message module per target locale, supports
  `await setLocale(locale)` without page reload, and has a small runtime/render cost.
  Lazy dynamic imports are the default loading strategy; static import of every locale
  blocks interactivity and is normally inappropriate.
- Transform mode creates a complete application build per locale, removes localization
  runtime code, and renders fastest/smallest for one locale. Switching locale requires
  navigation/reload to a different build. Validate a locale against the configured
  allowlist before deriving a script path; otherwise locale selection can become script
  injection.

Account for locale-load `loading`, `ready`, and `error` states in runtime UX. A newer
request supersedes status completion for the prior request, so avoid stale spinners or
preferences. Persist a locale only after the desired policy point.

## Extraction and build workflow

1. Install `@lit/localize` and development-only `@lit/localize-tools`.
2. Configure `lit-localize.json` with source/target locales, either `tsConfig` or
   `inputFiles`, output mode, generated locale-code module, and interchange settings.
3. Run `lit-localize extract`; send/update XLIFF 1.2 translations without damaging
   placeholders.
4. Run `lit-localize build` (or a correctly configured transform plugin).
5. Commit or package generated artifacts according to project policy and prevent stale
   translations in CI.

Keep localization APIs statically analyzable. If re-export/reassignment prevents
extraction, preserve the `typeof import('@lit/localize').msg` type annotation rather
than hiding the API behind arbitrary dynamic indirection.

## Verification

Run extract and build in CI. Test source and every representative target locale;
missing translations; loading and failed locale modules; fast locale switching;
re-rendered default values; long/short text and non-Latin scripts; RTL direction;
markup placeholders; locale-aware formats; translated accessibility names and errors;
server/client locale agreement; and injection attempts in locale-derived module URLs.
Have language experts review messages and context—successful extraction is not
linguistic correctness.

Primary docs: [overview](https://lit.dev/docs/localization/overview/),
[runtime mode](https://lit.dev/docs/localization/runtime-mode/),
[transform mode](https://lit.dev/docs/localization/transform-mode/),
[CLI/config](https://lit.dev/docs/localization/cli-and-config/), and
[best practices](https://lit.dev/docs/localization/best-practices/).
