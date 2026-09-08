const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { transformSync } = require('esbuild');

// Run the actual Modal handlers/effect, with controlled DOM focus and events.
// Real React event ordering and browser focus are checked in connected Chrome.
const file = path.resolve(__dirname, '../src/components/Modal/index.tsx');
const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const nodes = [];
(function visit(node) { nodes.push(node); ts.forEachChild(node, visit); })(source);
const declaration = name => {
  const matches = nodes.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.equal(matches.length, 1, name);
  return matches[0].getText(source);
};
const compile = code => transformSync(code, { loader: 'ts', format: 'cjs' }).code;
function keyboard({ id = 2, top = [1, 2], closeOnEscape = true, modal } = {}) {
  const calls = [];
  const handler = new Function('openModals', 'modalId', 'closeOnEscape', 'onClose', 'modalRef', compile(
    declaration('trapModalFocus') + '\n' + declaration('handleDocumentKeyDown') + '\nreturn handleDocumentKeyDown;'
  ))(new Set(top), id, closeOnEscape, () => calls.push('close'), { current: modal });
  return { calls, handler };
}
function key(key, values = {}) {
  return { key, defaultPrevented: false, isComposing: false, keyCode: 0,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.stopped = true; }, ...values };
}
function focusable(name, doc, values = {}) {
  return { name, isConnected: true, offsetWidth: 44, offsetHeight: 44,
    getAttribute() { return null; }, focus() { doc.activeElement = this; }, ...values };
}
function focusDialog() {
  const doc = { activeElement: null };
  const first = focusable('close', doc), last = focusable('cancel', doc);
  const modal = { ownerDocument: doc, contains: item => [modal, first, last].includes(item),
    querySelectorAll: () => [first, last], focus() { doc.activeElement = modal; } };
  return { doc, first, last, modal };
}

test('modal keyboard listeners run after descendant handlers and remove the same listener phase', () => {
  const listeners = nodes.filter(node => ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
    && ['addEventListener', 'removeEventListener'].includes(node.expression.name.text)
    && node.arguments[0]?.getText(source) === "'keydown'" && node.arguments[1]?.getText(source) === 'handleDocumentKeyDown');
  assert.equal(listeners.length, 2);
  for (const node of listeners) assert.notEqual(node.arguments[2]?.getText(source), 'true', 'Capture closes the dialog before search can consume Escape');
});

test('handled Escape and IME Escape do not dismiss a chat dialog', () => {
  const { calls, handler } = keyboard();
  for (const values of [{ defaultPrevented: true }, { isComposing: true }, { keyCode: 229 }]) handler(key('Escape', values));
  assert.deepEqual(calls, []);
});

test('unhandled Escape dismisses only the top dialog and consumes the key', () => {
  const lower = keyboard({ id: 1 }), upper = keyboard();
  const event = key('Escape');
  lower.handler(event);
  upper.handler(event);
  assert.deepEqual(lower.calls, []);
  assert.deepEqual(upper.calls, ['close']);
  assert.equal(event.defaultPrevented, true);
  assert.equal(event.stopped, true);
});

test('busy dialogs continue to reject Escape and unrelated keys', () => {
  const { calls, handler } = keyboard({ closeOnEscape: false });
  handler(key('Escape')); handler(key('Enter'));
  assert.deepEqual(calls, []);
});

test('Tab and Shift+Tab wrap within the top dialog', () => {
  const { modal, doc, first, last } = focusDialog();
  const { handler } = keyboard({ modal });
  doc.activeElement = last;
  handler(key('Tab'));
  assert.equal(doc.activeElement, first);
  handler(key('Tab', { shiftKey: true }));
  assert.equal(doc.activeElement, last);
  doc.activeElement = modal;
  handler(key('Tab'));
  assert.equal(doc.activeElement, first);
});

test('a consumed Tab is preserved; a dialog with no controls still contains focus', () => {
  const { modal, doc, last } = focusDialog();
  const { handler } = keyboard({ modal });
  doc.activeElement = last;
  handler(key('Tab', { defaultPrevented: true }));
  assert.equal(doc.activeElement, last);
  modal.querySelectorAll = () => [];
  handler(key('Tab'));
  assert.equal(doc.activeElement, modal);
});

function focusLifecycle({ explicitDocument = false } = {}) {
  const { modal, doc, first } = focusDialog();
  const opener = focusable('open dialog', doc);
  doc.activeElement = opener;
  let timer, cleared = false, modalFocuses = 0;
  const view = { setTimeout(fn) { timer = fn; return 1; }, clearTimeout() { cleared = true; } };
  doc.defaultView = view;
  modal.focus = () => { modalFocuses++; doc.activeElement = modal; };
  const effect = nodes.find(node => ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect'
    && node.arguments[0]?.getText(source).includes('previouslyFocusedElement'));
  assert.ok(effect, 'actual Modal focus effect');
  const otherDoc = { activeElement: focusable('outside frame', {}) };
  const cleanup = new Function('isOpen', 'document', 'window', 'portalTarget', 'previousActiveElement', 'modalRef', 'allowOverflow', 'backdropRef',
    compile('return (' + effect.arguments[0].getText(source) + ')();'))(
    true, explicitDocument ? otherDoc : doc, view, explicitDocument ? { ownerDocument: doc } : undefined,
    { current: null }, { current: modal }, false, { current: null });
  return { doc, first, modal, opener, cleanup, tick: () => timer(), focuses: () => modalFocuses, cleared: () => cleared };
}

test('delayed modal focus preserves a child’s autofocus and restores the opener on close', () => {
  const state = focusLifecycle();
  state.doc.activeElement = state.first;
  state.tick();
  assert.equal(state.focuses(), 0, 'The 50ms fallback must not steal search/name focus');
  assert.equal(state.doc.activeElement, state.first);
  state.cleanup();
  assert.equal(state.doc.activeElement, state.opener);
  assert.equal(state.cleared(), true);
});

test('modal focus fallback works when no child takes focus and skips disconnected openers', () => {
  const state = focusLifecycle();
  state.tick();
  assert.equal(state.focuses(), 1);
  state.opener.isConnected = false;
  state.cleanup();
  assert.equal(state.doc.activeElement, state.modal);
});

test('an explicit portal uses its own document for focus and restoration', () => {
  const state = focusLifecycle({ explicitDocument: true });
  state.tick();
  state.cleanup();
  assert.equal(state.doc.activeElement, state.opener);
});
