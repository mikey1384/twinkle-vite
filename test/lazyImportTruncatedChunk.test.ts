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
    /confirmedStaleOnly: !isFinalAttempt && !isTruncatedScriptError\(error\)/
  );
  assert.match(
    helpers,
    /if \(isTruncatedScriptError\(error\)\) \{[\s\S]*?if \(confirmedStaleOnly\) return false;\s*if \(hasRecentLazyImportReload\(window\.location\.href\)\) return false;\s*\} else if \(failedUrl\) \{/m
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
});
