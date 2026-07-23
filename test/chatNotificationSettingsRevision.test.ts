import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChatNotificationSettings } from '../src/types/chat';
import { shouldApplyChatNotificationSettings } from '../src/contexts/Chat/notificationSettingsRevision';

test('notification settings reject older and duplicate snapshots', () => {
  const currentSettings = createSettings({ userId: 41, revision: 7 });

  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings,
      incomingSettings: createSettings({ userId: 41, revision: 6 })
    }),
    false
  );
  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings,
      incomingSettings: createSettings({ userId: 41, revision: 7 })
    }),
    false
  );
  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings,
      incomingSettings: createSettings({ userId: 41, revision: 8 })
    }),
    true
  );
});

test('notification settings require a reset before accepting a new user', () => {
  const currentSettings = createSettings({ userId: 41, revision: 7 });

  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings,
      incomingSettings: null
    }),
    true
  );
  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings: null,
      incomingSettings: createSettings({ userId: 41, revision: 1 })
    }),
    true
  );
  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings,
      incomingSettings: createSettings({ userId: 42, revision: 1 })
    }),
    false
  );
});

test('unversioned arrivals cannot replace versioned settings', () => {
  assert.equal(
    shouldApplyChatNotificationSettings({
      currentSettings: createSettings({ userId: 41, revision: 2 }),
      incomingSettings: createSettings({
        userId: 41,
        revision: undefined as unknown as number
      })
    }),
    false
  );
});

function createSettings({
  userId,
  revision
}: {
  userId: number;
  revision: number;
}): ChatNotificationSettings {
  return {
    userId,
    revision,
    preferences: {
      backgroundDirectMessages: true,
      backgroundGroupMode: 'all',
      backgroundAiReplies: true,
      closedDirectMessages: true,
      closedGroupMentions: true
    },
    mutedChannelIds: [],
    mutedConversations: []
  };
}
