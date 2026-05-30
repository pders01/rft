// Minimal Chrome DevTools Protocol client over the Node built-in WebSocket.
// No npm dependencies: Node >= 22 ships a global `WebSocket` and `fetch`.
//
// A CDP endpoint (Helium, Chrome, any Chromium) exposes an HTTP discovery API
// on the remote-debugging port (`/json/version`, `/json/list`, `/json/new`)
// and one WebSocket per target that speaks JSON-RPC. This client wraps a single
// page target: request/response correlation by `id`, plus an event bus so
// callers can await protocol events (load, console, etc.).

const DEFAULT_PORT = 9333;

/** Resolve the HTTP base for a CDP endpoint. */
function endpoint(port = DEFAULT_PORT) {
  return `http://127.0.0.1:${port}`;
}

/** GET + parse a CDP discovery JSON route. */
async function discover(path, port) {
  const res = await fetch(endpoint(port) + path);
  if (!res.ok) throw new Error(`CDP ${path} -> HTTP ${res.status}`);
  return res.json();
}

/** True if a debuggable browser answers on the port. */
export async function isRunning(port = DEFAULT_PORT) {
  try {
    await discover('/json/version', port);
    return true;
  } catch {
    return false;
  }
}

/**
 * Connect to a page target. Reuses the first existing page tab by default so
 * repeated commands share one window; pass `{ fresh: true }` to open a new tab.
 */
export async function connect({ port = DEFAULT_PORT, fresh = false } = {}) {
  let target;
  if (fresh) {
    target = await discover('/json/new', port);
  } else {
    const list = await discover('/json/list', port);
    target = list.find((t) => t.type === 'page') || (await discover('/json/new', port));
  }
  const session = new Session(target.webSocketDebuggerUrl, target);
  await session.open();
  return session;
}

/** One live WebSocket connection to a single CDP target. */
export class Session {
  constructor(wsUrl, target) {
    this.wsUrl = wsUrl;
    this.target = target;
    this.ws = null;
    this._id = 0;
    this._pending = new Map();
    this._listeners = new Map(); // method -> Set<fn>
  }

  open() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener('message', (ev) => this._onMessage(ev));
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve(this));
      this.ws.addEventListener('error', (e) =>
        reject(new Error(`CDP socket error: ${e?.message ?? 'unknown'}`)),
      );
    });
  }

  _onMessage(ev) {
    const msg = JSON.parse(ev.data);
    if (msg.id && this._pending.has(msg.id)) {
      const { resolve, reject } = this._pending.get(msg.id);
      this._pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      return;
    }
    if (msg.method) {
      const set = this._listeners.get(msg.method);
      if (set) for (const fn of set) fn(msg.params);
    }
  }

  /** Send a CDP command and await its result. */
  send(method, params = {}) {
    const id = ++this._id;
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /** Subscribe to a CDP event; returns an unsubscribe fn. */
  on(method, fn) {
    if (!this._listeners.has(method)) this._listeners.set(method, new Set());
    this._listeners.get(method).add(fn);
    return () => this._listeners.get(method)?.delete(fn);
  }

  /** Resolve the next time `method` fires, or reject after `timeout` ms. */
  once(method, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`timed out waiting for ${method}`));
      }, timeout);
      const off = this.on(method, (params) => {
        clearTimeout(timer);
        off();
        resolve(params);
      });
    });
  }

  /** Evaluate JS in the page and return the value (by value, not a handle). */
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
    }
    return r.result.value;
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      /* already closed */
    }
  }
}
