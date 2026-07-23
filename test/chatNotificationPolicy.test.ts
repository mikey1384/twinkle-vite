import assert from 'node:assert/strict';
import test from 'node:test';
import {
  shouldShowBackgroundAiReplyNotification,
  shouldShowBackgroundChatMessageNotification
} from '../src/helpers/chatNotificationPolicy';
import type {
  BackgroundGroupNotificationMode,
  ChatNotificationSettings
} from '../src/types/chat';

function createSettings({
  backgroundDirectMessages = true,
  backgroundGroupMode = 'all',
  backgroundAiReplies = true,
  mutedChannelIds = []
}: {
  backgroundDirectMessages?: boolean;
  backgroundGroupMode?: BackgroundGroupNotificationMode;
  backgroundAiReplies?: boolean;
  mutedChannelIds?: number[];
} = {}): ChatNotificationSettings {
  return {
    userId: 7,
    preferences: {
      backgroundDirectMessages,
      backgroundGroupMode,
      backgroundAiReplies,
      closedDirectMessages: true,
      closedGroupMentions: true
    },
    mutedChannelIds,
    mutedConversations: []
  };
}

test('background notifications wait for the current account settings', () => {
  assert.equal(
    shouldShowBackgroundChatMessageNotification({
      channel: { twoPeople: true },
      message: { channelId: 12 },
      settings: null,
      userId: 7
    }),
    false
  );
  assert.equal(
    shouldShowBackgroundChatMessageNotification({
      channel: { twoPeople: true },
      message: { channelId: 12 },
      settings: createSettings(),
      userId: 8
    }),
    false
  );
});

test('background direct-message preference and mute are both enforced', () => {
  assert.equal(
    shouldShowBackgroundChatMessageNotification({
      channel: { twoPeople: true },
      message: { channelId: 12 },
      settings: createSettings({ backgroundDirectMessages: false }),
      userId: 7
    }),
    false
  );
  assert.equal(
    shouldShowBackgroundChatMessageNotification({
      channel: { twoPeople: true },
      message: { channelId: 12 },
      settings: createSettings({ mutedChannelIds: [12] }),
      userId: 7
    }),
    false
  );
});

test('background group modes distinguish all messages, mentions, and off', () => {
  const message = { channelId: 18, mentionedUserIds: [7] };
  for (const [backgroundGroupMode, expected] of [
    ['all', true],
    ['mentions', true],
    ['off', false]
  ] as const) {
    assert.equal(
      shouldShowBackgroundChatMessageNotification({
        channel: { twoPeople: false },
        message,
        settings: createSettings({ backgroundGroupMode }),
        userId: 7
      }),
      expected
    );
  }
  assert.equal(
    shouldShowBackgroundChatMessageNotification({
      channel: { twoPeople: false },
      message: { channelId: 18, mentionedUserIds: [9] },
      settings: createSettings({ backgroundGroupMode: 'mentions' }),
      userId: 7
    }),
    false
  );
});

test('AI reply preference and conversation mute are both enforced', () => {
  assert.equal(
    shouldShowBackgroundAiReplyNotification({
      channelId: 21,
      settings: createSettings({ backgroundAiReplies: false }),
      userId: 7
    }),
    false
  );
  assert.equal(
    shouldShowBackgroundAiReplyNotification({
      channelId: 21,
      settings: createSettings({ mutedChannelIds: [21] }),
      userId: 7
    }),
    false
  );
  assert.equal(
    shouldShowBackgroundAiReplyNotification({
      channelId: 21,
      settings: createSettings(),
      userId: 7
    }),
    true
  );
});
