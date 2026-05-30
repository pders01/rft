// High-level page actions built on a CDP Session: navigate, screenshot, and a
// text/a11y snapshot. These are the operations a UX walkthrough actually needs.

import { writeFileSync } from 'node:fs';

/**
 * Navigate and wait for the load event (falls back to a timeout so a hung
 * sub-resource never blocks forever). `settleMs` adds a post-load pause for
 * async render. Optionally sets the viewport first.
 */
export async function navigate(session, url, { width, height, settleMs = 600, timeout = 8000 } = {}) {
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  if (width && height) {
    await session.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }
  const loaded = session.once('Page.loadEventFired', timeout).catch(() => null);
  await session.send('Page.navigate', { url });
  await loaded;
  if (settleMs) await new Promise((r) => setTimeout(r, settleMs));
}

/**
 * Capture a PNG to `outPath`. `full: true` grabs the whole scroll height.
 *
 * `Page.bringToFront` first: a headful Chromium produces no compositor frame for
 * an occluded/background tab, so `captureScreenshot` would hang indefinitely.
 */
export async function screenshot(session, outPath, { full = false } = {}) {
  await session.send('Page.bringToFront').catch(() => {});
  const shot = await session.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: full,
  });
  writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  return outPath;
}

/**
 * A compact text snapshot of interactive + landmark elements, each tagged with
 * a CSS-path ref so a caller (or a model) can describe and locate UI without a
 * screenshot. Runs entirely in-page to keep the protocol chatter to one call.
 */
export async function snapshot(session) {
  const expr = `(() => {
    const out = [];
    const sel = 'a,button,input,textarea,select,[role],h1,h2,h3,nav,main,header,form,label,summary';
    const cssPath = (el) => {
      const parts = [];
      while (el && el.nodeType === 1 && parts.length < 5) {
        let p = el.nodeName.toLowerCase();
        if (el.id) { parts.unshift(p + '#' + el.id); break; }
        const sibs = el.parentNode ? [...el.parentNode.children].filter(c => c.nodeName === el.nodeName) : [];
        if (sibs.length > 1) p += ':nth-of-type(' + (sibs.indexOf(el) + 1) + ')';
        parts.unshift(p);
        el = el.parentElement;
      }
      return parts.join('>');
    };
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      const label = (el.getAttribute('aria-label') || el.value || el.placeholder || el.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 80);
      out.push({
        tag: el.nodeName.toLowerCase(),
        role: el.getAttribute('role') || '',
        type: el.getAttribute('type') || '',
        label,
        ref: cssPath(el),
        visible,
      });
    }
    return JSON.stringify({
      title: document.title,
      url: location.href,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      nodes: out,
    });
  })()`;
  return JSON.parse(await session.eval(expr));
}

/** Click the first element matching a CSS selector; returns whether it matched. */
export async function click(session, selector) {
  return session.eval(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`,
  );
}
