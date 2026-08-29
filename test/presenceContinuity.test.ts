import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createPresenceContinuityState } from '../src/helpers/presenceContinuity';

test('a cold page bind carries identity and visibility without claiming continuity', () => {
  const continuity = createPresenceContinuityState({
    pageSessionId: 'web-page:cold'
  });

  assert.deepEqual(
    continuity.getBindMetadata({ userId: 42, visible: true }),
    {
      presenceSessionId: 'web-page:cold',
      presenceVisible: true
    }
  );
});

test('only a canonical server proof is returned to the same user in the same page', () => {
  const continuity = createPresenceContinuityState({
    pageSessionId: 'web-page:qualified'
  });

  continuity.recordCanonicalProof({
    expiresAt: 2_000,
    userId: 42,
    token: 'server-issued-proof'
  });

  assert.deepEqual(
    continuity.getBindMetadata({ userId: 42, visible: false }),
    {
      presenceSessionId: 'web-page:qualified',
      presenceVisible: false,
      presenceContinuityToken: 'server-issued-proof'
    }
  );
  assert.deepEqual(
    continuity.getBindMetadata({ userId: 43, visible: true }),
    {
      presenceSessionId: 'web-page:qualified',
      presenceVisible: true
    }
  );
});

test('account transitions clear page-lifetime continuity', () => {
  const continuity = createPresenceContinuityState({
    pageSessionId: 'web-page:logout'
  });
  continuity.recordCanonicalProof({
    expiresAt: 2_000,
    userId: 42,
    token: 'proof'
  });
  continuity.clear();

  assert.deepEqual(
    continuity.getBindMetadata({ userId: 42, visible: true }),
    {
      presenceSessionId: 'web-page:logout',
      presenceVisible: true
    }
  );
});

test('a delayed older server proof cannot replace newer continuity', () => {
  const continuity = createPresenceContinuityState({
    pageSessionId: 'web-page:ordered'
  });
  assert.equal(
    continuity.recordCanonicalProof({
      expiresAt: 3_000,
      userId: 42,
      token: 'newer-proof'
    }),
    true
  );
  assert.equal(
    continuity.recordCanonicalProof({
      expiresAt: 2_000,
      userId: 42,
      token: 'older-proof'
    }),
    false
  );
  assert.deepEqual(
    continuity.getBindMetadata({ userId: 42, visible: true }),
    {
      presenceSessionId: 'web-page:ordered',
      presenceVisible: true,
      presenceContinuityToken: 'newer-proof'
    }
  );
});

test('handshake and bind both carry continuity while snapshots wait for bind', () => {
  const continuitySource = readFileSync(
    path.resolve(process.cwd(), 'src/helpers/presenceContinuity.ts'),
    'utf8'
  );
  const socketSingletonSource = readFileSync(
    path.resolve(process.cwd(), 'src/constants/sockets/api.ts'),
    'utf8'
  );
  const socketInitSource = readFileSync(
    path.resolve(
      process.cwd(),
      'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
    ),
    'utf8'
  );
  const bindStart = socketInitSource.indexOf('function bindSocketToUser');
  const bindSource = socketInitSource.slice(
    bindStart,
    socketInitSource.indexOf(
      'function handleSocketBindFailure',
      bindStart
    )
  );

  assert.match(
    socketSingletonSource,
    /getPresenceContinuityBindMetadata\(userId\)/
  );
  assert.match(
    bindSource,
    /getPresenceContinuityBindMetadata\(bindingUserId\)/
  );
  assert.match(
    socketInitSource,
    /presence_continuity_updated[\s\S]*recordCanonicalPresenceContinuity/
  );
  assert.match(
    bindSource,
    /result\?\.presenceQualified === true[\s\S]*hydrateOnlinePresence\(bindingUserId\)/
  );
  assert.doesNotMatch(continuitySource, /localStorage|sessionStorage/);
});
