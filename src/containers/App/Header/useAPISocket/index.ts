import { useEffect, useMemo, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import {
  useAppContext,
  useHomeContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { parseChannelPath, getSectionFromPathname } from '~/helpers';

import useAICardSocket from './useAICardSocket';
import useAISocket from './useAISocket';
import useCallSocket from './useCallSocket';
import useChatSocket from './useChatSocket';
import useChessSocket from './useChessSocket';
import useNotiSocket from './useNotiSocket';
import useUserSocket from './useUserSocket';

const MAX_RETRY_COUNT = 7;
let currentTimeoutId: any;
let loadingPromise: Promise<void> | null = null;

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
  const navigate = useNavigate();

  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadRankings = useAppContext((v) => v.requestHelpers.loadRankings);
  const loadXP = useAppContext((v) => v.requestHelpers.loadXP);
  const checkChatAccessible = useAppContext(
    (v) => v.requestHelpers.checkChatAccessible
  );
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const checkIfHomeOutdated = useAppContext(
    (v) => v.requestHelpers.checkIfHomeOutdated
  );
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const loadChat = useAppContext((v) => v.requestHelpers.loadChat);

  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const latestPathId = useChatContext((v) => v.state.latestPathId);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onInitChat = useChatContext((v) => v.actions.onInitChat);
  const onSetSelectedSubchannelId = useChatContext(
    (v) => v.actions.onSetSelectedSubchannelId
  );
  const onSetOnlineUsers = useChatContext((v) => v.actions.onSetOnlineUsers);
  const onSetReconnecting = useChatContext((v) => v.actions.onSetReconnecting);
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );
  const onUpdateChatType = useChatContext((v) => v.actions.onUpdateChatType);
  const onClearRecentChessMessage = useChatContext(
    (v) => v.actions.onClearRecentChessMessage
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );

  const category = useHomeContext((v) => v.state.category);
  const feeds = useHomeContext((v) => v.state.feeds);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );

  const onGetRanks = useNotiContext((v) => v.actions.onGetRanks);
  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);

  const usingChat = useMemo(
    () => getSectionFromPathname(pathname)?.section === 'chat',
    [pathname]
  );

  const usingChatRef = useRef(usingChat);
  const prevProfilePicUrl = useRef(profilePicUrl);
  const latestPathIdRef = useRef(latestPathId);
  const latestChatTypeRef = useRef(chatType);
  const currentPathIdRef = useRef(Number(currentPathId));
  const aiCallChannelIdRef = useRef(aiCallChannelId);

  useEffect(() => {
    onSetSelectedSubchannelId(subchannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannelId]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

  useEffect(() => {
    latestChatTypeRef.current = chatType;
  }, [chatType]);

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
    if (!aiCallChannelIdRef.current && aiCallChannelId) {
      console.log('starting ai call...');
      socket.emit('openai_start_ai_voice_conversation');
    } else if (aiCallChannelIdRef.current && !aiCallChannelId) {
      console.log('ending ai call');
      socket.emit('openai_end_ai_voice_conversation');
    }
    aiCallChannelIdRef.current = aiCallChannelId;
  }, [aiCallChannelId]);

  useEffect(() => {
    if (userId && profilePicUrl !== prevProfilePicUrl.current) {
      localStorage.setItem('profilePicUrl', profilePicUrl);
      socket.emit('change_profile_pic', profilePicUrl);
    }
    prevProfilePicUrl.current = profilePicUrl;
  }, [profilePicUrl, userId, username]);

  useAICardSocket();
  useAISocket({ selectedChannelId, usingChatRef });
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

  useEffect(() => {
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return function cleanUp() {
      socket.removeListener('connect', handleConnect);
      socket.removeListener('disconnect', handleDisconnect);
    };

    async function handleConnect() {
      console.log('connected to socket');
      onClearRecentChessMessage(selectedChannelId);
      onChangeSocketStatus(true);
      handleCheckVersion();
      handleCheckOutdated();
      if (userId) {
        handleGetNumberOfUnreadMessages();
        handleLoadChat({ selectedChannelId });
      }

      async function handleCheckOutdated() {
        const firstFeed = feeds[0];
        if (
          firstFeed?.lastInteraction &&
          (category === 'uploads' || category === 'recommended')
        ) {
          const outdated = await checkIfHomeOutdated({
            lastInteraction: feeds[0] ? feeds[0].lastInteraction : 0,
            category,
            subFilter
          });
          onSetFeedsOutdated(outdated.length > 0);
        }
      }

      async function handleCheckVersion() {
        const data = await checkVersion();
        onCheckVersion(data);
      }

      async function handleGetNumberOfUnreadMessages() {
        const numUnreads = await getNumberOfUnreadMessages();
        onGetNumberOfUnreadMessages(numUnreads);
      }
    }

    async function handleLoadChat({
      selectedChannelId,
      retryCount = 0
    }: {
      selectedChannelId: number;
      retryCount?: number;
    }): Promise<void> {
      if (loadingPromise) return loadingPromise;

      loadingPromise = (async (): Promise<void> => {
        try {
          if (!navigator.onLine) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            throw new Error('Network is offline');
          }

          if (currentTimeoutId) {
            clearTimeout(currentTimeoutId);
          }

          socket.emit(
            'bind_uid_to_socket',
            { userId, username, profilePicUrl },
            () => {
              socket.emit('change_busy_status', !usingChatRef.current);
            }
          );
          socket.emit('enter_my_notification_channel', userId);

          const initialTimeout = 5000;
          const timeoutDuration =
            retryCount < 3
              ? initialTimeout
              : initialTimeout * Math.pow(2, retryCount - 2);

          const { promise: timeoutPromise, cancel: cancelTimeout } =
            createTimeoutPromise(timeoutDuration);

          currentTimeoutId = timeoutPromise.timeoutId;

          const loadChatPromise = (async () => {
            try {
              onSetReconnecting(true);
              onInit();
              const pathId = Number(currentPathId);
              let currentChannelIsAccessible = true;

              if (!isNaN(pathId) && userId) {
                const { isAccessible } = await checkChatAccessible(pathId);
                currentChannelIsAccessible = isAccessible;
              }

              console.log('Loading chat...');
              const startTime = Date.now();

              const data = await loadChatWithRetry({
                channelId: !isNaN(pathId)
                  ? parseChannelPath(pathId)
                  : selectedChannelId,
                subchannelPath
              });

              const endTime = Date.now();
              const chatLoadingTime = (endTime - startTime) / 1000;
              console.log(`Chat loaded in ${chatLoadingTime} seconds`);

              onInitChat({ data, userId });

              if (
                latestPathIdRef.current &&
                (data.currentPathId !== latestPathIdRef.current ||
                  data.chatType)
              ) {
                const { isAccessible } = await checkChatAccessible(
                  latestPathIdRef.current
                );
                if (!isAccessible) {
                  onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                  if (usingChatRef.current) {
                    navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, {
                      replace: true
                    });
                    return;
                  }
                }

                const channelId = parseChannelPath(latestPathIdRef.current);
                if (channelId > 0) {
                  if (!channelPathIdHash[pathId]) {
                    onUpdateChannelPathIdHash({ channelId, pathId });
                  }
                  const channelData = await loadChatChannel({
                    channelId,
                    subchannelPath
                  });
                  onEnterChannelWithId(channelData);
                  onUpdateSelectedChannelId(channelId);
                }
              }

              if (latestChatTypeRef.current) {
                onUpdateChatType(latestChatTypeRef.current);
              }

              socket.emit(
                'check_online_users',
                selectedChannelId,
                ({
                  onlineUsers
                }: {
                  onlineUsers: { userId: number; username: string }[];
                }) => {
                  onSetOnlineUsers({
                    channelId: selectedChannelId,
                    onlineUsers
                  });
                }
              );
              if (!currentChannelIsAccessible) {
                onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                if (usingChatRef.current) {
                  navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
                }
              }
              cancelTimeout();
              currentTimeoutId = null;
            } catch (error) {
              cancelTimeout();
              currentTimeoutId = null;
              console.error('Error in loadChatPromise:', error);
              throw error;
            }
          })();

          try {
            await Promise.race([loadChatPromise, timeoutPromise.promise]);
          } catch (error: unknown) {
            loadingPromise = null;
            if (currentTimeoutId) {
              clearTimeout(currentTimeoutId);
              currentTimeoutId = null;
            }
            if (retryCount < MAX_RETRY_COUNT) {
              const delay = Math.pow(2, retryCount) * 1000;
              console.warn(
                `handleLoadChat failed on attempt ${
                  retryCount + 1
                }. Retrying in ${delay / 1000}s...`,
                error
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              if (userId === 5) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                alert(errorMessage);
              }
              await handleLoadChat({
                selectedChannelId,
                retryCount: retryCount + 1
              });
            } else {
              onSetReconnecting(false);
              console.error(
                'Failed to load chat after maximum retries:',
                error
              );
            }
          }
        } finally {
          loadingPromise = null;
          if (currentTimeoutId) {
            clearTimeout(currentTimeoutId);
            currentTimeoutId = null;
          }
        }
      })();

      return loadingPromise;

      function createTimeoutPromise(ms: number) {
        let timeoutId: any;
        const promise = new Promise((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Operation timed out')),
            ms
          );
        }) as any;
        return {
          promise,
          timeoutId,
          cancel: () => clearTimeout(timeoutId)
        };
      }
    }

    function handleDisconnect(reason: string) {
      console.log('disconnected from socket. reason: ', reason);
      onChangeSocketStatus(false);
    }
  });

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

  async function loadChatWithRetry(
    params: any,
    retryCount = 0,
    maxRetries = 3
  ): Promise<any> {
    try {
      const data = await loadChat(params);
      return data;
    } catch (error) {
      if (!navigator.onLine) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return loadChatWithRetry(params, retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }
}
