import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// requestHelpers are lazy-loaded per module, and index.ts hand-maintains the
// list of method names that maps a call to the module owning it. A helper that
// is written but never listed does not fail to compile and does not fail to
// lint — it resolves to undefined at the call site and throws
// "x is not a function" the first time a user presses the button.
//
// Checked against the source text rather than by importing the modules because
// they reach import.meta.env, which does not exist outside Vite. The registry
// is itself a textual mirror of these files, so text is the right level.
const HELPERS_DIR = join(process.cwd(), 'src/contexts/requestHelpers');

function readRegisteredMethodNames(indexSource: string, moduleName: string) {
  const start = indexSource.indexOf(`registerMethods('${moduleName}'`);
  if (start < 0) return null;
  const block = indexSource.slice(start);
  const end = block.indexOf(']);');
  assert.notEqual(end, -1, `registerMethods('${moduleName}') block is unterminated`);
  const names = [...block.slice(0, end).matchAll(/'([A-Za-z0-9_]+)'/g)].map(
    (match) => match[1]
  );
  // The first quoted string in the block is the module name itself.
  return new Set(names.slice(1));
}

function readDefinedMethodNames(moduleSource: string) {
  // Methods of the returned helpers object, which sits at one indent level.
  return new Set(
    [...moduleSource.matchAll(/^ {4}(?:async )?([A-Za-z0-9_]+)\(/gm)].map(
      (match) => match[1]
    )
  );
}

test('every request helper is registered to its module', () => {
  const indexSource = readFileSync(join(HELPERS_DIR, 'index.ts'), 'utf8');
  const moduleFiles = readdirSync(HELPERS_DIR).filter(
    (file) => file.endsWith('.ts') && file !== 'index.ts'
  );
  assert.ok(moduleFiles.length > 0, 'no request helper modules found');

  const unregistered: string[] = [];
  for (const file of moduleFiles) {
    const moduleName = file.replace(/\.ts$/, '');
    const registered = readRegisteredMethodNames(indexSource, moduleName);
    if (!registered) continue;
    const defined = readDefinedMethodNames(
      readFileSync(join(HELPERS_DIR, file), 'utf8')
    );
    for (const methodName of defined) {
      if (!registered.has(methodName)) {
        unregistered.push(`${moduleName}.${methodName}`);
      }
    }
  }

  assert.deepEqual(
    unregistered,
    [],
    `these helpers would throw "is not a function" when called; add them to registerMethods in requestHelpers/index.ts: ${unregistered.join(
      ', '
    )}`
  );
});

test('the registry does not list helpers that no longer exist', () => {
  // The other direction. A stale name routes a call to a module that will not
  // answer it, which fails the same way and is just as invisible.
  const indexSource = readFileSync(join(HELPERS_DIR, 'index.ts'), 'utf8');
  const moduleFiles = readdirSync(HELPERS_DIR).filter(
    (file) => file.endsWith('.ts') && file !== 'index.ts'
  );

  const stale: string[] = [];
  for (const file of moduleFiles) {
    const moduleName = file.replace(/\.ts$/, '');
    const registered = readRegisteredMethodNames(indexSource, moduleName);
    if (!registered) continue;
    const defined = readDefinedMethodNames(
      readFileSync(join(HELPERS_DIR, file), 'utf8')
    );
    for (const methodName of registered) {
      if (!defined.has(methodName)) {
        stale.push(`${moduleName}.${methodName}`);
      }
    }
  }

  assert.deepEqual(stale, [], `stale registry entries: ${stale.join(', ')}`);
});
