import React, { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import { parseChannelPath } from '~/helpers';
import {
  useAppContext,
  useHomeContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';

const MAX_RETRY_COUNT = 7;
const GLOBAL_TIMEOUT = 30000;

export default function useInitSocket({
  chatType,
  currentPathId,
  onInit,
  selectedChannelId,
  subchannelPath,
  usingChatRef
}: {
  chatType: string;
  currentPathId: string;
  onInit: () => void;
  selectedChannelId: number;
  subchannelPath: string | null;
  usingChatRef: React.RefObject<boolean>;
}) {
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();

  const category = useHomeContext((v) => v.state.category);
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const feeds = useHomeContext((v) => v.state.feeds);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const latestPathId = useChatContext((v) => v.state.latestPathId);

  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);
  const onClearRecentChessMessage = useChatContext(
    (v) => v.actions.onClearRecentChessMessage
  );
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );
  const onInitChat = useChatContext((v) => v.actions.onInitChat);
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );
  const onSetOnlineUsers = useChatContext((v) => v.actions.onSetOnlineUsers);
  const onSetReconnecting = useChatContext((v) => v.actions.onSetReconnecting);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onUpdateChatType = useChatContext((v) => v.actions.onUpdateChatType);
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );

  const checkIfHomeOutdated = useAppContext(
    (v) => v.requestHelpers.checkIfHomeOutdated
  );
  const checkChatAccessible = useAppContext(
    (v) => v.requestHelpers.checkChatAccessible
  );
  const loadChat = useAppContext((v) => v.requestHelpers.loadChat);
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );

  const latestChatTypeRef = useRef(chatType);
  const latestPathIdRef = useRef(latestPathId);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const currentTimeoutIdRef = useRef<any>(null);

  useEffect(() => {
    latestChatTypeRef.current = chatType;
  }, [chatType]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

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
      if (loadingPromiseRef.current) return loadingPromiseRef.current;

      const globalTimeout = new Promise<void>((_, reject) => {
        setTimeout(
          () => reject(new Error('Global timeout exceeded')),
          GLOBAL_TIMEOUT
        );
      });

      loadingPromiseRef.current = Promise.race([
        (async (): Promise<void> => {
          try {
            if (!navigator.onLine) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              throw new Error('Network is offline');
            }

            if (currentTimeoutIdRef.current) {
              clearTimeout(currentTimeoutIdRef.current);
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

            currentTimeoutIdRef.current = timeoutPromise.timeoutId;

            const loadChatPromise = (async () => {
              onSetReconnecting(true);
              onInit();
              const pathId = Number(currentPathId);
              let currentChannelIsAccessible = true;

              try {
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
                    data.chatType) &&
                  userId
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
                currentTimeoutIdRef.current = null;
              } catch (error) {
                cancelTimeout();
                currentTimeoutIdRef.current = null;
                console.error('Error in loadChatPromise:', error);
                throw error;
              }
            })();

            try {
              await Promise.race([loadChatPromise, timeoutPromise.promise]);
              onSetReconnecting(false);
            } catch (error: unknown) {
              loadingPromiseRef.current = null;
              if (currentTimeoutIdRef.current) {
                clearTimeout(currentTimeoutIdRef.current);
                currentTimeoutIdRef.current = null;
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
                return handleLoadChat({
                  selectedChannelId,
                  retryCount: retryCount + 1
                });
              } else {
                console.error(
                  'Failed to load chat after maximum retries:',
                  error
                );
              }
              onSetReconnecting(false);
            }
          } finally {
            loadingPromiseRef.current = null;
            if (currentTimeoutIdRef.current) {
              clearTimeout(currentTimeoutIdRef.current);
              currentTimeoutIdRef.current = null;
            }
            onSetReconnecting(false);
          }
        })(),
        globalTimeout
      ]);

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

  async function loadChatWithRetry(
    params: any,
    retryCount = 0,
    maxRetries = 10
  ): Promise<any> {
    try {
      const data = await loadChat(params);
      return data;
    } catch (error) {
      if (!navigator.onLine) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return loadChatWithRetry(params, retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }
}
