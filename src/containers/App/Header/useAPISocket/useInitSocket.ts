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
  const acceptInvitation = useAppContext(
    (v) => v.requestHelpers.acceptInvitation
  );

  const latestChatTypeRef = useRef(chatType);
  const latestPathIdRef = useRef(latestPathId);
  const isLoadingChatRef = useRef(false);
  const disconnectedDuringLoadRef = useRef(false);

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
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };

    async function handleConnect() {
      logForAdmin({
        message: 'connected to socket'
      });

      onChangeSocketStatus(true);

      if (disconnectedDuringLoadRef.current) {
        disconnectedDuringLoadRef.current = false;
        return;
      }

      onClearRecentChessMessage(selectedChannelId);
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
      selectedChannelId
    }: {
      selectedChannelId: number;
    }): Promise<void> {
      onSetReconnecting();
      isLoadingChatRef.current = true;

      try {
        if (!navigator.onLine) {
          throw new Error('Network is offline');
        }

        socket.emit(
          'bind_uid_to_socket',
          { userId, username, profilePicUrl },
          () => {
            socket.emit('change_busy_status', !usingChatRef.current);
          }
        );
        socket.emit('enter_my_notification_channel', userId);

        onInit();
        const pathId = Number(currentPathId);
        // To prevent users from being redirected to General Chat when loading Collect Section, we want to assume currentChannelIsAccessible is true unless proven otherwise from following checks
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
    }
  });
}
