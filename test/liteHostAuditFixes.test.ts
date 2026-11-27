import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSessionStore, type LiteHostConfig } from '../src/liteHost/session';
import { LITE_HOST_TEXT } from '../src/liteHost/text';

const CONFIG: LiteHostConfig = {
  v: 1,
  buildId: 42,
  versionId: 7,
  slug: 'new-slug',
  title: 'Star Game',
  description: 'Catch stars',
  owner: { id: 1, username: 'maker' },
  thumbnailUrl: null,
  root: 'lumine.app',
  runOrigin: 'https://b42.run.lumine.app',
  frameSrc: 'https://b42.run.lumine.app/v7/index.html',
  apiOrigin: 'https://api.twinkle.network',
  siteOrigin: 'https://www.twin-kle.com',
  publishedAt: 1
};

function withBrowserGlobals(
  {
    hash = '',
    initialStorage = {},
    fetchImpl
  }: {
    hash?: string;
    initialStorage?: Record<string, string>;
    fetchImpl: (url: string, init?: any) => Promise<{ ok: boolean; status?: number; json: () => Promise<any> }>;
  },
  fn: () => Promise<void>
) {
  const store = new Map<string, string>(Object.entries(initialStorage));
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key)
  };
  const location = {
    href: `https://new-slug.lumine.app/${hash}`,
    hash,
    origin: 'https://new-slug.lumine.app',
    hostname: 'new-slug.lumine.app'
  };
  const history = {
    replaceState: (_state: unknown, _title: string, url: string) => {
      location.href = String(url);
      const idx = location.href.indexOf('#');
      location.hash = idx >= 0 ? location.href.slice(idx) : '';
    }
  };
  const prevWindow = (globalThis as any).window;
  const prevHistory = (globalThis as any).history;
  const prevFetch = globalThis.fetch;
  (globalThis as any).window = {
    localStorage,
    location,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis)
  };
  (globalThis as any).history = history;
  (globalThis as any).fetch = fetchImpl;
  return fn().finally(() => {
    (globalThis as any).window = prevWindow;
    (globalThis as any).history = prevHistory;
    (globalThis as any).fetch = prevFetch;
  });
}

test('completeOriginHandoff requires explicit confirmation for signed-out guest-only handoffs (preview and legacy APIs)', async () => {
  const guestRecord = {
    v: 1,
    guestId: 'guest_abcdefgh12',
    nextId: 2,
    items: { score: { id: 1, value: 99, updatedAt: 100 } },
    operations: []
  };

  // 1. Preview API: declined signed-out guest-only handoff never claims or merges
  await withBrowserGlobals(
    {
      hash: '#lumine_handoff=code-guest-1',
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body || '{}'));
        assert.equal(body.preview, true, 'must not claim after user declines');
        return {
          ok: true,
          json: async () => ({
            preview: true,
            sourceOrigin: 'https://old-slug.lumine.app',
            hasSession: false,
            userId: 0,
            username: null,
            hasGuestRecord: true
          })
        };
      }
    },
    async () => {
      const store = createSessionStore(CONFIG);
      const merged: unknown[] = [];
      const confirmCalls: Array<{ signedIn: boolean } | undefined> = [];
      await store.completeOriginHandoff({
        onGuestRecord: (record) => merged.push(record),
        confirmGuestCarryover: async (opts) => {
          confirmCalls.push(opts);
          return false;
        }
      });
      assert.deepEqual(confirmCalls, [{ signedIn: false }]);
      assert.deepEqual(merged, []);
    }
  );

  // 2. Preview API: accepted signed-out guest-only handoff claims with skipSession and merges
  const requests: any[] = [];
  await withBrowserGlobals(
    {
      hash: '#lumine_handoff=code-guest-2',
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body || '{}'));
        requests.push(body);
        if (body.preview) {
          return {
            ok: true,
            json: async () => ({
              preview: true,
              sourceOrigin: 'https://old-slug.lumine.app',
              hasSession: false,
              userId: 0,
              username: null,
              hasGuestRecord: true
            })
          };
        }
        return { ok: true, json: async () => ({ session: null, guestRecord }) };
      }
    },
    async () => {
      const store = createSessionStore(CONFIG);
      const merged: unknown[] = [];
      await store.completeOriginHandoff({
        onGuestRecord: (record) => merged.push(record),
        confirmGuestCarryover: async (opts) => {
          assert.deepEqual(opts, { signedIn: false });
          return true;
        }
      });
      assert.equal(requests.length, 2);
      assert.equal(requests[0].preview, true);
      assert.equal(requests[1].skipSession, true);
      assert.deepEqual(merged, [guestRecord]);
    }
  );

  // 3. Legacy non-preview API: still gates signed-out guest-only merge behind confirmGuestCarryover
  await withBrowserGlobals(
    {
      hash: '#lumine_handoff=code-legacy',
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ session: null, guestRecord })
      })
    },
    async () => {
      const store = createSessionStore(CONFIG);
      const merged: unknown[] = [];
      let asked = false;
      await store.completeOriginHandoff({
        onGuestRecord: (record) => merged.push(record),
        confirmGuestCarryover: async (opts) => {
          asked = true;
          assert.deepEqual(opts, { signedIn: false });
          return false;
        }
      });
      assert.equal(asked, true);
      assert.deepEqual(merged, []);
    }
  );
});

test('completeOriginHandoff previews session handoffs before claiming so declining never mutates server session', async () => {
  const requests: any[] = [];
  await withBrowserGlobals(
    {
      hash: '#lumine_handoff=code-session-decline',
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body || '{}'));
        requests.push(body);
        return {
          ok: true,
          json: async () => ({
            preview: true,
            sourceOrigin: 'https://old-slug.lumine.app',
            hasSession: true,
            userId: 9,
            username: 'attacker',
            hasGuestRecord: true
          })
        };
      }
    },
    async () => {
      const store = createSessionStore(CONFIG);
      const merged: unknown[] = [];
      const res = await store.completeOriginHandoff({
        onGuestRecord: (record) => merged.push(record),
        confirmSession: async (incoming) => {
          assert.equal(incoming.user.username, 'attacker');
          assert.equal(incoming.hasGuestRecord, true);
          return false;
        }
      });
      assert.equal(res, null);
      assert.equal(store.get(), null);
      assert.deepEqual(merged, []);
      assert.equal(requests.length, 1, 'declining must never send a non-preview claim');
      assert.equal(requests[0].preview, true);
    }
  );
});

test('localized signed-out guest handoff strings exist in EN and KO', () => {
  assert.match(LITE_HOST_TEXT.en.handoffGuestLocalBody('Star Game'), /Star Game/);
  assert.ok(LITE_HOST_TEXT.en.handoffGuestLocalConfirm.length > 0);
  assert.match(LITE_HOST_TEXT.ko.handoffGuestLocalBody('별빛'), /별빛/);
  assert.ok(LITE_HOST_TEXT.ko.handoffGuestLocalConfirm.length > 0);
});

test('main.tsx guards openSignIn against an open AppAccountSheet and fails closed on Link Twinkle before info loads', () => {
  const mainSource = readFileSync(
    new URL('../src/liteHost/react/main.tsx', import.meta.url),
    'utf8'
  );
  // Finding 2: openSignIn awaits an open AppAccountSheet instead of stacking askSignIn
  assert.match(mainSource, /let\s+accountSheetOpen\s*=\s*Boolean\(resetToken\s*&&\s*!session\.get\(\)\)/);
  assert.match(mainSource, /if\s*\(\s*accountSheetOpen\s*\)\s*\{\s*await\s+waitForAccountSheetClose\(\);/);
  assert.match(mainSource, /handedOffToAppAccount\s*=\s*true;\s*accountSheetOpen\s*=\s*true;/);
  // Finding 3: Link Twinkle badge row requires accountModeLoaded
  assert.match(mainSource, /let\s+accountModeLoaded\s*=\s*false;/);
  assert.match(mainSource, /accountModeLoaded\s*=\s*true;/);
  assert.match(mainSource, /return\s+accountModeLoaded\s*&&\s*accountMode\s*!==\s*'app'/);
});

test('host.css gives returning-player .lh-text-button links focus-visible, top spacing, and 44px touch targets', () => {
  const css = readFileSync(
    new URL('../src/liteHost/host.css', import.meta.url),
    'utf8'
  );
  assert.match(css, /\.lh-text-button:focus-visible\s*\{[^}]*outline:/);
  assert.match(css, /\.lh-actions\s*\+\s*\.lh-text-button\s*\{[^}]*margin-top:\s*10px/);
  assert.match(css, /@media\s*\(hover:\s*none\)\s*\{[\s\S]*?\.lh-text-button\s*\{[^}]*min-height:\s*44px/);
});
