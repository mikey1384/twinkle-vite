import React, { useEffect, useMemo, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Omok from '../../Omok';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import Icon from '~/components/Icon';

interface OmokModalProps {
  currentChannel: any;
  channelId: number;
  myId: number;
  opponentId: number;
  opponentName: string;
  countdownNumber?: number;
  onConfirmOmokMove: (params: {
    state: any;
    moveNumber: number;
    isWinning: boolean;
    previousState?: any;
    message?: any;
  }) => Promise<void> | void;
  onHide: () => void;
  onSpoilerClick: (senderId: number) => void;
  onScrollToBottom: () => void;
  socketConnected: boolean;
}

export default function OmokModal({
  currentChannel,
  channelId,
  myId,
  opponentId,
  opponentName,
  countdownNumber,
  onConfirmOmokMove,
  onHide,
  onSpoilerClick,
  onScrollToBottom,
  socketConnected
}: OmokModalProps) {
  const fetchCurrentOmokState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentOmokState
  );
  const setOmokMoveViewTimeStamp = useAppContext(
    (v) => v.requestHelpers.setOmokMoveViewTimeStamp
  );
  const onUpdateRecentOmokMessage = useChatContext(
    (v) => v.actions.onUpdateRecentOmokMessage
  );
  const onUpdateLastOmokMoveViewerId = useChatContext(
    (v) => v.actions.onUpdateLastOmokMoveViewerId
  );
  const username = useKeyContext((v) => v.myState.username);

  const [message, setMessage] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchCurrentOmokState({
          channelId,
          recentOmokMessage: currentChannel.recentOmokMessage
        });
        if (!ignore) {
          if (data) {
            setMessage(data);
            onUpdateRecentOmokMessage({ channelId, message: data });
          }
          setLoaded(true);
        }
      } catch (error: any) {
        if (!ignore) {
          setLoadError(error?.message || 'Failed to load omok board.');
          setLoaded(true);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [channelId, currentChannel.recentOmokMessage, fetchCurrentOmokState, onUpdateRecentOmokMessage]);

  const initialState = useMemo(() => message?.omokState, [message]);

  const handleConfirmMove = async ({
    state,
    moveNumber,
    isWinning,
    previousState
  }: {
    state: any;
    moveNumber: number;
    isWinning: boolean;
    previousState?: any;
  }) => {
    try {
      setSubmitting(true);
      await onConfirmOmokMove({
        state,
        moveNumber,
        isWinning,
        previousState,
        message
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpoilerClick = async (senderId: number) => {
    try {
      if (message) {
        await setOmokMoveViewTimeStamp({
          channelId,
          message,
          gameType: 'omok'
        });
        onUpdateLastOmokMoveViewerId({ channelId, viewerId: myId });
      }
      onSpoilerClick(senderId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ErrorBoundary componentPath="Chat/Modals/OmokModal">
      <NewModal
        isOpen
        size="lg"
        title="Omok"
        onClose={onHide}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon icon="user" />
              <span>
                {username} vs {opponentName}
              </span>
            </div>
            <Button transparent onClick={onHide} disabled={submitting}>
              Close
            </Button>
          </div>
        }
      >
        {!loaded ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>Loading board…</div>
        ) : loadError ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#d94848' }}>
            {loadError}
          </div>
        ) : (
          <Omok
            channelId={channelId}
            myId={myId}
            senderId={message?.userId}
            messageId={message?.id}
            opponentId={opponentId}
            opponentName={opponentName}
            initialState={initialState}
            countdownNumber={countdownNumber}
            spoilerOff={true}
            interactable
            loaded={loaded && socketConnected}
            onConfirmMove={handleConfirmMove}
            onCancelPendingMove={() => setSubmitting(false)}
            onSpoilerClick={handleSpoilerClick}
          />
        )}
      </NewModal>
    </ErrorBoundary>
  );
}
