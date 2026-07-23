import type { ChatNotificationSettings } from '../../types/chat';

export function shouldApplyChatNotificationSettings({
  currentSettings,
  incomingSettings
}: {
  currentSettings: ChatNotificationSettings | null;
  incomingSettings: ChatNotificationSettings | null;
}) {
  if (!incomingSettings || !currentSettings) return true;
  if (Number(incomingSettings.userId) !== Number(currentSettings.userId)) {
    return false;
  }

  const currentRevision = normalizeRevision(currentSettings.revision);
  const incomingRevision = normalizeRevision(incomingSettings.revision);
  if (incomingRevision == null) return false;
  if (currentRevision == null) return true;
  return incomingRevision > currentRevision;
}

function normalizeRevision(value: unknown) {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : null;
}
