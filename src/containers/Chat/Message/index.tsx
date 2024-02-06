import React, { useEffect, useMemo, useRef, useState } from 'react';
import MessageBody from './MessageBody';
import { useInView } from 'react-intersection-observer';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { isMobile } from '~/helpers';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function Message({
  channelId,
  chessCountdownNumber,
  partner,
  currentChannel,
  displayedThemeColor,
  forceRefreshForMobile,
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
  onSetTransactionModalShown,
  onSetVisibleMessageIndex,
  onScrollToBottom,
  onShowSubjectMsgsModal,
  zIndex
}: {
  chessCountdownNumber: number;
  partner: any;
  channelId: number;
  currentChannel: any;
  displayedThemeColor: string;
  forceRefreshForMobile: () => void;
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
    contentId: message.id
  });
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const [contentShown, setContentShown] = useState(isOneOfVisibleMessages);
  const [visible, setVisible] = useState(isOneOfVisibleMessages);

  useEffect(() => {
    if (contentShown) {
      onSetVisibleMessageIndex(index + 10);
    }
  }, [index, onSetVisibleMessageIndex, contentShown]);

  const [ComponentRef, inView] = useInView({
    threshold: 0
  });

  const PanelRef = useRef(null);

  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: setPlaceholderHeight,
    onSetVisible: setVisible,
    delay: 1000
  });

  const placeholderHeightRef = useRef(placeholderHeight);
  useEffect(() => {
    placeholderHeightRef.current = placeholderHeight;
  }, [placeholderHeight]);

  const startedRef = useRef(started);
  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    setContentShown(
      inView ||
        startedRef.current ||
        visibleRef.current ||
        !placeholderHeightRef.current
    );
  }, [inView]);

  useEffect(() => {
    if (contentShown && deviceIsMobile) {
      forceRefreshForMobile?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentShown]);

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
    <div style={{ width: '100%' }} ref={ComponentRef}>
      <div style={{ width: '100%' }} ref={PanelRef}>
        {contentShown ? (
          <MessageBody
            channelId={channelId}
            chessCountdownNumber={chessCountdownNumber}
            partner={partner}
            currentChannel={currentChannel}
            displayedThemeColor={displayedThemeColor}
            forceRefreshForMobile={forceRefreshForMobile}
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
              paddingTop: placeholderHeight
            }}
          />
        )}
      </div>
    </div>
  );
}
