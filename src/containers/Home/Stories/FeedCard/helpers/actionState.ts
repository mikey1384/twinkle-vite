import { resolveContentRewardLevel } from '~/helpers/rewardLevel';

export type HomeFeedActionType = 'comment' | 'reward' | 'recommend';

export function getHomeFeedFinalRewardLevel({
  content,
  rootObj
}: {
  content: any;
  rootObj?: any;
}) {
  return resolveContentRewardLevel({ content, rootObj });
}
