import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  ZERO_TWINKLE_ID,
  CIEL_TWINKLE_ID,
  clientVersion
} from '~/constants/defaultValues';
import { emitAdminTelemetry, parseChannelPath } from '~/helpers';
import {
  clearSocketAuthReady,
  markSocketAuthReady,
  SOCKET_BIND_ACK_TIMEOUT_MS
} from '~/helpers/socketAuthReady';
import {
  nextChatBootstrapId,
  recordChatBootstrapEvent,
  flushChatBootstrapHistory
} from '~/helpers/chatBootstrapDebug';
import { getStoredItem, getTwinkleDeviceId } from '~/helpers/userDataHelpers';
import {
  useAppContext,
  useExploreContext,
  useHomeContext,
  useInputContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { emitAcceptedChatGroupMembership } from '~/helpers/chatGroupMembership';
import { TWINKLE_CLIENT_REFRESH_REQUIRED_EVENT } from '~/constants/socketEvents';
import {
  applyClientVersionResult,
  armUpdateIfDeployedBundleNewer,
  attemptSilentClientUpdate,
  hasUnsavedUserWork,
  isClientUpdatePending
} from '~/helpers/clientUpdate';
import { loadFreshCanonicalChatGlobalUnreadCount } from '~/helpers/chatGlobalUnreadReconciler';
import {
  invalidateFeaturedSubjectsRequests,
  loadLatestCanonicalFeaturedSubjects
} from '~/helpers/featuredSubjects';
import { getServerDisconnectReconnectDelayMs } from '~/helpers/socketRecovery';
import {
  getChatProjectionActivityRevision,
  markChatProjectionSocketEvent
} from '~/helpers/chatUnreadActivity';

function dispatchSocketAuthReady(userId?: number | null) {
  markSocketAuthReady(userId);
}

const SOCKET_BIND_RETRY_DELAY_MS = 1000;

interface SocketBindPayload {
  userId: number;
  username?: string;
  profilePicUrl?: string;
  token?: string | null;
  deviceId?: string;
}

interface SocketBindResult {
  authError?: boolean;
  bindError?: boolean;
  chatRoomsChanged?: boolean;
}

function emitSocketBind({
  payload,
  onAcknowledged,
  onFailure
}: {
  payload: SocketBindPayload;
  onAcknowledged: (result?: SocketBindResult) => void;
  onFailure: (error: Error) => void;
}) {
  socket
    .timeout(SOCKET_BIND_ACK_TIMEOUT_MS)
    .emit(
      'bind_uid_to_socket',
      payload,
      (error: Error | null, result?: SocketBindResult) => {
        if (error) {
          onFailure(error);
          return;
        }
        if (result?.bindError) {
          onFailure(new Error('Socket bind failed'));
          return;
        }
        onAcknowledged(result);
      }
    );
}

export default function useInitSocket({
  chatBusyRef,
  chatType,
  currentPathId,
  onInit,
  selectedChannelId,
  subchannelPath,
  usingChatRef
}: {
  chatBusyRef: React.RefObject<boolean>;
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
  const chatLoaded = useChatContext((v) => v.state.loaded);
  const latestPathId = useChatContext((v) => v.state.latestPathId);
  const loadedForUserId = useChatContext((v) => v.state.loadedForUserId);
  const numNewPosts = useNotiContext((v) => v.state.numNewPosts);

  const onChangeSocketStatus = useNotiContext(
    (v) => v.actions.onChangeSocketStatus
  );
  const onCheckVersion = useNotiContext((v) => v.actions.onCheckVersion);
  const onSetNumNewPosts = useNotiContext((v) => v.actions.onSetNumNewPosts);
  const onClearRecentChessMessage = useChatContext(
    (v) => v.actions.onClearRecentChessMessage
  );
  const onSetAICallEnding = useChatContext((v) => v.actions.onSetAICallEnding);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );
  const onFinishChatBootstrap = useChatContext(
    (v) => v.actions.onFinishChatBootstrap
  );
  const onFinishReconnecting = useChatContext(
    (v) => v.actions.onFinishReconnecting
  );
  const onInitChat = useChatContext((v) => v.actions.onInitChat);
  const onStartChatBootstrap = useChatContext(
    (v) => v.actions.onStartChatBootstrap
  );
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );
  const onSetFeaturedSubjectsLoaded = useHomeContext(
    (v) => v.actions.onSetFeaturedSubjectsLoaded
  );
  const onLoadFeaturedSubjects = useExploreContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const onSetOnlinePresenceSnapshot = useChatContext(
    (v) => v.actions.onSetOnlinePresenceSnapshot
  );
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
  const loadFeaturedSubjects = useAppContext(
    (v) => v.requestHelpers.loadFeaturedSubjects
  );
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const getInputState = useInputContext((v) => v.getInputState);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );

  const latestChatTypeRef = useRef(chatType);
  const latestPathIdRef = useRef(latestPathId);
  const selectedChannelIdRef = useRef(selectedChannelId);
  const currentPathIdRef = useRef(currentPathId);
  const subchannelPathRef = useRef(subchannelPath);
  const chatLoadedRef = useRef(chatLoaded);
  const loadedForUserIdRef = useRef(loadedForUserId);
  const didSocketDisconnectRef = useRef(false);
  const socketDisconnectSequenceRef = useRef(0);
  const boundSocketIdRef = useRef<string | null>(null);
  const isLoadingChatRef = useRef(false);
  // When the currently-owning bootstrap attempt began its loadChat (0 = none in
  // flight). The watchdog uses this to tell a healthy slow load from a hung one.
  const bootstrapStartedAtRef = useRef(0);
  const activeBootstrapIdRef = useRef<string | null>(null);
  const lastFailedBootstrapIdRef = useRef<string | null>(null);
  const loadChatRetryTimerRef = useRef<number | null>(null);
  const loadChatRetryCountRef = useRef(0);
  const heartbeatTimerRef = useRef<number | null>(null);
  const serverDisconnectReconnectTimerRef = useRef<number | null>(null);
  const socketBindRetryTimerRef = useRef<number | null>(null);
  const socketBindAttemptRef = useRef(0);
  const wakeReconcileInFlightRef = useRef(false);
  const bootstrapAwaitingBindUserIdRef = useRef<number | null>(userId || null);
  const userActionAckedRef = useRef(false);
  const userActionAttemptsRef = useRef(0);
  const actionRetryTimersRef = useRef<number[]>([]);
  const detachActionListenersRef = useRef<() => void>(() => {});
  const actionCaptureActiveRef = useRef(false);
  const retriesScheduledRef = useRef(false);
  const lastOutdatedCheckRef = useRef(0);
  const isCheckingOutdatedRef = useRef(false);
  // Silent-update eligibility: a stale bundle may only reload itself at an
  // "arrival" moment (fresh load, or a tab resumed after a long suspension)
  // and only while the user hasn't interacted yet, so the reload can never
  // destroy in-progress typing. A genuine mandatory mismatch can fall back to
  // the popup; a feature-specific 426 never blockades the site.
  const hiddenAtRef = useRef(0);
  const interactedSinceArrivalRef = useRef(false);
  const COLD_RESUME_MS = 5 * 60 * 1000;

  function handleMarkArrivalIfCold() {
    // A resume after a short hide (quick app switch) keeps whatever the user
    // was doing in flight, so it does not reopen silent-update eligibility.
    const hiddenAt = hiddenAtRef.current;
    if (!hiddenAt || Date.now() - hiddenAt > COLD_RESUME_MS) {
      interactedSinceArrivalRef.current = false;
    }
  }

  function markSocketTransportGap(confirmedFailure = false) {
    if (confirmedFailure || !didSocketDisconnectRef.current) {
      socketDisconnectSequenceRef.current += 1;
    }
    didSocketDisconnectRef.current = true;
    boundSocketIdRef.current = null;
    wakeReconcileInFlightRef.current = false;
    if (
      chatLoadedRef.current &&
      loadedForUserIdRef.current === userIdRef.current
    ) {
      onSetReconnecting();
    }
  }

  function requestChatWakeBarrier(reason: 'focus' | 'online' | 'pageshow') {
    const bindingUserId = Number(userIdRef.current || 0);
    const hasCurrentChatProjection =
      bindingUserId > 0 &&
      chatLoadedRef.current &&
      Number(loadedForUserIdRef.current || 0) === bindingUserId;
    if (!hasCurrentChatProjection) return;

    // Keep the last confirmed projection visible, but close every message-send
    // path until the server proves this exact socket still owns its canonical
    // room membership. A real disconnect already owns the stronger writer
    // resync and must not be displaced by a competing wake bind.
    onSetReconnecting();
    if (
      !socket.connected ||
      didSocketDisconnectRef.current ||
      isLoadingChatRef.current ||
      activeBootstrapIdRef.current ||
      lastFailedBootstrapIdRef.current ||
      loadChatRetryTimerRef.current ||
      wakeReconcileInFlightRef.current
    ) {
      return;
    }

    wakeReconcileInFlightRef.current = true;
    const expectedSocketId = socket.id;
    recordChatBootstrapEvent('chat-wake-barrier-start', {
      reason,
      userId: bindingUserId,
      socketId: expectedSocketId || null
    });
    bindSocketToUser({
      bindingUserId,
      onBound(result) {
        const sameContinuousSession =
          socket.connected &&
          socket.id === expectedSocketId &&
          !didSocketDisconnectRef.current;
        const canonicalRecoveryOwnsGate =
          isLoadingChatRef.current ||
          !!activeBootstrapIdRef.current ||
          !!lastFailedBootstrapIdRef.current ||
          !!loadChatRetryTimerRef.current;
        if (
          bindingUserId !== Number(userIdRef.current || 0) ||
          !sameContinuousSession ||
          canonicalRecoveryOwnsGate
        ) {
          return;
        }
        // Socket.IO preserves packet ordering within one session, and the
        // server reconciles room ids from the writer before acknowledging. A
        // membership delta also requires a writer-backed projection refresh;
        // an unchanged room set can safely keep the rendered conversation.
        recordChatBootstrapEvent('chat-wake-barrier-acknowledged', {
          reason,
          userId: bindingUserId,
          socketId: socket.id || null,
          chatRoomsChanged: Boolean(result?.chatRoomsChanged)
        });
        if (result?.chatRoomsChanged) {
          void handleLoadChatRef.current?.({
            selectedChannelId: selectedChannelIdRef.current,
            fromWriter: true
          });
          return;
        }
        onFinishReconnecting();
      },
      onBindSettled() {
        wakeReconcileInFlightRef.current = false;
      }
    });
  }

  function handleVersionData(
    data: unknown,
    trigger: 'arrival' | 'staleActionError'
  ) {
    applyClientVersionResult({
      data,
      trigger,
      version: clientVersion,
      interactedSinceArrival: interactedSinceArrivalRef.current,
      hasUnsavedWork: () =>
        hasUnsavedUserWork({ inputState: getInputState?.() }),
      onVersionStatus: onCheckVersion,
      // Compatible is not the same as current. Wake/reconnect learns whether
      // a newer entry bundle exists, then a safe navigation/hidden boundary
      // applies it without interrupting a working client.
      onCompatibleArrival: () => {
        void armUpdateIfDeployedBundleNewer();
      }
    });
  }
  const checkFeedsInflightRef = useRef<Promise<void> | null>(null);
  const checkFeedsRerunRequestedRef = useRef(false);
  const pendingHydrateFromOutdatedRef = useRef(false);
  const channelPathIdHashRef = useRef(channelPathIdHash);
  const autoLoadDecisionSignatureRef = useRef('');
  const [loadChatHandlerVersion, bumpLoadChatHandlerVersion] = useReducer(
    (version) => version + 1,
    0
  );
  const handleLoadChatRef = useRef<
    | (({
        selectedChannelId,
        fromWriter
      }: {
        selectedChannelId: number;
        fromWriter?: boolean;
      }) => Promise<void>)
    | null
  >(null);
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
    const previousUserId = userIdRef.current;
    userIdRef.current = userId;
    if (previousUserId === userId) return;

    // A bootstrap belongs to the account that started it. Retire that attempt
    // before the autoload effect considers the replacement account; otherwise
    // the old request can keep the shared in-flight gate closed and later mark
    // the new account as loaded with a reducer-rejected snapshot.
    const staleBootstrapId = activeBootstrapIdRef.current;
    activeBootstrapIdRef.current = null;
    isLoadingChatRef.current = false;
    bootstrapStartedAtRef.current = 0;
    lastFailedBootstrapIdRef.current = null;
    loadChatRetryCountRef.current = 0;
    autoLoadDecisionSignatureRef.current = '';
    bootstrapAwaitingBindUserIdRef.current = userId || null;
    if (loadChatRetryTimerRef.current) {
      clearTimeout(loadChatRetryTimerRef.current);
      loadChatRetryTimerRef.current = null;
    }
    if (staleBootstrapId) {
      onFinishChatBootstrap(staleBootstrapId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    channelPathIdHashRef.current = channelPathIdHash;
  }, [channelPathIdHash]);
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
    chatLoadedRef.current = chatLoaded;
  }, [chatLoaded]);

  useEffect(() => {
    loadedForUserIdRef.current = loadedForUserId;
  }, [loadedForUserId]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

  useEffect(() => {
    selectedChannelIdRef.current = selectedChannelId;
  }, [selectedChannelId]);

  useEffect(() => {
    currentPathIdRef.current = currentPathId;
  }, [currentPathId]);

  useEffect(() => {
    subchannelPathRef.current = subchannelPath;
  }, [subchannelPath]);

  useEffect(() => {
    if (userId) return;
    clearSocketAuthReady();
    socketBindAttemptRef.current += 1;
    wakeReconcileInFlightRef.current = false;
    boundSocketIdRef.current = null;
    clearSocketBindRetryTimer();
    if (loadChatRetryTimerRef.current) {
      clearTimeout(loadChatRetryTimerRef.current);
      loadChatRetryTimerRef.current = null;
    }
    loadChatRetryCountRef.current = 0;
  }, [userId]);

  useEffect(() => {
    function ensureSocketConnected() {
      // Socket.IO's transport ping/pong owns connection health. An
      // application-level acknowledgement can be delayed by tab throttling and
      // must not turn a confirmed connection into a synthetic disconnect.
      if (socket.connected) return;
      // A resume can observe the disconnected transport before Socket.IO's
      // disconnect callback has run. Preserve the same canonical-resync
      // invariant instead of treating the next connect as a clean cold bind.
      markSocketTransportGap();
      emitAdminTelemetry({
        message: 'Socket disconnected on resume - attempting reconnect'
      });
      try {
        socket.connect();
      } catch {}
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const resumedFromHidden = hiddenAtRef.current > 0;
        handleMarkArrivalIfCold();
        checkFeedsOutdated();
        ensureSocketConnected();
        if (resumedFromHidden) {
          hiddenAtRef.current = 0;
          requestChatWakeBarrier('focus');
        }
      } else {
        hiddenAtRef.current = Date.now();
        // A hidden tab is the one moment a reload is guaranteed invisible, so
        // apply a deferred update here — unless typed text would be lost.
        if (
          isClientUpdatePending() &&
          !hasUnsavedUserWork({ inputState: getInputState?.() })
        ) {
          attemptSilentClientUpdate({ version: clientVersion });
        }
      }
    }

    async function onPageShow(event: PageTransitionEvent) {
      const resumedFromHidden = hiddenAtRef.current > 0;
      handleMarkArrivalIfCold();
      try {
        socket.emit('presence_ping');
      } catch {}
      void checkFeedsOutdated();
      ensureSocketConnected();
      if (resumedFromHidden || event.persisted) {
        hiddenAtRef.current = 0;
        requestChatWakeBarrier('pageshow');
      }
      try {
        const data = await checkVersion();
        handleVersionData(data, 'arrival');
      } catch {}
    }

    async function onClientRefreshRequired() {
      try {
        const data = await checkVersion();
        handleVersionData(data, 'staleActionError');
      } catch {}
    }

    function onUserInteraction() {
      interactedSinceArrivalRef.current = true;
    }

    const onFocus = () => {
      const resumedFromHidden = hiddenAtRef.current > 0;
      if (resumedFromHidden) handleMarkArrivalIfCold();
      void checkFeedsOutdated();
      ensureSocketConnected();
      if (resumedFromHidden) {
        hiddenAtRef.current = 0;
        requestChatWakeBarrier('focus');
      }
    };
    const onOnline = () => {
      void checkFeedsOutdated();
      ensureSocketConnected();
      if (document.visibilityState === 'visible') {
        requestChatWakeBarrier('online');
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pointerdown', onUserInteraction, {
      capture: true,
      passive: true
    });
    window.addEventListener('keydown', onUserInteraction, {
      capture: true,
      passive: true
    });
    window.addEventListener(
      TWINKLE_CLIENT_REFRESH_REQUIRED_EVENT,
      onClientRefreshRequired
    );
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('pointerdown', onUserInteraction, {
        capture: true
      });
      window.removeEventListener('keydown', onUserInteraction, {
        capture: true
      });
      window.removeEventListener(
        TWINKLE_CLIENT_REFRESH_REQUIRED_EVENT,
        onClientRefreshRequired
      );
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkFeedsOutdated]);

  useEffect(() => {
    const handleChatProjectionSocketEvent = (eventName: string) => {
      markChatProjectionSocketEvent(eventName);
    };
    socket.onAny(handleChatProjectionSocketEvent);
    socket.on('online_acknowledged', handleOnlineAcknowledged);
    socket.on('online_status_changed', handleSelfPresenceDemoted);
    socket.on('away_status_changed', handleSelfAwayDemoted);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('home_outdated', handleHomeOutdated);

    onChangeSocketStatus(socket.connected);

    return function cleanUp() {
      socket.offAny(handleChatProjectionSocketEvent);
      socket.off('online_acknowledged', handleOnlineAcknowledged);
      socket.off('online_status_changed', handleSelfPresenceDemoted);
      socket.off('away_status_changed', handleSelfAwayDemoted);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('home_outdated', handleHomeOutdated);
      if (loadChatRetryTimerRef.current) {
        clearTimeout(loadChatRetryTimerRef.current);
        loadChatRetryTimerRef.current = null;
      }
      if (serverDisconnectReconnectTimerRef.current) {
        clearTimeout(serverDisconnectReconnectTimerRef.current);
        serverDisconnectReconnectTimerRef.current = null;
      }
      socketBindAttemptRef.current += 1;
      clearSocketBindRetryTimer();
      handleLoadChatRef.current = null;
    };

    function handleOnlineAcknowledged() {
      userActionAckedRef.current = true;
      handleStopUserActionCapture();
    }

    // The qualification capture is one-shot: after online_acknowledged the
    // listeners detach and ordinary input produces no socket-visible signal,
    // so the server's idle sweep can demote a user who is actively using the
    // site (away after 10min, offline after 45min of socket silence — typical
    // of a long chess game in an always-visible tab, where moves travel over
    // HTTP). When this socket sees its own user demoted, re-arm the capture so
    // the next trusted input re-qualifies via presence_user_action and the
    // server promotes the user back online. A legitimately hidden tab re-arms
    // harmlessly: no trusted input fires until the user actually returns.
    function handleSelfPresenceDemoted({
      userId,
      isOnline
    }: {
      userId: number;
      isOnline: boolean;
    }) {
      if (isOnline) return;
      if (Number(userId) !== Number(userIdRef.current)) return;
      handleRearmUserActionCapture();
    }

    function handleSelfAwayDemoted({
      userId,
      isAway
    }: {
      userId: number;
      isAway: boolean;
    }) {
      if (!isAway) return;
      if (Number(userId) !== Number(userIdRef.current)) return;
      handleRearmUserActionCapture();
    }

    function handleRearmUserActionCapture() {
      if (!userIdRef.current) return;
      handleStopUserActionCapture();
      userActionAckedRef.current = false;
      userActionAttemptsRef.current = 0;
      handleStartUserActionCapture();
    }

    function handleHomeOutdated({
      featuredSubjects = false
    }: { featuredSubjects?: boolean } = {}) {
      if (featuredSubjects === true) {
        invalidateFeaturedSubjectsRequests();
        void refreshFeaturedSubjects();
        return;
      }
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

    async function refreshFeaturedSubjects() {
      const requestUserId = userIdRef.current;
      try {
        const subjects = await loadLatestCanonicalFeaturedSubjects({
          load: loadFeaturedSubjects,
          isCurrentOwner: () => userIdRef.current === requestUserId
        });
        if (!subjects) return;
        onLoadFeaturedSubjects(subjects);
        onSetFeaturedSubjectsLoaded(true);
      } catch (error) {
        if (userIdRef.current !== requestUserId) return;
        console.error('Failed to refresh Featured Subjects:', error);
      }
    }

    async function handleCheckVersion() {
      try {
        const data = await checkVersion();
        handleVersionData(data, 'arrival');
      } catch {}
    }

    async function handleGetNumberOfUnreadMessages({
      expectedUserId
    }: {
      expectedUserId?: number;
    } = {}) {
      const requestUserId = Number(expectedUserId || userIdRef.current || 0);
      const numUnreads = await loadFreshCanonicalChatGlobalUnreadCount({
        // Chat bootstrap may itself have advanced a read watermark. Always
        // read this derived badge from the writer so replica lag cannot revive
        // the pre-open unread state after the channel response arrives.
        load: () => getNumberOfUnreadMessages({ fromWriter: true }),
        isCurrentOwner: () =>
          requestUserId > 0 && Number(userIdRef.current || 0) === requestUserId
      });
      if (numUnreads !== null) {
        onGetNumberOfUnreadMessages(numUnreads);
      }
    }

    function handleConnect() {
      if (serverDisconnectReconnectTimerRef.current) {
        clearTimeout(serverDisconnectReconnectTimerRef.current);
        serverDisconnectReconnectTimerRef.current = null;
      }
      clearSocketBindRetryTimer();
      emitAdminTelemetry({
        message: 'connected to socket'
      });

      onChangeSocketStatus(true);

      handleStartUserActionCapture();

      // Any proven transport break requires the next bootstrap to read the
      // writer, including a break during the initial load. A replica snapshot
      // taken after the new room barrier can still omit commits made before
      // that barrier, which no later socket event is required to replay.
      const shouldResyncAfterDisconnect = didSocketDisconnectRef.current;
      const shouldSkipReload =
        isLoadingChatRef.current ||
        (!shouldResyncAfterDisconnect &&
          chatLoadedRef.current &&
          loadedForUserIdRef.current === userIdRef.current);

      onClearRecentChessMessage(selectedChannelIdRef.current);
      void handleCheckVersion();
      void checkFeedsOutdated({ bypassThrottle: true, withFallback: true });

      if (userIdRef.current) {
        if (loadChatRetryTimerRef.current) {
          clearTimeout(loadChatRetryTimerRef.current);
          loadChatRetryTimerRef.current = null;
        }
        loadChatRetryCountRef.current = 0;

        const bindingUserId = userIdRef.current;
        bindSocketToUser({
          bindingUserId,
          onBound() {
            void handleCheckVersion();
            void checkFeedsOutdated({
              bypassThrottle: true,
              withFallback: true
            });
            // The bind acknowledgement is the synchronization barrier: the
            // server has joined every canonical chat room before replying. A
            // reconnect resync must start after that barrier so activity before
            // it comes from the writer snapshot and activity after it arrives
            // through the socket.
            // The load that was in flight when `connect` fired can settle
            // before this bind acknowledgement. Re-evaluate here: if it could
            // not close the transport gap because the new socket was not bound
            // yet, this acknowledgement must start the writer repair. If it is
            // still in flight, its `finally` path will start that repair after
            // it settles.
            const needsPostBindWriterResync =
              didSocketDisconnectRef.current &&
              !isLoadingChatRef.current &&
              !activeBootstrapIdRef.current &&
              !loadChatRetryTimerRef.current;
            if (needsPostBindWriterResync || !shouldSkipReload) {
              const loadFromWriter =
                needsPostBindWriterResync || didSocketDisconnectRef.current;
              recordChatBootstrapEvent('chat-bootstrap-triggered-by-connect', {
                userId: bindingUserId,
                selectedChannelId: selectedChannelIdRef.current,
                currentPathId: currentPathIdRef.current,
                latestPathId: latestPathIdRef.current,
                socketConnected: socket.connected,
                fromWriter: loadFromWriter
              });
              void handleLoadChat({
                selectedChannelId: selectedChannelIdRef.current,
                fromWriter: loadFromWriter
              });
            }
          }
        });
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = window.setInterval(() => {
          if (userIdRef.current) socket.emit('user_heartbeat');
        }, 15000);
      }
    }

    async function handleLoadChat({
      selectedChannelId,
      fromWriter = false
    }: {
      selectedChannelId: number;
      fromWriter?: boolean;
    }): Promise<void> {
      if (!userIdRef.current) {
        recordChatBootstrapEvent('chat-bootstrap-skip-no-user', {
          selectedChannelId,
          currentPathId: currentPathIdRef.current,
          latestPathId: latestPathIdRef.current
        });
        return;
      }
      const bootstrapUserId = userIdRef.current;
      // Callers do not all know whether a transport break happened before
      // they reached this function (autoload and watchdog are intentionally
      // generic). Centralize the source-of-truth choice here so no recovery
      // path can close a disconnect gap with a replica snapshot.
      const canonicalReadFromWriter =
        fromWriter || didSocketDisconnectRef.current;
      const bootstrapDisconnectSequence = socketDisconnectSequenceRef.current;
      onSetReconnecting();
      isLoadingChatRef.current = true;
      let didInitChat = false;
      let didCompleteChatSync = false;
      const rawCurrentPathId = currentPathIdRef.current;
      const routePathId = Number(rawCurrentPathId);
      const hasRoutePathId = !isNaN(routePathId) && routePathId > 0;
      const fallbackPathId =
        Number(latestPathIdRef.current) > 0
          ? Number(latestPathIdRef.current)
          : GENERAL_CHAT_PATH_ID;
      const bootstrapChannelId = hasRoutePathId
        ? parseChannelPath(routePathId)
        : selectedChannelId || parseChannelPath(fallbackPathId);
      const requestedSubchannelPath = hasRoutePathId
        ? subchannelPathRef.current || ''
        : '';
      const bootstrapId = nextChatBootstrapId();
      activeBootstrapIdRef.current = bootstrapId;
      const bootstrapStartedAt = Date.now();
      bootstrapStartedAtRef.current = bootstrapStartedAt;
      // The reducer only retains event identities while a bootstrap can race
      // them. Starting a newer attempt clears identities that its writer read
      // is guaranteed to follow.
      onStartChatBootstrap({
        bootstrapId,
        userId: bootstrapUserId,
        startedAt: bootstrapStartedAt
      });

      recordChatBootstrapEvent('chat-bootstrap-attempt-start', {
        bootstrapId,
        userId: bootstrapUserId,
        selectedChannelId,
        bootstrapChannelId,
        requestedSubchannelPath,
        rawCurrentPathId,
        routePathId: hasRoutePathId ? routePathId : null,
        fallbackPathId,
        latestPathId: latestPathIdRef.current,
        socketConnected: socket.connected,
        fromWriter: canonicalReadFromWriter
      });

      try {
        onInit();
        recordChatBootstrapEvent('chat-bootstrap-on-init', {
          bootstrapId,
          userId: bootstrapUserId
        });

        emitAdminTelemetry({
          message: 'Loading chat...'
        });
        const startTime = Date.now();
        recordChatBootstrapEvent('chat-bootstrap-request-start', {
          bootstrapId,
          channelId: bootstrapChannelId,
          requestedSubchannelPath,
          selectedChannelId,
          socketConnected: socket.connected
        });

        const data = await loadChat({
          channelId: bootstrapChannelId,
          subchannelPath: requestedSubchannelPath,
          fromWriter: canonicalReadFromWriter,
          bounded: canonicalReadFromWriter
        });

        const endTime = Date.now();
        const chatLoadingTime = (endTime - startTime) / 1000;
        emitAdminTelemetry({
          message: `Chat loaded in ${chatLoadingTime} seconds`
        });
        recordChatBootstrapEvent('chat-bootstrap-request-success', {
          bootstrapId,
          elapsedMs: endTime - startTime,
          hasChannelsObj: !!data?.channelsObj,
          channelCount: Object.keys(data?.channelsObj || {}).length,
          currentChannelId: data?.currentChannelId ?? null,
          currentPathId: data?.currentPathId ?? null,
          messageCount: Array.isArray(data?.messageIds)
            ? data.messageIds.length
            : null,
          chatType: data?.chatType ?? null
        });

        // A newer bootstrap has superseded this one — e.g. the stuck-chat
        // watchdog started a fresh attempt while this loadChat was merely slow
        // (throttled tab / poor network) rather than hung. Bail before touching
        // any shared chat state so this older snapshot can't clobber the newer
        // load's onInitChat or its channel/route reconciliation. The active
        // (latest-started) attempt owns the result. The finally below leaves the
        // in-flight gate to that owner.
        if (
          activeBootstrapIdRef.current !== bootstrapId ||
          userIdRef.current !== bootstrapUserId
        ) {
          recordChatBootstrapEvent('chat-bootstrap-superseded-skip-init', {
            bootstrapId,
            activeBootstrapId: activeBootstrapIdRef.current,
            bootstrapUserId,
            currentUserId: userIdRef.current
          });
          return;
        }
        if (!data?.channelsObj) {
          throw new Error('Chat bootstrap returned no canonical channel state');
        }

        if (loadChatRetryTimerRef.current) {
          clearTimeout(loadChatRetryTimerRef.current);
          loadChatRetryTimerRef.current = null;
        }

        const latestPathId =
          Number(latestPathIdRef.current) > 0
            ? Number(latestPathIdRef.current)
            : 0;
        const needsPostBootstrapChannelReconciliation = Boolean(
          !hasRoutePathId &&
          latestPathId &&
          (data.currentPathId !== latestPathId || data.chatType) &&
          userIdRef.current
        );
        // Capture navigation intent before INIT_CHAT installs the server
        // snapshot. A later ref update can be caused by that dispatch itself,
        // so reading latestChatTypeRef after an awaited channel recovery would
        // mistake stale response state for a user navigation that must win.
        const routedChatTypeToRestore =
          latestChatTypeRef.current &&
          String(currentPathIdRef.current) === String(latestChatTypeRef.current)
            ? latestChatTypeRef.current
            : null;

        recordChatBootstrapEvent('chat-bootstrap-dispatch-init-chat', {
          bootstrapId,
          userId: bootstrapUserId,
          currentChannelId: data?.currentChannelId ?? null,
          hasChannelsObj: !!data?.channelsObj
        });
        onInitChat({
          data,
          userId: bootstrapUserId,
          bootstrapId
        });
        chatLoadedRef.current = true;
        loadedForUserIdRef.current = bootstrapUserId;
        didInitChat = true;
        // INIT_CHAT makes the full snapshot renderable and ordinarily opens the
        // interaction gate. A plain /chat restore can still owe a second
        // canonical channel read, and a socket can also have changed while the
        // full request was in flight. Keep the last confirmed projection
        // visible but non-interactive until the whole synchronization chain
        // completes.
        if (
          needsPostBootstrapChannelReconciliation ||
          didSocketDisconnectRef.current
        ) {
          onSetReconnecting();
        }
        void handleGetNumberOfUnreadMessages({
          expectedUserId: bootstrapUserId
        });

        // Explicit routed numeric chat paths are resolved by Chat/Main.handleChannelEnter().
        // Keep this bootstrap reconciliation for non-routed restore cases like plain /chat.
        if (needsPostBootstrapChannelReconciliation) {
          const channelId = parseChannelPath(latestPathId);
          const { isAccessible, isPublic } =
            await checkChatAccessible(latestPathId);
          if (
            activeBootstrapIdRef.current !== bootstrapId ||
            userIdRef.current !== bootstrapUserId
          ) {
            return;
          }
          if (!isAccessible) {
            if (isPublic) {
              if (!channelPathIdHashRef.current[latestPathId]) {
                onUpdateChannelPathIdHash({ channelId, pathId: latestPathId });
              }
              const response = await acceptInvitation(channelId);
              if (
                activeBootstrapIdRef.current !== bootstrapId ||
                userIdRef.current !== bootstrapUserId
              ) {
                return;
              }
              if (response.channel.id === channelId) {
                emitAcceptedChatGroupMembership({
                  response,
                  memberId: bootstrapUserId,
                  fallbackMember: {
                    id: bootstrapUserId,
                    username: usernameRef.current,
                    profilePicUrl: profilePicUrlRef.current
                  },
                  socket,
                  markLegacyMessageLoaded: true
                });
              }
            } else {
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
                didCompleteChatSync = true;
                return;
              }
              // For AI DM channels, continue loading - don't redirect
            }
          }

          if (channelId > 0) {
            if (!channelPathIdHashRef.current[latestPathId]) {
              onUpdateChannelPathIdHash({ channelId, pathId: latestPathId });
            }
            const expectedActivityRevision =
              getChatProjectionActivityRevision();
            const channelData = await loadChatChannel({
              channelId,
              subchannelPath: requestedSubchannelPath,
              // This request resolves a canonical path/access mismatch and may
              // follow an invitation mutation. It always reads the writer;
              // otherwise a cold (non-reconnect) bootstrap could still replace
              // confirmed access or messages with a lagging replica page.
              fromWriter: true,
              bounded: true
            });
            if (
              activeBootstrapIdRef.current !== bootstrapId ||
              userIdRef.current !== bootstrapUserId
            ) {
              return;
            }
            // A confirmed socket event can land after the writer captured this
            // channel response but before the HTTP response arrives. Applying
            // that older page would erase its newer message, edit, membership,
            // settings, AI-stream, or game projection. Discard it and let the
            // owning writer retry cover the whole chain instead.
            if (
              getChatProjectionActivityRevision() !== expectedActivityRevision
            ) {
              throw new Error(
                'Canonical chat activity changed during channel recovery'
              );
            }
            if (!channelData?.channel?.id) {
              throw new Error(
                'Canonical chat channel recovery returned no channel'
              );
            }
            const canonicalChannelId = Number(channelData.channel.id);
            if (canonicalChannelId !== channelId) {
              if (
                canonicalChannelId !== GENERAL_CHAT_ID ||
                channelId === GENERAL_CHAT_ID
              ) {
                throw new Error(
                  'Canonical chat channel recovery returned a different channel'
                );
              }
              // GET /chat/channel canonicalizes a channel the user lost access
              // to as General with HTTP 200. Apply that confirmed response and
              // repair both selection and route instead of reinstalling the
              // now-inaccessible requested id.
              onEnterChannelWithId({
                data: channelData,
                userId: bootstrapUserId
              });
              for (const member of channelData.channel.members || []) {
                onSetUserState({
                  userId: member.id,
                  newState: member
                });
              }
              onUpdateSelectedChannelId(GENERAL_CHAT_ID);
              onUpdateChatType(null);
              if (usingChatRef.current) {
                navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, {
                  replace: true
                });
              }
              didCompleteChatSync = true;
              return;
            }
            onEnterChannelWithId({
              data: channelData,
              userId: bootstrapUserId
            });
            for (const member of channelData?.channel?.members || []) {
              onSetUserState({
                userId: member.id,
                newState: member
              });
            }
            onUpdateSelectedChannelId(canonicalChannelId);
            // /chat/channel canonically clears the persisted Collect mode when
            // it confirms a numeric channel. Mirror that confirmed response;
            // retaining data.chatType from the preceding full snapshot can
            // otherwise redirect the user straight back to Collect.
            onUpdateChatType(null);
          }
        }

        if (routedChatTypeToRestore) {
          onUpdateChatType(routedChatTypeToRestore);
        }
        didCompleteChatSync = true;
      } catch (error) {
        const normalizedError = error as {
          status?: number;
          message?: string;
          code?: string;
          name?: string;
        };
        recordChatBootstrapEvent('chat-bootstrap-attempt-failed', {
          bootstrapId,
          didInitChat,
          status: normalizedError?.status ?? null,
          code: normalizedError?.code ?? null,
          name: normalizedError?.name ?? null,
          message: normalizedError?.message ?? null,
          retryCount: loadChatRetryCountRef.current,
          socketConnected: socket.connected
        });
        if (!didInitChat) {
          const isOwningBootstrap =
            activeBootstrapIdRef.current === bootstrapId;
          const alreadyLoaded =
            chatLoadedRef.current &&
            loadedForUserIdRef.current === bootstrapUserId;
          if (!isOwningBootstrap) {
            // A superseded/stale attempt rejecting (e.g. one the watchdog
            // abandoned) must not schedule a retry: the active attempt owns
            // recovery. An OWNING failure must retry even when chat is already
            // loaded — the reconnect resync always runs over loaded chat, and
            // it is the only repair path for per-channel unread state (the nav
            // badge re-syncs from /chat/numUnreads, channelsObj has nothing
            // else). Skipping it left channels stale until the next reconnect.
            recordChatBootstrapEvent('chat-bootstrap-retry-skipped-stale', {
              sourceBootstrapId: bootstrapId,
              activeBootstrapId: activeBootstrapIdRef.current,
              alreadyLoaded,
              userId: bootstrapUserId,
              selectedChannelId: selectedChannelIdRef.current
            });
          } else {
            lastFailedBootstrapIdRef.current = bootstrapId;
            console.error('Failed to load chat:', error);
            if (socket.connected) {
              scheduleLoadChatRetry({
                // A disconnect can happen after this request starts. Its retry
                // must then upgrade to the writer even if the failed request
                // itself began as an ordinary replica bootstrap.
                fromWriter:
                  canonicalReadFromWriter || didSocketDisconnectRef.current
              });
            } else {
              recordChatBootstrapEvent(
                'chat-bootstrap-retry-skipped-disconnected',
                {
                  sourceBootstrapId: bootstrapId,
                  retryCount: loadChatRetryCountRef.current,
                  userId: bootstrapUserId,
                  selectedChannelId: selectedChannelIdRef.current
                }
              );
            }
          }
        } else {
          const isOwningBootstrap =
            activeBootstrapIdRef.current === bootstrapId;
          if (!isOwningBootstrap) {
            recordChatBootstrapEvent('chat-bootstrap-retry-skipped-stale', {
              sourceBootstrapId: bootstrapId,
              activeBootstrapId: activeBootstrapIdRef.current,
              alreadyLoaded: true,
              userId: bootstrapUserId,
              selectedChannelId: selectedChannelIdRef.current
            });
          } else {
            lastFailedBootstrapIdRef.current = bootstrapId;
            console.error('Failed to sync post-load chat state:', error);
            if (socket.connected) {
              scheduleLoadChatRetry({ fromWriter: true });
            } else {
              recordChatBootstrapEvent(
                'chat-bootstrap-retry-skipped-disconnected',
                {
                  sourceBootstrapId: bootstrapId,
                  retryCount: loadChatRetryCountRef.current,
                  userId: bootstrapUserId,
                  selectedChannelId: selectedChannelIdRef.current
                }
              );
            }
          }
        }
      } finally {
        // Only the owning (latest-started) attempt clears the shared in-flight
        // gate and active id. A superseded older attempt finishing must leave both
        // alone, or it would reopen the gate while the newer attempt is still
        // running and invite yet another overlapping bootstrap.
        const isOwningBootstrap = activeBootstrapIdRef.current === bootstrapId;
        let shouldFollowWithCanonicalResync = false;
        if (isOwningBootstrap) {
          if (didCompleteChatSync) {
            loadChatRetryCountRef.current = 0;
            if (loadChatRetryTimerRef.current) {
              clearTimeout(loadChatRetryTimerRef.current);
              loadChatRetryTimerRef.current = null;
            }
            lastFailedBootstrapIdRef.current = null;
            // Only a synchronization chain completed entirely after the latest
            // authenticated room barrier can close a proven transport gap. If
            // the socket changed anywhere in the chain, the next writer read
            // still owns recovery.
            if (
              socket.connected &&
              boundSocketIdRef.current === socket.id &&
              bootstrapDisconnectSequence ===
                socketDisconnectSequenceRef.current
            ) {
              didSocketDisconnectRef.current = false;
            }
            if (!didSocketDisconnectRef.current) {
              onFinishReconnecting();
            }
          }
          isLoadingChatRef.current = false;
          activeBootstrapIdRef.current = null;
          bootstrapStartedAtRef.current = 0;
          if (!didInitChat) {
            onFinishChatBootstrap(bootstrapId);
          }
          shouldFollowWithCanonicalResync =
            didCompleteChatSync &&
            didSocketDisconnectRef.current &&
            socket.connected &&
            boundSocketIdRef.current === socket.id &&
            !loadChatRetryTimerRef.current &&
            lastFailedBootstrapIdRef.current === null;
        }
        recordChatBootstrapEvent('chat-bootstrap-attempt-finished', {
          bootstrapId,
          didInitChat,
          didCompleteChatSync,
          isOwningBootstrap,
          isLoadingChat: isLoadingChatRef.current,
          hasRetryTimer: !!loadChatRetryTimerRef.current
        });
        if (shouldFollowWithCanonicalResync) {
          recordChatBootstrapEvent(
            'chat-bootstrap-follow-up-after-transport-gap',
            {
              bootstrapId,
              userId: bootstrapUserId,
              selectedChannelId: selectedChannelIdRef.current,
              bootstrapDisconnectSequence,
              currentDisconnectSequence: socketDisconnectSequenceRef.current
            }
          );
          void handleLoadChat({
            selectedChannelId: selectedChannelIdRef.current,
            fromWriter: true
          });
        }
      }
    }

    handleLoadChatRef.current = handleLoadChat;
    bumpLoadChatHandlerVersion();

    function scheduleLoadChatRetry({
      fromWriter = false
    }: { fromWriter?: boolean } = {}) {
      if (loadChatRetryTimerRef.current || !userIdRef.current) return;
      const delay = Math.min(1000 * 2 ** loadChatRetryCountRef.current, 10000);
      loadChatRetryCountRef.current += 1;
      recordChatBootstrapEvent('chat-bootstrap-retry-scheduled', {
        sourceBootstrapId: lastFailedBootstrapIdRef.current,
        retryCount: loadChatRetryCountRef.current,
        delayMs: delay,
        userId: userIdRef.current,
        selectedChannelId: selectedChannelIdRef.current,
        fromWriter
      });
      emitAdminTelemetry({
        message: `Retrying chat load in ${Math.round(delay / 1000)}s`
      });
      loadChatRetryTimerRef.current = window.setTimeout(() => {
        loadChatRetryTimerRef.current = null;
        if (!userIdRef.current) {
          loadChatRetryCountRef.current = 0;
          return;
        }
        if (!socket.connected) {
          recordChatBootstrapEvent(
            'chat-bootstrap-retry-skipped-disconnected',
            {
              sourceBootstrapId: lastFailedBootstrapIdRef.current,
              retryCount: loadChatRetryCountRef.current,
              userId: userIdRef.current,
              selectedChannelId: selectedChannelIdRef.current
            }
          );
          return;
        }
        if (isLoadingChatRef.current) return;
        if (lastFailedBootstrapIdRef.current === null) {
          // A newer attempt succeeded after the failure that scheduled this
          // retry (success nulls lastFailedBootstrapIdRef) — don't reload over
          // it. Chat merely being loaded is NOT recovery: the failed attempt
          // may have been a reconnect resync over already-loaded chat, whose
          // retry is the only repair path for per-channel unread state.
          loadChatRetryCountRef.current = 0;
          recordChatBootstrapEvent('chat-bootstrap-retry-skipped-loaded', {
            sourceBootstrapId: lastFailedBootstrapIdRef.current,
            userId: userIdRef.current,
            selectedChannelId: selectedChannelIdRef.current
          });
          return;
        }
        recordChatBootstrapEvent('chat-bootstrap-retry-fired', {
          sourceBootstrapId: lastFailedBootstrapIdRef.current,
          retryCount: loadChatRetryCountRef.current,
          userId: userIdRef.current,
          selectedChannelId: selectedChannelIdRef.current
        });
        void handleLoadChat({
          selectedChannelId: selectedChannelIdRef.current,
          fromWriter
        });
      }, delay);
    }

    function handleDisconnect(reason: string) {
      emitAdminTelemetry({
        message: `disconnected from socket. reason: ${reason}`
      });
      clearSocketAuthReady();
      socketBindAttemptRef.current += 1;
      markSocketTransportGap(true);
      onSetAICallEnding(false);
      onChangeSocketStatus(false);

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      handleStopUserActionCapture();

      if (reason === 'io server disconnect') {
        if (serverDisconnectReconnectTimerRef.current) {
          clearTimeout(serverDisconnectReconnectTimerRef.current);
        }
        serverDisconnectReconnectTimerRef.current = window.setTimeout(() => {
          serverDisconnectReconnectTimerRef.current = null;
          try {
            socket.connect();
          } catch {}
        }, getServerDisconnectReconnectDelayMs());
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

  useEffect(() => {
    if (!userId) return;
    if (chatLoaded && loadedForUserId === userId) return;
    // Account switches restart only after the replacement socket bind has
    // completed its room-hydration barrier.
    if (bootstrapAwaitingBindUserIdRef.current === userId) return;
    const decisionDetails = {
      userId,
      chatLoaded,
      loadedForUserId,
      isLoadingChat: isLoadingChatRef.current,
      hasRetryTimer: !!loadChatRetryTimerRef.current,
      selectedChannelId: selectedChannelIdRef.current,
      currentPathId: currentPathIdRef.current,
      latestPathId: latestPathIdRef.current
    };
    const decisionSignature = JSON.stringify(decisionDetails);
    if (autoLoadDecisionSignatureRef.current !== decisionSignature) {
      autoLoadDecisionSignatureRef.current = decisionSignature;
      recordChatBootstrapEvent(
        isLoadingChatRef.current || loadChatRetryTimerRef.current
          ? 'chat-bootstrap-autoload-blocked'
          : 'chat-bootstrap-autoload-triggered',
        decisionDetails
      );
    }
    if (isLoadingChatRef.current || loadChatRetryTimerRef.current) return;
    if (!handleLoadChatRef.current) {
      recordChatBootstrapEvent('chat-bootstrap-autoload-missing-handler', {
        ...decisionDetails
      });
      return;
    }
    void handleLoadChatRef.current?.({
      selectedChannelId: selectedChannelIdRef.current
    });
  }, [chatLoaded, loadedForUserId, loadChatHandlerVersion, userId]);

  // Self-heal watchdog. An ordinary initial bootstrap deliberately has no hard
  // request deadline because a throttled tab can remain healthy but slow.
  // Canonical reconnect repair is bounded separately and retries through its
  // owning loop. This watchdog protects only the unbounded initial-bootstrap
  // case, where every recovery path otherwise waits behind isLoadingChatRef.
  //
  // The watchdog must NOT preempt a healthy-but-slow load (a throttled tab can
  // legitimately take a while), or it would supersede every attempt before it can
  // resolve and chat would never load. So it acts only when (a) nothing is in
  // flight, or (b) the in-flight attempt has overrun a generous deadline that
  // backs off each time — letting slow successful loads settle while still
  // rescuing a genuinely hung one. Runs only while the loader shows; clears on
  // load.
  const WATCHDOG_TICK_MS = 15000;
  const WATCHDOG_BASE_STUCK_MS = 60000;
  const WATCHDOG_MAX_STUCK_MS = 240000;
  useEffect(() => {
    if (!userId) return;
    if (chatLoaded && loadedForUserId === userId) return;
    // Closure-scoped because this effect persists for the whole stuck window
    // (its deps don't change while wedged) and resets naturally on recovery.
    let forcedRetries = 0;
    let warned = false;
    const interval = window.setInterval(() => {
      if (!userIdRef.current) return;
      if (bootstrapAwaitingBindUserIdRef.current === userIdRef.current) {
        return;
      }
      if (
        chatLoadedRef.current &&
        loadedForUserIdRef.current === userIdRef.current
      ) {
        return;
      }
      // Save the trace the moment trouble is suspected, so it survives even a hard
      // quit (not just the reload used to escape the hang).
      flushChatBootstrapHistory();
      if (!socket.connected) {
        recordChatBootstrapEvent('chat-bootstrap-watchdog-reconnect', {
          userId: userIdRef.current,
          selectedChannelId: selectedChannelIdRef.current
        });
        try {
          socket.connect();
        } catch {}
        return;
      }
      // Let a healthy in-flight attempt finish. Only intervene once nothing is
      // loading, or the in-flight attempt has clearly overrun its (backing-off)
      // deadline — i.e. it is hung, not merely slow.
      const stuckDeadline = Math.min(
        WATCHDOG_BASE_STUCK_MS * 2 ** forcedRetries,
        WATCHDOG_MAX_STUCK_MS
      );
      const inFlightAge = bootstrapStartedAtRef.current
        ? Date.now() - bootstrapStartedAtRef.current
        : Infinity;
      if (isLoadingChatRef.current && inFlightAge < stuckDeadline) {
        return;
      }
      forcedRetries += 1;
      recordChatBootstrapEvent('chat-bootstrap-watchdog-force-retry', {
        userId: userIdRef.current,
        selectedChannelId: selectedChannelIdRef.current,
        wasLoadingChat: isLoadingChatRef.current,
        inFlightAge: Number.isFinite(inFlightAge) ? inFlightAge : null,
        stuckDeadline,
        forcedRetries,
        hadRetryTimer: !!loadChatRetryTimerRef.current
      });
      // After more than one forced retry it is clearly wedged (not a slow first
      // load) — tell the user how to hand over a diagnostic, once, loudly.
      if (forcedRetries >= 2 && !warned) {
        warned = true;
        console.warn(
          `[twinkle-chat] Chat has been stuck loading. To capture a diagnostic log, run:\n\n    copy(window.dumpChatBootstrap())\n\nand send it over.`
        );
      }
      // Clear the gates the stuck attempt left set, then re-bootstrap. The
      // superseded check in handleLoadChat stops the abandoned attempt from
      // clobbering this fresh one if it resolves late.
      isLoadingChatRef.current = false;
      if (loadChatRetryTimerRef.current) {
        clearTimeout(loadChatRetryTimerRef.current);
        loadChatRetryTimerRef.current = null;
      }
      void handleLoadChatRef.current?.({
        selectedChannelId: selectedChannelIdRef.current
      });
    }, WATCHDOG_TICK_MS);
    return () => clearInterval(interval);
  }, [userId, chatLoaded, loadedForUserId]);

  const prevUserIdRef = useRef<number | undefined>(undefined);

  // Rebind socket when user changes (login/logout/switch account)
  useEffect(() => {
    if (!socket.connected) {
      prevUserIdRef.current = userId;
      return;
    }

    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      socket.emit('leave_my_notification_channel', prevUserIdRef.current);
    }

    if (userId) {
      bindSocketToUser({ bindingUserId: userId });
    }

    prevUserIdRef.current = userId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function bindSocketToUser({
    bindingUserId,
    onBound,
    onBindSettled
  }: {
    bindingUserId: number;
    onBound?: (result?: SocketBindResult) => void;
    onBindSettled?: () => void;
  }) {
    const bindAttempt = ++socketBindAttemptRef.current;
    emitSocketBind({
      payload: {
        userId: bindingUserId,
        username: usernameRef.current,
        profilePicUrl: profilePicUrlRef.current,
        token: getStoredItem('token'),
        deviceId: getTwinkleDeviceId()
      },
      onAcknowledged(result) {
        if (
          bindAttempt !== socketBindAttemptRef.current ||
          bindingUserId !== userIdRef.current ||
          !socket.connected
        ) {
          onBindSettled?.();
          return;
        }
        if (result?.authError) {
          onBindSettled?.();
          window.location.reload();
          return;
        }
        const wasAwaitingBootstrapBind =
          bootstrapAwaitingBindUserIdRef.current === bindingUserId;
        if (wasAwaitingBootstrapBind) {
          bootstrapAwaitingBindUserIdRef.current = null;
        }
        clearSocketBindRetryTimer();
        boundSocketIdRef.current = socket.id || null;
        dispatchSocketAuthReady(bindingUserId);
        socket.emit('enter_my_notification_channel', bindingUserId);
        socket.emit('change_busy_status', chatBusyRef.current);
        userActionAckedRef.current = false;
        userActionAttemptsRef.current = 0;
        handleStartUserActionCapture();
        hydrateOnlinePresence(bindingUserId);
        onBound?.(result);
        if (
          wasAwaitingBootstrapBind &&
          !onBound &&
          !isLoadingChatRef.current &&
          (!chatLoadedRef.current ||
            loadedForUserIdRef.current !== bindingUserId)
        ) {
          void handleLoadChatRef.current?.({
            selectedChannelId: selectedChannelIdRef.current
          });
        }
        onBindSettled?.();
      },
      onFailure(error) {
        onBindSettled?.();
        if (bindAttempt !== socketBindAttemptRef.current) return;
        handleSocketBindFailure({ bindingUserId, error });
      }
    });
  }

  // Online indicators are read all over the app (profile pages, user popups,
  // content panels), not just inside chat, so the presence snapshot is tied to
  // the socket binding rather than to the chat bootstrap. Hydrating it here
  // covers a cold load outside chat - where no chat channel is selected yet -
  // and a reconnect that skips the chat reload. The reconnect case is also why
  // this must reconcile rather than merge: online_status_changed events sent
  // while the socket was down are gone, so anyone the server no longer lists
  // has to be flipped back to offline from this snapshot.
  function hydrateOnlinePresence(bindingUserId: number) {
    const requestedAt = Date.now();
    socket.emit(
      'check_online_presence',
      ({
        onlineUsers,
        isComplete
      }: {
        onlineUsers: Record<number, any>;
        isComplete?: boolean;
      }) => {
        if (userIdRef.current !== bindingUserId) return;
        onSetOnlinePresenceSnapshot({
          onlineUsers,
          isComplete: isComplete === true,
          requestedAt
        });
      }
    );
  }

  function handleSocketBindFailure({
    bindingUserId,
    error
  }: {
    bindingUserId: number;
    error: Error;
  }) {
    if (bindingUserId !== userIdRef.current) return;
    clearSocketAuthReady();
    markSocketTransportGap(true);
    recordChatBootstrapEvent('socket-bind-failed', {
      userId: bindingUserId,
      socketConnected: socket.connected,
      error: error.message
    });
    emitAdminTelemetry({
      message: `Socket bind failed; retrying connection: ${error.message}`
    });
    if (socketBindRetryTimerRef.current) return;
    if (socket.connected) socket.disconnect();
    socketBindRetryTimerRef.current = window.setTimeout(() => {
      socketBindRetryTimerRef.current = null;
      if (bindingUserId !== userIdRef.current || socket.connected) return;
      try {
        socket.connect();
      } catch {}
    }, SOCKET_BIND_RETRY_DELAY_MS);
  }

  function clearSocketBindRetryTimer() {
    if (!socketBindRetryTimerRef.current) return;
    clearTimeout(socketBindRetryTimerRef.current);
    socketBindRetryTimerRef.current = null;
  }

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
