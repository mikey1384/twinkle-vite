import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getDefaultRequestCollapseKey } from '../src/contexts/requestHelpers/axiosInstance/requestCollapseKey';

test('GET collapsing is isolated by interactive and Build API authorization', () => {
  const baseRequest = {
    method: 'GET',
    url: 'https://api.twinkle.network/user/session',
    params: { include: 'state' }
  };
  const first = getDefaultRequestCollapseKey(
    {
      ...baseRequest,
      headers: {
        Authorization: 'interactive-a',
        'x-build-api-token': 'build-a'
      }
    },
    true
  );
  const sameIdentity = getDefaultRequestCollapseKey(
    {
      ...baseRequest,
      headers: {
        authorization: 'interactive-a',
        'X-Build-Api-Token': 'build-a'
      }
    },
    true
  );
  const nextLogin = getDefaultRequestCollapseKey(
    {
      ...baseRequest,
      headers: {
        authorization: 'interactive-b',
        'x-build-api-token': 'build-a'
      }
    },
    true
  );
  const refreshedBuildToken = getDefaultRequestCollapseKey(
    {
      ...baseRequest,
      headers: {
        authorization: 'interactive-a',
        'x-build-api-token': 'build-b'
      }
    },
    true
  );

  assert.equal(first, sameIdentity);
  assert.notEqual(first, nextLogin);
  assert.notEqual(first, refreshedBuildToken);
});

test('non-GET and explicitly disabled requests are never collapsed', () => {
  assert.equal(
    getDefaultRequestCollapseKey(
      { method: 'POST', url: 'https://api.twinkle.network/user/session' },
      true
    ),
    null
  );
  assert.equal(
    getDefaultRequestCollapseKey(
      { method: 'GET', url: 'https://api.twinkle.network/user/session' },
      false
    ),
    null
  );
});

test('the scheduler uses the authorization-aware default key', () => {
  const scheduler = readFileSync(
    new URL(
      '../src/contexts/requestHelpers/axiosInstance/requestScheduler.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    scheduler,
    /return getDefaultRequestCollapseKey\(config, this\.policy\.collapseGet\)/
  );
  assert.match(
    scheduler,
    /this\.inflight\.get\(collapseKey\) === promise/
  );
});
