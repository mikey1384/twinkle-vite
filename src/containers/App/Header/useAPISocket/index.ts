import { useEffect, useMemo, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  VOCAB_CHAT_TYPE,
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID,
  CIEL_PFP_URL
} from '~/constants/defaultValues';
import { User } from '~/types';
import {
  useAppContext,
  useContentContext,
  useViewContext,
  useHomeContext,
  useMissionContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { parseChannelPath, getSectionFromPathname } from '~/helpers';
import useAICardSocket from './useAICardSocket';
import useCallSocket from './useCallSocket';
import useChatSocket from './useChatSocket';
import useChessSocket from './useChessSocket';

const MAX_RETRY_COUNT = 7;
let currentTimeoutId: any;
let loadingPromise: Promise<void> | null = null;

export default function useAPISocket({
  chatType,
  channelsObj,
  currentPathId,
  isAIChat,
  onInit,
  pathname,
  selectedChannelId,
  subchannelId,
  subchannelPath
}: {
  chatType: string;
  channelsObj: any;
  currentPathId: string;
  isAIChat: boolean;
  onInit: () => void;
  pathname: string;
  selectedChannelId: number;
  subchannelId: number;
  subchannelPath: string | null;
}) {
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const loadCoins = useAppContext((v) => v.requestHelpers.loadCoins);
  const loadXP = useAppContext((v) => v.requestHelpers.loadXP);
  const checkChatAccessible = useAppContext(
    (v) => v.requestHelpers.checkChatAccessible
  );
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const onUpdateAchievementUnlockStatus = useAppContext(
    (v) => v.user.actions.onUpdateAchievementUnlockStatus
  );
  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const checkIfHomeOutdated = useAppContext(
    (v) => v.requestHelpers.checkIfHomeOutdated
  );
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const loadChat = useAppContext((v) => v.requestHelpers.loadChat);

  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const latestPathId = useChatContext((v) => v.state.latestPathId);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onInitChat = useChatContext((v) => v.actions.onInitChat);
  const onSetSelectedSubchannelId = useChatContext(
    (v) => v.actions.onSetSelectedSubchannelId
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onSetOnlineUsers = useChatContext((v) => v.actions.onSetOnlineUsers);
  const onSetReconnecting = useChatContext((v) => v.actions.onSetReconnecting);
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onUpdateChatType = useChatContext((v) => v.actions.onUpdateChatType);
  const onChangeChannelSettings = useChatContext(
    (v) => v.actions.onChangeChannelSettings
  );
  const onSetTopicSettingsJSON = useChatContext(
    (v) => v.actions.onSetTopicSettingsJSON
  );
  const onSetChannelSettingsJSON = useChatContext(
    (v) => v.actions.onSetChannelSettingsJSON
  );
  const onChangeTopicSettings = useChatContext(
    (v) => v.actions.onChangeTopicSettings
  );
  const onClearRecentChessMessage = useChatContext(
    (v) => v.actions.onClearRecentChessMessage
  );
  const onHideAttachment = useChatContext((v) => v.actions.onHideAttachment);
  const onLeaveChannel = useChatContext((v) => v.actions.onLeaveChannel);
  const onNewAICardSummon = useChatContext((v) => v.actions.onNewAICardSummon);
  const onReceiveVocabActivity = useChatContext(
    (v) => v.actions.onReceiveVocabActivity
  );
  const onFeatureTopic = useChatContext((v) => v.actions.onFeatureTopic);
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onUpdateCollectorsRankings = useChatContext(
    (v) => v.actions.onUpdateCollectorsRankings
  );
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );

  const category = useHomeContext((v) => v.state.category);
  const feeds = useHomeContext((v) => v.state.feeds);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );

  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const onSetRewardsTimeoutExecuted = useNotiContext(
    (v) => v.actions.onSetRewardsTimeoutExecuted
  );
  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);
  const onLoadNotifications = useNotiContext(
    (v) => v.actions.onLoadNotifications
  );
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);
  const onIncreaseNumNewPosts = useNotiContext(
    (v) => v.actions.onIncreaseNumNewPosts
  );
  const onIncreaseNumNewNotis = useNotiContext(
    (v) => v.actions.onIncreaseNumNewNotis
  );

  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onAttachReward = useContentContext((v) => v.actions.onAttachReward);
  const onCloseContent = useContentContext((v) => v.actions.onCloseContent);
  const onOpenContent = useContentContext((v) => v.actions.onOpenContent);
  const onLikeContent = useContentContext((v) => v.actions.onLikeContent);
  const onRecommendContent = useContentContext(
    (v) => v.actions.onRecommendContent
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);
  const state = useContentContext((v) => v.state);

  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const usingChat = useMemo(
    () => getSectionFromPathname(pathname)?.section === 'chat',
    [pathname]
  );

  const usingChatRef = useRef(usingChat);
  const prevProfilePicUrl = useRef(profilePicUrl);
  const latestPathIdRef = useRef(latestPathId);
  const latestChatTypeRef = useRef(chatType);
  const currentPathIdRef = useRef(Number(currentPathId));
  const aiCallChannelIdRef = useRef(aiCallChannelId);

  useEffect(() => {
    onSetSelectedSubchannelId(subchannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannelId]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

  useEffect(() => {
    latestChatTypeRef.current = chatType;
  }, [chatType]);

  useEffect(() => {
    socket.disconnect();
    socket.connect();
  }, [userId]);

  useEffect(() => {
    currentPathIdRef.current = Number(currentPathId);
  }, [currentPathId]);

  useEffect(() => {
    usingChatRef.current = usingChat && !isAIChat;
  }, [isAIChat, usingChat]);

  useEffect(() => {
    if (!aiCallChannelIdRef.current && aiCallChannelId) {
      console.log('starting ai call...');
      socket.emit('openai_start_ai_voice_conversation');
    } else if (aiCallChannelIdRef.current && !aiCallChannelId) {
      console.log('ending ai call');
      socket.emit('openai_end_ai_voice_conversation');
    }
    aiCallChannelIdRef.current = aiCallChannelId;
  }, [aiCallChannelId]);

  useEffect(() => {
    if (userId && profilePicUrl !== prevProfilePicUrl.current) {
      localStorage.setItem('profilePicUrl', profilePicUrl);
      socket.emit('change_profile_pic', profilePicUrl);
    }
    prevProfilePicUrl.current = profilePicUrl;
  }, [profilePicUrl, userId, username]);

  useAICardSocket();
  useCallSocket({
    channelsObj,
    selectedChannelId
  });
  useChatSocket({
    channelsObj,
    onUpdateMyXp: handleUpdateMyXp,
    selectedChannelId,
    subchannelId,
    usingChatRef
  });
  useChessSocket({ selectedChannelId });

  useEffect(() => {
    socket.on('ai_memory_updated', handleAIMemoryUpdate);
    socket.on('ai_message_done', handleAIMessageDone);
    socket.on('approval_result_received', handleApprovalResultReceived);
    socket.on('ban_status_updated', handleBanStatusUpdate);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('topic_settings_changed', onChangeTopicSettings);
    socket.on('content_edited', handleEditContent);
    socket.on('connect', handleConnect);
    socket.on('content_closed', handleContentClose);
    socket.on('content_opened', handleContentOpen);
    socket.on('current_transaction_id_updated', handleTransactionIdUpdate);
    socket.on('disconnect', handleDisconnect);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('message_attachment_hid', onHideAttachment);
    socket.on('mission_rewards_received', handleMissionRewards);
    socket.on('new_post_uploaded', handleNewPost);
    socket.on('new_notification_received', handleNewNotification);
    socket.on('new_ai_message_received', handleReceiveAIMessage);
    socket.on('new_reward_posted', handleNewReward);
    socket.on('new_recommendation_posted', handleNewRecommendation);
    socket.on('new_title_received', handleNewTitle);
    socket.on('new_ai_card_summoned', handleNewAICardSummon);
    socket.on('new_vocab_activity_received', handleReceiveVocabActivity);
    socket.on('profile_pic_changed', handleProfilePicChange);
    socket.on('topic_featured', handleTopicFeatured);
    socket.on('user_type_updated', handleUserTypeUpdate);
    socket.on('username_changed', handleUsernameChange);

    return function cleanUp() {
      socket.removeListener('ai_memory_updated', handleAIMemoryUpdate);
      socket.removeListener('ai_message_done', handleAIMessageDone);
      socket.removeListener(
        'approval_result_received',
        handleApprovalResultReceived
      );
      socket.removeListener('ban_status_updated', handleBanStatusUpdate);
      socket.removeListener('content_edited', handleEditContent);
      socket.removeListener(
        'channel_settings_changed',
        onChangeChannelSettings
      );
      socket.removeListener('topic_settings_changed', onChangeTopicSettings);
      socket.removeListener('connect', handleConnect);
      socket.removeListener('content_closed', handleContentClose);
      socket.removeListener('content_opened', handleContentOpen);
      socket.removeListener(
        'current_transaction_id_updated',
        handleTransactionIdUpdate
      );
      socket.removeListener('disconnect', handleDisconnect);
      socket.removeListener(
        'left_chat_from_another_tab',
        handleLeftChatFromAnotherTab
      );
      socket.removeListener('message_attachment_hid', onHideAttachment);
      socket.removeListener('mission_rewards_received', handleMissionRewards);
      socket.removeListener('new_post_uploaded', handleNewPost);
      socket.removeListener('new_notification_received', handleNewNotification);
      socket.removeListener('new_ai_message_received', handleReceiveAIMessage);
      socket.removeListener('new_reward_posted', handleNewReward);
      socket.removeListener('new_title_received', handleNewTitle);
      socket.removeListener('new_ai_card_summoned', handleNewAICardSummon);
      socket.removeListener(
        'new_vocab_activity_received',
        handleReceiveVocabActivity
      );
      socket.removeListener(
        'new_recommendation_posted',
        handleNewRecommendation
      );
      socket.removeListener('profile_pic_changed', handleProfilePicChange);
      socket.removeListener('topic_featured', handleTopicFeatured);
      socket.removeListener('user_type_updated', handleUserTypeUpdate);
      socket.removeListener('username_changed', handleUsernameChange);
    };

    function handleAIMemoryUpdate({
      channelId,
      topicId,
      memory
    }: {
      channelId: number;
      topicId: number;
      memory: any;
    }) {
      if (topicId) {
        onSetTopicSettingsJSON({
          channelId,
          topicId,
          newSettings: { aiMemory: memory }
        });
      } else {
        onSetChannelSettingsJSON({
          channelId,
          newSettings: { aiMemory: memory }
        });
      }
    }

    function handleApprovalResultReceived({ type }: { type: string }) {
      if (type === 'mentor') {
        onSetUserState({
          userId,
          newState: { title: 'teacher' }
        });
      }
    }

    function handleAIMessageDone(channelId: number) {
      onSetChannelState({
        channelId,
        newState: { currentlyStreamingAIMsgId: null }
      });
    }

    function handleBanStatusUpdate(banStatus: any) {
      onSetUserState({ userId, newState: { banned: banStatus } });
    }

    async function handleConnect() {
      console.log('connected to socket');
      onClearRecentChessMessage(selectedChannelId);
      onChangeSocketStatus(true);
      handleCheckVersion();
      handleCheckOutdated();
      if (userId) {
        handleGetNumberOfUnreadMessages();
        handleLoadChat({ selectedChannelId });
      }

      async function handleCheckOutdated() {
        const firstFeed = feeds[0];
        if (
          firstFeed?.lastInteraction &&
          (category === 'uploads' || category === 'recommended')
        ) {
          const outdated = await checkIfHomeOutdated({
            lastInteraction: feeds[0] ? feeds[0].lastInteraction : 0,
            category,
            subFilter
          });
          onSetFeedsOutdated(outdated.length > 0);
        }
      }

      async function handleCheckVersion() {
        const data = await checkVersion();
        onCheckVersion(data);
      }

      async function handleGetNumberOfUnreadMessages() {
        const numUnreads = await getNumberOfUnreadMessages();
        onGetNumberOfUnreadMessages(numUnreads);
      }
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

    async function handleLoadChat({
      selectedChannelId,
      retryCount = 0
    }: {
      selectedChannelId: number;
      retryCount?: number;
    }): Promise<void> {
      if (loadingPromise) return loadingPromise;

      loadingPromise = (async (): Promise<void> => {
        try {
          if (!navigator.onLine) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            throw new Error('Network is offline');
          }

          if (currentTimeoutId) {
            clearTimeout(currentTimeoutId);
          }

          socket.emit(
            'bind_uid_to_socket',
            { userId, username, profilePicUrl },
            () => {
              socket.emit('change_busy_status', !usingChatRef.current);
            }
          );
          socket.emit('enter_my_notification_channel', userId);

          const initialTimeout = 5000;
          const timeoutDuration =
            retryCount < 3
              ? initialTimeout
              : initialTimeout * Math.pow(2, retryCount - 2);

          const { promise: timeoutPromise, cancel: cancelTimeout } =
            createTimeoutPromise(timeoutDuration);

          currentTimeoutId = timeoutPromise.timeoutId;

          const loadChatPromise = (async () => {
            try {
              onSetReconnecting(true);
              onInit();
              const pathId = Number(currentPathId);
              let currentChannelIsAccessible = true;

              if (!isNaN(pathId) && userId) {
                const { isAccessible } = await checkChatAccessible(pathId);
                currentChannelIsAccessible = isAccessible;
              }

              console.log('Loading chat...');
              const startTime = Date.now();

              const data = await loadChatWithRetry({
                channelId: !isNaN(pathId)
                  ? parseChannelPath(pathId)
                  : selectedChannelId,
                subchannelPath
              });

              const endTime = Date.now();
              const chatLoadingTime = (endTime - startTime) / 1000;
              console.log(`Chat loaded in ${chatLoadingTime} seconds`);

              onInitChat({ data, userId });

              if (
                latestPathIdRef.current &&
                (data.currentPathId !== latestPathIdRef.current ||
                  data.chatType)
              ) {
                const { isAccessible } = await checkChatAccessible(
                  latestPathIdRef.current
                );
                if (!isAccessible) {
                  onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                  if (usingChatRef.current) {
                    navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, {
                      replace: true
                    });
                    return;
                  }
                }

                const channelId = parseChannelPath(latestPathIdRef.current);
                if (channelId > 0) {
                  if (!channelPathIdHash[pathId]) {
                    onUpdateChannelPathIdHash({ channelId, pathId });
                  }
                  const channelData = await loadChatChannel({
                    channelId,
                    subchannelPath
                  });
                  onEnterChannelWithId(channelData);
                  onUpdateSelectedChannelId(channelId);
                }
              }

              if (latestChatTypeRef.current) {
                onUpdateChatType(latestChatTypeRef.current);
              }

              socket.emit(
                'check_online_users',
                selectedChannelId,
                ({
                  onlineUsers
                }: {
                  onlineUsers: { userId: number; username: string }[];
                }) => {
                  onSetOnlineUsers({
                    channelId: selectedChannelId,
                    onlineUsers
                  });
                }
              );
              if (!currentChannelIsAccessible) {
                onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                if (usingChatRef.current) {
                  navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
                }
              }
              cancelTimeout();
              currentTimeoutId = null;
            } catch (error) {
              cancelTimeout();
              currentTimeoutId = null;
              console.error('Error in loadChatPromise:', error);
              throw error;
            }
          })();

          try {
            await Promise.race([loadChatPromise, timeoutPromise.promise]);
          } catch (error: unknown) {
            loadingPromise = null;
            if (currentTimeoutId) {
              clearTimeout(currentTimeoutId);
              currentTimeoutId = null;
            }
            if (retryCount < MAX_RETRY_COUNT) {
              const delay = Math.pow(2, retryCount) * 1000;
              console.warn(
                `handleLoadChat failed on attempt ${
                  retryCount + 1
                }. Retrying in ${delay / 1000}s...`,
                error
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              if (userId === 5) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                alert(errorMessage);
              }
              await handleLoadChat({
                selectedChannelId,
                retryCount: retryCount + 1
              });
            } else {
              onSetReconnecting(false);
              console.error(
                'Failed to load chat after maximum retries:',
                error
              );
            }
          }
        } finally {
          loadingPromise = null;
          if (currentTimeoutId) {
            clearTimeout(currentTimeoutId);
            currentTimeoutId = null;
          }
        }
      })();

      return loadingPromise;

      function createTimeoutPromise(ms: number) {
        let timeoutId: any;
        const promise = new Promise((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Operation timed out')),
            ms
          );
        }) as any;
        return {
          promise,
          timeoutId,
          cancel: () => clearTimeout(timeoutId)
        };
      }
    }

    function handleTopicFeatured({
      channelId,
      topic
    }: {
      channelId: number;
      topic: string;
    }) {
      onFeatureTopic({
        channelId,
        topic
      });
    }

    function handleTransactionIdUpdate({
      channelId,
      senderId,
      transactionId
    }: {
      channelId: number;
      senderId: number;
      transactionId: number;
    }) {
      if (senderId !== userId) {
        onUpdateCurrentTransactionId({ channelId, transactionId });
      }
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

    function handleDisconnect(reason: string) {
      console.log('disconnected from socket. reason: ', reason);
      onChangeSocketStatus(false);
    }

    async function handleLeftChatFromAnotherTab(channelId: number) {
      if (selectedChannelId === channelId) {
        onLeaveChannel({ channelId, userId });
        if (usingChatRef.current) {
          navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        } else {
          onUpdateSelectedChannelId(GENERAL_CHAT_ID);
          onSetLastChatPath(`/${GENERAL_CHAT_PATH_ID}`);
        }
      } else {
        onLeaveChannel({ channelId, userId });
      }
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
        handleUpdateMyXp();
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

    function handleNewTitle(title: string) {
      onSetUserState({ userId, newState: { title } });
    }

    function handleProfilePicChange({
      userId,
      profilePicUrl
    }: {
      userId: number;
      profilePicUrl: string;
    }) {
      onSetUserState({ userId, newState: { profilePicUrl } });
    }

    function handleReceiveAIMessage({
      message,
      channelId
    }: {
      message: any;
      channelId: number;
    }) {
      onSetChannelState({
        channelId,
        newState: {
          currentlyStreamingAIMsgId: message.id
        }
      });
      const messageIsForCurrentChannel = channelId === selectedChannelId;
      if (messageIsForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message: {
            ...message,
            profilePicUrl:
              message.userId === ZERO_TWINKLE_ID ? ZERO_PFP_URL : CIEL_PFP_URL
          },
          pageVisible,
          usingChat: usingChatRef.current
        });
      }
    }

    function handleUserTypeUpdate({
      userId,
      userType,
      userTypeProps
    }: {
      userId: number;
      userType: string;
      userTypeProps: any;
    }) {
      onSetUserState({ userId, newState: { userType, ...userTypeProps } });
    }

    function handleUsernameChange({
      userId,
      newUsername
    }: {
      userId: number;
      newUsername: string;
    }) {
      onSetUserState({ userId, newState: { username: newUsername } });
    }

    function handleNewAICardSummon({ feed, card }: { feed: any; card: any }) {
      const senderIsNotTheUser = card.creator.id !== userId;
      if (senderIsNotTheUser) {
        onNewAICardSummon({ card, feed });
      }
    }

    function handleReceiveVocabActivity(activity: {
      userId: number;
      username: string;
      profilePicUrl: string;
      numWordsCollected: number;
      rank: number;
    }) {
      const senderIsNotTheUser = activity.userId !== userId;
      if (senderIsNotTheUser) {
        onReceiveVocabActivity({
          activity,
          usingVocabSection: chatType === VOCAB_CHAT_TYPE
        });
        onUpdateCollectorsRankings({
          id: activity.userId,
          username: activity.username,
          profilePicUrl: activity.profilePicUrl,
          numWordsCollected: activity.numWordsCollected,
          rank: activity.rank
        });
      }
    }
  });

  async function handleUpdateMyCoins() {
    const coins = await loadCoins();
    onSetUserState({ userId, newState: { twinkleCoins: coins } });
  }

  async function handleUpdateMyXp() {
    const {
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    } = await loadRankings();
    onGetRanks({
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    });
    const { xp, rank } = await loadXP();
    onSetUserState({ userId, newState: { twinkleXP: xp, rank } });
  }

  async function loadChatWithRetry(
    params: any,
    retryCount = 0,
    maxRetries = 3
  ): Promise<any> {
    try {
      const data = await loadChat(params);
      return data;
    } catch (error) {
      if (!navigator.onLine) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return loadChatWithRetry(params, retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }
}
