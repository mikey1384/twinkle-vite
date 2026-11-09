import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  hasRecentLazyImportReload,
  isTruncatedScriptError,
  LAZY_CHUNK_UNRECOVERABLE_MARKER,
  wasOpenedByLazyImportReload
} from '../src/helpers/lazyChunkErrors';

function syntaxError(message: string) {
  const error = new Error(message);
  error.name = 'SyntaxError';
  return error;
}

test('a lazy chunk cut off mid-download is recognized in each browser wording', () => {
  assert.equal(
    isTruncatedScriptError(syntaxError('Unexpected end of script')),
    true
  );
  assert.equal(
    isTruncatedScriptError(syntaxError('Unexpected end of input')),
    true
  );
  assert.equal(
    isTruncatedScriptError(
      syntaxError('expected expression, got end of script')
    ),
    true
  );
  assert.equal(isTruncatedScriptError('Unexpected end of script'), true);
  // not a truncated chunk
  assert.equal(
    isTruncatedScriptError(syntaxError('Unexpected end of JSON input')),
    false
  );
  assert.equal(
    isTruncatedScriptError(syntaxError('JSON Parse error: Unexpected EOF')),
    false
  );
  const typeError = new TypeError('Unexpected end of input');
  assert.equal(isTruncatedScriptError(typeError), false);
});

test('the reload param stops a loop even without sessionStorage', () => {
  const now = 1_800_000_000_000;
  const base = 'https://www.twin-kle.com/app/2813?viewSource=x';
  assert.equal(hasRecentLazyImportReload(base, now), false);
  assert.equal(
    hasRecentLazyImportReload(
      `${base}&_twinkleLazyImportReload=${now - 4_000}`,
      now
    ),
    true
  );
  assert.equal(
    hasRecentLazyImportReload(
      `${base}&_twinkleLazyImportReload=${now - 120_000}`,
      now
    ),
    false
  );
  assert.equal(hasRecentLazyImportReload('not a url', now), false);
  // a future timestamp (another device's clock) does not block recovery
  assert.equal(
    hasRecentLazyImportReload(
      `${base}&_twinkleLazyImportReload=${now + 30_000}`,
      now
    ),
    false
  );
  assert.equal(
    wasOpenedByLazyImportReload(
      `${base}&_twinkleLazyImportReload=${now - 5_000}`,
      now
    ),
    true
  );
  // an old bookmarked param is not a recent recovery reload
  assert.equal(
    wasOpenedByLazyImportReload(`${base}&_twinkleLazyImportReload=1`, now),
    false
  );
  assert.equal(wasOpenedByLazyImportReload(base, now), false);
});

const helpers = readFileSync(
  new URL('../src/helpers/lazyImportHelpers.ts', import.meta.url),
  'utf8'
);
const boundary = readFileSync(
  new URL('../src/components/ErrorBoundary.tsx', import.meta.url),
  'utf8'
);

test('a truncated chunk reloads at once, capped, never twice in a minute', () => {
  assert.match(
    helpers,
    /confirmedStaleOnly: canRetry && !truncated/
  );
  assert.match(
    helpers,
    /if \(isTruncatedScriptError\(error\)\) \{\s*if \(confirmedStaleOnly\) return null;\s*reason = 'truncated';/m
  );
  // every reload kind, truncated included, is held off by the URL param
  assert.match(
    helpers,
    /if \(hasRecentLazyImportReload\(window\.location\.href\)\) return null;/
  );
  assert.match(helpers, /LAZY_IMPORT_MAX_RELOADS_PER_PATH = 2/);
  assert.match(
    helpers,
    /export function isLazyImportLoadError[\s\S]*?isTruncatedScriptError\(error\) \|\|/m
  );
});

test('still failing after its reload, the boundary reports past the suppression', () => {
  assert.equal(LAZY_CHUNK_UNRECOVERABLE_MARKER, '[lazy-chunk-unrecoverable]');
  assert.match(
    boundary,
    /truncatedChunk &&\s*!isLocalDevelopmentRuntime\(\) &&\s*wasOpenedByLazyImportReload\(window\.location\.href\)[\s\S]*?\$\{LAZY_CHUNK_UNRECOVERABLE_MARKER\}/m
  );
  assert.match(boundary, /title="Didn't Finish Loading"/);
  // a chunk the connection kept from loading gets the same notice, not
  // "Update Available"
  assert.match(
    boundary,
    /lastErrorDidNotFinishLoading:\s*truncatedChunk \|\| isLazyLoadConnectionError\(error\)/m
  );
});

test('a new deploy is read from entry scripts, not runtime preload links', async () => {
  const { extractEntryScriptPaths } = await import(
    '../src/helpers/lazyChunkErrors'
  );
  const origin = 'https://twinkle-vite-lpsrq0dor-twinkle-747b4379.vercel.app';
  const deployed = `<head><script defer src="/js/load-image.all.min.js"></script>
<script type="module" crossorigin src="${origin}/assets/index--O4sFU0u.js"></script>
<link rel="modulepreload" crossorigin href="${origin}/assets/index-BRarbbeP.js"></head>`;
  // the running page: same entry, plus preload links Vite added at runtime
  const running = deployed.replace(
    '</head>',
    `<link rel="modulepreload" href="${origin}/assets/content-CA8FY4Cc.js"></head>`
  );
  assert.deepEqual(extractEntryScriptPaths(deployed), [
    '/assets/index--O4sFU0u.js'
  ]);
  assert.deepEqual(
    extractEntryScriptPaths(running),
    extractEntryScriptPaths(deployed)
  );
  // a redeploy: new entry hash on a new deployment origin
  const next = deployed
    .replace(origin, 'https://twinkle-vite-abc-twinkle.vercel.app')
    .replace('index--O4sFU0u.js', 'index-Kji1Dzzc.js');
  assert.notDeepEqual(
    extractEntryScriptPaths(next),
    extractEntryScriptPaths(running)
  );
});
