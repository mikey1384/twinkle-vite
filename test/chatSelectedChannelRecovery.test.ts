import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  clearTerminalChatRecovery,
  getTerminalChatRecoveryState,
  installCanonicalChatRebuildHandler,
  publishTerminalChatRecovery,
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
      recoveryId: 'chat-recovery-1788147000000-1',
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
          recoveryId: 'chat-recovery-1788147000000-1',
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
      recoveryId: 'chat-recovery-1788147000000-2',
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
      recoveryId: 'chat-recovery-1788147000000-2',
      reason: 'request_failure',
      userId: 11
    }),
    false
  );
});

test('terminal recovery state remains isolated by account and channel', () => {
  const first = {
    channelId: 7,
    failedAttempts: 4,
    occurredAt: 1788147000000,
    recoveryId: 'chat-recovery-1788147000000-3',
    reason: 'bootstrap_retry_exhausted' as const,
    userId: 11
  };
  const second = {
    channelId: 8,
    failedAttempts: 3,
    occurredAt: 1788147000001,
    recoveryId: 'chat-recovery-1788147000001-4',
    reason: 'canonical_rebuild_unavailable' as const,
    userId: 11
  };
  const otherUser = {
    ...first,
    recoveryId: 'chat-recovery-1788147000002-5',
    userId: 12
  };

  publishTerminalChatRecovery(first);
  publishTerminalChatRecovery(second);
  publishTerminalChatRecovery(otherUser);
  assert.deepEqual(
    getTerminalChatRecoveryState({ channelId: 7, userId: 11 }),
    first
  );
  assert.deepEqual(
    getTerminalChatRecoveryState({ channelId: 8, userId: 11 }),
    second
  );
  assert.deepEqual(
    getTerminalChatRecoveryState({ channelId: 7, userId: 12 }),
    otherUser
  );

  clearTerminalChatRecovery({ channelId: 7, userId: 11 });
  assert.equal(
    getTerminalChatRecoveryState({ channelId: 7, userId: 11 }),
    null
  );
  assert.deepEqual(
    getTerminalChatRecoveryState({ channelId: 8, userId: 11 }),
    second
  );
  assert.deepEqual(
    getTerminalChatRecoveryState({ channelId: 7, userId: 12 }),
    otherUser
  );
  clearTerminalChatRecovery({ userId: 11 });
  clearTerminalChatRecovery({ userId: 12 });

  assert.match(
    messagesSource,
    /function handleRetryChatRecovery\(\)[\s\S]*?requestCanonicalChatRebuild\([\s\S]*?if \(!rebuildAccepted\) return;[\s\S]*?clearTerminalChatRecovery/
  );
  assert.doesNotMatch(messagesSource, /setChatRecoveryEpoch/);
});
