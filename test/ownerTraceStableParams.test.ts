import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';

// The wake profiler counts a request as a repeat by its exact text; params
// built with a different key order (at any depth) are the same request.
const path = fileURLToPath(
  new URL('../src/helpers/ownerTrace.ts', import.meta.url)
);
const output = buildSync({
  bundle: true,
  define: { 'import.meta.env': JSON.stringify({}) },
  entryPoints: [path],
  format: 'cjs',
  platform: 'node',
  write: false,
  logLevel: 'silent'
}).outputFiles[0].text;
const mod: { exports: any } = { exports: {} };
new Function('require', 'module', 'exports', output)(
  createRequire(path),
  mod,
  mod.exports
);
const { stableParams } = mod.exports;

test('params are keyed the same regardless of key order, nested objects included', () => {
  assert.equal(
    stableParams({ b: 1, a: { y: [2, { q: 1, p: 0 }], x: 1 } }),
    stableParams({ a: { x: 1, y: [2, { p: 0, q: 1 }] }, b: 1 })
  );
  assert.notEqual(stableParams({ a: { x: 1 } }), stableParams({ a: { x: 2 } }));
  assert.equal(stableParams(undefined), '');
});
