import React, { useEffect, useMemo, useRef, useState } from 'react';
import MessageBody from './MessageBody';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useInView } from 'react-intersection-observer';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';

export default function Message({
  channelId,
  chessCountdownNumber,
  partner,
  currentChannel,
  displayedThemeColor,
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
  MessageHeightObjRef,
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
  MessageHeightObjRef: any;
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
  const {
    thumbUrl: recentThumbUrl,
    isEditing,
    started
  } = useContentState({
    contentType: 'chat',
    contentId: message?.id
  });
  const [visible, setVisible] = useState(false);

  const [ComponentRef, inView] = useInView({
    threshold: 0
  });

  useEffect(() => {
    if (inView) {
      onSetVisibleMessageIndex(index);
    }
  }, [index, onSetVisibleMessageIndex, inView]);

  const PanelRef = useRef(null);

  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: (height: number) => {
      onSetMessageHeightObj({
        messageId: message?.id,
        height
      });
    },
    onSetVisible: setVisible,
    delay: 100
  });

  const contentShown = useMemo(
    () =>
      inView ||
      started ||
      visible ||
      !MessageHeightObjRef.current?.[message?.id],
    [inView, message?.id, MessageHeightObjRef, started, visible]
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
          {contentShown || isOneOfVisibleMessages ? (
            <MessageBody
              channelId={channelId}
              chessCountdownNumber={chessCountdownNumber}
              partner={partner}
              currentChannel={currentChannel}
              displayedThemeColor={displayedThemeColor}
              isAICardModalShown={isAICardModalShown}
              isAIMessage={isAIMessage}
              isApprovalRequest={isApprovalRequest}
              isModificationNotice={isModificationNotice}
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
                paddingTop: MessageHeightObjRef.current?.[message?.id] || 0
              }}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
