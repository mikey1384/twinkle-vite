import React, { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useKeyContext,
  useViewContext,
  useHomeContext
} from '~/contexts';

export default function useChatSocket({
  channelsObj,
  onUpdateMyXp,
  selectedChannelId,
  subchannelId,
  usingChatRef
}: {
  channelsObj: Record<number, any>;
  onUpdateMyXp: () => void;
  selectedChannelId: number;
  subchannelId: number;
  usingChatRef: React.RefObject<boolean>;
}) {
  const navigate = useNavigate();
  const { userId } = useKeyContext((v) => v.myState);
  const { chatStatus } = useChatContext((v) => v.state);
  const { pageVisible } = useViewContext((v) => v.state);

  const {
    onAddReactionToMessage,
    onChangeAIThinkingStatus,
    onChangeAwayStatus,
    onChangeBusyStatus,
    onChangeChannelOwner,
    onChangeChannelSettings,
    onChangeChatSubject,
    onChangeTopicSettings,
    onChangeOnlineStatus,
    onDeleteMessage,
    onEditMessage,
    onEnableChatSubject,
    onFeatureTopic,
    onHideAttachment,
    onLeaveChannel,
    onPostVocabFeed,
    onRemoveReactionFromMessage,
    onUpdateCurrentTransactionId,
    onUpdateSelectedChannelId,
    onReceiveVocabHints,
    onRemoveMemberFromChannel,
    onReceiveMessage,
    onReceiveFirstMsg,
    onReceiveMessageOnDifferentChannel,
    onSetVocabLeaderboards,
    onCrossOffVocabHint
  } = useChatContext((v) => v.actions);
  const { onSetGroupMemberState } = useHomeContext((v) => v.actions);
  const { onNotifyChatSubjectChange } = useNotiContext((v) => v.actions);
  const { onSetLastChatPath } = useAppContext((v) => v.user.actions);
  const {
    loadVocabularyLeaderboards,
    updateChatLastRead,
    updateSubchannelLastRead
  } = useAppContext((v) => v.requestHelpers);

  useEffect(() => {
    socket.on('ai_thinking_status_updated', onChangeAIThinkingStatus);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('channel_owner_changed', handleChangeChannelOwner);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on('chat_message_deleted', onDeleteMessage);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_reaction_added', onAddReactionToMessage);
    socket.on('chat_reaction_removed', onRemoveReactionFromMessage);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('message_attachment_hid', onHideAttachment);
    socket.on('new_message_received', handleReceiveMessage);
    socket.on('new_vocab_hints_received', handleReceiveVocabHints);
    socket.on('new_vocab_feed_received', handleReceiveVocabFeed);
    socket.on('new_wordle_attempt_received', handleNewWordleAttempt);
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('removed_from_channel', handleRemovedFromChannel);
    socket.on('subject_changed', handleTopicChange);
    socket.on('topic_featured', handleTopicFeatured);
    socket.on('topic_settings_changed', onChangeTopicSettings);

    return function cleanUp() {
      socket.off('ai_thinking_status_updated', onChangeAIThinkingStatus);
      socket.off('away_status_changed', handleAwayStatusChange);
      socket.off('busy_status_changed', handleBusyStatusChange);
      socket.off('channel_owner_changed', handleChangeChannelOwner);
      socket.off('channel_settings_changed', onChangeChannelSettings);
      socket.off('chat_invitation_received', handleChatInvitation);
      socket.off('chat_message_deleted', onDeleteMessage);
      socket.off('chat_message_edited', onEditMessage);
      socket.off('chat_reaction_added', onAddReactionToMessage);
      socket.off('chat_reaction_removed', onRemoveReactionFromMessage);
      socket.off('chat_subject_purchased', onEnableChatSubject);
      socket.off('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
      socket.off('message_attachment_hid', onHideAttachment);
      socket.off('new_message_received', handleReceiveMessage);
      socket.off('new_vocab_feed_received', handleReceiveVocabFeed);
      socket.off('new_vocab_hints_received', handleReceiveVocabHints);
      socket.off('online_status_changed', handleOnlineStatusChange);
      socket.off('removed_from_channel', handleRemovedFromChannel);
      socket.off('new_wordle_attempt_received', handleNewWordleAttempt);
      socket.off('subject_changed', handleTopicChange);
      socket.off('topic_featured', handleTopicFeatured);
      socket.off('topic_settings_changed', onChangeTopicSettings);
    };

    function handleAwayStatusChange({
      userId,
      isAway
    }: {
      userId: number;
      isAway: boolean;
    }) {
      if (chatStatus[userId] && chatStatus[userId].isAway !== isAway) {
        onChangeAwayStatus({ userId, isAway });
      }
    }

    function handleBusyStatusChange({
      userId,
      isBusy
    }: {
      userId: number;
      isBusy: boolean;
    }) {
      if (chatStatus[userId] && chatStatus[userId].isBusy !== isBusy) {
        onChangeBusyStatus({ userId, isBusy });
      }
    }

    function handleChangeChannelOwner({
      channelId,
      message,
      newOwner
    }: {
      channelId: number;
      message: any;
      newOwner: any;
    }) {
      updateChatLastRead(channelId);
      onChangeChannelOwner({ channelId, message, newOwner });
    }

    function handleChatInvitation({
      message,
      members,
      isTwoPeople,
      isClass,
      pathId
    }: {
      message: any;
      members: any[];
      isTwoPeople: boolean;
      isClass: boolean;
      pathId: number;
    }) {
      let isDuplicate = false;
      if (selectedChannelId === 0) {
        if (
          members.filter((member) => member.id !== userId)[0].id ===
          channelsObj[selectedChannelId].members.filter(
            (member: { id: number }) => member.id !== userId
          )[0].id
        ) {
          isDuplicate = true;
        }
      }
      socket.emit('join_chat_group', message.channelId);
      onReceiveFirstMsg({
        message,
        isDuplicate,
        isTwoPeople,
        isClass,
        pageVisible,
        pathId
      });
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

    function handleNewWordleAttempt({
      channelId,
      channelName,
      user,
      message,
      pathId
    }: {
      channelId: number;
      channelName: string;
      user: any;
      message: any;
      pathId: string;
    }) {
      const isForCurrentChannel = channelId === selectedChannelId;
      if (isForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat: usingChatRef.current
        });
      }
      if (!isForCurrentChannel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel: {
            id: channelId,
            channelName,
            pathId
          },
          pageVisible,
          usingChat: usingChatRef.current
        });
      }
      if (user.id === userId && user.newXp) {
        onUpdateMyXp();
      }
    }

    function handleOnlineStatusChange({
      userId,
      member,
      isOnline
    }: {
      userId: number;
      member: any;
      isOnline: boolean;
    }) {
      onChangeOnlineStatus({ userId, member, isOnline });
    }

    async function handleReceiveMessage({
      message,
      channel,
      newMembers,
      isNotification
    }: {
      message: any;
      channel: any;
      newMembers: any[];
      isNotification: boolean;
    }) {
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelId;
      const senderIsUser = message.userId === userId && !isNotification;
      if (senderIsUser && pageVisible) return;
      if (messageIsForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(message.channelId);
          if (message.subchannelId === subchannelId) {
            updateSubchannelLastRead(message.subchannelId);
          }
        }
        onReceiveMessage({
          message,
          pageVisible,
          usingChat: usingChatRef.current,
          newMembers,
          currentSubchannelId: subchannelId
        });
      }
      if (!messageIsForCurrentChannel && channel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel,
          pageVisible,
          usingChat: usingChatRef.current,
          newMembers
        });
      }
      if (message.transactionDetails?.id) {
        onUpdateCurrentTransactionId({
          channelId: message.channelId,
          transactionId: message.transactionDetails.id
        });
      }
      if (message.targetMessage?.userId === userId && message.rewardAmount) {
        onUpdateMyXp();
      }
    }

    function handleReceiveVocabHints({ hints }: { hints: string[] }) {
      onReceiveVocabHints(hints);
    }

    function handleRemovedFromChannel({
      channelId,
      memberId
    }: {
      channelId: number;
      memberId: number;
    }) {
      onRemoveMemberFromChannel({ channelId, memberId });
      onSetGroupMemberState({
        groupId: channelId,
        action: 'remove',
        memberId
      });
      if (memberId === userId) {
        onLeaveChannel({ channelId, userId });
        navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        socket.emit('confirm_leave_channel', channelId);
      }
    }
    async function handleReceiveVocabFeed({
      feed,
      currentYear,
      currentMonth
    }: {
      feed: any;
      leaderboards: any;
      currentYear: number;
      currentMonth: number;
    }) {
      if (feed.userId === userId) {
        handleUpdateLeaderboard();
      }
      onPostVocabFeed({
        feed,
        isMyFeed: feed.userId === userId,
        currentYear,
        currentMonth
      });

      if (feed.wordId) {
        onCrossOffVocabHint({ wordId: feed.wordId });
      }

      async function handleUpdateLeaderboard() {
        const { collectorRankings, monthlyVocabRankings, yearlyVocabRankings } =
          await loadVocabularyLeaderboards();
        onSetVocabLeaderboards({
          collectorRankings,
          monthlyVocabRankings,
          yearlyVocabRankings
        });
      }
    }

    function handleTopicChange({
      message,
      channelId,
      pathId,
      channelName,
      subchannelId,
      subject,
      topicObj,
      isFeatured
    }: {
      message: any;
      channelId: number;
      pathId: number | string;
      channelName: string;
      subchannelId: number;
      subject: string;
      topicObj: any;
      isFeatured: boolean;
    }) {
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelId;
      const senderIsUser = message.userId === userId;

      if (senderIsUser) return;

      if (channelId === GENERAL_CHAT_ID && !subchannelId) {
        onNotifyChatSubjectChange(subject);
      }

      onChangeChatSubject({
        subject,
        topicObj,
        channelId,
        subchannelId,
        isFeatured
      });

      if (messageIsForCurrentChannel) {
        onReceiveMessage({ message, pageVisible });
      } else {
        onReceiveMessageOnDifferentChannel({
          pageVisible,
          message,
          channel: {
            id: channelId,
            pathId,
            channelName,
            isHidden: false,
            numUnreads: 1
          }
        });
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
  });
}
