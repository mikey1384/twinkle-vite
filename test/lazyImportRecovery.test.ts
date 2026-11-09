import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 11-09 (Blackstar): a request-helper chunk failed to download while her
// phone had the site in the background, the failure was kept, and every later
// upload showed the raw "Failed to fetch dynamically imported module: <url>".

const PAGE = 'https://www.twin-kle.com';
const CHUNK = `${PAGE}/assets/content-CA8FY4Cc.js`;

function chunkError(url = CHUNK) {
  return new TypeError(`Failed to fetch dynamically imported module: ${url}`);
}

function installBrowserStubs({ chunkStatus = 200 } = {}) {
  const store = new Map<string, string>();
  const replaced: string[] = [];
  const doc = Object.assign(new EventTarget(), {
    visibilityState: 'visible',
    body: null,
    getElementById: () => null
  });
  const win = Object.assign(new EventTarget(), {
    location: {
      href: `${PAGE}/chat/reflections`,
      origin: PAGE,
      pathname: '/chat/reflections',
      replace: (url: string) => replaced.push(url),
      reload: () => replaced.push('reload')
    },
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key)
    },
    setTimeout,
    clearTimeout
  });
  Object.assign(globalThis, { window: win, document: doc });
  // the stale probe (HEAD on the chunk)
  (globalThis as any).fetch = async () =>
    new Response('', {
      status: chunkStatus,
      headers: { 'content-type': 'application/javascript' }
    });
  return {
    replaced,
    setVisibility(next: 'visible' | 'hidden') {
      doc.visibilityState = next;
      doc.dispatchEvent(new Event('visibilitychange'));
    }
  };
}

// stands in for the browser's import of a fresh copy of the failed chunk
function freshCopies(results: unknown[]) {
  const requested: string[] = [];
  return {
    requested,
    options: {
      isUsable: (loaded: any) => typeof loaded?.default === 'function',
      load: async (url: string) => {
        requested.push(url);
        const next = results.shift();
        if (next === 'fail' || next === undefined) throw chunkError(url);
        return next;
      }
    }
  };
}

const factory = () => ({});
const helpers = await import('../src/helpers/lazyImportHelpers');

test('a request helper retries with a fresh copy and loads without a reload', async () => {
  const browser = installBrowserStubs();
  const fresh = freshCopies(['fail', { default: factory }]);
  let calls = 0;
  const loaded = await helpers.importWithRecovery(async () => {
    calls += 1;
    throw chunkError();
  }, fresh.options);
  assert.deepEqual(loaded, { default: factory });
  assert.equal(calls, 1, 'the kept failure is not asked for again');
  assert.equal(fresh.requested.length, 2);
  for (const url of fresh.requested) {
    assert.match(
      url,
      /^https:\/\/www\.twin-kle\.com\/assets\/content-CA8FY4Cc\.js\?twinkleRetry=\w+$/
    );
  }
  assert.notEqual(fresh.requested[0], fresh.requested[1]);
  assert.deepEqual(browser.replaced, []);
});

test('fresh-copy URLs are never reused, even on a later call', async () => {
  installBrowserStubs();
  const fresh = freshCopies([]);
  const fail = async () => {
    throw chunkError();
  };
  await assert.rejects(helpers.importWithRecovery(fail, fresh.options));
  await assert.rejects(helpers.importWithRecovery(fail, fresh.options));
  assert.equal(fresh.requested.length, 6);
  assert.equal(new Set(fresh.requested).size, 6);
});

test('a fresh copy that is not what the importer returns is never used', async () => {
  const browser = installBrowserStubs();
  // e.g. an importer that reshapes the module: import(...).then(m => m.i)
  const fresh = freshCopies([{ i: factory }]);
  let calls = 0;
  await assert.rejects(
    helpers.importWithRecovery(async () => {
      calls += 1;
      throw chunkError();
    }, fresh.options),
    (error: any) => error.name === 'LazyLoadConnectionError'
  );
  assert.equal(fresh.requested.length, 1, 'no second fresh copy');
  assert.equal(calls, 1, 'the kept failure is not asked for again');
  assert.deepEqual(browser.replaced, []);
});

test('page components never load a fresh copy and never reload for a dropped connection', async () => {
  const browser = installBrowserStubs();
  let calls = 0;
  await assert.rejects(
    helpers.importWithRecovery(async () => {
      calls += 1;
      throw chunkError();
    }),
    (error: any) => {
      assert.equal(error.name, 'LazyLoadConnectionError');
      assert.doesNotMatch(error.message, /https?:|assets\/|dynamically/);
      assert.match(error.message, /connection dropped/);
      assert.equal(helpers.isLazyImportLoadError(error), true);
      assert.equal(error.cause?.message.includes(CHUNK), true);
      return true;
    }
  );
  // retrying the importer would only get the kept failure back (review r2)
  assert.equal(calls, 1);
  assert.deepEqual(browser.replaced, [], 'typed work is never dropped');
});

test('a retry waits while the page is in the background', async () => {
  const browser = installBrowserStubs();
  const fresh = freshCopies([{ default: factory }]);
  let settled = false;
  const loading = helpers
    .importWithRecovery(async () => {
      browser.setVisibility('hidden');
      throw chunkError();
    }, fresh.options)
    .then((value) => {
      settled = true;
      return value;
    });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert.deepEqual(fresh.requested, [], 'no retry while hidden');
  assert.equal(settled, false);
  browser.setVisibility('visible');
  assert.deepEqual(await loading, { default: factory });
  assert.equal(fresh.requested.length, 1);
});

test('a chunk a newer deploy removed still reloads (capped)', async () => {
  const browser = installBrowserStubs({ chunkStatus: 404 });
  helpers
    .importWithRecovery(async () => {
      throw chunkError();
    })
    .catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(browser.replaced.length, 1);
  assert.match(browser.replaced[0], /_twinkleLazyImportReload=\d+/);
});

test('a reload that never happens (Stay on "Leave site?") fails in plain words', async () => {
  const browser = installBrowserStubs({ chunkStatus: 404 });
  const started = Date.now();
  await assert.rejects(
    helpers.importWithRecovery(async () => {
      throw chunkError();
    }),
    (error: any) => error.name === 'LazyLoadConnectionError'
  );
  assert.equal(browser.replaced.length, 1, 'the reload was asked for');
  assert.ok(Date.now() - started >= 14_000, 'after the overlay gives up');
});

test('the raw recover call never reloads for a dropped connection', async () => {
  const browser = installBrowserStubs();
  // Header/index.tsx passes request failures straight in
  assert.equal(await helpers.recoverFromLazyImportLoadError(chunkError()), false);
  assert.equal(
    await helpers.recoverFromLazyImportLoadError(
      new helpers.LazyLoadConnectionError(chunkError())
    ),
    false
  );
  assert.deepEqual(browser.replaced, []);
});

test('the stale check accepts the deployment asset origin', () => {
  const source = readFileSync(
    new URL('../src/helpers/lazyImportHelpers.ts', import.meta.url),
    'utf8'
  );
  assert.match(source, /if \(!isOwnAssetOrigin\(url\.origin\)\) return false;/);
  assert.match(source, /new URL\(import\.meta\.url\)\.origin/);
  assert.doesNotMatch(source, /url\.origin !== window\.location\.origin/);
});

test('request helpers check the fresh copy and never keep a failure', () => {
  const source = readFileSync(
    new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
    'utf8'
  );
  assert.match(
    source,
    /importWithRecovery\(helperModuleLoaders\[moduleName\], \{\s*isUsable: isRequestHelperModule\s*\}\)/m
  );
  assert.match(source, /return typeof factory === 'function';/);
  assert.match(
    source,
    /loading\.catch\(\(\) => \{\s*if \(loadedModules\[moduleName\] === loading\) \{\s*delete loadedModules\[moduleName\];/m
  );
});
