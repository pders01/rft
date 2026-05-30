// Launch / ensure a Helium (Chromium fork) instance with CDP enabled.
//
// Helium ships no `--remote-debugging-port` by default; we spawn it detached
// with a dedicated user-data-dir so the debug profile never collides with the
// user's real browsing session. `ensure()` is idempotent: if something already
// answers on the port we attach to it instead of spawning a second copy.

import { spawn } from 'node:child_process';
import { isRunning } from './cdp.mjs';

const DEFAULT_PORT = 9333;
const HELIUM_BIN = '/Applications/Helium.app/Contents/MacOS/Helium';
const USER_DATA_DIR = '/tmp/helium-debug';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Ensure a debuggable Helium is up on `port`. Returns `{ launched }` — false if
 * an existing instance was reused, true if we spawned one.
 */
export async function ensure({
  port = DEFAULT_PORT,
  bin = HELIUM_BIN,
  userDataDir = USER_DATA_DIR,
  timeoutMs = 10000,
} = {}) {
  if (await isRunning(port)) return { launched: false };

  const child = spawn(
    bin,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`],
    { detached: true, stdio: 'ignore' },
  );
  child.unref();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(250);
    if (await isRunning(port)) return { launched: true };
  }
  throw new Error(`Helium did not expose CDP on :${port} within ${timeoutMs}ms`);
}
