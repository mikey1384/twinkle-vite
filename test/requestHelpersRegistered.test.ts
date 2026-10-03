import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// The request helpers are looked up by name at runtime, so TypeScript does not
// notice a helper that is registered (or used) but no longer defined: the
// button just fails when pressed. These checks read the sources as text.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const HELPERS_DIR = path.join(HERE, '..', 'src', 'contexts', 'requestHelpers');
const SRC_DIR = path.join(HERE, '..', 'src');

function helperSources() {
  return fs
    .readdirSync(HELPERS_DIR)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    .map((file) => fs.readFileSync(path.join(HELPERS_DIR, file), 'utf8'))
    .join('\n');
}

function registeredNames() {
  const index = fs.readFileSync(path.join(HELPERS_DIR, 'index.ts'), 'utf8');
  return [...index.matchAll(/^\s*'([A-Za-z0-9_]+)',?\s*$/gm)].map((match) => match[1]);
}

function isDefined(source: string, name: string) {
  return new RegExp(`(^|\\n)\\s*(async\\s+)?${name}\\s*(\\(|:|<)`).test(source);
}

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('every registered request helper is defined', () => {
  const source = helperSources();
  const names = registeredNames();
  assert.ok(names.length > 100, 'the registry list was read');
  const missing = names.filter((name) => !isDefined(source, name));
  assert.deepEqual(missing, [], `registered but not defined: ${missing.join(', ')}`);
});

test('every request helper a component uses is registered and defined', () => {
  const source = helperSources();
  // auth is the one helper index.ts defines itself (baseHelpers)
  const registered = new Set([...registeredNames(), 'auth']);
  const used = new Map<string, string>();
  for (const file of walk(SRC_DIR)) {
    if (file.startsWith(HELPERS_DIR)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/requestHelpers\.([A-Za-z0-9_]+)/g)) {
      if (!used.has(match[1])) used.set(match[1], path.relative(SRC_DIR, file));
    }
  }
  const problems = [...used]
    .filter(([name]) => !registered.has(name) || (name !== 'auth' && !isDefined(source, name)))
    .map(([name, file]) => `${name} (${file}): ${registered.has(name) ? 'not defined' : 'not registered'}`);
  assert.deepEqual(problems, []);
});
