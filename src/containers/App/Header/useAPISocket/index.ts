import { useEffect, useMemo, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { getSectionFromPathname } from '~/helpers';

import useAICardSocket from './useAICardSocket';
import useAISocket from './useAISocket';
import useCallSocket from './useCallSocket';
import useChatSocket from './useChatSocket';
import useChessSocket from './useChessSocket';
import useInitSocket from './useInitSocket';
import useNotiSocket from './useNotiSocket';
import useUserSocket from './useUserSocket';

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

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const loadXP = useAppContext((v) => v.requestHelpers.loadXP);

  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);

  const onSetSelectedSubchannelId = useChatContext(
    (v) => v.actions.onSetSelectedSubchannelId
  );
  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);

  const usingChat = useMemo(
    () => getSectionFromPathname(pathname)?.section === 'chat',
    [pathname]
  );

  const usingChatRef = useRef(usingChat);
  const prevProfilePicUrl = useRef(profilePicUrl);
  const currentPathIdRef = useRef(Number(currentPathId));

  useEffect(() => {
    onSetSelectedSubchannelId(subchannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannelId]);

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
    if (userId && profilePicUrl !== prevProfilePicUrl.current) {
      localStorage.setItem('profilePicUrl', profilePicUrl);
      socket.emit('change_profile_pic', profilePicUrl);
    }
    prevProfilePicUrl.current = profilePicUrl;
  }, [profilePicUrl, userId, username]);

  useInitSocket({
    chatType,
    currentPathId,
    onInit,
    selectedChannelId,
    subchannelPath,
    usingChatRef
  });
  useAICardSocket();
  useAISocket({ selectedChannelId, aiCallChannelId, usingChatRef });
  useCallSocket({
    channelsObj,
    selectedChannelId
  });
  useChatSocket({
    channelsObj,
    chatType,
    onUpdateMyXp: handleUpdateMyXp,
    selectedChannelId,
    subchannelId,
    usingChatRef
  });
  useChessSocket({ selectedChannelId });
  useNotiSocket({ onUpdateMyXp: handleUpdateMyXp });
  useUserSocket();

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
}
