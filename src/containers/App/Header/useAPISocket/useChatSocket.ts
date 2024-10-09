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
  useViewContext
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

  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const onAddReactionToMessage = useChatContext(
    (v) => v.actions.onAddReactionToMessage
  );
  const onChangeChannelOwner = useChatContext(
    (v) => v.actions.onChangeChannelOwner
  );
  const onChangeChatSubject = useChatContext(
    (v) => v.actions.onChangeChatSubject
  );
  const onDeleteMessage = useChatContext((v) => v.actions.onDeleteMessage);
  const onEditMessage = useChatContext((v) => v.actions.onEditMessage);
  const onChangeAwayStatus = useChatContext(
    (v) => v.actions.onChangeAwayStatus
  );
  const onChangeBusyStatus = useChatContext(
    (v) => v.actions.onChangeBusyStatus
  );
  const onChangeOnlineStatus = useChatContext(
    (v) => v.actions.onChangeOnlineStatus
  );
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onLeaveChannel = useChatContext((v) => v.actions.onLeaveChannel);
  const onNotifyChatSubjectChange = useNotiContext(
    (v) => v.actions.onNotifyChatSubjectChange
  );
  const onReceiveFirstMsg = useChatContext((v) => v.actions.onReceiveFirstMsg);
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );
  const onRemoveReactionFromMessage = useChatContext(
    (v) => v.actions.onRemoveReactionFromMessage
  );
  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );

  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const updateSubchannelLastRead = useAppContext(
    (v) => v.requestHelpers.updateSubchannelLastRead
  );

  useEffect(() => {
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('channel_owner_changed', handleChangeChannelOwner);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on('chat_message_deleted', onDeleteMessage);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_reaction_added', onAddReactionToMessage);
    socket.on('chat_reaction_removed', onRemoveReactionFromMessage);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('new_message_received', handleReceiveMessage);
    socket.on('new_wordle_attempt_received', handleNewWordleAttempt);
    socket.on('subject_changed', handleTopicChange);

    return function cleanUp() {
      socket.removeListener('online_status_changed', handleOnlineStatusChange);
      socket.removeListener('away_status_changed', handleAwayStatusChange);
      socket.removeListener('busy_status_changed', handleBusyStatusChange);
      socket.removeListener('channel_owner_changed', handleChangeChannelOwner);
      socket.removeListener('chat_invitation_received', handleChatInvitation);
      socket.removeListener('chat_message_deleted', onDeleteMessage);
      socket.removeListener('chat_message_edited', onEditMessage);
      socket.removeListener('chat_reaction_added', onAddReactionToMessage);
      socket.removeListener(
        'chat_reaction_removed',
        onRemoveReactionFromMessage
      );
      socket.removeListener('chat_subject_purchased', onEnableChatSubject);
      socket.removeListener(
        'left_chat_from_another_tab',
        handleLeftChatFromAnotherTab
      );
      socket.removeListener('new_message_received', handleReceiveMessage);
      socket.removeListener(
        'new_wordle_attempt_received',
        handleNewWordleAttempt
      );
      socket.removeListener('subject_changed', handleTopicChange);
    };
  });

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
    const messageIsForCurrentChannel = message.channelId === selectedChannelId;
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
    if (!messageIsForCurrentChannel) {
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
    const messageIsForCurrentChannel = message.channelId === selectedChannelId;
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
}
