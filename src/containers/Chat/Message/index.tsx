import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import MessageBody from './MessageBody';
import LoadingPlaceholder from '~/components/LoadingPlaceholder';
import ErrorBoundary from '~/components/ErrorBoundary';
import SystemErrorMessage from './MessageBody/SystemErrorMessage';
import LocalContext from '../Context';
import { useShouldUpdate } from '../UpdateModeContext';
import { css } from '@emotion/css';
import { useInView } from 'react-intersection-observer';
import { useAppContext } from '~/contexts';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { MessageHeights } from '~/constants/state';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';

function Message({
  channelId,
  isChessCountdownActive,
  isOmokCountdownActive,
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
  onOmokBoardClick,
  onOmokSpoilerClick,
  onReceiveNewMessage,
  onReplyClick,
  onRequestRewind,
  onRewardMessageSubmit,
  onSetAICardModalCardId,
  onSetChessTarget,
  onSetMessageHeightObj,
  onSetTransactionModalShown,
  onSetVisibleMessageIndex,
  onSetVisibleMessageId,
  onSetMessageToScrollTo,
  onShowSubjectMsgsModal,
  zIndex
}: {
  channelId: number;
  isChessCountdownActive?: boolean;
  isOmokCountdownActive?: boolean;
  partner: any;
  currentChannel: any;
  displayedThemeColor: string;
  groupObjs: any;
  onSetGroupObjs: (v: any) => void;
  index: number;
  isAICardModalShown: boolean;
  isLastMsg: boolean;
  isOneOfVisibleMessages: boolean;
  isNotification: boolean;
  isRestricted: boolean;
  isBanned: boolean;
  loading: boolean;
  message: {
    id: number;
    isLoaded?: boolean;
    rootId?: number | null;
    rootType?: string | null;
    userId?: number;
    isNotification?: boolean;
    settings?: { hasError?: boolean };
  };
  nextMessageHasTopic: boolean;
  prevMessageHasTopic: boolean;
  onAcceptGroupInvitation: (v: any) => void;
  onChessBoardClick: () => void;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (v: any) => void;
  onDeclineRewind: () => void;
  onDelete: (v: any) => void;
  onChessSpoilerClick: (v: number) => void;
  onOmokBoardClick: () => void;
  onOmokSpoilerClick: (v: number) => void;
  onReceiveNewMessage: () => void;
  onReplyClick: (target: any) => void;
  onRequestRewind: (v: any) => void;
  onSetAICardModalCardId: (v: any) => void;
  onSetChessTarget: (v: any) => void;
  onSetMessageHeightObj: (v: { messageId: number; height: number }) => void;
  onSetTransactionModalShown: (v: boolean) => void;
  onSetVisibleMessageIndex: (v: number) => void;
  onSetVisibleMessageId?: (v: number) => void;
  onSetMessageToScrollTo: (v: number) => void;
  onRewardMessageSubmit: (v: any) => void;
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
  const PanelRef = useRef(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Optimization: during scrolling, only update messages that are in view
  // During transitions or idle, all messages can update
  const shouldUpdate = useShouldUpdate(inView);

  useEffect(() => {
    if (inView) {
      onSetVisibleMessageIndex(index);
      if (onSetVisibleMessageId && message?.id) {
        onSetVisibleMessageId(message.id);
      }
    }
  }, [index, onSetVisibleMessageIndex, onSetVisibleMessageId, inView, message?.id]);

  useEffect(() => {
    if (!message?.isLoaded && message?.id && !message?.isNotification) {
      (async function init() {
        try {
          const data = await loadChatMessage({ messageId: message?.id });
          onSetMessageState({
            channelId,
            messageId: message?.id,
            newState: { ...data, isLoaded: true }
          });
        } catch (_error) {
          setLoadFailed(true);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.isLoaded, message?.isNotification, message?.id]);

  const handleSetPlaceholderHeight = useCallback(
    (height: number) => {
      onSetMessageHeightObj({
        messageId: message?.id,
        height
      });
    },
    [message?.id, onSetMessageHeightObj]
  );

  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: handleSetPlaceholderHeight
  });

  const contentShown = useMemo(
    () => started || !MessageHeights[message?.id] || (shouldUpdate && inView),
    [shouldUpdate, inView, message?.id, started]
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

  const aiName = useMemo(() => {
    if (userId === Number(ZERO_TWINKLE_ID)) return 'Zero';
    if (userId === Number(CIEL_TWINKLE_ID)) return 'Ciel';
    return 'the AI assistant';
  }, [userId]);

  const aiMessageHasError = useMemo(() => {
    if (!isAIMessage || !message?.id) return false;
    return message?.settings?.hasError === true;
  }, [isAIMessage, message?.id, message?.settings]);

  const isOneOnOneAIChat = useMemo(() => {
    if (!currentChannel?.twoPeople) return false;
    return (
      partner?.id === Number(ZERO_TWINKLE_ID) ||
      partner?.id === Number(CIEL_TWINKLE_ID)
    );
  }, [currentChannel?.twoPeople, partner?.id]);

  const handleDeleteErrorMessage = () => {
    onDelete({ messageId: message?.id });
  };

  let renderedContent: React.ReactNode = null;

  if (loadFailed) {
    renderedContent = null;
  } else if (aiMessageHasError) {
    renderedContent = (
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
            <SystemErrorMessage
              canDelete={isOneOnOneAIChat}
              onDelete={isOneOnOneAIChat ? handleDeleteErrorMessage : undefined}
              aiName={aiName}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  } else {
    renderedContent = (
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
            {!message?.isLoaded && !message?.isNotification ? (
              <LoadingPlaceholder />
            ) : contentShown || (shouldUpdate && isOneOfVisibleMessages) ? (
              <MessageBody
                channelId={channelId}
                isChessCountdownActive={isChessCountdownActive}
                isOmokCountdownActive={isOmokCountdownActive}
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
                onOmokBoardClick={onOmokBoardClick}
                onOmokSpoilerClick={onOmokSpoilerClick}
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

  return renderedContent;
}

export default memo(Message);
