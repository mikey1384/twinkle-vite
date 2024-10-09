import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { User } from '~/types';
import {
  useKeyContext,
  useNotiContext,
  useAppContext,
  useContentContext
} from '~/contexts';

export default function useNotiSocket() {
  const { userId } = useKeyContext((v) => v.myState);
  const onAttachReward = useContentContext((v) => v.actions.onAttachReward);
  const onCloseContent = useContentContext((v) => v.actions.onCloseContent);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onIncreaseNumNewNotis = useNotiContext(
    (v) => v.actions.onIncreaseNumNewNotis
  );
  const onIncreaseNumNewPosts = useNotiContext(
    (v) => v.actions.onIncreaseNumNewPosts
  );
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onLoadNotifications = useNotiContext(
    (v) => v.actions.onLoadNotifications
  );
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);
  const onOpenContent = useContentContext((v) => v.actions.onOpenContent);
  const onRecommendContent = useContentContext(
    (v) => v.actions.onRecommendContent
  );
  const onUpdateAchievementUnlockStatus = useAppContext(
    (v) => v.user.actions.onUpdateAchievementUnlockStatus
  );
  const onSetRewardsTimeoutExecuted = useNotiContext(
    (v) => v.actions.onSetRewardsTimeoutExecuted
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);

  const state = useContentContext((v) => v.state);

  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);

  useEffect(() => {
    socket.on('content_closed', handleContentClose);
    socket.on('content_edited', handleEditContent);
    socket.on('content_opened', handleContentOpen);
    socket.on('new_notification_received', handleNewNotification);
    socket.on('new_post_uploaded', handleNewPost);
    socket.on('new_reward_posted', handleNewReward);
    socket.on('new_recommendation_posted', handleNewRecommendation);

    return function cleanUp() {
      socket.removeListener('content_closed', handleContentClose);
      socket.removeListener('content_edited', handleEditContent);
      socket.removeListener('content_opened', handleContentOpen);
      socket.removeListener('new_notification_received', handleNewNotification);
      socket.removeListener('new_post_uploaded', handleNewPost);
      socket.removeListener('new_reward_posted', handleNewReward);
      socket.removeListener(
        'new_recommendation_posted',
        handleNewRecommendation
      );
    };

    function handleContentClose({
      contentId,
      contentType,
      closedBy
    }: {
      contentId: number;
      contentType: string;
      closedBy: User;
    }) {
      onCloseContent({ contentId, contentType, userId: closedBy });
    }

    function handleContentOpen({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      onOpenContent({ contentId, contentType });
    }

    function handleEditContent({
      contentType,
      contentId,
      newState
    }: {
      contentType: string;
      contentId: number;
      newState: any;
    }) {
      onEditContent({
        contentType,
        contentId,
        data: newState
      });
    }

    function handleNewNotification({
      type,
      achievementType,
      isAchievementUnlocked,
      likes,
      target
    }: {
      type: string;
      achievementType: string;
      isAchievementUnlocked: boolean;
      likes: any[];
      target: any;
    }) {
      if (type === 'achievement') {
        onUpdateAchievementUnlockStatus({
          userId,
          achievementType,
          isUnlocked: isAchievementUnlocked
        });
      }
      if (likes) {
        onLikeContent({
          likes,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      if (type !== 'achievement' || isAchievementUnlocked) {
        onIncreaseNumNewNotis();
      }
    }

    function handleNewPost({ comment, target }: { comment: any; target: any }) {
      if (comment) {
        if (target.commentId || target.replyId) {
          onUploadReply({
            ...target,
            ...comment
          });
        } else {
          onUploadComment({
            contentId: target.contentId,
            contentType: target.contentType,
            ...comment
          });
        }
      }
      onIncreaseNumNewPosts();
    }

    function handleNewRecommendation({
      uploaderId,
      recommendations,
      recommenderId,
      target
    }: {
      uploaderId: number;
      recommendations: any[];
      recommenderId: number;
      target: any;
    }) {
      if (
        state[target.contentType + target.contentId] ||
        (uploaderId === userId && recommenderId !== userId)
      ) {
        onRecommendContent({
          recommendations,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
    }

    async function handleNewReward({
      target,
      reward,
      receiverId
    }: {
      target: any;
      reward: any;
      receiverId: number;
    }) {
      if (reward.rewarderId !== userId) {
        onAttachReward({
          reward,
          contentId: target.contentId,
          contentType: target.contentType
        });
      }
      if (receiverId === userId) {
        onSetRewardsTimeoutExecuted(false);
        const [
          { currentChatSubject, loadMoreNotifications, notifications },
          {
            rewards,
            loadMoreRewards,
            totalRewardedTwinkles,
            totalRewardedTwinkleCoins
          }
        ] = await Promise.all([fetchNotifications(), loadRewards()]);
        onLoadRewards({
          rewards,
          loadMoreRewards,
          totalRewardedTwinkles,
          totalRewardedTwinkleCoins,
          userId
        });
        onLoadNotifications({
          currentChatSubject,
          loadMoreNotifications,
          notifications,
          userId
        });
      }
    }
  });
}
