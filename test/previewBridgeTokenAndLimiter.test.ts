import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  selectCachedBuildApiToken,
  type BuildApiTokenState
} from '../src/containers/Build/PreviewPanel/helpers/previewBridgeTokenCache.ts';
import { RequestPriorityLimiters } from '../src/contexts/requestHelpers/axiosInstance/requestPriorityLimiters.ts';

test('selectCachedBuildApiToken keeps a broader valid cached token over a narrower late refresh', () => {
  const now = 1_800_000_000;
  const broader: BuildApiTokenState = {
    buildId: 2,
    userId: 5,
    token: 'tok-broad',
    scopes: ['privateDb:read', 'sharedDb:read', 'sharedDb:write'],
    expiresAt: now + 600
  };
  const narrower: BuildApiTokenState = {
    buildId: 2,
    userId: 5,
    token: 'tok-narrow',
    scopes: ['sharedDb:write'],
    expiresAt: now + 600
  };
  const disjoint: BuildApiTokenState = {
    buildId: 2,
    userId: 5,
    token: 'tok-other',
    scopes: ['notifications:read'],
    expiresAt: now + 600
  };

  assert.equal(selectCachedBuildApiToken(broader, narrower, now), broader);
  assert.equal(selectCachedBuildApiToken(broader, disjoint, now), disjoint);
  assert.equal(
    selectCachedBuildApiToken({ ...broader, expiresAt: now + 10 }, narrower, now),
    narrower
  );
  assert.equal(
    selectCachedBuildApiToken({ ...broader, buildId: 9 }, narrower, now),
    narrower
  );
  assert.equal(
    selectCachedBuildApiToken({ ...broader, userId: 7 }, narrower, now),
    narrower
  );
  assert.equal(selectCachedBuildApiToken(null, narrower, now), narrower);
});

test('ensureBuildApiToken evaluates post-await completion timestamp against cached token expiry', () => {
  const startedAt = 1_800_000_000;
  const completedAt = startedAt + 15;
  const expiringBroader: BuildApiTokenState = {
    buildId: 2,
    userId: 5,
    token: 'tok-broad-expiring',
    scopes: ['privateDb:read', 'sharedDb:read', 'sharedDb:write'],
    expiresAt: startedAt + 40
  };
  const freshNarrower: BuildApiTokenState = {
    buildId: 2,
    userId: 5,
    token: 'tok-narrow-fresh',
    scopes: ['sharedDb:write'],
    expiresAt: completedAt + 600
  };

  // Valid at startedAt, but past the 30s expiry margin by completedAt.
  assert.equal(
    selectCachedBuildApiToken(expiringBroader, freshNarrower, startedAt),
    expiringBroader
  );
  assert.equal(
    selectCachedBuildApiToken(expiringBroader, freshNarrower, completedAt),
    freshNarrower
  );

  const authSource = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/helpers/previewBridgeAuth.ts',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(
    authSource,
    /await\s+previewAuth\.getBuildApiTokenRef\.current\([\s\S]*?const\s+completedAt\s*=\s*Math\.floor\(Date\.now\(\)\s*\/\s*1000\);[\s\S]*?expiresAt:\s*result\.expiresAt\s*\|\|\s*completedAt\s*\+\s*600[\s\S]*?selectCachedBuildApiToken\([\s\S]*?nextToken,\s*completedAt\s*\)/
  );
});

test('RequestPriorityLimiters releases slots after resolved and rejected bursts so later reads proceed', async () => {
  const limiters = new RequestPriorityLimiters(2);
  const completed: string[] = [];

  const writes = Array.from({ length: 5 }, (_, index) =>
    limiters
      .run({
        priority: 'normal',
        task: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          if (index % 2 === 1) throw new Error(`write-${index}-failed`);
          completed.push(`write-${index}`);
          return index;
        }
      })
      .catch(() => 'failed')
  );

  const readPromise = limiters.run({
    priority: 'normal',
    task: async () => {
      completed.push('shared-db-entries');
      return 'entries-ok';
    }
  });

  const [writeResults, readResult] = await Promise.all([
    Promise.all(writes),
    readPromise
  ]);

  assert.equal(writeResults.length, 5);
  assert.equal(readResult, 'entries-ok');
  assert.ok(completed.includes('shared-db-entries'));
});
