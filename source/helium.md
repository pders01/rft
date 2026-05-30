---
id: helium-cdp
title: Drive Helium over CDP
kind: skill
intent: Screenshot, snapshot, and script a local web page through the Helium browser when chrome-devtools-mcp cannot attach.
triggers:
  - "screenshot a local page"
  - "walk through a web UX in the browser"
  - "chrome-devtools-mcp launches Chrome instead of Helium"
  - "drive Helium / take a browser screenshot"
domains: [browser, devtools, testing]
---

Use the `helium-cdp` CLI (in this repo under `helium/`) to drive a local
[Helium](https://helium.computer) browser over the raw Chrome DevTools Protocol.
Reach for it whenever you need to *see* a web page render — screenshots, an
a11y/text snapshot, in-page JS — and `chrome-devtools-mcp` is unavailable.

## When to prefer this over chrome-devtools-mcp

`chrome-devtools-mcp` defaults to launching Chrome **stable** and only attaches
to a running Helium when its `plugin.json` args include
`--browserUrl=http://127.0.0.1:9333`. That config is read **once at session
start** — editing it mid-session and running `/mcp restart` does *not* re-read
it (the MCP reconnects its transport but reuses the start-of-session config
snapshot). On a Helium-only machine the MCP keeps failing with
`Could not find Google Chrome executable for channel 'stable'` until a full
restart. `helium-cdp` has no such dependency: it talks CDP directly using
Node's built-in `WebSocket` + `fetch`, zero npm installs.

## Commands

```sh
cd <repo>/helium

node bin/helium-cdp.mjs launch                          # ensure Helium up (CDP :9333)
node bin/helium-cdp.mjs shot <url> <out.png>            # navigate + screenshot
node bin/helium-cdp.mjs shot <url> <out.png> --full     # full scroll-height
node bin/helium-cdp.mjs shot <url> <out.png> --w 390 --h 844   # phone viewport
node bin/helium-cdp.mjs snapshot <url>                  # text/a11y tree as JSON
node bin/helium-cdp.mjs eval <url> "document.title"     # run JS, print value
node bin/helium-cdp.mjs click <url> "<css-selector>"    # click first match
```

Then `Read` the PNG to inspect the render, or parse the snapshot JSON (each node
carries a `ref` CSS-path so you can describe and locate elements without an
image).

## Gotchas baked into the tool

- **Occluded-tab hang.** A headful Chromium produces no compositor frame for a
  background tab, so `Page.captureScreenshot` hangs forever. The tool calls
  `Page.bringToFront` before every capture — do not strip that.
- **Sandbox paths.** Write screenshots somewhere the harness allows (e.g. the
  session temp dir), not an arbitrary path.
- **Requires Node ≥ 22** (global `WebSocket`/`fetch`) and Helium at
  `/Applications/Helium.app`.
