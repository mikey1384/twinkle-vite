const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { transformSync } = require('esbuild');

function initialModalRender({ hasRoot = true, portalTarget } = {}) {
  const target = hasRoot ? { id: 'modal' } : null;
  const container = { setAttribute() {}, className: '' };
  const slots = [], layouts = [];
  let cursor = 0;
  for (const host of [target, portalTarget].filter(Boolean)) {
    host.appendChild = element => { element.parentNode = host; };
    host.removeChild = element => { element.parentNode = null; };
  }
  const deps = {
    react: {
      ...React,
      forwardRef: fn => fn,
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], value => { slots[index] = value; }];
      },
      useRef: current => ({ current }), useMemo: fn => fn(), useCallback: fn => fn,
      useEffect() {}, useLayoutEffect(fn) { layouts.push(fn); }
    },
    'react-dom': { createPortal: (children, element) => {
      assert.ok(element.parentNode, 'Children must not mount into a detached container');
      return { portal: true, children, element };
    } },
    '@emotion/css': { css: () => 'modal-style' }, '@emotion/react': { keyframes: () => 'animation' },
    '~/constants/css': { Color: new Proxy({}, { get: () => () => '#334155' }) },
    '~/constants/appShell': { APP_SHELL_KEYBOARD_INSET_STYLE: '0px' },
    '~/helpers': { isMobile: () => false, isTablet: () => false },
    '~/components/Icon': () => null, '~/components/ErrorBoundary': ({ children }) => children
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'document', 'window', 'navigator', transformSync(readFileSync(path.resolve(__dirname, '../src/components/Modal/index.tsx'), 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(
    name => { assert.ok(Object.hasOwn(deps, name), `Unexpected dependency ${name}`); return deps[name]; },
    mod, mod.exports, { createElement: () => container, getElementById: () => target }, { innerWidth: 1280, innerHeight: 640 }, {}
  );
  const props = { isOpen: true, onClose() {}, portalTarget, children: React.createElement('p', null, 'Stateful chat content') };
  const initial = mod.exports.default(props);
  for (const attach of layouts.splice(0)) attach();
  cursor = 0;
  return { initial, result: mod.exports.default(props), container };
}

test('chat dialogs start in the existing portal without an inline-to-portal remount', () => {
  const { initial, result, container } = initialModalRender();
  assert.equal(initial, null);
  assert.equal(result.portal, true);
  assert.equal(result.element, container);
});

test('an explicit portal target also owns the first render', () => {
  const { initial, result, container } = initialModalRender({ hasRoot: false, portalTarget: { id: 'embedded-host' } });
  assert.equal(initial, null);
  assert.equal(result.portal, true);
  assert.equal(result.element, container);
});

test('dialogs retain the inline fallback when no portal target exists', () => {
  const { result } = initialModalRender({ hasRoot: false });
  assert.equal(React.isValidElement(result), true);
  assert.equal(result.portal, undefined);
});
