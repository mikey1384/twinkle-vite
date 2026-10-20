import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// lazyImportHelpers imports React/emotion constants; check the classifier and
// the reload rule from source like the other recovery contracts.
const source = readFileSync(
  new URL('../src/helpers/lazyImportHelpers.ts', import.meta.url),
  'utf8'
);

test('a lazy chunk cut off mid-download counts as a chunk load failure', () => {
  for (const message of [
    'Unexpected end of script',
    'Unexpected end of input',
    'got end of script'
  ]) {
    assert.ok(source.includes(`message.includes('${message}')`), message);
  }
  assert.match(
    source,
    /export function isLazyImportLoadError[\s\S]*?return \(\s*isTruncatedScriptError\(error\) \|\|/m
  );
  // JSON parse errors ("Unexpected end of JSON input") must not match
  assert.ok(
    !'Unexpected end of JSON input'.includes('Unexpected end of input')
  );
});

test('a truncated chunk may reload after the retries without a new deploy', () => {
  assert.match(
    source,
    /if \(isTruncatedScriptError\(error\)\) \{[\s\S]*?if \(confirmedStaleOnly\) return false;\s*\} else if \(failedUrl\) \{/m
  );
  // still behind the cooldown and per-path reload caps
  assert.match(source, /LAZY_IMPORT_MAX_RELOADS_PER_PATH = 2/);
});
