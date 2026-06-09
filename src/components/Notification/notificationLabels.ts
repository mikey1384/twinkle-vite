export const DAILY_GOAL_COMPLETION_LABEL = 'daily goal completion';
export const DAILY_TASKS_BONUS_LABEL = 'Daily Tasks bonus';
export const SHARED_SYSTEM_PROMPT_LABEL = 'shared system prompt';

export function getNotificationContentTypeLabel({
  contentType,
  isTask = false,
  passType
}: {
  contentType?: string;
  isTask?: boolean;
  passType?: string;
}) {
  if (!contentType) return 'content';
  if (contentType === 'aiStory') return 'AI Story';
  if (contentType === 'url') return 'link';
  if (contentType === 'user') return 'profile';
  if (contentType === 'xpChange') return DAILY_GOAL_COMPLETION_LABEL;
  if (contentType === 'sharedTopic') return SHARED_SYSTEM_PROMPT_LABEL;
  if (contentType === 'dailyReflection') return 'reflection';
  if (contentType === 'pass') {
    return passType === 'achievement'
      ? 'achievement'
      : getMissionPassNotificationLabel(isTask);
  }
  if (contentType === 'missionPass') {
    return getMissionPassNotificationLabel(isTask);
  }
  if (contentType === 'achievementPass') return 'achievement';
  return humanizeNotificationIdentifier(contentType);
}

export function getRecommendationTargetLabel({
  rootTargetType,
  rootType,
  isTask = false
}: {
  rootTargetType?: string;
  rootType?: string;
  isTask?: boolean;
}) {
  if (rootType === 'xpChange') return DAILY_TASKS_BONUS_LABEL;
  if (rootType === 'dailyReflection') return 'daily reflection';
  if (rootType === 'pass') {
    return rootTargetType === 'achievement'
      ? 'achievement'
      : isTask
        ? 'task accomplishment'
        : 'mission accomplishment';
  }
  return getNotificationContentTypeLabel({
    contentType: rootType,
    isTask,
    passType: rootTargetType
  });
}

export function shouldShowNotificationContentDetail(contentType?: string) {
  return contentType !== 'xpChange';
}

function getMissionPassNotificationLabel(isTask: boolean) {
  return isTask ? 'task accomplishment' : 'mission completion';
}

function humanizeNotificationIdentifier(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
}
