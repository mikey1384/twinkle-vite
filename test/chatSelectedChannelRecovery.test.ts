import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  installCanonicalChatRebuildHandler,
  requestCanonicalChatRebuild,
  SELECTED_CHANNEL_RECOVERY_FAILURES_BEFORE_REBUILD,
  shouldEscalateSelectedChannelRecovery
} from '../src/helpers/chatSelectedChannelRecovery';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const messagesSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/index.tsx'
);
const bootstrapSource = readSource(
  'src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
);

test('continuous selected-channel activity escalates instead of retrying forever', () => {
  let targetedRetries = 0;
  let rebuildRequests = 0;
  const removeHandler = installCanonicalChatRebuildHandler((request) => {
    rebuildRequests += 1;
    assert.deepEqual(request, {
      channelId: 7,
      failedAttempts: SELECTED_CHANNEL_RECOVERY_FAILURES_BEFORE_REBUILD,
      reason: 'projection_activity_race',
      userId: 11
    });
    return true;
  });

  for (
    let failedAttempts = 1;
    failedAttempts <= SELECTED_CHANNEL_RECOVERY_FAILURES_BEFORE_REBUILD;
    failedAttempts += 1
  ) {
    if (shouldEscalateSelectedChannelRecovery(failedAttempts)) {
      assert.equal(
        requestCanonicalChatRebuild({
          channelId: 7,
          failedAttempts,
          reason: 'projection_activity_race',
          userId: 11
        }),
        true
      );
      break;
    }
    targetedRetries += 1;
  }

  removeHandler();
  assert.equal(targetedRetries, 2);
  assert.equal(rebuildRequests, 1);
  assert.match(
    messagesSource,
    /failedAttempts \+= 1[\s\S]*?shouldEscalateSelectedChannelRecovery\(failedAttempts\)[\s\S]*?requestCanonicalChatRebuild\([\s\S]*?if \(rebuildAccepted\) return;[\s\S]*?2 \*\* \(failedAttempts - 1\)/
  );
  assert.match(
    bootstrapSource,
    /installCanonicalChatRebuildHandler\([\s\S]*?fromWriter: true,[\s\S]*?replaceSelectedProjection: true/
  );
  assert.match(
    bootstrapSource,
    /const bootstrapChannelId = replaceSelectedProjection[\s\S]*?\? selectedChannelId[\s\S]*?: hasRoutePathId/
  );
  assert.match(
    bootstrapSource,
    /scheduleLoadChatRetry\(\{[\s\S]*?replaceSelectedProjection[\s\S]*?function scheduleLoadChatRetry\(\{[\s\S]*?replaceSelectedProjection = false[\s\S]*?handleLoadChat\(\{[\s\S]*?replaceSelectedProjection/
  );
});

test('a stale handler cleanup cannot remove the current bootstrap owner', () => {
  const removeFirst = installCanonicalChatRebuildHandler(() => false);
  const removeCurrent = installCanonicalChatRebuildHandler(() => true);
  removeFirst();

  assert.equal(
    requestCanonicalChatRebuild({
      channelId: 7,
      failedAttempts: 3,
      reason: 'request_failure',
      userId: 11
    }),
    true
  );
  removeCurrent();
  assert.equal(
    requestCanonicalChatRebuild({
      channelId: 7,
      failedAttempts: 3,
      reason: 'request_failure',
      userId: 11
    }),
    false
  );
});
