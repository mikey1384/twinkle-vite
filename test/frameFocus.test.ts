import test from 'node:test';
import assert from 'node:assert/strict';

interface ListenerRegistry {
  addEventListener: (type: string, fn: (...args: any[]) => void, capture?: boolean) => void;
  removeEventListener: (type: string, fn: (...args: any[]) => void, capture?: boolean) => void;
  dispatch: (type: string, event?: any) => void;
}

function createListeners(): ListenerRegistry {
  const map = new Map<string, Set<(...args: any[]) => void>>();
  return {
    addEventListener(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type)!.add(fn);
    },
    removeEventListener(type, fn) {
      map.get(type)?.delete(fn);
    },
    dispatch(type, event = {}) {
      for (const fn of [...(map.get(type) || [])]) fn(event);
    }
  };
}

function createMockDom() {
  const observers = new Set<{
    callback: (records: Array<{ removedNodes: any[]; addedNodes: any[] }>) => void;
    targets: Map<MockElement, { childList?: boolean; subtree?: boolean }>;
  }>();

  function notifyObservers(parent: MockElement, record: { removedNodes: any[]; addedNodes: any[] }) {
    for (const obs of observers) {
      let matches = false;
      for (const [target, opts] of obs.targets) {
        if (target === parent || (opts.subtree && isDescendant(target, parent))) {
          matches = true;
          break;
        }
      }
      if (matches) {
        queueMicrotask(() => {
          if (observers.has(obs)) obs.callback([record]);
        });
      }
    }
  }

  function isDescendant(ancestor: MockElement, node: MockElement | null): boolean {
    let cur = node;
    while (cur) {
      if (cur === ancestor) return true;
      cur = cur.parentNode;
    }
    return false;
  }

  let activeElement: MockElement | null = null;
  let body: MockElement;

  class MockElement {
    tagName: string;
    id: string;
    className: string;
    type: string;
    isContentEditable = false;
    attributes = new Map<string, string>();
    children: MockElement[] = [];
    parentNode: MockElement | null = null;
    focusCalls = 0;
    private listeners = createListeners();

    constructor(tag: string, { id = '', className = '', type = '' } = {}) {
      this.tagName = tag.toUpperCase();
      this.id = id;
      this.className = className;
      this.type = type;
    }

    get isConnected(): boolean {
      if (this === documentElement || this === body) return true;
      return Boolean(this.parentNode && this.parentNode.isConnected);
    }

    get childElementCount(): number {
      return this.children.length;
    }

    hasClass(name: string): boolean {
      return this.className.split(/\s+/).includes(name);
    }

    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    }

    removeAttribute(name: string) {
      this.attributes.delete(name);
    }

    appendChild(child: MockElement) {
      child.parentNode = this;
      this.children.push(child);
      notifyObservers(this, { addedNodes: [child], removedNodes: [] });
      return child;
    }

    removeChild(child: MockElement) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) {
        this.children.splice(idx, 1);
        child.parentNode = null;
        if (activeElement && isDescendant(child, activeElement)) {
          activeElement = body;
        }
        notifyObservers(this, { addedNodes: [], removedNodes: [child] });
      }
      return child;
    }

    remove() {
      this.parentNode?.removeChild(this);
    }

    closest(selector: string): MockElement | null {
      const selectors = selector.split(',').map((s) => s.trim());
      let cur: MockElement | null = this;
      while (cur) {
        for (const sel of selectors) {
          if (sel === '[inert]' && cur.attributes.has('inert')) return cur;
          if (sel.startsWith('.') && cur.hasClass(sel.slice(1))) return cur;
        }
        cur = cur.parentNode;
      }
      return null;
    }

    focus() {
      this.focusCalls += 1;
      activeElement = this;
    }

    blur() {
      if (activeElement === this) activeElement = body;
    }

    addEventListener(type: string, fn: (...args: any[]) => void, capture?: boolean) {
      this.listeners.addEventListener(type, fn, capture);
    }

    removeEventListener(type: string, fn: (...args: any[]) => void, capture?: boolean) {
      this.listeners.removeEventListener(type, fn, capture);
    }

    dispatch(type: string, event?: any) {
      this.listeners.dispatch(type, event);
    }
  }

  const documentElement = new MockElement('html');
  body = new MockElement('body');
  documentElement.children.push(body);
  body.parentNode = documentElement;
  activeElement = body;

  const docListeners = createListeners();
  const winListeners = createListeners();

  function walk(node: MockElement, predicate: (el: MockElement) => boolean): MockElement | null {
    for (const child of node.children) {
      if (predicate(child)) return child;
      const found = walk(child, predicate);
      if (found) return found;
    }
    return null;
  }

  const fakeDocument = {
    body,
    documentElement,
    visibilityState: 'visible' as 'visible' | 'hidden',
    get activeElement() {
      return activeElement;
    },
    setActiveElement(el: MockElement | null) {
      activeElement = el;
    },
    getElementById(id: string) {
      return walk(documentElement, (el) => el.id === id);
    },
    querySelector(selector: string) {
      if (selector === '.lh-backdrop, .lh-pop-layer:not([inert])') {
        return walk(
          documentElement,
          (el) => el.hasClass('lh-backdrop') || (el.hasClass('lh-pop-layer') && !el.attributes.has('inert'))
        );
      }
      if (selector === '.lh-backdrop') {
        return walk(documentElement, (el) => el.hasClass('lh-backdrop'));
      }
      return null;
    },
    addEventListener: docListeners.addEventListener,
    removeEventListener: docListeners.removeEventListener,
    dispatch: docListeners.dispatch
  };

  class MockMutationObserver {
    private record: {
      callback: (records: Array<{ removedNodes: any[]; addedNodes: any[] }>) => void;
      targets: Map<MockElement, { childList?: boolean; subtree?: boolean }>;
    };

    constructor(callback: (records: Array<{ removedNodes: any[]; addedNodes: any[] }>) => void) {
      this.record = { callback, targets: new Map() };
    }

    observe(target: MockElement, options: { childList?: boolean; subtree?: boolean } = {}) {
      this.record.targets.set(target, options);
      observers.add(this.record);
    }

    disconnect() {
      this.record.targets.clear();
      observers.delete(this.record);
    }
  }

  const prevWindow = (globalThis as any).window;
  const prevDocument = (globalThis as any).document;
  const prevMutationObserver = (globalThis as any).MutationObserver;

  const fakeWindow = {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    addEventListener: winListeners.addEventListener,
    removeEventListener: winListeners.removeEventListener,
    dispatch: winListeners.dispatch,
    matchMedia: () => ({ matches: false })
  };

  (globalThis as any).window = fakeWindow;
  (globalThis as any).document = fakeDocument;
  (globalThis as any).MutationObserver = MockMutationObserver;

  return {
    MockElement,
    document: fakeDocument,
    window: fakeWindow,
    teardown() {
      observers.clear();
      if (prevWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = prevWindow;
      if (prevDocument === undefined) delete (globalThis as any).document;
      else (globalThis as any).document = prevDocument;
      if (prevMutationObserver === undefined) delete (globalThis as any).MutationObserver;
      else (globalThis as any).MutationObserver = prevMutationObserver;
    }
  };
}

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 10));

const { installFrameFocusKeeper } = await import('../src/liteHost/frameFocus.ts');

test('window focus, tab return, and iframe load never steal focus from a host button, but refocus when focus is lost', async () => {
  const dom = createMockDom();
  const frame = new dom.MockElement('iframe', { id: 'lumine-app-frame' });
  const badge = new dom.MockElement('button', { className: 'lh-badge' });
  dom.document.body.appendChild(frame);
  dom.document.body.appendChild(badge);
  const keeper = installFrameFocusKeeper(frame as unknown as HTMLIFrameElement, {
    isTouchOnly: () => false
  });
  try {
    // User tabs from the iframe onto the host badge: window focus / visible / load must keep focus on badge.
    badge.focus();
    dom.window.dispatch('focus');
    dom.document.dispatch('visibilitychange');
    frame.dispatch('load');
    await nextTick();
    assert.equal(frame.focusCalls, 0);
    assert.equal(dom.document.activeElement, badge);

    // When focus is lost on body/document, window focus, tab return, and load return keys to the frame.
    dom.document.setActiveElement(dom.document.body);
    dom.window.dispatch('focus');
    await nextTick();
    assert.equal(frame.focusCalls, 1);
    assert.equal(dom.document.activeElement, frame);

    dom.document.setActiveElement(dom.document.documentElement);
    dom.document.dispatch('visibilitychange');
    await nextTick();
    assert.equal(frame.focusCalls, 2);

    dom.document.setActiveElement(dom.document.body);
    frame.dispatch('load');
    await nextTick();
    assert.equal(frame.focusCalls, 3);
  } finally {
    keeper.dispose();
    dom.teardown();
  }
});

test('activeElement is already the iframe at load, visibility, window focus, and overlay removal → focus() is still called', async () => {
  const dom = createMockDom();
  const frame = new dom.MockElement('iframe', { id: 'lumine-app-frame' });
  const badge = new dom.MockElement('button', { className: 'lh-badge' });
  dom.document.body.appendChild(frame);
  dom.document.body.appendChild(badge);
  const keeper = installFrameFocusKeeper(frame as unknown as HTMLIFrameElement, {
    isTouchOnly: () => false
  });
  try {
    // Frame is already activeElement (e.g. focused before its inner document loaded or before navigation).
    dom.document.setActiveElement(frame);
    frame.dispatch('load');
    await nextTick();
    assert.equal(frame.focusCalls, 1);
    assert.equal(dom.document.activeElement, frame);

    // Subsequent frame navigation while activeElement is still the iframe refocuses again.
    frame.dispatch('load');
    await nextTick();
    assert.equal(frame.focusCalls, 2);

    // Window load also refocuses when activeElement is already the iframe.
    dom.window.dispatch('load');
    await nextTick();
    assert.equal(frame.focusCalls, 3);

    // Visibility return and window focus refocus when activeElement is already the iframe.
    dom.document.dispatch('visibilitychange');
    await nextTick();
    assert.equal(frame.focusCalls, 4);

    dom.window.dispatch('focus');
    await nextTick();
    assert.equal(frame.focusCalls, 5);

    // Overlay removal refocuses when activeElement is already the iframe.
    const toast = new dom.MockElement('div', { className: 'lh-toast' });
    dom.document.body.appendChild(toast);
    const beforeRemove = frame.focusCalls;
    toast.remove();
    await nextTick();
    assert.ok(frame.focusCalls > beforeRemove);
    assert.equal(dom.document.activeElement, frame);

    // Host overlay open and host button guards still apply when activeElement is the iframe or badge.
    const callsBeforeGuards = frame.focusCalls;
    const backdrop = new dom.MockElement('div', { className: 'lh-backdrop' });
    dom.document.body.appendChild(backdrop);
    dom.document.setActiveElement(frame);
    frame.dispatch('load');
    dom.window.dispatch('focus');
    dom.document.dispatch('visibilitychange');
    await nextTick();
    assert.equal(frame.focusCalls, callsBeforeGuards);
    backdrop.remove();
    await nextTick();

    const callsBeforeBadge = frame.focusCalls;
    badge.focus();
    frame.dispatch('load');
    dom.window.dispatch('load');
    await nextTick();
    assert.equal(frame.focusCalls, callsBeforeBadge);
    assert.equal(dom.document.activeElement, badge);
  } finally {
    keeper.dispose();
    dom.teardown();
  }
});

test('touch-only guard still blocks refocus on load, focus, visibility, and overlay removal when activeElement is already the iframe', async () => {
  const dom = createMockDom();
  const frame = new dom.MockElement('iframe', { id: 'lumine-app-frame' });
  const banner = new dom.MockElement('div', { className: 'lh-ai-banner' });
  dom.document.body.appendChild(frame);
  dom.document.body.appendChild(banner);
  const keeper = installFrameFocusKeeper(frame as unknown as HTMLIFrameElement, {
    isTouchOnly: () => true
  });
  try {
    dom.document.setActiveElement(frame);
    frame.dispatch('load');
    dom.window.dispatch('load');
    dom.window.dispatch('focus');
    dom.document.dispatch('visibilitychange');
    banner.remove();
    await nextTick();
    assert.equal(frame.focusCalls, 0);
  } finally {
    keeper.dispose();
    dom.teardown();
  }
});

test('keydown never steals focus from a host button and ignores modifier, chord, and navigation keys on body', async () => {
  const dom = createMockDom();
  const frame = new dom.MockElement('iframe');
  const closeBtn = new dom.MockElement('button', { className: 'lh-ai-banner-close' });
  dom.document.body.appendChild(frame);
  dom.document.body.appendChild(closeBtn);
  const keeper = installFrameFocusKeeper(frame as unknown as HTMLIFrameElement, {
    isTouchOnly: () => false
  });
  try {
    // Focused on a host button: Shift+Tab, browser shortcuts, screen-reader keys, or letters never steal focus.
    closeBtn.focus();
    for (const event of [
      { key: 'Shift', isTrusted: true },
      { key: 'Tab', shiftKey: true, isTrusted: true },
      { key: 'ArrowDown', isTrusted: true },
      { key: 'Escape', isTrusted: true },
      { key: 'l', metaKey: true, isTrusted: true },
      { key: 'a', isTrusted: true }
    ]) {
      dom.document.dispatch('keydown', event);
    }
    assert.equal(frame.focusCalls, 0);
    assert.equal(dom.document.activeElement, closeBtn);

    // Focus lost on body: modifier-only keys, chords, Tab, Escape, and untrusted keys are ignored.
    dom.document.setActiveElement(dom.document.body);
    for (const event of [
      { key: 'Shift', isTrusted: true },
      { key: 'Control', isTrusted: true },
      { key: 'Alt', isTrusted: true },
      { key: 'Meta', isTrusted: true },
      { key: 'CapsLock', isTrusted: true },
      { key: 'Insert', isTrusted: true },
      { key: 'Tab', isTrusted: true },
      { key: 'Escape', isTrusted: true },
      { key: 't', ctrlKey: true, isTrusted: true },
      { key: 'l', metaKey: true, isTrusted: true },
      { key: 'ArrowLeft', altKey: true, isTrusted: true },
      { key: 'w', isTrusted: false }
    ]) {
      dom.document.dispatch('keydown', event);
    }
    assert.equal(frame.focusCalls, 0);

    // A regular trusted game key while focus is lost on body recovers focus to the frame.
    dom.document.dispatch('keydown', { key: 'w', isTrusted: true });
    assert.equal(frame.focusCalls, 1);
    assert.equal(dom.document.activeElement, frame);
  } finally {
    keeper.dispose();
    dom.teardown();
  }
});

test('on touch-only devices only a trusted stage pointerdown focuses the frame', async () => {
  const dom = createMockDom();
  const frame = new dom.MockElement('iframe');
  const banner = new dom.MockElement('div', { className: 'lh-ai-banner' });
  const closeBtn = new dom.MockElement('button', { className: 'lh-ai-banner-close' });
  banner.appendChild(closeBtn);
  dom.document.body.appendChild(frame);
  dom.document.body.appendChild(banner);
  const keeper = installFrameFocusKeeper(frame as unknown as HTMLIFrameElement, {
    isTouchOnly: () => true
  });
  try {
    // Startup focusApp, load, focus, visible, clicks, keydown, and overlay removal must not focus the frame.
    keeper.focusApp();
    frame.dispatch('load');
    dom.window.dispatch('focus');
    dom.document.dispatch('visibilitychange');
    dom.document.dispatch('click', { target: closeBtn, isTrusted: true });
    dom.document.dispatch('click', { target: dom.document.body, isTrusted: false });
    dom.document.dispatch('keydown', { key: 'w', isTrusted: true });
    banner.remove();
    dom.document.dispatch('pointerdown', { target: dom.document.body, isTrusted: false });
    dom.document.dispatch('pointerdown', { target: closeBtn, isTrusted: true });
    await nextTick();
    assert.equal(frame.focusCalls, 0);

    // A trusted tap on the stage itself refocuses the frame on touch-only devices.
    dom.document.dispatch('pointerdown', { target: dom.document.body, isTrusted: true });
    await nextTick();
    assert.equal(frame.focusCalls, 1);
    assert.equal(dom.document.activeElement, frame);
  } finally {
    keeper.dispose();
    dom.teardown();
  }
});

test('closing AppAccountSheet inside #lumine-host-root and inert closing menus return focus on desktop', async () => {
  const dom = createMockDom();
  const frame = new dom.MockElement('iframe');
  dom.document.body.appendChild(frame);
  const keeper = installFrameFocusKeeper(frame as unknown as HTMLIFrameElement, {
    isTouchOnly: () => false
  });
  try {
    // #lumine-host-root is added after installFrameFocusKeeper (just like main.tsx).
    const hostRoot = new dom.MockElement('div', { id: 'lumine-host-root' });
    dom.document.body.appendChild(hostRoot);
    await nextTick();

    const backdrop = new dom.MockElement('div', { className: 'lh-backdrop' });
    const input = new dom.MockElement('input', { type: 'text' });
    backdrop.appendChild(input);
    hostRoot.appendChild(backdrop);
    input.focus();

    // While the sheet is open, focus must not be stolen.
    keeper.focusApp();
    assert.equal(frame.focusCalls, 0);

    // Async unmount of AppAccountSheet removes .lh-backdrop from #lumine-host-root.
    backdrop.remove();
    await nextTick();
    assert.ok(frame.focusCalls >= 1);
    assert.equal(dom.document.activeElement, frame);

    // Closing a menu marks .lh-pop-layer inert while fading out; focus inside it counts as lost.
    const callsBefore = frame.focusCalls;
    const popLayer = new dom.MockElement('div', { className: 'lh-pop-layer' });
    const item = new dom.MockElement('button');
    popLayer.appendChild(item);
    dom.document.body.appendChild(popLayer);
    item.focus();
    popLayer.setAttribute('inert', '');
    keeper.focusApp();
    assert.equal(frame.focusCalls, callsBefore + 1);
    assert.equal(dom.document.activeElement, frame);
  } finally {
    keeper.dispose();
    dom.teardown();
  }
});
