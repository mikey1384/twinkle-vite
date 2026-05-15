export type HomeFeedActionType = 'comment' | 'reward' | 'recommend';

export function getHomeFeedFinalRewardLevel({
  content,
  rootObj
}: {
  content: any;
  rootObj?: any;
}) {
  const rootType = content?.rootType;
  const targetSubject = content?.targetObj?.subject;
  const rootRewardLevel =
    rootType === 'video' || rootType === 'url'
      ? rootObj?.rewardLevel > 0
        ? 1
        : 0
      : rootObj?.rewardLevel;
  return content?.byUser
    ? 5
    : targetSubject?.rewardLevel || rootRewardLevel || 0;
}
