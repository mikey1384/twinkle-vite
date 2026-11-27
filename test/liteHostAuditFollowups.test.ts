import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveAppBridgeUrl,
  resolveStandaloneDeepLinkTarget,
  resolveStandaloneShareUrl
} from '../src/liteHost/shareUrl';
import { createGuestStore } from '../src/liteHost/guestStore';
import { createSessionStore, type LiteHostConfig } from '../src/liteHost/session';
import { LITE_HOST_TEXT } from '../src/liteHost/text';
import {
  CUSTOM_DOMAIN_COINS_UNAVAILABLE_CODE,
  CUSTOM_DOMAIN_COINS_UNAVAILABLE_MESSAGE,
  isCustomDomainCoinSpendBlocked
} from '../src/liteHost/react/liteCoins';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeMemoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    }
  };
}

function withFakeBrowser(
  initialHref: string,
  fn: (env: {
    storage: ReturnType<typeof makeMemoryStorage>;
    replacedUrls: string[];
  }) => Promise<void> | void
) {
  const storage = makeMemoryStorage();
  const replacedUrls: string[] = [];
  const loc = new URL(initialHref);
  const fakeLocation = {
    get href() {
      return loc.href;
    },
    get origin() {
      return loc.origin;
    },
    get pathname() {
      return loc.pathname;
    },
    get search() {
      return loc.search;
    },
    get hash() {
      return loc.hash;
    },
    get hostname() {
      return loc.hostname;
    }
  };
  const fakeHistory = {
    replaceState(_state: unknown, _title: string, url: string) {
      replacedUrls.push(url);
      const next = new URL(url, loc.origin);
      loc.href = next.href;
    }
  };
  const prevWindow = (globalThis as any).window;
  const prevLocalStorage = (globalThis as any).localStorage;
  const prevHistory = (globalThis as any).history;
  const fakeWindow = {
    localStorage: storage,
    location: fakeLocation,
    history: fakeHistory,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  (globalThis as any).window = fakeWindow;
  (globalThis as any).localStorage = storage;
  (globalThis as any).history = fakeHistory;
  return Promise.resolve()
    .then(() => fn({ storage, replacedUrls }))
    .finally(() => {
      if (prevWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = prevWindow;
      if (prevLocalStorage === undefined) delete (globalThis as any).localStorage;
      else (globalThis as any).localStorage = prevLocalStorage;
      if (prevHistory === undefined) delete (globalThis as any).history;
      else (globalThis as any).history = prevHistory;
    });
}

// --- G9: share links on an app's own address ------------------------------

test('G9: standalone apps generate share URLs on their own origin, not twin-kle.com/app/<id>', () => {
  // Standalone lumine.app slug
  assert.equal(
    resolveAppBridgeUrl({
      origin: 'https://star-hopper.lumine.app',
      buildId: 42,
      standalone: true
    }),
    'https://star-hopper.lumine.app'
  );
  // Standalone custom domain
  assert.equal(
    resolveAppBridgeUrl({
      origin: 'https://starhopper.com',
      buildId: 42,
      standalone: true
    }),
    'https://starhopper.com'
  );
  // Hosted on twin-kle.com keeps /app/<id>
  assert.equal(
    resolveAppBridgeUrl({
      origin: 'https://www.twin-kle.com',
      buildId: 42,
      standalone: false
    }),
    'https://www.twin-kle.com/app/42'
  );

  // Share button URL strips fragments (e.g. one-time codes) while keeping deep links & query.
  assert.equal(
    resolveStandaloneShareUrl('https://starhopper.com/level-3?mode=hard#lumine_handoff=secret'),
    'https://starhopper.com/level-3?mode=hard'
  );
  assert.equal(
    resolveStandaloneShareUrl('https://star-hopper.lumine.app/#lumine_code=abc'),
    'https://star-hopper.lumine.app/'
  );

  // Standalone deep-link pathname parses into Twinkle launch target.
  assert.equal(resolveStandaloneDeepLinkTarget('/'), null);
  assert.equal(resolveStandaloneDeepLinkTarget('/_lumine/host/app.js'), null);
  assert.deepEqual(resolveStandaloneDeepLinkTarget('/level-3/boss'), {
    source: 'deepLink',
    target: { path: 'level-3/boss' }
  });
});

// --- G10: slug rename handoff on the lite host ----------------------------

test('G10: guestStore.mergeHandoff preserves old-origin keys without overwriting newer keys', async () => {
  await withFakeBrowser('https://new-game.lumine.app/', () => {
    const store = createGuestStore(42, () => 'guest_local_default_1234');
    // Pre-existing key on the new origin must not be overwritten.
    store.set('level', 5);

    const merged = store.mergeHandoff({
      v: 1,
      guestId: 'guest_oldorigin_9999',
      nextId: 4,
      items: {
        level: { id: 1, value: 2, updatedAt: 1000 },
        coins: { id: 2, value: 75, updatedAt: 1001 },
        'bad key!': { id: 3, value: 'nope', updatedAt: 1002 }
      },
      operations: []
    });
    assert.equal(merged, 1);
    assert.equal(store.get('level').item?.value, 5);
    assert.equal(store.get('coins').item?.value, 75);
    assert.equal(store.list().items.length, 2);

    // When the new origin had no items, mergeHandoff also adopts the old guestId.
    const freshStore = createGuestStore(43, () => 'guest_fresh_default_1234');
    const mergedFresh = freshStore.mergeHandoff({
      v: 1,
      guestId: 'guest_oldorigin_9999',
      nextId: 2,
      items: {
        progress: { id: 1, value: { chapter: 3 }, updatedAt: 1005 }
      },
      operations: []
    });
    assert.equal(mergedFresh, 1);
    assert.deepEqual(freshStore.takeForCarryover(), {
      guestId: 'guest_oldorigin_9999',
      entries: [{ key: 'progress', value: { chapter: 3 } }]
    });
  });
});

test('G10: session.completeOriginHandoff claims #lumine_handoff, strips hash, adopts session and merges guest progress', async () => {
  await withFakeBrowser(
    'https://new-game.lumine.app/stage-2?a=1#lumine_handoff=handoff-code-xyz&view=map',
    async ({ storage, replacedUrls }) => {
      const prevFetch = globalThis.fetch;
      const calls: Array<{ url: string; body: any }> = [];
      globalThis.fetch = (async (input: any, init: any) => {
        calls.push({ url: String(input), body: JSON.parse(String(init?.body || '{}')) });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            session: {
              accessToken: 'new-access-jwt',
              expiresAt: Math.floor(Date.now() / 1000) + 3600,
              refreshToken: 'new-refresh-token',
              user: { id: 9, username: 'alice' },
              scopes: ['privateDb:read', 'privateDb:write'],
              appPlayer: { id: 501, kind: 'twinkle', linked: false }
            },
            guestRecord: {
              v: 1,
              guestId: 'guest_oldorigin_1234',
              nextId: 2,
              items: { checkpoint: { id: 1, value: 'bridge', updatedAt: 12345 } },
              operations: []
            }
          })
        } as any;
      }) as typeof fetch;

      try {
        const config: LiteHostConfig = {
          v: 1,
          buildId: 42,
          versionId: 7,
          slug: 'new-game',
          title: 'New Game',
          description: '',
          owner: { id: 1, username: 'maker' },
          thumbnailUrl: null,
          root: 'lumine.app',
          runOrigin: 'https://b42.run.lumine.app',
          frameSrc: 'https://b42.run.lumine.app/v7/index.html',
          apiOrigin: 'https://api.twinkle.network',
          siteOrigin: 'https://www.twin-kle.com',
          publishedAt: 1_800_000_000
        };
        const guestStore = createGuestStore(42, () => 'guest_local_123456');
        const store = createSessionStore(config);
        const confirmed: Array<{ user: { id: number; username: string }; hasGuestRecord: boolean }> = [];
        const adopted = await store.completeOriginHandoff({
          onGuestRecord: (record) => {
            guestStore.mergeHandoff(record);
          },
          confirmSession: async (incoming) => {
            confirmed.push(incoming);
            return true;
          }
        });

        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://api.twinkle.network/build/app-session/handoff/claim');
        assert.deepEqual(calls[0].body, { buildId: 42, code: 'handoff-code-xyz' });
        assert.equal(replacedUrls[0], 'https://new-game.lumine.app/stage-2?a=1#view=map');
        assert.deepEqual(confirmed, [{ user: { id: 9, username: 'alice' }, hasGuestRecord: true }]);
        assert.equal(adopted?.accessToken, 'new-access-jwt');
        assert.equal(adopted?.refreshToken, 'new-refresh-token');
        assert.equal(adopted?.user.username, 'alice');
        assert.ok(storage.getItem('lumine-app-session:42')?.includes('new-refresh-token'));
        assert.equal(guestStore.get('checkpoint').item?.value, 'bridge');
      } finally {
        globalThis.fetch = prevFetch;
      }
    }
  );
});

// --- D2 / G8: lite host text + existing-player sign-in UI -----------------

test('D2/G8 + G9: lite host copy includes existing-player sign-in fallback and standalone share labels', () => {
  for (const lang of ['en', 'ko'] as const) {
    assert.ok(LITE_HOST_TEXT[lang].existingAppAccount.length > 0);
    assert.ok(LITE_HOST_TEXT[lang].existingTwinkleAccount.length > 0);
    assert.ok(LITE_HOST_TEXT[lang].shareApp.length > 0);
    assert.ok(LITE_HOST_TEXT[lang].shareAppSub.length > 0);
    assert.ok(LITE_HOST_TEXT[lang].linkCopied.length > 0);
  }
});

// --- D7: maker settings on twin-kle.com stay in English -------------------

test('D7: twin-kle.com maker settings components always render English UI', () => {
  const appAddressSrc = readFileSync(
    path.join(__dirname, '../src/components/Build/AppAddress/index.tsx'),
    'utf8'
  );
  const domainCheckoutSrc = readFileSync(
    path.join(__dirname, '../src/components/Build/AppAddress/DomainCheckoutPage.tsx'),
    'utf8'
  );
  const appPlayersSrc = readFileSync(
    path.join(__dirname, '../src/components/Build/AppAddress/AppPlayers.tsx'),
    'utf8'
  );

  // Maker UI never switches text by browser/document language.
  assert.doesNotMatch(appAddressSrc, /ADDRESS_TEXT\[pageLang\(\)\]/);
  assert.match(appAddressSrc, /const t = ADDRESS_TEXT\.en;/);
  assert.match(appAddressSrc, /<AppPlayers buildId=\{buildId\} lang="en"/);

  assert.doesNotMatch(domainCheckoutSrc, /ADDRESS_TEXT\[pageLang\(\)\]/);
  assert.match(domainCheckoutSrc, /const t = ADDRESS_TEXT\.en;/);
  // Parent approval email keeps browser language preference for Korean parents.
  assert.match(domainCheckoutSrc, /lang: parentEmailLang\(\)/);

  assert.doesNotMatch(appPlayersSrc, /TEXT\[lang\]/);
  assert.match(appPlayersSrc, /const t = TEXT\.en;/);
  assert.match(appPlayersSrc, /toLocaleDateString\('en-US'/);
});

// --- G13: Coins spends on custom domains refused cleanly before box -------

test('G13: custom domains refuse Coins spend operations before opening confirmation box', () => {
  for (const spend of [
    'coins:charge',
    'coins:make-offer',
    'coins:respond-offer',
    'coins:takeover',
    'coins:withdraw-offer'
  ]) {
    assert.equal(isCustomDomainCoinSpendBlocked(spend, 'domain'), true, spend);
    assert.equal(isCustomDomainCoinSpendBlocked(spend, 'address'), false, spend);
    assert.equal(isCustomDomainCoinSpendBlocked(spend, null), false, spend);
  }
  // Read-only Coins operations remain allowed on custom domains.
  for (const readOp of ['coins:balance', 'coins:receipts', 'coins:offers', 'coins:record-blocks']) {
    assert.equal(isCustomDomainCoinSpendBlocked(readOp, 'domain'), false, readOp);
  }
  assert.equal(CUSTOM_DOMAIN_COINS_UNAVAILABLE_CODE, 'coins_unavailable_on_custom_domain');
  assert.match(CUSTOM_DOMAIN_COINS_UNAVAILABLE_MESSAGE, /custom domain/i);
});
