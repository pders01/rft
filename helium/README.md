# helium-cdp

Drive a local [Helium](https://helium.computer) (Chromium fork) browser over the
raw Chrome DevTools Protocol — **zero npm dependencies**. Navigate, screenshot,
snapshot the a11y tree, evaluate JS, and click, straight from the shell.

## Why

`chrome-devtools-mcp` defaults to launching Chrome "stable" and only attaches to
an existing Helium instance when its `plugin.json` carries
`--browserUrl=http://127.0.0.1:9333`. That config is read **once at session
start**, so editing it mid-session and running `/mcp restart` does *not* re-read
it — the server keeps launching (and failing to find) Chrome. On a machine with
only Helium installed, the MCP is unusable until the next full restart.

`helium-cdp` sidesteps the MCP altogether. Node ≥ 22 ships a global `WebSocket`
and `fetch`, which is everything CDP needs: the discovery API is HTTP, each
target is one WebSocket speaking JSON-RPC. No Puppeteer, no `ws`, no install.

## Usage

```sh
# Ensure Helium is running with CDP on :9333 (spawns it if needed)
node bin/helium-cdp.mjs launch

# Screenshot a page
node bin/helium-cdp.mjs shot http://127.0.0.1:5399/ /tmp/front.png

# Full-height screenshot at a phone width
node bin/helium-cdp.mjs shot http://127.0.0.1:5399/ /tmp/front.png --w 390 --h 844 --full

# Text / a11y snapshot (interactive + landmark elements, each with a CSS-path ref)
node bin/helium-cdp.mjs snapshot http://127.0.0.1:5399/

# Evaluate JS in the page
node bin/helium-cdp.mjs eval http://127.0.0.1:5399/ "document.title"

# Click the first match of a selector
node bin/helium-cdp.mjs click http://127.0.0.1:5399/ "a.lead"
```

Or install the bin: `npm link` (or `npm i -g .`) then call `helium-cdp …`.

### Flags

| Flag | Default | Meaning |
|------|---------|---------|
| `--port` | `9333` | CDP remote-debugging port |
| `--w` / `--h` | `1280` / `900` | viewport size |
| `--full` | off | capture the full scroll height (`shot`) |
| `--wait <ms>` | `600` | post-load settle pause for async render |
| `--fresh` | off | open a new tab instead of reusing the first |

## As a library

```js
import { ensure } from './src/helium.mjs';
import { connect } from './src/cdp.mjs';
import { navigate, screenshot, snapshot } from './src/page.mjs';

await ensure();                       // launch Helium if down
const s = await connect();            // attach to the first page tab
await navigate(s, 'http://localhost:5399/', { width: 1280, height: 900 });
await screenshot(s, '/tmp/out.png');
const tree = await snapshot(s);       // { title, url, nodes: [...] }
s.close();
```

## Layout

```
src/cdp.mjs      CDP client: discovery + one Session per target (request/response + events)
src/helium.mjs   ensure(): idempotent launch of Helium with a dedicated debug profile
src/page.mjs     navigate / screenshot / snapshot / click on a Session
bin/helium-cdp.mjs  the CLI
```

## Requirements

- Node ≥ 22 (built-in `WebSocket` + `fetch`)
- Helium at `/Applications/Helium.app` (macOS). Override the binary path via the
  `ensure({ bin })` option if yours lives elsewhere.
