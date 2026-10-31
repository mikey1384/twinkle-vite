import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Website version numbering (ruling 10-25): patch numbers stay below 100, so
// the release after x.y.99 is x.(y+1).0. A 2.x.100 bump must fail here.
test('website version patch number stays below 100', () => {
  const { version } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, `package.json version "${version}" must be x.y.z`);
  const patch = Number(match[3]);
  assert.ok(
    patch < 100,
    `package.json version ${version} has patch ${patch}; after x.y.99 the next release is x.(y+1).0`
  );
});
