import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  sharedMediaEventChannel,
  sharedMediaInvalidationEvents
} from '~/helpers/chatSharedMedia';
import type { Dispatch } from '~/types';

// Own invalidation at the Chat provider so cached filters and inactive chats
// receive the same canonical visibility updates as the mounted sidebar.
export default function useSharedMediaCacheEvents(dispatch: Dispatch) {
  useEffect(() => {
    function changed(event: any) {
      const channelId = sharedMediaEventChannel(event);
      if (channelId)
        dispatch({ type: 'INVALIDATE_CHAT_SHARED_MEDIA', channelId });
    }
    function received(event: any) {
      const channelId = sharedMediaEventChannel(event);
      if (channelId && event.message?.fileName)
        dispatch({
          type: 'INVALIDATE_CHAT_SHARED_MEDIA',
          channelId,
          preserve: true
        });
    }
    function reconnect() {
      // Changes may have been missed while disconnected, in any cached chat.
      dispatch({ type: 'INVALIDATE_CHAT_SHARED_MEDIA' });
    }
    for (const name of sharedMediaInvalidationEvents) socket.on(name, changed);
    socket.on('new_message_received', received);
    socket.on('connect', reconnect);
    return () => {
      for (const name of sharedMediaInvalidationEvents) socket.off(name, changed);
      socket.off('new_message_received', received);
      socket.off('connect', reconnect);
    };
  }, [dispatch]);
}
