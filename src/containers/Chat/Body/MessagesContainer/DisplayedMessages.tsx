import React, { useCallback } from 'react';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Message from '../../Message';
import { rewardReasons } from '~/constants/defaultValues';

export default function DisplayedMessages() {
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
      handleMessageSubmit({
        content: rewardReasons[reasonId].message,
        rewardAmount: amount,
        rewardReason: reasonId,
        target: message,
        subchannelId
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
    [handleMessageSubmit, handleUpdateRankings, subchannelId]
  );
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
        {loadingAnimationShown ? (
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
                    handleScrollToBottom();
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
                isRestricted={isChatRestricted}
                loading={loadingAnimationShown}
                message={message}
                onAcceptGroupInvitation={handleAcceptGroupInvitation}
                onChessBoardClick={handleChessModalShown}
                onChessSpoilerClick={handleChessSpoilerClick}
                onCancelRewindRequest={handleCancelRewindRequest}
                onAcceptRewind={handleAcceptRewind}
                onDeclineRewind={handleDeclineRewind}
                onDelete={handleShowDeleteModal}
                onReceiveNewMessage={handleReceiveNewMessage}
                onReplyClick={() => ChatInputRef.current.focus()}
                onRequestRewind={handleRequestChessRewind}
                onRewardMessageSubmit={handleRewardMessageSubmit}
                onSetAICardModalCardId={onSetAICardModalCardId}
                onSetChessTarget={handleSetChessTarget}
                onSetTransactionModalShown={setTransactionModalShown}
                onScrollToBottom={handleScrollToBottom}
                onShowSubjectMsgsModal={({ subjectId, content }) =>
                  setSubjectMsgsModal({ shown: true, subjectId, content })
                }
              />
            ))}
            {!loadingAnimationShown &&
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
      handleScrollToBottom();
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
    setDeleteModal({
      shown: true,
      fileName,
      filePath,
      messageId
    });
  }
}
