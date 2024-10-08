import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useKeyContext, useViewContext } from '~/contexts';

export default function useChatSocket({
  channelsObj,
  selectedChannelId
}: {
  channelsObj: Record<number, any>;
  selectedChannelId: number;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const onChangeAwayStatus = useChatContext(
    (v) => v.actions.onChangeAwayStatus
  );
  const onChangeBusyStatus = useChatContext(
    (v) => v.actions.onChangeBusyStatus
  );
  const onChangeOnlineStatus = useChatContext(
    (v) => v.actions.onChangeOnlineStatus
  );
  const onReceiveFirstMsg = useChatContext((v) => v.actions.onReceiveFirstMsg);

  useEffect(() => {
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('chat_invitation_received', handleChatInvitation);

    return function cleanUp() {
      socket.removeListener('online_status_changed', handleOnlineStatusChange);
      socket.removeListener('away_status_changed', handleAwayStatusChange);
      socket.removeListener('busy_status_changed', handleBusyStatusChange);
      socket.removeListener('chat_invitation_received', handleChatInvitation);
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
}
