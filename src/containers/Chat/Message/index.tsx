import React, { memo, useContext, useEffect, useMemo, useRef } from 'react';
import MessageBody from './MessageBody';
import LoadingPlaceholder from '~/components/LoadingPlaceholder';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../Context';
import { css } from '@emotion/css';
import { useInView } from 'react-intersection-observer';
import { useAppContext } from '~/contexts';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { MessageHeights } from '~/constants/state';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';

function Message({
  channelId,
  chessCountdownNumber,
  partner,
  currentChannel,
  displayedThemeColor,
  groupObjs,
  onSetGroupObjs,
  index,
  isAICardModalShown,
  isLastMsg,
  isOneOfVisibleMessages,
  isNotification,
  isRestricted,
  isBanned,
  loading,
  message,
  message: { rootId, rootType, userId },
  nextMessageHasTopic,
  prevMessageHasTopic,
  onAcceptGroupInvitation,
  onChessBoardClick,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  onDelete,
  onChessSpoilerClick,
  onReceiveNewMessage,
  onReplyClick,
  onRequestRewind,
  onRewardMessageSubmit,
  onSetAICardModalCardId,
  onSetChessTarget,
  onSetMessageHeightObj,
  onSetTransactionModalShown,
  onSetVisibleMessageIndex,
  onSetMessageToScrollTo,
  onScrollToBottom,
  onShowSubjectMsgsModal,
  zIndex
}: {
  chessCountdownNumber: number;
  partner: any;
  channelId: number;
  currentChannel: any;
  displayedThemeColor: string;
  groupObjs: any;
  onSetGroupObjs: (v: any) => void;
  isAICardModalShown: boolean;
  message: any;
  nextMessageHasTopic: boolean;
  prevMessageHasTopic: boolean;
  onDelete: (v: any) => void;
  index: number;
  isBanned: boolean;
  isLastMsg: boolean;
  isOneOfVisibleMessages: boolean;
  isNotification: boolean;
  isRestricted: boolean;
  loading: boolean;
  onAcceptGroupInvitation: (v: any) => void;
  onChessBoardClick: () => void;
  onChessSpoilerClick: (v: number) => void;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (v: any) => void;
  onDeclineRewind: () => void;
  onReceiveNewMessage: () => void;
  onReplyClick: () => void;
  onRequestRewind: (v: any) => void;
  onSetAICardModalCardId: (v: any) => void;
  onSetChessTarget: (v: any) => void;
  onSetMessageHeightObj: (v: any) => void;
  onSetMessageToScrollTo: (v: any) => void;
  onSetTransactionModalShown: (v: boolean) => void;
  onSetVisibleMessageIndex: (v: number) => void;
  onRewardMessageSubmit: (v: any) => void;
  onScrollToBottom: () => void;
  onShowSubjectMsgsModal: (v: any) => void;
  zIndex?: number;
}) {
  const loadChatMessage = useAppContext(
    (v) => v.requestHelpers.loadChatMessage
  );
  const {
    actions: { onSetMessageState }
  } = useContext(LocalContext);
  const {
    thumbUrl: recentThumbUrl,
    isEditing,
    started
  } = useContentState({
    contentType: 'chat',
    contentId: message?.id
  });
  const [ComponentRef, inView] = useInView();

  useEffect(() => {
    if (inView) {
      onSetVisibleMessageIndex(index);
    }
  }, [index, onSetVisibleMessageIndex, inView]);

  useEffect(() => {
    init();
    async function init() {
      if (!message.isLoaded) {
        const data = await loadChatMessage({ messageId: message?.id });
        onSetMessageState({
          channelId,
          messageId: message?.id,
          newState: { ...data, isLoaded: true }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.isLoaded, message?.id]);

  const PanelRef = useRef(null);

  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: (height: number) => {
      onSetMessageHeightObj({
        messageId: message?.id,
        height
      });
    }
  });

  const contentShown = useMemo(
    () => inView || started || !MessageHeights[message?.id],
    [inView, message?.id, started]
  );

  const isApprovalRequest = useMemo(() => {
    return rootType === 'approval' && !!rootId;
  }, [rootId, rootType]);
  const isModificationNotice = useMemo(() => {
    return rootType === 'modification' && !!rootId;
  }, [rootId, rootType]);
  const isAIMessage = useMemo(() => {
    return (
      userId === Number(ZERO_TWINKLE_ID) || userId === Number(CIEL_TWINKLE_ID)
    );
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Chat/Message/index">
      <div
        className={css`
          width: 100%;
        `}
        ref={ComponentRef}
      >
        <div
          className={css`
            width: 100%;
          `}
          ref={PanelRef}
        >
          {!message?.isLoaded ? (
            <LoadingPlaceholder />
          ) : contentShown || isOneOfVisibleMessages ? (
            <MessageBody
              channelId={channelId}
              chessCountdownNumber={chessCountdownNumber}
              partner={partner}
              currentChannel={currentChannel}
              displayedThemeColor={displayedThemeColor}
              isAICardModalShown={isAICardModalShown}
              isAIMessage={isAIMessage}
              isCielMessage={userId === Number(CIEL_TWINKLE_ID)}
              isApprovalRequest={isApprovalRequest}
              isModificationNotice={isModificationNotice}
              groupObjs={groupObjs}
              onSetGroupObjs={onSetGroupObjs}
              message={message}
              nextMessageHasTopic={nextMessageHasTopic}
              prevMessageHasTopic={prevMessageHasTopic}
              onDelete={onDelete}
              index={index}
              isBanned={isBanned}
              isEditing={isEditing}
              isLastMsg={isLastMsg}
              isNotification={isNotification}
              isRestricted={isRestricted}
              loading={loading}
              onAcceptGroupInvitation={onAcceptGroupInvitation}
              onChessBoardClick={onChessBoardClick}
              onChessSpoilerClick={onChessSpoilerClick}
              onCancelRewindRequest={onCancelRewindRequest}
              onAcceptRewind={onAcceptRewind}
              onDeclineRewind={onDeclineRewind}
              onReceiveNewMessage={onReceiveNewMessage}
              onReplyClick={onReplyClick}
              onRequestRewind={onRequestRewind}
              onSetAICardModalCardId={onSetAICardModalCardId}
              onSetChessTarget={onSetChessTarget}
              onSetMessageToScrollTo={onSetMessageToScrollTo}
              onSetTransactionModalShown={onSetTransactionModalShown}
              onRewardMessageSubmit={onRewardMessageSubmit}
              onScrollToBottom={onScrollToBottom}
              onShowSubjectMsgsModal={onShowSubjectMsgsModal}
              recentThumbUrl={recentThumbUrl}
              zIndex={zIndex}
            />
          ) : (
            <div
              style={{
                width: '100%',
                display: 'block',
                paddingTop: MessageHeights[message?.id] || 0
              }}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default memo(Message);
