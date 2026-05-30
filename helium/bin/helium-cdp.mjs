#!/usr/bin/env node
// helium-cdp — drive a local Helium/Chromium over raw CDP, zero dependencies.
//
// Why this exists: chrome-devtools-mcp launches Chrome "stable" by default and
// only attaches to Helium when its plugin.json carries `--browserUrl`. That
// config is read once at session start, so toggling it mid-session does not
// take effect. This CLI sidesteps the MCP entirely: it talks CDP straight to
// Helium's remote-debugging port using Node's built-in WebSocket + fetch.
//
// Commands:
//   helium-cdp launch                     ensure Helium is up with CDP
//   helium-cdp shot <url> <out.png>       navigate + screenshot
//   helium-cdp snapshot <url>             print a text/a11y snapshot as JSON
//   helium-cdp eval <url> <expr>          navigate, evaluate JS, print the value
//   helium-cdp click <url> <selector>     navigate + click first match
//
// Flags: --port 9333  --w 1280  --h 900  --full  --wait <ms>  --fresh

import { ensure } from '../src/helium.mjs';
import { connect, isRunning } from '../src/cdp.mjs';
import { navigate, screenshot, snapshot, click } from '../src/page.mjs';

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else (flags[key] = next), i++;
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

const HELP = `helium-cdp — drive Helium over CDP (no deps)

  helium-cdp launch                     ensure Helium is up with CDP
  helium-cdp shot <url> <out.png>       navigate + screenshot
  helium-cdp snapshot <url>             text/a11y snapshot as JSON
  helium-cdp eval <url> <expr>          navigate, evaluate JS, print result
  helium-cdp click <url> <selector>     navigate + click first match

Flags: --port 9333  --w 1280  --h 900  --full  --wait <ms>  --fresh`;

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [cmd, ...rest] = positional;
  const port = Number(flags.port) || 9333;
  const width = Number(flags.w) || 1280;
  const height = Number(flags.h) || 900;
  const settleMs = flags.wait !== undefined ? Number(flags.wait) : 600;
  const navOpts = { width, height, settleMs };

  if (!cmd || cmd === 'help' || flags.help) {
    console.log(HELP);
    return;
  }

  if (cmd === 'launch') {
    const { launched } = await ensure({ port });
    console.log(launched ? `launched Helium (CDP :${port})` : `Helium already up (CDP :${port})`);
    return;
  }

  // Every other command needs a live browser; bring one up on demand.
  if (!(await isRunning(port))) await ensure({ port });
  const session = await connect({ port, fresh: Boolean(flags.fresh) });

  try {
    if (cmd === 'shot') {
      const [url, out] = rest;
      if (!url || !out) throw new Error('usage: helium-cdp shot <url> <out.png>');
      await navigate(session, url, navOpts);
      await screenshot(session, out, { full: Boolean(flags.full) });
      console.log(out);
    } else if (cmd === 'snapshot') {
      const [url] = rest;
      if (!url) throw new Error('usage: helium-cdp snapshot <url>');
      await navigate(session, url, navOpts);
      console.log(JSON.stringify(await snapshot(session), null, 2));
    } else if (cmd === 'eval') {
      const [url, ...exprParts] = rest;
      if (!url || !exprParts.length) throw new Error('usage: helium-cdp eval <url> <expr>');
      await navigate(session, url, navOpts);
      console.log(JSON.stringify(await session.eval(exprParts.join(' ')), null, 2));
    } else if (cmd === 'click') {
      const [url, selector] = rest;
      if (!url || !selector) throw new Error('usage: helium-cdp click <url> <selector>');
      await navigate(session, url, navOpts);
      console.log(String(await click(session, selector)));
    } else {
      throw new Error(`unknown command: ${cmd}\n\n${HELP}`);
    }
  } finally {
    session.close();
  }
}

main().catch((err) => {
  console.error('helium-cdp:', err.message);
  process.exit(1);
});
