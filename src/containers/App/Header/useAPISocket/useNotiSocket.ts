import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { User } from '~/types';
import {
  useKeyContext,
  useMissionContext,
  useNotiContext,
  useAppContext,
  useContentContext,
  useManagementContext
} from '~/contexts';

export default function useNotiSocket({
  onUpdateMyXp
}: {
  onUpdateMyXp: () => void;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const onAddAdminLog = useManagementContext((v) => v.actions.onAddAdminLog);
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
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateAchievementUnlockStatus = useAppContext(
    (v) => v.user.actions.onUpdateAchievementUnlockStatus
  );
  const onSetRewardsTimeoutExecuted = useNotiContext(
    (v) => v.actions.onSetRewardsTimeoutExecuted
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);

  const state = useContentContext((v) => v.state);

  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadCoins = useAppContext((v) => v.requestHelpers.loadCoins);
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);

  useEffect(() => {
    socket.on('content_closed', handleContentClose);
    socket.on('content_edited', handleEditContent);
    socket.on('content_opened', handleContentOpen);
    socket.on('mission_rewards_received', handleMissionRewards);
    socket.on('new_notification_received', handleNewNotification);
    socket.on('new_log_for_admin_received', handleNewLogForAdmin);
    socket.on('new_post_uploaded', handleNewPost);
    socket.on('new_reward_posted', handleNewReward);
    socket.on('new_recommendation_posted', handleNewRecommendation);

    return function cleanUp() {
      socket.off('content_closed', handleContentClose);
      socket.off('content_edited', handleEditContent);
      socket.off('content_opened', handleContentOpen);
      socket.off('mission_rewards_received', handleMissionRewards);
      socket.off('new_log_for_admin_received', handleNewLogForAdmin);
      socket.off('new_notification_received', handleNewNotification);
      socket.off('new_post_uploaded', handleNewPost);
      socket.off('new_reward_posted', handleNewReward);
      socket.off('new_recommendation_posted', handleNewRecommendation);
    };

    function handleNewLogForAdmin(message: string) {
      onAddAdminLog(message);
    }

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

    function handleMissionRewards({
      includesCoinReward,
      includesXpReward,
      missionId
    }: {
      includesCoinReward: boolean;
      includesXpReward: boolean;
      missionId: number;
    }) {
      if (includesCoinReward) {
        handleUpdateMyCoins();
      }
      if (includesXpReward) {
        onUpdateMyXp();
      }
      onUpdateMissionAttempt({
        missionId,
        newState: { status: 'pass', tryingAgain: false }
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

        const { currentChatSubject, loadMoreNotifications, notifications } =
          await fetchNotifications();

        const {
          rewards,
          loadMoreRewards,
          totalRewardedTwinkles,
          totalRewardedTwinkleCoins
        } = await loadRewards();

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

    async function handleUpdateMyCoins() {
      const coins = await loadCoins();
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
    }
  });
}
