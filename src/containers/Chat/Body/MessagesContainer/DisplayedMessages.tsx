import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Message from '../../Message';
import LocalContext from '../../Context';
import { v1 as uuidv1 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { useTheme } from '~/helpers/hooks';
import { isMobile, parseChannelPath } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { rewardReasons } from '~/constants/defaultValues';
import { socket } from '~/constants/io';

const unseenButtonThreshold = -1;
const deviceIsMobile = isMobile(navigator);

export default function DisplayedMessages({
  loading,
  chessTarget,
  chessCountdownObj,
  currentChannel,
  displayedThemeColor,
  isAICardModalShown,
  isRestrictedChannel,
  ChatInputRef,
  MessagesRef,
  onAcceptRewind,
  onCancelRewindRequest,
  onChessModalShown,
  onChessSpoilerClick,
  onDeclineRewind,
  onMessageSubmit,
  onSetAICardModalCardId,
  onSetDeleteModal,
  onSetSubjectMsgsModalShown,
  onSetTransactionModalShown,
  onScrollToBottom,
  partner,
  selectedTab = 'all',
  subchannel
}: {
  loading: boolean;
  chessTarget: any;
  chessCountdownObj: Record<string, any>;
  currentChannel: any;
  displayedThemeColor: string;
  isAICardModalShown: boolean;
  isRestrictedChannel: boolean;
  ChatInputRef: React.RefObject<any>;
  MessagesRef: React.RefObject<any>;
  onAcceptRewind: (chessState: any) => void;
  onCancelRewindRequest: () => void;
  onChessModalShown: () => void;
  onChessSpoilerClick: (senderId: number) => void;
  onDeclineRewind: () => void;
  onMessageSubmit: (message: any) => void;
  onSetAICardModalCardId: (cardId: number) => void;
  onSetDeleteModal: (obj: {
    shown: boolean;
    fileName: string;
    filePath: string;
    messageId: number;
  }) => void;
  onSetSubjectMsgsModalShown: (obj: {
    shown: boolean;
    subjectId: number;
    content: string;
  }) => void;
  onSetTransactionModalShown: (shown: boolean) => void;
  onScrollToBottom: () => void;
  partner?: {
    id: number;
    username: string;
  };
  selectedTab: string;
  subchannel: Record<string, any>;
}) {
  const navigate = useNavigate();
  const {
    actions: {
      onGetRanks,
      onLoadMoreMessages,
      onSetChessTarget,
      onSubmitMessage,
      onUpdateChannelPathIdHash
    },
    requests: {
      acceptInvitation,
      loadMoreChatMessages,
      loadRankings,
      updateUserXP
    },
    state: { channelPathIdHash, selectedChannelId }
  } = useContext(LocalContext);
  const { banned, profilePicUrl, userId, profileTheme, username } =
    useKeyContext((v) => v.myState);
  const {
    messageIds = [],
    messagesObj = {},
    messagesLoadMoreButton = false,
    twoPeople
  } = currentChannel;
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useTheme(twoPeople ? profileTheme : displayedThemeColor || profileTheme);

  const [newUnseenMessage, setNewUnseenMessage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrolledToBottomRef = useRef(true);
  const loadMoreButtonLock = useRef(false);
  const timerRef: React.RefObject<any> = useRef(null);
  const prevScrollPosition = useRef(null);
  const chessCountdownNumber = useMemo(
    () => chessCountdownObj[selectedChannelId],
    [chessCountdownObj, selectedChannelId]
  );

  const topicObj = useMemo(() => {
    if (currentChannel.topicObj) {
      return currentChannel.topicObj;
    }
    return {};
  }, [currentChannel.topicObj]);

  console.log(topicObj, selectedTab);

  const messages = useMemo(() => {
    let displayedMessageIds = [];
    if (subchannel?.messageIds) {
      displayedMessageIds = subchannel.messageIds;
    } else {
      displayedMessageIds = messageIds;
    }
    let displayedMessagesObj: Record<string, any> = {};
    if (subchannel?.messagesObj) {
      displayedMessagesObj = subchannel.messagesObj;
    } else {
      displayedMessagesObj = messagesObj;
    }
    const result = [];
    const dupe: Record<string, any> = {};
    for (const messageId of displayedMessageIds) {
      if (!dupe[messageId]) {
        const message = displayedMessagesObj[messageId];
        if (message) {
          result.push(message);
          dupe[messageId] = true;
        }
      }
    }
    return result;
  }, [messageIds, messagesObj, subchannel]);

  const loadMoreButtonShown = useMemo(() => {
    if (subchannel) {
      return subchannel?.loadMoreButtonShown;
    }
    return messagesLoadMoreButton;
  }, [messagesLoadMoreButton, subchannel]);

  const handleAcceptGroupInvitation = useCallback(
    async (invitationChannelPath: string) => {
      const invitationChannelId =
        channelPathIdHash[invitationChannelPath] ||
        parseChannelPath(invitationChannelPath);
      if (!channelPathIdHash[invitationChannelPath]) {
        onUpdateChannelPathIdHash({
          channelId: invitationChannelId,
          pathId: invitationChannelPath
        });
      }
      const { channel, joinMessage } = await acceptInvitation(
        invitationChannelId
      );
      if (channel.id === invitationChannelId) {
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
        navigate(`/chat/${invitationChannelPath}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentChannel?.creatorId, selectedChannelId, userId]
  );
  const handleLoadMore = useCallback(async () => {
    if (loadMoreButtonShown) {
      const messageId = messages[messages.length - 1].id;
      if (!loadMoreButtonLock.current) {
        setLoadingMore(true);
        loadMoreButtonLock.current = true;
        prevScrollPosition.current = (MessagesRef.current || {}).scrollTop;
        try {
          const {
            messageIds,
            messagesObj,
            loadedChannelId,
            loadedSubchannelId
          } = await loadMoreChatMessages({
            userId,
            messageId,
            channelId: selectedChannelId,
            subchannelId: subchannel?.id
          });
          onLoadMoreMessages({
            messageIds,
            messagesObj,
            loadedChannelId,
            loadedSubchannelId
          });
          loadMoreButtonLock.current = false;
        } catch (error) {
          console.error(error);
          loadMoreButtonLock.current = false;
        }
        if (deviceIsMobile) {
          setTimeout(
            () =>
              ((MessagesRef.current || {}).scrollTop =
                prevScrollPosition.current),
            50
          );
        }
      }
    }
    setLoadingMore(loadMoreButtonLock.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    messages,
    loadMoreButtonShown,
    selectedChannelId,
    subchannel?.id,
    userId
  ]);

  const handleUpdateRankings = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleRewardMessageSubmit = useCallback(
    async ({
      amount,
      reasonId,
      message
    }: {
      amount: number;
      reasonId: string;
      message: any;
    }) => {
      onMessageSubmit({
        content: rewardReasons[reasonId].message,
        rewardAmount: amount,
        rewardReason: reasonId,
        target: message,
        subchannelId: subchannel?.id
      });
      await updateUserXP({
        amount,
        action: 'reward',
        target: 'chat',
        targetId: message.id,
        type: 'increase',
        userId: message.userId
      });
      handleUpdateRankings();
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onMessageSubmit, handleUpdateRankings, subchannel?.id]
  );
  const handleSetChessTarget = useCallback(
    ({
      channelId,
      messageId,
      chessState
    }: {
      channelId: number;
      messageId: number;
      chessState: any;
    }) => {
      onSetChessTarget({ channelId, messageId, target: chessState });
      ChatInputRef.current.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const handleRequestChessRewind = useCallback(
    async (chessTarget: any) => {
      const messageId = uuidv1();
      onSubmitMessage({
        messageId,
        message: {
          userId,
          chessState: chessTarget,
          profilePicUrl,
          username,
          isNotification: true,
          content: 'proposed a new game from this position',
          channelId: selectedChannelId
        }
      });
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessTarget, selectedChannelId]
  );

  useEffect(() => {
    const MessagesContainer = MessagesRef.current;
    addEvent(MessagesContainer, 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(MessagesContainer, 'scroll', handleScroll);
    };

    function handleScroll() {
      clearTimeout(timerRef.current);
      scrolledToBottomRef.current =
        (MessagesRef.current || {}).scrollTop >= unseenButtonThreshold;
      const scrollThreshold =
        (MessagesRef.current || {}).scrollHeight -
        (MessagesRef.current || {}).offsetHeight;
      const scrollTop = (MessagesRef.current || {}).scrollTop;
      const distanceFromTop = scrollThreshold + scrollTop;
      if (distanceFromTop < 3) {
        handleLoadMore();
      }
      if (scrollTop >= unseenButtonThreshold) {
        setNewUnseenMessage(false);
      }
    }
  });

  return (
    <ErrorBoundary componentPath="Chat/Body/MessagesContainer/DisplayedMessages">
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column-reverse',
          overflowY: 'scroll'
        }}
        ref={MessagesRef}
      >
        {loading ? (
          <Loading style={{ position: 'absolute', top: '20%' }} />
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                zIndex: 1000
              }}
            >
              {newUnseenMessage && (
                <Button
                  filled
                  color="orange"
                  style={{ opacity: 0.9 }}
                  onClick={() => {
                    setNewUnseenMessage(false);
                    onScrollToBottom();
                  }}
                >
                  New Message
                </Button>
              )}
            </div>
            {messages.map((message, index) => (
              <Message
                key={message.id || message.tempMessageId}
                channelId={selectedChannelId}
                chessCountdownNumber={chessCountdownNumber}
                partner={partner}
                currentChannel={currentChannel}
                displayedThemeColor={displayedThemeColor}
                forceRefreshForMobile={handleForceRefreshForMobile}
                isAICardModalShown={isAICardModalShown}
                index={index}
                isOneOfLastFiveMessages={index <= 4}
                isLastMsg={index === 0}
                isNotification={!!message.isNotification}
                isBanned={!!banned?.chat}
                isRestricted={isRestrictedChannel}
                loading={loading}
                message={message}
                onAcceptGroupInvitation={handleAcceptGroupInvitation}
                onChessBoardClick={onChessModalShown}
                onChessSpoilerClick={onChessSpoilerClick}
                onCancelRewindRequest={onCancelRewindRequest}
                onAcceptRewind={onAcceptRewind}
                onDeclineRewind={onDeclineRewind}
                onDelete={handleShowDeleteModal}
                onReceiveNewMessage={handleReceiveNewMessage}
                onReplyClick={() => ChatInputRef.current.focus()}
                onRequestRewind={handleRequestChessRewind}
                onRewardMessageSubmit={handleRewardMessageSubmit}
                onSetAICardModalCardId={onSetAICardModalCardId}
                onSetChessTarget={handleSetChessTarget}
                onSetTransactionModalShown={onSetTransactionModalShown}
                onScrollToBottom={onScrollToBottom}
                onShowSubjectMsgsModal={({ subjectId, content }) =>
                  onSetSubjectMsgsModalShown({
                    shown: true,
                    subjectId,
                    content
                  })
                }
              />
            ))}
            {!loading &&
              (loadMoreButtonShown ? (
                <div>
                  <div style={{ width: '100%', height: '1rem' }} />
                  <div
                    style={{
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%'
                    }}
                  >
                    <LoadMoreButton
                      filled
                      color={loadMoreButtonColor}
                      loading={loadingMore}
                      onClick={handleLoadMore}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: '20rem' }} />
              ))}
          </>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleForceRefreshForMobile() {
    const currentScrollTop = (MessagesRef.current || {}).scrollTop || 0;
    (MessagesRef.current || {}).scrollTop = currentScrollTop;
    (MessagesRef.current || {}).scrollTop = currentScrollTop - 1000;
    (MessagesRef.current || {}).scrollTop = currentScrollTop;
  }
  function handleReceiveNewMessage() {
    if (MessagesRef.current && !scrolledToBottomRef.current) {
      setNewUnseenMessage(true);
    } else {
      onScrollToBottom();
    }
  }
  function handleShowDeleteModal({
    fileName,
    filePath,
    messageId
  }: {
    fileName: string;
    filePath: string;
    messageId: number;
  }) {
    onSetDeleteModal({
      shown: true,
      fileName,
      filePath,
      messageId
    });
  }
}
