import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Request helpers are loaded lazily through a name registry. A helper that is
// implemented but not listed there resolves to undefined, so its caller throws
// inside whatever try/catch surrounds it and the feature silently never works
// (the app-cover tabs shipped that way in 2.2.46). The helpers are typed as
// Record<string, any>, so nothing else catches this.
const MODULES = [
  'build',
  'chat',
  'chess',
  'community',
  'content',
  'interactive',
  'management',
  'mission',
  'notification',
  'user',
  'zero'
];

test('every request helper a module implements is registered for lazy access', () => {
  const registrySource = readFileSync(
    new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
    'utf8'
  );
  const missing = [];
  for (const moduleName of MODULES) {
    const block = registrySource.match(
      new RegExp(`registerMethods\\('${moduleName}', \\[([\\s\\S]*?)\\]\\);`)
    );
    assert(block, `${moduleName} request-helper registry must exist`);
    const registered = new Set(
      [...block[1].matchAll(/['"]([A-Za-z0-9_]+)['"]/g)].map((m) => m[1])
    );
    const source = readFileSync(
      new URL(`../src/contexts/requestHelpers/${moduleName}.ts`, import.meta.url),
      'utf8'
    );
    // Helpers are the four-space-indented async methods of the returned object.
    for (const [, helperName] of source.matchAll(/^ {4}async ([A-Za-z0-9_]+)\s*\(/gm)) {
      if (!registered.has(helperName)) missing.push(`${moduleName}.${helperName}`);
    }
  }
  assert.deepEqual(missing, [], `unregistered request helpers: ${missing.join(', ')}`);
});
