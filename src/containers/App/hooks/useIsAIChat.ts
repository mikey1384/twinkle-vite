import { useMemo } from 'react';
import { useChatContext, useKeyContext } from '~/contexts';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { User } from '~/types';

// Shared between the always-mounted SocketManager (to drive socket busy
// status) and the Header nav UI, so the AI-chat derivation lives in one place.
export default function useIsAIChat() {
  const userId = useKeyContext((v) => v.myState.userId);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const channelsObj = useChatContext((v) => v.state.channelsObj);

  const currentChannel = useMemo<{
    subchannelObj: Record<string, any>;
    twoPeople: boolean;
    members: User[];
  }>(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );

  const partner = useMemo(() => {
    return currentChannel?.twoPeople
      ? currentChannel?.members?.filter(
          (member) => Number(member.id) !== userId
        )?.[0]
      : null;
  }, [currentChannel?.members, currentChannel?.twoPeople, userId]);

  const isAIChat = useMemo(() => {
    return partner?.id === ZERO_TWINKLE_ID || partner?.id === CIEL_TWINKLE_ID;
  }, [partner?.id]);

  return isAIChat;
}
