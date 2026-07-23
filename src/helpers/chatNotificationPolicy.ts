import type { ChatNotificationSettings } from '~/types/chat';

export function shouldShowBackgroundChatMessageNotification({
  channel,
  message,
  settings,
  userId
}: {
  channel: { twoPeople?: boolean | number } | null | undefined;
  message: {
    channelId?: number;
    mentionedUserIds?: number[];
  };
  settings: ChatNotificationSettings | null;
  userId: number;
}) {
  if (!hasCurrentSettings(settings, userId)) return false;
  const channelId = Number(message.channelId || 0);
  if (!channelId || settings.mutedChannelIds.includes(channelId)) return false;

  if (channel?.twoPeople) {
    return settings.preferences.backgroundDirectMessages;
  }

  if (settings.preferences.backgroundGroupMode === 'off') return false;
  if (settings.preferences.backgroundGroupMode === 'all') return true;
  return (message.mentionedUserIds || []).some(
    (mentionedUserId) => Number(mentionedUserId) === Number(userId)
  );
}

export function shouldShowBackgroundAiReplyNotification({
  channelId,
  settings,
  userId
}: {
  channelId: number;
  settings: ChatNotificationSettings | null;
  userId: number;
}) {
  return Boolean(
    hasCurrentSettings(settings, userId) &&
      settings.preferences.backgroundAiReplies &&
      !settings.mutedChannelIds.includes(Number(channelId))
  );
}

function hasCurrentSettings(
  settings: ChatNotificationSettings | null,
  userId: number
): settings is ChatNotificationSettings {
  return Boolean(settings && Number(settings.userId) === Number(userId));
}
