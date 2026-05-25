import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Build notification subscription writes are transition-safe preview requests', () => {
  const policySource = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy.ts',
      import.meta.url
    ),
    'utf8'
  );
  const bridgeSource = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    policySource,
    /'notifications:subscribe-subject-updates'/
  );
  assert.match(
    policySource,
    /'notifications:unsubscribe-subject-updates'/
  );
  assert.match(
    bridgeSource,
    /case 'notifications:get-subject-update-subscription':[\s\S]*\['notifications:read'\]/
  );
  assert.match(
    bridgeSource,
    /case 'notifications:subscribe-subject-updates':[\s\S]*\['notifications:write'\][\s\S]*subscribeToBuildSubjectUpdatesRef/
  );
  assert.match(
    bridgeSource,
    /case 'notifications:unsubscribe-subject-updates':[\s\S]*\['notifications:write'\][\s\S]*unsubscribeFromBuildSubjectUpdatesRef/
  );
});
