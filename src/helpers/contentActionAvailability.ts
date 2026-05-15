export interface ContentActionAvailabilityParams {
  actionsReady?: boolean;
  contentType: string;
  secretHidden?: boolean;
}

export const contentPanelNoRewardContentTypes = new Set([
  'aiStory',
  'build',
  'dailyReflection',
  'pass',
  'sharedTopic',
  'xpChange'
]);

export const homeFeedUnsupportedRecommendContentTypes = new Set(['build']);

const contentPanelCommentLabelContentTypes = new Set([
  'build',
  'pass',
  'sharedTopic',
  'url',
  'video',
  'xpChange'
]);

export function getContentPanelCommentActionLabel(contentType: string) {
  if (contentType === 'subject') return 'Respond';
  if (contentPanelCommentLabelContentTypes.has(contentType)) return 'Comment';
  return 'Reply';
}

export function isContentPanelLikeActionEnabled({
  actionsReady = true,
  secretHidden
}: ContentActionAvailabilityParams) {
  return Boolean(actionsReady && !secretHidden);
}

export function isContentPanelCommentActionEnabled({
  actionsReady = true,
  secretHidden
}: ContentActionAvailabilityParams) {
  return Boolean(actionsReady && !secretHidden);
}

export function isContentPanelRewardActionSupported(contentType: string) {
  return !contentPanelNoRewardContentTypes.has(contentType);
}

export function getXpRewardActionBlockedReason(
  xpButtonDisabled?: boolean | string
) {
  if (!xpButtonDisabled) return '';
  if (xpButtonDisabled === 'Reward') {
    return 'Reward options are already open.';
  }
  if (
    typeof xpButtonDisabled === 'string' &&
    xpButtonDisabled.includes('Twinkles')
  ) {
    return 'This has already received all available Twinkles.';
  }
  if (
    typeof xpButtonDisabled === 'string' &&
    xpButtonDisabled.includes('Rewarded')
  ) {
    return 'You already rewarded the maximum amount.';
  }
  if (typeof xpButtonDisabled === 'string') {
    return xpButtonDisabled;
  }
  return 'You cannot reward this right now.';
}

export function getContentPanelRewardActionBlockedReason({
  actionsReady = true,
  contentType,
  secretHidden,
  userCanRewardThis,
  userId,
  uploaderId,
  xpButtonDisabled
}: ContentActionAvailabilityParams & {
  userCanRewardThis: boolean;
  userId?: number;
  uploaderId?: number;
  xpButtonDisabled?: boolean | string;
}) {
  if (!isContentPanelRewardActionSupported(contentType)) return '';
  if (!userId) return 'Log in to reward this.';
  if (!actionsReady) return 'Open this first to reward it.';
  if (secretHidden) return 'Reveal the secret before rewarding.';
  if (uploaderId && Number(userId) === Number(uploaderId)) {
    return "You can't reward your own content.";
  }
  const xpBlockedReason = getXpRewardActionBlockedReason(xpButtonDisabled);
  if (xpBlockedReason) return xpBlockedReason;
  if (!userCanRewardThis) {
    return 'This needs a reward-enabled recommendation before you can reward it.';
  }
  return '';
}

export function isContentPanelRewardActionEnabled({
  actionsReady = true,
  contentType,
  secretHidden,
  userCanRewardThis,
  xpButtonDisabled
}: ContentActionAvailabilityParams & {
  userCanRewardThis: boolean;
  xpButtonDisabled?: boolean | string;
}) {
  return Boolean(
    actionsReady &&
    !secretHidden &&
    isContentPanelRewardActionSupported(contentType) &&
    userCanRewardThis &&
    !xpButtonDisabled
  );
}

export function isContentPanelRecommendActionEnabled({
  actionsReady = true,
  secretHidden
}: ContentActionAvailabilityParams) {
  return Boolean(actionsReady && !secretHidden);
}

export function isHomeFeedRecommendActionSupported(contentType: string) {
  return !homeFeedUnsupportedRecommendContentTypes.has(contentType);
}

export const isHomeFeedRecommendIntentSupported =
  isHomeFeedRecommendActionSupported;
