const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const compile = file => transformSync(read(file), { loader: 'ts', format: 'cjs' }).code;
const constants = { exports: {} };
new Function('module', 'exports', compile('src/constants/appShell.ts'))(constants, constants.exports);
const cssSource = read('src/constants/css.ts');
const cssConstants = Object.fromEntries(['mobileMaxWidth', 'desktopMinWidth'].map(name => {
  const match = cssSource.match(new RegExp(`export const ${name} = '(\\d+px)';`));
  assert.ok(match, `read the actual ${name} breakpoint`);
  return [name, match[1]];
}));
const shell = constants.exports;

function fixture(t, { width = 1366, height = 45, visible = true, missing = false } = {}) {
  const styles = new Map(), frames = new Map(), windowEvents = new Map(), viewportEvents = new Map();
  const observers = [];
  let cleanup, frameId = 0;
  const state = { width, height, missing };
  const style = {
    getPropertyValue: key => styles.get(key) || '',
    setProperty: (key, value) => styles.set(key, value)
  };
  const documentElement = { style };
  const header = { getBoundingClientRect: () => ({ height: state.height, bottom: state.height }) };
  const doc = {
    documentElement,
    querySelector(selector) {
      assert.equal(selector, shell.APP_SHELL_HEADER_SELECTOR);
      return state.missing ? null : header;
    },
    getElementById(id) {
      assert.equal(id, 'App');
      return { getBoundingClientRect: () => ({ top: Number.parseFloat(styles.get(shell.APP_SHELL_TOP_OFFSET_VAR)) }) };
    }
  };
  function events(map) {
    return {
      addEventListener: (type, fn) => map.set(type, fn),
      removeEventListener(type, fn) { assert.equal(map.get(type), fn); map.delete(type); }
    };
  }
  const win = {
    ...events(windowEvents),
    visualViewport: events(viewportEvents),
    // Deliberately preserve fractional CSS pixels instead of rounding innerWidth.
    matchMedia(query) {
      const match = query.match(/^\((min|max)-width: (\d+)px\)$/);
      assert.ok(match, query);
      return { matches: match[1] === 'max' ? state.width <= Number(match[2]) : state.width >= Number(match[2]) };
    },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  function observer(kind) {
    return class {
      constructor(callback) { this.kind = kind; this.callback = callback; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
    };
  }
  const mod = { exports: {} };
  const deps = {
    react: { useLayoutEffect: fn => { cleanup = fn(); } },
    '~/constants/appShell': shell,
    '~/constants/css': cssConstants
  };
  new Function('require', 'module', 'exports', 'document', 'window', 'ResizeObserver', 'MutationObserver',
    compile('src/containers/App/hooks/useAppShellHeaderOffset.ts'))(name => {
    assert.ok(Object.hasOwn(deps, name), name); return deps[name];
  }, mod, mod.exports, doc, win, observer('resize'), observer('mutation'));
  mod.exports.default({ headerVisible: visible, routeKey: '/chat/157435485' });
  t.after(() => {
    cleanup();
    assert.equal(frames.size, 0);
    assert.equal(windowEvents.size, 0);
    assert.equal(viewportEvents.size, 0);
    assert.ok(observers.every(item => item.disconnected));
  });
  return {
    state, style, observers,
    get top() { return styles.get(shell.APP_SHELL_TOP_OFFSET_VAR); },
    get bottom() { return styles.get(shell.APP_SHELL_BOTTOM_OFFSET_VAR); },
    flush() {
      let iterations = 0;
      while (frames.size) {
        assert.ok(iterations++ < 10, 'measurement should settle');
        const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn());
      }
    },
    emit(type, viewport = false) { (viewport ? viewportEvents : windowEvents).get(type)(); }
  };
}

test('chat reserves the top header at fractional zoom widths between mobile and desktop breakpoints', t => {
  for (const width of [767.01, 767.2, 767.8, 767.99, 768, 960, 1366]) {
    const app = fixture(t, { width }); app.flush();
    assert.equal(app.top, '45px', `visible desktop header at ${width}px`);
    assert.equal(app.bottom, shell.APP_SHELL_KEYBOARD_INSET_STYLE);
  }
});

test('phones reserve the bottom navigation, not the desktop top header', t => {
  for (const width of [320, 390, 767]) {
    const app = fixture(t, { width }); app.flush();
    assert.equal(app.top, '0px');
    assert.equal(app.bottom, shell.APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE);
  }
});

test('resizing across the exact mobile boundary never leaves a visible top header unreserved', t => {
  const app = fixture(t, { width: 767 });
  for (const width of [767.2, 767, 960, 320, 767.5]) {
    app.state.width = width; app.emit('resize'); app.flush();
    assert.equal(app.top, width > 767 ? '45px' : '0px');
    assert.equal(app.bottom, width > 767 ? shell.APP_SHELL_KEYBOARD_INSET_STYLE : shell.APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE);
  }
});

test('header height changes, viewport resize and page restore remeasure the offset', t => {
  const app = fixture(t, { width: 767.2, height: 45.2 }); app.flush();
  assert.equal(app.top, '46px');
  app.state.height = 60.4;
  app.observers.find(item => item.kind === 'resize').callback(); app.flush();
  assert.equal(app.top, '61px');
  for (const [event, viewport] of [['pageshow', false], ['orientationchange', false], ['resize', true]]) {
    app.style.setProperty(shell.APP_SHELL_TOP_OFFSET_VAR, '0px');
    app.emit(event, viewport); app.flush();
    assert.equal(app.top, '61px');
  }
});

test('hidden headers and unavailable measurements retain existing safe fallbacks', t => {
  for (const width of [320, 767.2, 1366]) {
    const hidden = fixture(t, { width, visible: false }); hidden.flush();
    assert.equal(hidden.top, '0px');
    assert.equal(hidden.bottom, shell.APP_SHELL_KEYBOARD_INSET_STYLE);
  }
  for (const options of [{ missing: true }, { height: 0 }]) {
    const fallback = fixture(t, { width: 767.2, ...options }); fallback.flush();
    assert.equal(fallback.top, shell.APP_SHELL_HEADER_OFFSET_FALLBACK);
  }
});

test('the header defaults to top zero and switches to bottom only at the mobile breakpoint', () => {
  const header = read('src/containers/App/Header/index.tsx');
  assert.match(header, /position: relative;\s*top: 0;/);
  assert.match(header, /@media \(max-width: \$\{mobileMaxWidth\}\) \{\s*top: auto;\s*bottom: 0;/);
  assert.doesNotMatch(header, /desktopMinWidth/);
});
