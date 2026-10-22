const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformSync } = require('esbuild');

// Execute the actual hook effect and lifecycle listeners, with suspended
// browser geometry/focus changes that deliberately emit no resize/focus event.
const source = readFileSync(path.resolve(__dirname, '../src/containers/App/hooks/useMobileKeyboardInset.ts'), 'utf8');
const code = transformSync(source, { loader: 'ts', format: 'cjs' }).code;
function mount(enabled = true) {
  const props = new Map();
  const frames = new Map();
  let id = 0, cleanup;
  const viewport = Object.assign(new EventTarget(), { height: 500, offsetTop: 0, scale: 1 });
  const root = { clientHeight: 800, style: {
    getPropertyValue: key => props.get(key) || '', setProperty: (key, value) => props.set(key, value), removeProperty: key => props.delete(key)
  } };
  const doc = Object.assign(new EventTarget(), {
    documentElement: root, visibilityState: 'visible', activeElement: { tagName: 'TEXTAREA', readOnly: false }
  });
  const win = Object.assign(new EventTarget(), {
    visualViewport: viewport,
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; }, cancelAnimationFrame(key) { frames.delete(key); }
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'document', 'window', 'ResizeObserver', code)(name => {
    if (name === 'react') return { useEffect(fn) { cleanup = fn(); } };
    if (name === '~/constants/appShell') return { APP_SHELL_KEYBOARD_INSET_VAR: '--app-keyboard-inset' };
    throw new Error(name);
  }, module, module.exports, doc, win, undefined);
  module.exports.default({ enabled });
  return {
    doc, win, frames, viewport, cleanup: () => cleanup?.(),
    inset: () => props.get('--app-keyboard-inset'),
    flush() { for (const [key, fn] of [...frames]) { frames.delete(key); fn(); } },
    visibility(state) { doc.visibilityState = state; doc.dispatchEvent(new Event('visibilitychange')); }
  };
}

test('resume clears a keyboard inset after silent keyboard dismissal while suspended', () => {
  const h = mount(); assert.equal(h.inset(), '300px');
  h.visibility('hidden'); h.doc.activeElement = null; h.viewport.height = 800;
  assert.equal(h.inset(), '300px'); assert.equal(h.frames.size, 0);
  h.visibility('visible'); h.win.dispatchEvent(new Event('pageshow'));
  assert.equal(h.frames.size, 1); h.flush();
  assert.equal(h.inset(), '0px'); h.cleanup();
});

test('pageshow alone refreshes restored geometry and preserves a genuinely open keyboard', () => {
  const h = mount(); h.win.dispatchEvent(new Event('pageshow')); h.flush();
  assert.equal(h.inset(), '300px');
  h.viewport.height = 600; h.win.dispatchEvent(new Event('pageshow')); h.flush();
  assert.equal(h.inset(), '200px'); h.cleanup();
});

test('chat-disabled hooks and unmounted hooks do not react to lifecycle events', () => {
  const disabled = mount(false); disabled.visibility('visible'); disabled.win.dispatchEvent(new Event('pageshow'));
  assert.equal(disabled.frames.size, 0); assert.equal(disabled.inset(), undefined);
  const h = mount(); h.win.dispatchEvent(new Event('pageshow')); h.cleanup();
  assert.equal(h.frames.size, 0); assert.equal(h.inset(), undefined);
  h.visibility('visible'); h.win.dispatchEvent(new Event('pageshow'));
  assert.equal(h.frames.size, 0);
});
