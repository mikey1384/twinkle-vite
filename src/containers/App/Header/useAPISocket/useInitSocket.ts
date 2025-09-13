import React, { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import { logForAdmin, parseChannelPath } from '~/helpers';
import {
  useAppContext,
  useHomeContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';

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
  const checkVersion = useAppContext((v) => v.requestHelpers.checkVersion);
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );

  const latestChatTypeRef = useRef(chatType);
  const latestPathIdRef = useRef(latestPathId);
  const isLoadingChatRef = useRef(false);
  const disconnectedDuringLoadRef = useRef(false);
  const heartbeatTimerRef = useRef<number | null>(null);
  const userActionAckedRef = useRef(false);
  const userActionAttemptsRef = useRef(0);
  const actionRetryTimersRef = useRef<number[]>([]);
  const detachActionListenersRef = useRef<() => void>(() => {});
  const actionCaptureActiveRef = useRef(false);
  const retriesScheduledRef = useRef(false);

  useEffect(() => {
    latestChatTypeRef.current = chatType;
  }, [chatType]);

  useEffect(() => {
    latestPathIdRef.current = latestPathId;
  }, [latestPathId]);

  useEffect(() => {
    socket.on('online_acknowledged', handleOnlineAcknowledged);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return function cleanUp() {
      socket.off('online_acknowledged', handleOnlineAcknowledged);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };

    function handleOnlineAcknowledged() {
      userActionAckedRef.current = true;
      handleStopUserActionCapture();
    }

    async function handleConnect() {
      logForAdmin({
        message: 'connected to socket'
      });

      onChangeSocketStatus(true);

      // Start capturing user actions immediately upon connect
      handleStartUserActionCapture();

      if (disconnectedDuringLoadRef.current) {
        disconnectedDuringLoadRef.current = false;
        return;
      }

      onClearRecentChessMessage(selectedChannelId);
      handleCheckVersion();
      handleCheckOutdated();
      if (userId) {
        socket.emit(
          'bind_uid_to_socket',
          { userId, username, profilePicUrl },
          () => {
            socket.emit('change_busy_status', !usingChatRef.current);
            userActionAckedRef.current = false;
            userActionAttemptsRef.current = 0;
            handleStartUserActionCapture();
          }
        );
        socket.emit('enter_my_notification_channel', userId);

        handleGetNumberOfUnreadMessages();
        handleLoadChat({ selectedChannelId });
        // Start heartbeat to keep presence accurate (handles sleep/network drops)
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        heartbeatTimerRef.current = window.setInterval(() => {
          if (userId) socket.emit('user_heartbeat');
        }, 15000);
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
      selectedChannelId
    }: {
      selectedChannelId: number;
    }): Promise<void> {
      onSetReconnecting();
      isLoadingChatRef.current = true;

      try {
        onInit();
        const pathId = Number(currentPathId);
        let currentChannelIsAccessible = true;
        let currentChannelIsPublic = false;
        let currentChannelId = 0;

        if (!isNaN(pathId) && userId) {
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

        onInitChat({ data, userId });

        if (
          latestPathIdRef.current &&
          (data.currentPathId !== latestPathIdRef.current || data.chatType) &&
          userId
        ) {
          const channelId = parseChannelPath(latestPathIdRef.current);
          const { isAccessible, isPublic } = await checkChatAccessible(
            latestPathIdRef.current
          );
          if (!isAccessible) {
            if (isPublic) {
              if (!channelPathIdHash[pathId]) {
                onUpdateChannelPathIdHash({ channelId, pathId });
              }
              const { channel, joinMessage } = await acceptInvitation(
                channelId
              );
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
                  newMembers: [{ id: userId, username, profilePicUrl }]
                });
              }
            } else {
              onUpdateSelectedChannelId(GENERAL_CHAT_ID);
              if (usingChatRef.current) {
                navigate(`/chat/${GENERAL_CHAT_PATH_ID}`, {
                  replace: true
                });
              }
              return;
            }
          }

          if (channelId > 0) {
            if (!channelPathIdHash[pathId]) {
              onUpdateChannelPathIdHash({ channelId, pathId });
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
            const { channel, joinMessage } = await acceptInvitation(
              currentChannelId
            );
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
            onUpdateSelectedChannelId(GENERAL_CHAT_ID);
            if (usingChatRef.current) {
              navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        isLoadingChatRef.current = false;
      }
    }

    function handleDisconnect(reason: string) {
      logForAdmin({
        message: `disconnected from socket. reason: ${reason}`
      });
      if (isLoadingChatRef.current) {
        disconnectedDuringLoadRef.current = true;
      }
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
  });

  function handleStartUserActionCapture() {
    if (userActionAckedRef.current) return;
    if (actionCaptureActiveRef.current) return; // prevent duplicate attachments

    const events = [
      'pointerdown',
      'click',
      'keydown',
      'input',
      'compositionend',
      'touchstart',
      'wheel'
    ] as const;
    // Use capture phase to avoid components stopping propagation on key events
    events.forEach((e) => window.addEventListener(e, handler, true));
    actionCaptureActiveRef.current = true;
    detachActionListenersRef.current = () => {
      events.forEach((e) => window.removeEventListener(e, handler, true));
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
}
