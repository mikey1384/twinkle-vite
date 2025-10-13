import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Button from '~/components/Button';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Message from '../../Message';
import LocalContext from '../../Context';
import { MessageHeights } from '~/constants/state';
import { v1 as uuidv1 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { isMobile, parseChannelPath } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { rewardReasons } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { getThemeRoles, ThemeName } from '~/theme/themes';

const unseenButtonThreshold = -1;
const deviceIsMobile = isMobile(navigator);

export default function DisplayedMessages({
  pageLoading,
  chessTarget,
  boardCountdownObj,
  currentChannel,
  displayedThemeColor,
  groupObjs,
  onSetGroupObjs,
  isAICardModalShown,
  isSearchActive,
  loadMoreShownAtBottom,
  isRestrictedChannel,
  isConnecting,
  isReconnecting,
  isLoadingChannel,
  isLoadingTopicMessages,
  isSearching,
  ChatInputRef,
  MessagesRef,
  MessageToScrollToFromAll,
  MessageToScrollToFromTopic,
  onAcceptRewind,
  onCancelRewindRequest,
  onChessModalShown,
  onChessSpoilerClick,
  onOmokModalShown,
  onOmokSpoilerClick,
  onDeclineRewind,
  onMessageSubmit,
  onSetAICardModalCardId,
  onSetDeleteModal,
  onSetSubjectMsgsModalShown,
  onSetTransactionModalShown,
  onScrollToBottom,
  onReplyTargetSelected,
  partner,
  searchText,
  selectedTab,
  subchannel
}: {
  pageLoading: boolean;
  chessTarget: any;
  boardCountdownObj: Record<
    number,
    Partial<Record<'chess' | 'omok', number | null>>
  >;
  currentChannel: any;
  displayedThemeColor: string;
  loadMoreShownAtBottom: boolean;
  groupObjs: any;
  onSetGroupObjs: (v: any) => void;
  isAICardModalShown: boolean;
  isSearchActive: boolean;
  isRestrictedChannel: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isLoadingChannel: boolean;
  isLoadingTopicMessages: boolean;
  isSearching: boolean;
  ChatInputRef: React.RefObject<any>;
  MessagesRef: React.RefObject<any>;
  MessageToScrollToFromAll: any;
  MessageToScrollToFromTopic: any;
  onAcceptRewind: (chessState: any) => void;
  onCancelRewindRequest: () => void;
  onChessModalShown: () => void;
  onChessSpoilerClick: (senderId: number) => void;
  onOmokModalShown: () => void;
  onOmokSpoilerClick: (senderId: number) => void;
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
  onReplyTargetSelected: (target: any) => void;
  partner?: {
    id: number;
    username: string;
  };
  searchText: string;
  selectedTab: string;
  subchannel: Record<string, any>;
}) {
  const navigate = useNavigate();
  const {
    actions: {
      onGetRanks,
      onLoadMoreMessages,
      onSetChessTarget,
      onSetUserState,
      onSubmitMessage,
      onUpdateChannelPathIdHash
    },
    requests: {
      acceptInvitation,
      loadMoreChatMessages,
      loadRankings,
      updateUserXP,
      updateUserCoins
    },
    state: { channelPathIdHash, selectedChannelId }
  } = useContext(LocalContext);
  const banned = useKeyContext((v) => v.myState.banned);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const userId = useKeyContext((v) => v.myState.userId);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const username = useKeyContext((v) => v.myState.username);
  const loadTopicMessages = useAppContext(
    (v) => v.requestHelpers.loadTopicMessages
  );
  const loadMoreRecentTopicMessages = useAppContext(
    (v) => v.requestHelpers.loadMoreRecentTopicMessages
  );
  const searchChatMessages = useAppContext(
    (v) => v.requestHelpers.searchChatMessages
  );
  const onLoadMoreTopicMessages = useChatContext(
    (v) => v.actions.onLoadMoreTopicMessages
  );
  const onLoadMoreRecentTopicMessages = useChatContext(
    (v) => v.actions.onLoadMoreRecentTopicMessages
  );
  const onLoadMoreSearchedMessages = useChatContext(
    (v) => v.actions.onLoadMoreSearchedMessages
  );
  const {
    messageIds = [],
    messagesObj = {},
    messagesLoadMoreButton = false,
    searchedLoadMoreButton = false,
    searchedMessageIds = [],
    twoPeople
  } = currentChannel;
  const loadMoreThemeName = useMemo<ThemeName>(
    () =>
      (
        (twoPeople ? profileTheme : displayedThemeColor || profileTheme) as
          ThemeName
      ),
    [displayedThemeColor, profileTheme, twoPeople]
  );
  const loadMoreButtonColor = useMemo(() => {
    const role = getThemeRoles(loadMoreThemeName).loadMoreButton;
    return role?.color || 'lightBlue';
  }, [loadMoreThemeName]);

  const visibleMessageIndexRef = useRef(10);
  useEffect(() => {
    visibleMessageIndexRef.current = 10;
  }, [selectedChannelId, subchannel?.id, selectedTab]);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const [newUnseenMessage, setNewUnseenMessage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const MessagesDomRef = useRef<Record<string, any>>({});
  const scrolledToBottomRef = useRef(true);
  const loadMoreButtonLock = useRef(false);
  const prevScrollPosition = useRef(null);
  const chessCountdownNumber = useMemo(
    () => boardCountdownObj[selectedChannelId]?.chess,
    [boardCountdownObj, selectedChannelId]
  );
  const omokCountdownNumber = useMemo(
    () => boardCountdownObj[selectedChannelId]?.omok,
    [boardCountdownObj, selectedChannelId]
  );

  const appliedTopicId = useMemo(() => {
    return currentChannel.selectedTopicId || currentChannel.featuredTopicId;
  }, [currentChannel.featuredTopicId, currentChannel.selectedTopicId]);

  const messages = useMemo(() => {
    let displayedMessageIds = [];
    if (selectedTab === 'topic') {
      if (isSearchActive) {
        displayedMessageIds =
          currentChannel.topicObj?.[appliedTopicId]?.searchedMessageIds || [];
      } else {
        displayedMessageIds =
          currentChannel.topicObj?.[appliedTopicId]?.messageIds || [];
      }
    } else if (subchannel?.messageIds) {
      displayedMessageIds = subchannel.messageIds;
    } else {
      displayedMessageIds = isSearchActive ? searchedMessageIds : messageIds;
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
  }, [
    appliedTopicId,
    currentChannel.topicObj,
    messageIds,
    messagesObj,
    selectedTab,
    subchannel?.messageIds,
    subchannel?.messagesObj,
    isSearchActive,
    searchedMessageIds
  ]);

  const loadMoreButtonShown = useMemo(() => {
    if (selectedTab === 'topic') {
      return isSearchActive
        ? currentChannel.topicObj?.[appliedTopicId]?.searchedLoadMoreButtonShown
        : currentChannel.topicObj?.[appliedTopicId]?.loadMoreButtonShown;
    }
    if (subchannel) {
      return subchannel?.loadMoreButtonShown;
    }
    return isSearchActive ? searchedLoadMoreButton : messagesLoadMoreButton;
  }, [
    appliedTopicId,
    currentChannel.topicObj,
    messagesLoadMoreButton,
    searchedLoadMoreButton,
    selectedTab,
    subchannel,
    isSearchActive
  ]);

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
    if (!loadMoreButtonShown || loadMoreButtonLock.current) return;

    const messageId = messages[messages.length - 1].id;
    const topicId = selectedTab === 'topic' ? appliedTopicId : undefined;
    loadMoreButtonLock.current = true;
    setLoadingMore(true);
    prevScrollPosition.current = MessagesRef.current?.scrollTop;

    const loadMoreActions = {
      search: async () => {
        const { messageIds, messagesObj, loadMoreButton } =
          await searchChatMessages({
            channelId: selectedChannelId,
            topicId,
            text: searchText,
            lastId: messageId
          });
        onLoadMoreSearchedMessages({
          channelId: selectedChannelId,
          topicId,
          messageIds,
          messagesObj,
          loadMoreShown: loadMoreButton
        });
      },
      topic: async () => {
        const { messages, loadMoreShown, topicObj } = await loadTopicMessages({
          channelId: selectedChannelId,
          topicId: appliedTopicId,
          lastMessageId: messageId
        });
        onLoadMoreTopicMessages({
          channelId: selectedChannelId,
          messages,
          loadMoreShown,
          topicObj,
          topicId: appliedTopicId
        });
      },
      default: async () => {
        const { messageIds, messagesObj, loadedChannelId, loadedSubchannelId } =
          await loadMoreChatMessages({
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
      }
    };

    try {
      if (isSearchActive) {
        await loadMoreActions.search();
      } else if (selectedTab === 'topic' && appliedTopicId) {
        await loadMoreActions.topic();
      } else {
        await loadMoreActions.default();
      }
    } catch (error) {
      console.error(error);
    } finally {
      loadMoreButtonLock.current = false;
      setLoadingMore(false);

      if (deviceIsMobile) {
        setTimeout(() => {
          MessagesRef.current &&
            (MessagesRef.current.scrollTop = prevScrollPosition.current);
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadMoreButtonShown,
    messages,
    MessagesRef,
    isSearchActive,
    selectedTab,
    appliedTopicId,
    selectedChannelId,
    searchText,
    userId,
    subchannel?.id
  ]);

  const handleLoadMoreRecentMessages = useCallback(async () => {
    setLoadingMoreRecent(true);

    const prevScrollHeight = MessagesRef.current?.scrollHeight;
    const prevScrollTop = MessagesRef.current?.scrollTop;

    try {
      const messageId = messages[0].id;
      const topicId = selectedTab === 'topic' ? appliedTopicId : undefined;
      const { messages: recentMessages, loadMoreShownAtBottom } =
        await loadMoreRecentTopicMessages({
          channelId: selectedChannelId,
          topicId,
          lastMessageId: messageId
        });
      onLoadMoreRecentTopicMessages({
        channelId: selectedChannelId,
        messages: recentMessages,
        topicId,
        loadMoreShownAtBottom
      });
      setTimeout(
        () => {
          if (MessagesRef.current) {
            const newScrollHeight = MessagesRef.current.scrollHeight;
            const heightDifference = prevScrollHeight - newScrollHeight;
            MessagesRef.current.scrollTop = prevScrollTop + heightDifference;
          }
        },
        deviceIsMobile ? 50 : 0
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMoreRecent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedTopicId, messages, selectedChannelId, selectedTab]);

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
        topicId: message.subjectId,
        selectedTab,
        subchannelId: subchannel?.id
      });
      const { coins } = await updateUserCoins({
        amount,
        action: 'reward',
        target: 'chat',
        targetId: message.id,
        type: 'decrease'
      });
      await updateUserXP({
        amount,
        action: 'reward',
        target: 'chat',
        targetId: message.id,
        type: 'increase',
        userId: message.userId
      });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      handleUpdateRankings();
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleUpdateRankings, subchannel?.id, selectedTab]
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
      ChatInputRef.current?.focus();
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
      onScrollToBottom();
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
      const {
        scrollTop = 0,
        scrollHeight = 0,
        offsetHeight = 0
      } = MessagesRef.current || {};

      scrolledToBottomRef.current = scrollTop >= unseenButtonThreshold;

      const distanceFromTop = scrollHeight - offsetHeight + scrollTop;
      if (distanceFromTop < 3) {
        handleLoadMore();
      }

      if (loadMoreShownAtBottom && !loadingMoreRecent) {
        const scrolledToBottom = Math.abs(scrollTop) < 3;
        if (scrolledToBottom) {
          handleLoadMoreRecentMessages();
        }
      }

      if (scrollTop >= unseenButtonThreshold) {
        setNewUnseenMessage(false);
      }
      setShowGoToBottom(scrollTop < -10000);
    }
  });

  useEffect(() => {
    const currentMessageToScrollTo =
      selectedTab === 'topic'
        ? MessageToScrollToFromTopic.current
        : MessageToScrollToFromAll.current;

    if (MessagesDomRef.current?.[currentMessageToScrollTo]) {
      const messageElement = MessagesDomRef.current[currentMessageToScrollTo];
      messageElement.scrollIntoView({ block: 'center' });
      setTimeout(() => {
        messageElement.scrollIntoView({ block: 'center' });
      }, 10);

      if (selectedTab === 'topic') {
        MessageToScrollToFromTopic.current = null;
      } else {
        MessageToScrollToFromAll.current = null;
      }
    }
  }, [
    MessageToScrollToFromAll,
    MessageToScrollToFromTopic,
    MessagesRef,
    selectedTab,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    messagesObj[MessageToScrollToFromTopic.current]?.isLoaded
  ]);

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
        {pageLoading || isSearching ? (
          <div style={{ position: 'absolute', top: '20%', width: '100%' }}>
            <Loading
              text={
                isReconnecting
                  ? 'Reconnecting...'
                  : isLoadingChannel || isConnecting
                  ? `Loading...`
                  : ''
              }
            />
          </div>
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
              {newUnseenMessage ? (
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
              ) : showGoToBottom ? (
                <GoToBottomButton
                  theme={displayedThemeColor}
                  onClick={() => {
                    onScrollToBottom();
                    scrolledToBottomRef.current = true;
                    setShowGoToBottom(false);
                  }}
                />
              ) : null}
            </div>
            {loadMoreShownAtBottom && (
              <LoadMoreButton
                filled
                disabled={isLoadingTopicMessages}
                style={{ marginBottom: '1rem', marginTop: '1rem' }}
                loading={loadingMoreRecent}
                onClick={handleLoadMoreRecentMessages}
                color={loadMoreButtonColor}
              />
            )}
            {messages.map((message, index) => {
              return message.id || message.tempMessageId ? (
                <div
                  style={{ width: '100%' }}
                  key={message.id || message.tempMessageId}
                  ref={(ref) => {
                    MessagesDomRef.current[
                      message.id || message.tempMessageId
                    ] = ref;
                  }}
                >
                  <Message
                    nextMessageHasTopic={
                      index !== 0
                        ? !!(
                            messages[index - 1]?.subjectId ||
                            messages[index - 1]?.isSubject
                          )
                        : false
                    }
                    prevMessageHasTopic={
                      index !== messages.length - 1
                        ? !!(
                            messages[index + 1]?.subjectId ||
                            messages[index + 1]?.isSubject
                          )
                        : false
                    }
                    channelId={selectedChannelId}
                    chessCountdownNumber={chessCountdownNumber}
                    omokCountdownNumber={omokCountdownNumber}
                    groupObjs={groupObjs}
                    onSetGroupObjs={onSetGroupObjs}
                    partner={partner}
                    currentChannel={currentChannel}
                    displayedThemeColor={displayedThemeColor}
                    isAICardModalShown={isAICardModalShown}
                    index={index}
                    isOneOfVisibleMessages={
                      index <= 10 ||
                      (index <= visibleMessageIndexRef.current + 10 &&
                        index >= visibleMessageIndexRef.current - 10)
                    }
                    isLastMsg={index === 0}
                    isNotification={!!message.isNotification}
                    isBanned={!!banned?.chat}
                    isRestricted={isRestrictedChannel}
                    loading={pageLoading}
                    onSetMessageToScrollTo={(messageId) => {
                      MessageToScrollToFromAll.current = messageId;
                      MessageToScrollToFromTopic.current = messageId;
                    }}
                    message={message}
                    onAcceptGroupInvitation={handleAcceptGroupInvitation}
                    onChessBoardClick={onChessModalShown}
                    onChessSpoilerClick={onChessSpoilerClick}
                    onOmokBoardClick={onOmokModalShown}
                    onOmokSpoilerClick={onOmokSpoilerClick}
                    onCancelRewindRequest={onCancelRewindRequest}
                    onAcceptRewind={onAcceptRewind}
                    onDeclineRewind={onDeclineRewind}
                    onDelete={handleShowDeleteModal}
                    onReceiveNewMessage={handleReceiveNewMessage}
                    onReplyClick={(target: any) => {
                      onReplyTargetSelected(target);
                      ChatInputRef.current?.focus();
                    }}
                    onRequestRewind={handleRequestChessRewind}
                    onRewardMessageSubmit={handleRewardMessageSubmit}
                    onSetAICardModalCardId={onSetAICardModalCardId}
                    onSetChessTarget={handleSetChessTarget}
                    onSetTransactionModalShown={onSetTransactionModalShown}
                    onSetVisibleMessageIndex={(index) =>
                      (visibleMessageIndexRef.current = index)
                    }
                    onSetMessageHeightObj={({ messageId, height }) => {
                      MessageHeights[messageId] = height;
                    }}
                    onShowSubjectMsgsModal={({ subjectId, content }) =>
                      onSetSubjectMsgsModalShown({
                        shown: true,
                        subjectId,
                        content
                      })
                    }
                  />
                </div>
              ) : null;
            })}
            {!pageLoading &&
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
