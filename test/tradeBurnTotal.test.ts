import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildSync } from 'esbuild';

// defaultValues.ts reads import.meta.env at module scope, so bundle with a
// stubbed env the way the other website tests do.
function load(rel: string) {
  const entryPoint = path.resolve(rel);
  const output = buildSync({
    bundle: true,
    define: { 'import.meta.env': JSON.stringify({}) },
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod: { exports: any } = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    createRequire(entryPoint),
    mod,
    mod.exports
  );
  return mod.exports;
}

const { bundleBurnValueLabel } = load('src/containers/Chat/Trade/helpers/terms.ts');
const { returnCardBurnXP } = load('src/constants/defaultValues.ts');

const bundle = (cards: any[]) =>
  ({ coins: 0, cardIds: cards.map((c) => c.id), groupIds: [], builds: [], cards }) as any;

test('trade bundle shows the summed burn value of its cards', () => {
  const cards = [
    { id: 1, level: 1, quality: 'common' },
    { id: 2, level: 3, quality: 'rare' }
  ];
  const expected =
    returnCardBurnXP({ cardLevel: 1, cardQuality: 'common' }) +
    returnCardBurnXP({ cardLevel: 3, cardQuality: 'rare' });
  assert.equal(bundleBurnValueLabel(bundle(cards)), expected.toLocaleString('en-US'));
});

test('no cards means no burn value line', () => {
  assert.equal(
    bundleBurnValueLabel({ coins: 700000, cardIds: [], groupIds: [], builds: [] } as any),
    ''
  );
});
