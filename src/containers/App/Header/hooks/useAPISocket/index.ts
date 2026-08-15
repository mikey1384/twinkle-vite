import { useEffect, useMemo, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { getSectionFromPathname, parseChannelPath } from '~/helpers';
import { readAuthToken, setStoredItem } from '~/helpers/userDataHelpers';
import { browserReportsOffline } from '~/helpers/browserNetwork';
import {
  AI_CARD_CHAT_TYPE,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';

import useAICardSocket from './useAICardSocket';
import useAISocket from './useAISocket';
import useBuildSocket from './useBuildSocket';
import useCallSocket from './useCallSocket';
import useChatSocket from './useChatSocket';
import useChessSocket from './useChessSocket';
import useCommunitySocket from './useCommunitySocket';
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
  onInit: () => Promise<boolean>;
  pathname: string;
  selectedChannelId: number;
  subchannelId: number;
  subchannelPath: string | null;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const sessionInterruption = useAppContext(
    (v) => v.user.state.sessionInterruption
  );

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
  // Unread "current channel" must match the body the user is looking at. The
  // normal Chat body renders from selectedChannelId, so that id is the source
  // of truth while a channel body is shown. Vocabulary and AI Cards render the
  // Collect body instead and must not inherit a stale selected channel.
  //
  // ba1494adb required selectedChannelId === routed path id. Any path/selection
  // disagreement made activeChatChannelId null, so live messages — including
  // chess/omok moves the user was watching — took RECEIVE_MSG_ON_DIFF_CHANNEL
  // (always +1 scoped unreads). Visible RECEIVE_MESSAGE preserves that sticky
  // count; last-read is the only clearer. Leaving the channel then shows the
  // left-menu badge.
  //
  // Prefer selectedChannelId. Fall back to the routed id only when selection is
  // still unset (path-first navigation before Main's sync effect). Build routes
  // stay out because usingChat is only true for the real /chat section.
  const routedChannelId =
    usingChat && currentPathId && !Number.isNaN(Number(currentPathId))
      ? parseChannelPath(currentPathId)
      : null;
  const selectedChatChannelId = Number(selectedChannelId || 0);
  const showingChannelBody =
    usingChat &&
    chatType !== VOCAB_CHAT_TYPE &&
    chatType !== AI_CARD_CHAT_TYPE;
  const activeChatChannelId = !showingChannelBody
    ? null
    : selectedChatChannelId > 0
      ? selectedChatChannelId
      : routedChannelId;

  const usingChatRef = useRef(usingChat);
  const activeChatChannelIdRef = useRef<number | null>(activeChatChannelId);
  const chatBusyRef = useRef(!usingChat || isAIChat);
  const prevProfilePicUrl = useRef(profilePicUrl);
  const prevUserIdRef = useRef(userId);
  // Zero/Ciel chats are still active chat views for unread reconciliation,
  // even though presence intentionally reports them as busy.
  usingChatRef.current = usingChat;
  activeChatChannelIdRef.current = activeChatChannelId;
  chatBusyRef.current = !usingChat || isAIChat;

  useEffect(() => {
    onSetSelectedSubchannelId(subchannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannelId]);

  useEffect(() => {
    const previousUserId = prevUserIdRef.current;
    const userIdChanged = previousUserId !== userId;
    prevUserIdRef.current = userId;

    if (!userIdChanged) return;

    if (sessionInterruption) {
      // `disconnect()` also cancels a Manager-owned reconnect attempt when the
      // transport has not connected yet. A terminal auth decision must stop
      // both connected and connecting sockets.
      socket.disconnect();
      return;
    }

    // Account identity is part of the socket handshake. Cancel either a live
    // transport or an in-progress Manager attempt before reconnecting; leaving
    // an active old-account attempt alone can bind the replacement session with
    // stale credentials. Explicit logout stays disconnected.
    socket.disconnect();
    if (userId && readAuthToken().token && !browserReportsOffline()) {
      socket.connect();
    }
  }, [sessionInterruption, userId]);

  useEffect(() => {
    if (userId && profilePicUrl !== prevProfilePicUrl.current) {
      setStoredItem('profilePicUrl', profilePicUrl);
      socket.emit('change_profile_pic', profilePicUrl);
    }
    prevProfilePicUrl.current = profilePicUrl;
  }, [profilePicUrl, userId, username]);

  useInitSocket({
    chatBusyRef,
    chatType,
    currentPathId,
    onInit,
    selectedChannelId,
    subchannelPath,
    usingChatRef
  });
  useAICardSocket();
  useAISocket({ activeChatChannelIdRef, aiCallChannelId, usingChatRef });
  useBuildSocket();
  useCallSocket({
    channelsObj,
    selectedChannelId
  });
  useChatSocket({
    activeChatChannelIdRef,
    channelsObj,
    onUpdateMyXp: handleUpdateMyXp,
    selectedChannelId,
    subchannelId,
    usingChatRef
  });
  useChessSocket({ selectedChannelId });
  useCommunitySocket();
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
      myMonthlyXP,
      userId
    });
    const { xp, rank } = await loadXP();
    onSetUserState({ userId, newState: { twinkleXP: xp, rank } });
  }
}
