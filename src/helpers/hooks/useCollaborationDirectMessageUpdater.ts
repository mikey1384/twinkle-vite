import { useChatContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';

interface BuildCollaborationDirectMessage {
  channel?: Record<string, any> | null;
  isNew?: boolean;
  message?: Record<string, any> | null;
}

export function useDirectMessageResponseUpdater() {
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );

  function updateDirectMessageResponse({
    directMessage
  }: {
    directMessage?: BuildCollaborationDirectMessage | null;
  }) {
    if (!directMessage?.message || !directMessage?.channel?.id) return;
    // The API response is canonical and RECEIVE_MSG_ON_DIFF_CHANNEL dedupes by
    // message id. Apply it for both new and previously hidden DMs so the sender
    // never depends on winning a race with the socket relay.
    socket.emit('join_chat_group', directMessage.channel.id);
    onReceiveMessageOnDifferentChannel({
      message: directMessage.message,
      channel: directMessage.channel,
      pageVisible: true,
      usingChat: true,
      isMyMessage: true
    });
  }

  return updateDirectMessageResponse;
}

// Existing Build callers keep the domain name while AI-card offers reuse the
// same canonical response-to-chat-state boundary.
export const useCollaborationDirectMessageUpdater =
  useDirectMessageResponseUpdater;
