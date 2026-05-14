import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Build leaderboard request helpers are registered for lazy app context access', () => {
  const registrySource = readFileSync(
    new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
    'utf8'
  );
  const buildHelperSource = readFileSync(
    new URL('../src/contexts/requestHelpers/build.ts', import.meta.url),
    'utf8'
  );
  const buildRegistryBlockMatch = registrySource.match(
    /registerMethods\('build', \[([\s\S]*?)\]\);/
  );
  assert(buildRegistryBlockMatch, 'build request-helper registry must exist');
  const buildRegistryBlock = buildRegistryBlockMatch[1];

  for (const helperName of [
    'getBuildLeaderboard',
    'submitBuildLeaderboardScore'
  ]) {
    assert.match(
      buildHelperSource,
      new RegExp(`async\\s+${helperName}\\s*\\(`),
      `${helperName} must be implemented by the build request-helper module`
    );
    assert.match(
      buildRegistryBlock,
      new RegExp(`['"]${helperName}['"]`),
      `${helperName} must be listed in registerMethods('build', ...)`
    );
  }
});
