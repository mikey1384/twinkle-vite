import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    map
  };
}

function createSessionTestEnv(initialHref: string) {
  const localStorage = createStorage();
  let currentHref = initialHref;
  const replaceCalls: string[] = [];
  const prevWindow = (globalThis as any).window;
  const prevHistory = (globalThis as any).history;
  const prevFetch = (globalThis as any).fetch;
  const prevLocalStorage = (globalThis as any).localStorage;

  const locationObj = {
    get href() {
      return currentHref;
    },
    get hash() {
      const idx = currentHref.indexOf('#');
      return idx >= 0 ? currentHref.slice(idx) : '';
    },
    get origin() {
      return new URL(currentHref).origin;
    },
    get host() {
      return new URL(currentHref).host;
    }
  };
  const historyObj = {
    replaceState(_state: unknown, _title: string, url?: string | URL | null) {
      if (typeof url === 'string') {
        currentHref = url;
        replaceCalls.push(url);
      }
    }
  };
  const timers: ReturnType<typeof setTimeout>[] = [];
  const fakeWindow = {
    localStorage,
    location: locationObj,
    history: historyObj,
    setTimeout: (fn: (...args: any[]) => void, ms?: number) => {
      const id = globalThis.setTimeout(fn, ms);
      id.unref?.();
      timers.push(id);
      return id;
    },
    clearTimeout: globalThis.clearTimeout.bind(globalThis)
  };
  (globalThis as any).window = fakeWindow;
  (globalThis as any).history = historyObj;
  (globalThis as any).localStorage = localStorage;

  return {
    localStorage,
    replaceCalls,
    setFetch(fn: (...args: any[]) => Promise<any>) {
      (globalThis as any).fetch = fn;
    },
    teardown() {
      for (const id of timers) globalThis.clearTimeout(id);
      if (prevWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = prevWindow;
      if (prevHistory === undefined) delete (globalThis as any).history;
      else (globalThis as any).history = prevHistory;
      if (prevFetch === undefined) delete (globalThis as any).fetch;
      else (globalThis as any).fetch = prevFetch;
      if (prevLocalStorage === undefined) delete (globalThis as any).localStorage;
      else (globalThis as any).localStorage = prevLocalStorage;
    }
  };
}

const baseConfig = {
  v: 1,
  buildId: 42,
  versionId: 100,
  slug: 'new-slug',
  title: 'Star Game',
  description: '',
  owner: { id: 1, username: 'maker' },
  thumbnailUrl: null,
  root: 'lumine.app',
  runOrigin: 'https://b42.run.lumine.app',
  frameSrc: 'https://b42.run.lumine.app/v100/index.html',
  apiOrigin: 'https://api.twinkle.network',
  siteOrigin: 'https://www.twin-kle.com',
  publishedAt: 1_800_000_000
};

const { createSessionStore } = await import('../src/liteHost/session.ts');
const { createGuestStore } = await import('../src/liteHost/guestStore.ts');

test('completeOriginHandoff never overwrites an existing session and confirms before carrying over guest data', async () => {
  const env = createSessionTestEnv('https://new-slug.lumine.app/#lumine_handoff=code-1');
  try {
    const existingSession = {
      accessToken: 'existing-jwt',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      refreshToken: 'existing-rt',
      user: { id: 2, username: 'victim' },
      scopes: ['privateDb:write'],
      appPlayer: { id: 20, kind: 'twinkle' as const, linked: false }
    };
    env.localStorage.setItem('lumine-app-session:42', JSON.stringify(existingSession));

    const postBodies: any[] = [];
    env.setFetch(async (_url: string, init: any) => {
      postBodies.push(JSON.parse(init.body));
      return {
        ok: true,
        json: async () => ({
          session: {
            accessToken: 'attacker-jwt',
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            refreshToken: 'attacker-rt',
            user: { id: 99, username: 'attacker' },
            scopes: ['privateDb:write']
          },
          guestRecord: {
            v: 1,
            guestId: 'guest_abcdefgh12',
            nextId: 2,
            items: { stage: { id: 1, value: 5, updatedAt: 1 } },
            operations: []
          }
        })
      };
    });

    const guestStore = createGuestStore(42, () => 'guest_local12345');
    const carriedTokens: string[] = [];
    const store = createSessionStore(baseConfig, {
      beforeSignedIn: async (token) => {
        carriedTokens.push(token);
      }
    });

    // Declining guest carryover leaves existing session intact and does not merge guest data
    let guestConfirmCalls = 0;
    await store.completeOriginHandoff({
      onGuestRecord: (record) => guestStore.mergeHandoff(record),
      confirmGuestCarryover: async () => {
        guestConfirmCalls += 1;
        return false;
      }
    });
    assert.equal(postBodies[0].skipSession, true);
    assert.equal(store.get()?.user.username, 'victim');
    assert.equal(guestConfirmCalls, 1);
    assert.equal(guestStore.get('stage').item, null);
    assert.deepEqual(carriedTokens, []);

    // Confirming guest carryover merges old-origin guest data and triggers beforeSignedIn carryover
    env.replaceCalls.length = 0;
    const env2 = createSessionTestEnv('https://new-slug.lumine.app/#lumine_handoff=code-2');
    try {
      env2.localStorage.setItem('lumine-app-session:42', JSON.stringify(existingSession));
      env2.setFetch(async () => ({
        ok: true,
        json: async () => ({
          session: null,
          guestRecord: {
            v: 1,
            guestId: 'guest_abcdefgh12',
            nextId: 2,
            items: { stage: { id: 1, value: 5, updatedAt: 1 } },
            operations: []
          }
        })
      }));
      const guestStore2 = createGuestStore(42, () => 'guest_local12345');
      const carriedTokens2: string[] = [];
      const store2 = createSessionStore(baseConfig, {
        beforeSignedIn: async (token) => {
          carriedTokens2.push(token);
        }
      });
      await store2.completeOriginHandoff({
        onGuestRecord: (record) => guestStore2.mergeHandoff(record),
        confirmGuestCarryover: async () => true
      });
      assert.equal(store2.get()?.user.username, 'victim');
      assert.equal(guestStore2.get('stage').item?.value, 5);
      assert.deepEqual(carriedTokens2, ['existing-jwt']);
    } finally {
      env2.teardown();
    }
  } finally {
    env.teardown();
  }
});

test('completeOriginHandoff requires explicit confirmation on signed-out origin and runs adopt carryover when confirmed', async () => {
  const handoffPayload = {
    session: {
      accessToken: 'handed-jwt',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      refreshToken: 'handed-rt',
      user: { id: 7, username: 'lily' },
      scopes: ['privateDb:write'],
      appPlayer: { id: 70, kind: 'twinkle' as const, linked: false }
    },
    guestRecord: null
  };

  // Without confirmation (or declined): never signs in
  const env1 = createSessionTestEnv('https://new-slug.lumine.app/#lumine_handoff=code-fixation');
  try {
    env1.setFetch(async () => ({ ok: true, json: async () => handoffPayload }));
    const store1 = createSessionStore(baseConfig);
    await store1.completeOriginHandoff({
      confirmSession: async ({ user }) => {
        assert.equal(user.username, 'lily');
        return false;
      }
    });
    assert.equal(store1.get(), null);
  } finally {
    env1.teardown();
  }

  // With confirmation: adopts session and runs beforeSignedIn carryover for new-origin guest saves
  const env2 = createSessionTestEnv('https://new-slug.lumine.app/#lumine_handoff=code-ok');
  try {
    env2.setFetch(async () => ({ ok: true, json: async () => handoffPayload }));
    const guestStore = createGuestStore(42, () => 'guest_neworigin12');
    guestStore.set('progress', { level: 4 });
    const carried: Array<{ token: string; entries: any[] }> = [];
    const store2 = createSessionStore(baseConfig, {
      beforeSignedIn: async (token) => {
        const pending = guestStore.takeForCarryover();
        if (pending) {
          carried.push({ token, entries: pending.entries });
          guestStore.clear();
        }
      }
    });
    await store2.completeOriginHandoff({
      onGuestRecord: (record) => guestStore.mergeHandoff(record),
      confirmSession: async ({ user }) => user.username === 'lily'
    });
    assert.equal(store2.get()?.user.username, 'lily');
    assert.equal(carried.length, 1);
    assert.equal(carried[0].token, 'handed-jwt');
    assert.deepEqual(carried[0].entries, [{ key: 'progress', value: { level: 4 } }]);
  } finally {
    env2.teardown();
  }
});

test('badge menu "Share this app" restores focus to app frame and shows feedback when clipboard fails', async () => {
  const prevWindow = (globalThis as any).window;
  const prevDocument = (globalThis as any).document;
  const prevNavigator = (globalThis as any).navigator;
  const timers: ReturnType<typeof setTimeout>[] = [];

  class FakeEl {
    tagName: string;
    className = '';
    id = '';
    attributes = new Map<string, string>();
    children: Array<FakeEl | string> = [];
    parentNode: FakeEl | null = null;
    style: Record<string, any> = { setProperty() {}, removeProperty() {} };
    offsetWidth = 240;
    offsetHeight = 200;
    private listeners = new Map<string, Array<(...args: any[]) => void>>();

    constructor(tag: string) {
      this.tagName = tag.toUpperCase();
    }
    get classList() {
      const self = this;
      return {
        add(name: string) {
          const parts = new Set(self.className.split(/\s+/).filter(Boolean));
          parts.add(name);
          self.className = [...parts].join(' ');
        },
        remove(name: string) {
          self.className = self.className
            .split(/\s+/)
            .filter((p) => p && p !== name)
            .join(' ');
        },
        contains(name: string) {
          return self.className.split(/\s+/).includes(name);
        }
      };
    }
    setAttribute(name: string, value: string) {
      if (name === 'id') this.id = value;
      this.attributes.set(name, value);
    }
    removeAttribute(name: string) {
      if (name === 'id') this.id = '';
      this.attributes.delete(name);
    }
    append(...items: Array<FakeEl | string>) {
      for (const item of items) {
        if (item instanceof FakeEl) item.parentNode = this;
        this.children.push(item);
      }
    }
    remove() {
      if (!this.parentNode) return;
      const idx = this.parentNode.children.indexOf(this);
      if (idx >= 0) this.parentNode.children.splice(idx, 1);
      this.parentNode = null;
    }
    getBoundingClientRect() {
      return { left: 100, right: 200, top: 100, bottom: 140, width: 100, height: 40 };
    }
    addEventListener(type: string, fn: (...args: any[]) => void) {
      const list = this.listeners.get(type) || [];
      list.push(fn);
      this.listeners.set(type, list);
    }
    removeEventListener(type: string, fn: (...args: any[]) => void) {
      const list = this.listeners.get(type) || [];
      this.listeners.set(
        type,
        list.filter((item) => item !== fn)
      );
    }
    click() {
      for (const fn of [...(this.listeners.get('click') || [])]) fn({ target: this });
    }
    focus() {
      activeElement = this;
    }
    blur() {
      if (activeElement === this) activeElement = body;
    }
    textContent(): string {
      return this.children.map((c) => (typeof c === 'string' ? c : c.textContent())).join('');
    }
    querySelector(selector: string): FakeEl | null {
      return this.querySelectorAll(selector)[0] || null;
    }
    querySelectorAll(selector: string): FakeEl[] {
      const out: FakeEl[] = [];
      const walk = (node: FakeEl) => {
        for (const child of node.children) {
          if (!(child instanceof FakeEl)) continue;
          const match =
            (selector === '[role="menuitem"]' && child.attributes.get('role') === 'menuitem') ||
            (selector.startsWith('.') && child.classList.contains(selector.slice(1))) ||
            (selector.startsWith('#') && child.id === selector.slice(1));
          if (match) out.push(child);
          walk(child);
        }
      };
      walk(this);
      return out;
    }
  }

  const body = new FakeEl('body');
  let activeElement: FakeEl = body;
  const fakeDoc: any = {
    body,
    documentElement: new FakeEl('html'),
    get activeElement() {
      return activeElement;
    },
    createElement: (tag: string) => new FakeEl(tag),
    createElementNS: (_ns: string, tag: string) => new FakeEl(tag),
    addEventListener() {},
    removeEventListener() {},
    querySelector: (sel: string) => body.querySelector(sel),
    getElementById: (id: string) => body.querySelector(`#${id}`)
  };
  const fakeWin: any = {
    location: { href: 'https://new-slug.lumine.app/play', host: 'new-slug.lumine.app' },
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: () => ({ matches: true }),
    addEventListener() {},
    removeEventListener() {},
    setTimeout: (fn: (...args: any[]) => void, ms?: number) => {
      const id = globalThis.setTimeout(fn, ms);
      id.unref?.();
      timers.push(id);
      return id;
    },
    clearTimeout: globalThis.clearTimeout.bind(globalThis)
  };
  (globalThis as any).document = fakeDoc;
  (globalThis as any).window = fakeWin;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async () => {
          throw new Error('clipboard denied');
        }
      }
    }
  });

  const { LITE_HOST_TEXT } = await import('../src/liteHost/text.ts');
  const { mountBadge, setHostFocusReturn } = await import('../src/liteHost/ui.ts');

  try {
    let focusReturnCalls = 0;
    setHostFocusReturn(() => {
      focusReturnCalls += 1;
    });
    const fakeSession: any = { get: () => null };
    const badge = mountBadge({
      config: baseConfig,
      t: LITE_HOST_TEXT.en,
      session: fakeSession,
      onReport: () => {}
    }) as unknown as FakeEl;

    badge.click();
    const menuItems = body.querySelectorAll('[role="menuitem"]');
    const shareItem = menuItems.find((item) => item.textContent().includes(LITE_HOST_TEXT.en.shareApp));
    assert.ok(shareItem, 'Share this app menu item exists');
    shareItem.click();
    await new Promise((resolve) => globalThis.setTimeout(resolve, 10));

    assert.equal(focusReturnCalls, 1, 'focus returns to app frame after Share');
    const toast = body.querySelector('.lh-toast');
    assert.ok(toast, 'shows toast feedback when clipboard write fails');
    assert.equal(toast.textContent(), LITE_HOST_TEXT.en.linkCopyFailed);
  } finally {
    setHostFocusReturn(null);
    for (const id of timers) globalThis.clearTimeout(id);
    if (prevWindow === undefined) delete (globalThis as any).window;
    else (globalThis as any).window = prevWindow;
    if (prevDocument === undefined) delete (globalThis as any).document;
    else (globalThis as any).document = prevDocument;
    if (prevNavigator === undefined) delete (globalThis as any).navigator;
    else Object.defineProperty(globalThis, 'navigator', { configurable: true, value: prevNavigator });
  }
});

test('refreshAiBanner in app-only mode offers Continue with Twinkle CTA for returning linked players', () => {
  const source = readFileSync(path.join(__dirname, '../src/liteHost/react/main.tsx'), 'utf8');
  assert.match(
    source,
    /if\s*\(\s*accountMode\s*===\s*'app'\s*\)\s*\{\s*if\s*\(\s*force\s*&&\s*player\?\.kind\s*===\s*'app'\s*&&\s*player\.linked\s*\)\s*\{\s*showAiBanner\(\{\s*t,\s*buildId:\s*config\.buildId,\s*cta:\s*t\.signInCta,\s*force,\s*onAction:\s*\(\)\s*=>\s*void\s+session\.signIn\(\)\s*\}\);/
  );
});
