import { useChatContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

interface BuildCollaborationDirectMessage {
  channel?: Record<string, any> | null;
  isNew?: boolean;
  message?: Record<string, any> | null;
}

export function useCollaborationDirectMessageUpdater() {
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );

  function updateBuildCollaborationDirectMessage({
    directMessage
  }: {
    directMessage?: BuildCollaborationDirectMessage | null;
  }) {
    if (!directMessage?.message || !directMessage?.channel?.id) return;
    if (directMessage.isNew === false) return;
    if (directMessage.isNew) {
      socket.emit('join_chat_group', directMessage.channel.id);
    }
    onReceiveMessageOnDifferentChannel({
      message: directMessage.message,
      channel: directMessage.channel,
      pageVisible: true,
      usingChat: true,
      isMyMessage: true
    });
  }

  return updateBuildCollaborationDirectMessage;
}
