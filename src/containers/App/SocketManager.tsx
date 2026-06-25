import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import useAPISocket from './Header/hooks/useAPISocket';
import useIsAIChat from './hooks/useIsAIChat';

import { userIdRef } from '~/constants/state';
import { getSectionFromPathname } from '~/helpers';
import { useChatContext, useKeyContext } from '~/contexts';

// Presentationless host for the main Twinkle socket. This used to live inside
// <Header>, which is not rendered on build-runtime routes (/app/:buildId), so
// the socket was never identity-bound or marked auth-ready there and Build apps
// hung on "Connecting to the shared world...". Mounting it at the App shell,
// unconditionally, keeps socket auth/reconnect alive on every route.
export default function SocketManager({ onInit }: { onInit: () => void }) {
  const { pathname = '' } = useLocation();

  const userId = useKeyContext((v) => v.myState.userId);
  const chatType = useChatContext((v) => v.state.chatType);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);

  const isAIChat = useIsAIChat();

  // Only parse a chat path id on the real /chat route. SocketManager is mounted
  // on every route now (including /app/:buildId/* Build apps), and a Build deep
  // link like /app/884/chat/12345 would otherwise be misread as a Twinkle chat
  // path and bootstrap chat state from an app page.
  const usingChat = useMemo(
    () => getSectionFromPathname(pathname)?.section === 'chat',
    [pathname]
  );

  const currentPathId = useMemo(
    () => (usingChat ? pathname?.split('chat/')[1]?.split('/')?.[0] : ''),
    [usingChat, pathname]
  );

  const subchannelPath = useMemo(() => {
    if (!currentPathId) return null;
    const [, result] = pathname?.split(currentPathId)?.[1]?.split('/') || [];
    return result;
  }, [currentPathId, pathname]);

  const currentChannel = useMemo<{ subchannelObj: Record<string, any> }>(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );

  const subchannelId = useMemo(() => {
    if (!subchannelPath || !currentChannel?.subchannelObj) return null;
    for (const subchannel of Object.values(currentChannel?.subchannelObj)) {
      if (subchannel.path === subchannelPath) {
        return subchannel.id;
      }
    }
    return null;
  }, [currentChannel?.subchannelObj, subchannelPath]);

  useAPISocket({
    chatType,
    currentPathId,
    channelsObj,
    isAIChat,
    onInit,
    pathname,
    selectedChannelId,
    subchannelId,
    subchannelPath
  });

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  return null;
}
