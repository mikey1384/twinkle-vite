import React, { useEffect, useRef, useCallback } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  ZERO_TWINKLE_ID,
  CIEL_TWINKLE_ID
} from '~/constants/defaultValues';
import { TWINKLE_SOCKET_AUTH_READY_EVENT } from '~/constants/socketEvents';
import { logForAdmin, parseChannelPath } from '~/helpers';
import {
  getStoredItem,
  getTwinkleDeviceId
} from '~/helpers/userDataHelpers';
import {
  useAppContext,
  useHomeContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';

function dispatchSocketAuthReady(userId?: number | null) {
  const normalizedUserId = Number(userId || 0);
  if (!normalizedUserId) return;
  window.dispatchEvent(
    new CustomEvent(TWINKLE_SOCKET_AUTH_READY_EVENT, {
      detail: {
        socketId: socket.id,
        userId: normalizedUserId
      }
    })
  );
}

export default function useInitSocket({
  chatType,
  currentPathId,
  onInit,
  selectedChannelId,
  subchannelPath,
  usingChatRef
}: {
  chatType: string;
  currentPathId: string | number;
  onInit: () => void;
  selectedChannelId: number;
  subchannelPath: string | null;
  usingChatRef: React.RefObject<boolean>;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const navigate = useNavigate();

  const category = useHomeContext((v) => v.state.category);
  const displayOrder = useHomeContext((v) => v.state.displayOrder);
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const feeds = useHomeContext((v) => v.state.feeds);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const feedsOutdated = useHomeContext((v) => v.state.feedsOutdated);
  const latestPathId = useChatContext((v) => v.state.latestPathId);
  const numNewPosts = useNotiContext((v) => v.state.numNewPosts);

  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);
  const onSetNumNewPosts = useNotiContext((v) => v.actions.onSetNumNewPosts);
  const onClearRecentChessMessage = useChatContext(
    (v) => v.actions.onClearRecentChessMessage
  );
  const onSetAICallEnding = useChatContext(
    (v) => v.actions.onSetAICallEnding
  );
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
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
  const countNewFeeds = useAppContext((v) => v.requestHelpers.countNewFeeds);
  const loadNewFeeds = useAppContext((v) => v.requestHelpers.loadNewFeeds);
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );

  const latestChatTypeRef = useRef(chatType);
  const latestPathIdRef = useRef(latestPathId);
  const selectedChannelIdRef = useRef(selectedChannelId);
  const isLoadingChatRef = useRef(false);
  const loadChatRetryTimerRef = useRef<number | null>(null);
  const loadChatRetryCountRef = useRef(0);
  const heartbeatTimerRef = useRef<number | null>(null);
  const userActionAckedRef = useRef(false);
  const userActionAttemptsRef = useRef(0);
  const actionRetryTimersRef = useRef<number[]>([]);
  const detachActionListenersRef = useRef<() => void>(() => {});
  const actionCaptureActiveRef = useRef(false);
  const retriesScheduledRef = useRef(false);
  const lastOutdatedCheckRef = useRef(0);
  const isCheckingOutdatedRef = useRef(false);
  const checkFeedsInflightRef = useRef<Promise<void> | null>(null);
  const checkFeedsRerunRequestedRef = useRef(false);
  const pendingHydrateFromOutdatedRef = useRef(false);
  const categoryRef = useRef(category);
  const displayOrderRef = useRef(displayOrder);
  const channelsObjRef = useRef(channelsObj);
  const feedsRef = useRef(feeds);
  const subFilterRef = useRef(subFilter);
  const numNewPostsRef = useRef(numNewPosts);
  const userIdRef = useRef(userId);
  const usernameRef = useRef(username);
  const profilePicUrlRef = useRef(profilePicUrl);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);
  useEffect(() => {
    profilePicUrlRef.current = profilePicUrl;
  }, [profilePicUrl]);
  useEffect(() => {
    categoryRef.current = category;
  }, [category]);
  useEffect(() => {
    displayOrderRef.current = displayOrder;
  }, [displayOrder]);
  useEffect(() => {
    channelsObjRef.current = channelsObj;
  }, [channelsObj]);
  useEffect(() => {
    feedsRef.current = feeds;
  }, [feeds]);
  useEffect(() => {
    subFilterRef.current = subFilter;
  }, [subFilter]);
  useEffect(() => {
    numNewPostsRef.current = numNewPosts;
  }, [numNewPosts]);
  useEffect(() => {
    if (displayOrder !== 'desc') {
      pendingHydrateFromOutdatedRef.current = false;
      if (feedsOutdated) {
        onSetFeedsOutdated(false);
      }
      if (numNewPosts !== 0) {
        onSetNumNewPosts(0);
      }
      return;
    }
    if (!pendingHydrateFromOutdatedRef.current) return;
    if (!feedsOutdated) {
      pendingHydrateFromOutdatedRef.current = false;
      return;
    }
    const newestVisibleFeed = feeds?.[0];
    if (!newestVisibleFeed?.lastInteraction) return;

    pendingHydrateFromOutdatedRef.current = false;
    if (numNewPosts === 0) {
      void hydrateNumNewPostsIfNeeded(newestVisibleFeed.lastInteraction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOrder, feeds, feedsOutdated, numNewPosts]);

  const checkFeedsOutdated = useCallback(
    async ({
      bypassThrottle = false,
      withFallback = true
    }: { bypassThrottle?: boolean; withFallback?: boolean } = {}) => {
      if (checkFeedsInflightRef.current) {
        checkFeedsRerunRequestedRef.current = true;
        return checkFeedsInflightRef.current;
      }

      checkFeedsInflightRef.current = (async () => {
        await runCheck(bypassThrottle);
        while (checkFeedsRerunRequestedRef.current) {
          checkFeedsRerunRequestedRef.current = false;
          await runCheck(true);
        }
      })().finally(() => {
        checkFeedsInflightRef.current = null;
      });

      return checkFeedsInflightRef.current;

      async function runCheck(bypass: boolean) {
        const now = Date.now();
        if (isCheckingOutdatedRef.current) return;
        if (!bypass && now - lastOutdatedCheckRef.current < 15000) return;

        if (displayOrderRef.current !== 'desc') {
          onSetFeedsOutdated(false);
          return;
        }

        const firstFeed = feedsRef.current?.[0];
        const currentCategory = categoryRef.current;
        const currentSubFilter = subFilterRef.current;
        if (
          firstFeed?.lastInteraction &&
          (currentCategory === 'uploads' || currentCategory === 'recommended')
        ) {
          isCheckingOutdatedRef.current = true;
          lastOutdatedCheckRef.current = now;
          try {
            const outdated = await checkIfHomeOutdated({
              lastInteraction: firstFeed.lastInteraction,
              category: currentCategory,
              subFilter: currentSubFilter
            });
            let flag = Array.isArray(outdated)
              ? outdated.length > 0
              : !!outdated;
            if (!flag && withFallback && currentCategory === 'uploads') {
              try {
                const newFeeds = await loadNewFeeds({
                  lastInteraction: firstFeed.lastInteraction
                });
                flag = Array.isArray(newFeeds)
                  ? newFeeds.length > 0
                  : !!newFeeds;
              } catch {}
            }
            if (flag) {
              await hydrateNumNewPostsIfNeeded(firstFeed.lastInteraction);
            }
            onSetFeedsOutdated(flag);
          } catch {
            // ignore transient errors
          } finally {
            isCheckingOutdatedRef.current = false;
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    latestChatTypeRef.current = chatType;
  }, [chatType]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

  useEffect(() => {
    selectedChannelIdRef.current = selectedChannelId;
  }, [selectedChannelId]);

  useEffect(() => {
    if (userId) return;
    if (loadChatRetryTimerRef.current) {
      clearTimeout(loadChatRetryTimerRef.current);
      loadChatRetryTimerRef.current = null;
    }
    loadChatRetryCountRef.current = 0;
  }, [userId]);

  useEffect(() => {
    let socketHealthCheckTimer: number | null = null;
    let currentPongHandler: (() => void) | null = null;
    let pongReceived = false;

    function checkSocketHealth() {
      if (!socket.connected) {
        logForAdmin({
          message:
            'Socket disconnected during health check - attempting reconnect'
        });
        try {
          socket.connect();
        } catch {}
        return;
      }

      if (socketHealthCheckTimer) {
        clearTimeout(socketHealthCheckTimer);
        socketHealthCheckTimer = null;
      }
      if (currentPongHandler) {
        socket.off('pong_received', currentPongHandler);
        currentPongHandler = null;
      }

      pongReceived = false;

      const handlePong = () => {
        pongReceived = true;
      };
      currentPongHandler = handlePong;
      socket.once('pong_received', handlePong);

      socket.emit('socket_health_ping');

      socketHealthCheckTimer = window.setTimeout(() => {
        socket.off('pong_received', handlePong);
        currentPongHandler = null;
        if (!pongReceived && socket.connected) {
          logForAdmin({
            message: 'Socket health check failed - forcing reconnect'
          });
          socket.disconnect();
          socket.connect();
        }
      }, 3000);
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkFeedsOutdated();
        checkSocketHealth();
      }
    }

    async function onPageShow() {
      try {
        socket.emit('presence_ping');
      } catch {}
      void checkFeedsOutdated();
      checkSocketHealth();
      try {
        const data = await checkVersion();
        onCheckVersion(data);
      } catch {}
    }

    const onFocus = () => {
      void checkFeedsOutdated();
      checkSocketHealth();
    };
    const onOnline = () => {
      void checkFeedsOutdated();
      checkSocketHealth();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (socketHealthCheckTimer) {
        clearTimeout(socketHealthCheckTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkFeedsOutdated]);

  useEffect(() => {
    socket.on('online_acknowledged', handleOnlineAcknowledged);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('home_outdated', handleHomeOutdated);

    return function cleanUp() {
      socket.off('online_acknowledged', handleOnlineAcknowledged);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('home_outdated', handleHomeOutdated);
      if (loadChatRetryTimerRef.current) {
        clearTimeout(loadChatRetryTimerRef.current);
        loadChatRetryTimerRef.current = null;
      }
    };

    function handleOnlineAcknowledged() {
      userActionAckedRef.current = true;
      handleStopUserActionCapture();
    }

    function handleHomeOutdated() {
      if (displayOrderRef.current !== 'desc') {
        onSetFeedsOutdated(false);
        pendingHydrateFromOutdatedRef.current = false;
        return;
      }
      onSetFeedsOutdated(true);
      const firstFeed = feedsRef.current?.[0];
      if (firstFeed?.lastInteraction) {
        pendingHydrateFromOutdatedRef.current = false;
        if (numNewPostsRef.current === 0) {
          void hydrateNumNewPostsIfNeeded(firstFeed.lastInteraction);
        }
        return;
      }
      pendingHydrateFromOutdatedRef.current = true;
    }

    function handleConnect() {
      logForAdmin({
        message: 'connected to socket'
      });

      onChangeSocketStatus(true);

      // Start capturing user actions immediately upon connect
      handleStartUserActionCapture();

      const shouldSkipReload = isLoadingChatRef.current;

      onClearRecentChessMessage(selectedChannelIdRef.current);
      handleCheckVersion();
      void checkFeedsOutdated({ bypassThrottle: true, withFallback: true });

      if (userIdRef.current) {
        if (loadChatRetryTimerRef.current) {
          clearTimeout(loadChatRetryTimerRef.current);
          loadChatRetryTimerRef.current = null;
        }
        loadChatRetryCountRef.current = 0;

        const token = getStoredItem('token');
        const deviceId = getTwinkleDeviceId();
        socket.emit(
          'bind_uid_to_socket',
          {
            userId: userIdRef.current,
            username: usernameRef.current,
            profilePicUrl: profilePicUrlRef.current,
            token,
            deviceId
          },
          (result?: { authError?: boolean }) => {
            if (result?.authError) {
              // Token is invalid (e.g., password was changed)
              window.location.reload();
              return;
            }
            dispatchSocketAuthReady(userIdRef.current);
            socket.emit('change_busy_status', !usingChatRef.current);
            userActionAckedRef.current = false;
            userActionAttemptsRef.current = 0;
            handleStartUserActionCapture();
            handleCheckVersion();
            void checkFeedsOutdated({
              bypassThrottle: true,
              withFallback: true
            });
          }
        );
        socket.emit('enter_my_notification_channel', userIdRef.current);

        if (!shouldSkipReload) {
          handleGetNumberOfUnreadMessages();
          handleLoadChat({ selectedChannelId: selectedChannelIdRef.current });
        }
        // Start heartbeat to keep presence accurate (handles sleep/network drops)
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = window.setInterval(() => {
          if (userIdRef.current) socket.emit('user_heartbeat');
        }, 15000);
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
      selectedChannelId
    }: {
      selectedChannelId: number;
    }): Promise<void> {
      onSetReconnecting();
      isLoadingChatRef.current = true;
      let didInitChat = false;

      try {
        onInit();
        const pathId = Number(currentPathId);
        let currentChannelIsAccessible = true;
        let currentChannelIsPublic = false;
        let currentChannelId = 0;

        if (!isNaN(pathId) && userIdRef.current) {
          const { isAccessible, isPublic, channelId } =
            await checkChatAccessible(pathId);
          currentChannelIsAccessible = isAccessible;
          currentChannelIsPublic = isPublic;
          currentChannelId = channelId;
        }

        logForAdmin({
          message: 'Loading chat...'
        });
        const startTime = Date.now();

        const data = await loadChat({
          channelId: !isNaN(pathId)
            ? parseChannelPath(pathId)
            : selectedChannelId,
          subchannelPath
        });

        const endTime = Date.now();
        const chatLoadingTime = (endTime - startTime) / 1000;
        logForAdmin({
          message: `Chat loaded in ${chatLoadingTime} seconds`
        });
        loadChatRetryCountRef.current = 0;
        if (loadChatRetryTimerRef.current) {
          clearTimeout(loadChatRetryTimerRef.current);
          loadChatRetryTimerRef.current = null;
        }

        onInitChat({ data, userId: userIdRef.current });
        didInitChat = true;

        const latestPathId = latestPathIdRef.current;
        const latestPathIdMatchesCurrentPath =
          !isNaN(pathId) && Number(latestPathId) === Number(pathId);

        if (
          latestPathId &&
          (data.currentPathId !== latestPathId || data.chatType) &&
          userIdRef.current &&
          (isNaN(pathId) || latestPathIdMatchesCurrentPath)
        ) {
          const channelId = parseChannelPath(latestPathId);
          const { isAccessible, isPublic } =
            await checkChatAccessible(latestPathId);
          if (!isAccessible) {
            if (isPublic) {
              if (!channelPathIdHash[latestPathId]) {
                onUpdateChannelPathIdHash({ channelId, pathId: latestPathId });
              }
              const { channel, joinMessage } =
                await acceptInvitation(channelId);
              if (channel.id === channelId) {
                socket.emit('join_chat_group', channel.id);
                socket.emit('new_chat_message', {
                  message: {
                    ...joinMessage,
                    isLoaded: true
                  },
                  channel: {
                    id: channel.id,
                    channelName: channel.channelName,
                    pathId: channel.pathId
                  },
                  newMembers: [
                    {
                      id: userIdRef.current,
                      username: usernameRef.current,
                      profilePicUrl: profilePicUrlRef.current
                    }
                  ]
                });
              }
            } else {
              // Check if this is an AI DM channel before forcing navigation to general
              const channel = channelsObjRef.current[channelId];
              const isAIDM =
                channel?.twoPeople &&
                channel?.members?.some(
                  (m: { id: number }) =>
                    m.id === ZERO_TWINKLE_ID || m.id === CIEL_TWINKLE_ID
                );
              if (!isAIDM) {
                onUpdateSelectedChannelId(GENERAL_CHAT_ID);
                if (usingChatRef.current) {
                  navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, {
                    replace: true
                  });
                }
                return;
              }
              // For AI DM channels, continue loading - don't redirect
            }
          }

          if (channelId > 0) {
            if (!channelPathIdHash[latestPathId]) {
              onUpdateChannelPathIdHash({ channelId, pathId: latestPathId });
            }
            const channelData = await loadChatChannel({
              channelId,
              subchannelPath
            });
            onEnterChannelWithId(channelData);
            for (const member of channelData?.channel?.members || []) {
              onSetUserState({
                userId: member.id,
                newState: member
              });
            }
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
            onlineUsers,
            recentOfflineUsers
          }: {
            onlineUsers: { userId: number; username: string }[];
            recentOfflineUsers?: any[];
          }) => {
            onSetOnlineUsers({
              channelId: selectedChannelId,
              onlineUsers,
              recentOfflineUsers: recentOfflineUsers || []
            });
          }
        );
        if (!currentChannelIsAccessible) {
          if (currentChannelIsPublic) {
            if (!channelPathIdHash[pathId]) {
              onUpdateChannelPathIdHash({
                channelId: currentChannelId,
                pathId
              });
            }
            const { channel, joinMessage } =
              await acceptInvitation(currentChannelId);
            if (channel.id === currentChannelId) {
              socket.emit('join_chat_group', channel.id);
              socket.emit('new_chat_message', {
                message: joinMessage,
                channel: {
                  id: channel.id,
                  channelName: channel.channelName,
                  pathId: channel.pathId
                },
                newMembers: [{ id: userId, username, profilePicUrl }]
              });
            }
          } else {
            // Check if this is an AI DM channel before forcing navigation to general
            const channel = channelsObjRef.current[currentChannelId];
            const isAIDM =
              channel?.twoPeople &&
              channel?.members?.some(
                (m: { id: number }) =>
                  m.id === ZERO_TWINKLE_ID || m.id === CIEL_TWINKLE_ID
              );
            if (!isAIDM) {
              onUpdateSelectedChannelId(GENERAL_CHAT_ID);
              if (usingChatRef.current) {
                navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
              }
            }
            // For AI DM channels, don't redirect
          }
        }
      } catch (error) {
        if (!didInitChat) {
          console.error('Failed to load chat:', error);
          scheduleLoadChatRetry();
        } else {
          console.error('Failed to sync post-load chat state:', error);
        }
      } finally {
        isLoadingChatRef.current = false;
      }
    }

    function scheduleLoadChatRetry() {
      if (loadChatRetryTimerRef.current || !userIdRef.current) return;
      const delay = Math.min(1000 * 2 ** loadChatRetryCountRef.current, 10000);
      loadChatRetryCountRef.current += 1;
      logForAdmin({
        message: `Retrying chat load in ${Math.round(delay / 1000)}s`
      });
      loadChatRetryTimerRef.current = window.setTimeout(() => {
        loadChatRetryTimerRef.current = null;
        if (!userIdRef.current) {
          loadChatRetryCountRef.current = 0;
          return;
        }
        if (!socket.connected || isLoadingChatRef.current) return;
        void handleLoadChat({ selectedChannelId: selectedChannelIdRef.current });
      }, delay);
    }

    function handleDisconnect(reason: string) {
      logForAdmin({
        message: `disconnected from socket. reason: ${reason}`
      });
      onSetAICallEnding(false);
      onChangeSocketStatus(false);

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      handleStopUserActionCapture();

      if (reason === 'io server disconnect') {
        setTimeout(() => {
          try {
            socket.connect();
          } catch {}
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inform server of away/visible status — helps server detect long-away sessions reliably
  useEffect(() => {
    const emitVisible = () => socket.emit('change_away_status', true);
    const emitHidden = () => socket.emit('change_away_status', false);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') emitVisible();
      else emitHidden();
    };

    const onOnline = () => {
      if (document.visibilityState === 'visible') emitVisible();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', emitVisible);
    window.addEventListener('blur', emitHidden);
    window.addEventListener('online', onOnline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', emitVisible);
      window.removeEventListener('blur', emitHidden);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Track previous userId to properly leave old notification channel
  const prevUserIdRef = useRef<number | undefined>(undefined);

  // Rebind socket when user changes (login/logout/switch account)
  useEffect(() => {
    if (!socket.connected) {
      prevUserIdRef.current = userId;
      return;
    }

    // Leave previous user's notification channel if switching users
    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      socket.emit('leave_my_notification_channel', prevUserIdRef.current);
    }

    if (userId) {
      // User logged in - bind socket to new user
      const token = getStoredItem('token');
      const deviceId = getTwinkleDeviceId();
      socket.emit(
        'bind_uid_to_socket',
        { userId, username, profilePicUrl, token, deviceId },
        (result?: { authError?: boolean }) => {
          if (result?.authError) {
            window.location.reload();
            return;
          }
          dispatchSocketAuthReady(userId);
        }
      );
      socket.emit('enter_my_notification_channel', userId);
    }

    prevUserIdRef.current = userId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function handleStartUserActionCapture() {
    if (userActionAckedRef.current) return;
    if (actionCaptureActiveRef.current) return; // prevent duplicate attachments

    const events = [
      'pointerdown',
      'click',
      'keydown',
      'input',
      'compositionend',
      'wheel'
    ] as const;
    // Use capture phase to avoid components stopping propagation on key events
    events.forEach((e) => window.addEventListener(e, handler, true));
    // touchstart must be passive to avoid blocking iOS tap events
    window.addEventListener('touchstart', handler, {
      capture: true,
      passive: true
    });
    actionCaptureActiveRef.current = true;
    detachActionListenersRef.current = () => {
      events.forEach((e) => window.removeEventListener(e, handler, true));
      window.removeEventListener('touchstart', handler, true);
      actionRetryTimersRef.current.forEach((t) => clearTimeout(t));
      actionRetryTimersRef.current = [];
      retriesScheduledRef.current = false;
      actionCaptureActiveRef.current = false;
    };

    function handler(e: Event) {
      if (userActionAckedRef.current) return;
      // Ignore scripted/synthetic events; accept only real user input
      if (!(e as any)?.isTrusted) return;
      handleSendUserActionPing();

      // Two quick retries to improve reliability if the first emit/ack drops.
      // Only schedule once to avoid stacking retries on rapid inputs.
      if (!retriesScheduledRef.current) {
        retriesScheduledRef.current = true;
        actionRetryTimersRef.current.push(
          window.setTimeout(() => handleSendUserActionPing(true), 250),
          window.setTimeout(() => handleSendUserActionPing(true), 1000)
        );
      }

      function handleSendUserActionPing(isRetrying: boolean = false) {
        userActionAttemptsRef.current = userActionAttemptsRef.current || 0;
        if (userActionAckedRef.current) return;
        if (userActionAttemptsRef.current >= 3) return;
        if (!isRetrying) userActionAttemptsRef.current += 1;
        socket.emit('presence_user_action', { type: (e as any)?.type });
      }
    }
  }

  function handleStopUserActionCapture() {
    if (actionCaptureActiveRef.current) {
      detachActionListenersRef.current?.();
    }
  }

  async function hydrateNumNewPostsIfNeeded(lastInteraction: number) {
    if (!lastInteraction) return;
    if (numNewPostsRef.current > 0) return;
    try {
      const count = await countNewFeeds({ lastInteraction });
      const parsedCount = Number(count);
      if (!Number.isFinite(parsedCount)) {
        throw new Error('Invalid new feed count');
      }
      if (parsedCount > 0 && numNewPostsRef.current === 0) {
        onSetNumNewPosts(parsedCount);
      }
      return;
    } catch {
      // ignore transient errors
    }

    if (numNewPostsRef.current > 0) return;
    try {
      const fallbackFeeds = await loadNewFeeds({ lastInteraction });
      const fallbackCount = Array.isArray(fallbackFeeds)
        ? fallbackFeeds.length
        : 0;
      if (fallbackCount > 0 && numNewPostsRef.current === 0) {
        onSetNumNewPosts(fallbackCount);
      }
    } catch {
      // ignore transient errors
    }
  }
}
